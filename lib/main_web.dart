import 'dart:async';
import 'dart:html' as html;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

import 'firebase_options.dart';
import 'web/shared/rc_colors.dart';
import 'web/shared/rc_panel.dart';
import 'web/shared/rc_field.dart';
import 'web/shared/rc_loaders.dart';
import 'web/shared/rc_layout.dart';
import 'features/auth/presentation/screens/admin_invite_screen.dart';
import 'web/shared/unified_command_console.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.web);
  final inviteToken = Uri.base.queryParameters['token']?.trim();
  if (Uri.base.path == '/admin-invite' &&
      inviteToken != null &&
      inviteToken.isNotEmpty) {
    html.window.sessionStorage['pendingAdminInviteToken'] = inviteToken;
  }
  // Firebase requires the pending redirect credential to be consumed before
  // the auth gate is built. Doing this only inside LoginScreen can race with
  // authStateChanges on mobile Chrome and return the user to the login page.
  try {
    // A stale/aborted browser redirect must never hold the whole web app on
    // the native splash screen. Auth state is still observed by AuthGate, so
    // timing out here is safe and lets the UI report the real access state.
    await FirebaseAuth.instance
        .getRedirectResult()
        .timeout(const Duration(seconds: 8));
  } on FirebaseAuthException catch (e) {
    html.window.sessionStorage['web_google_redirect_error'] = e.code;
    debugPrint('WEB_GOOGLE_REDIRECT_RESULT_FAILED: ${e.code}');
  } catch (e) {
    html.window.sessionStorage['web_google_redirect_error'] = 'unknown';
    debugPrint('WEB_GOOGLE_REDIRECT_RESULT_FAILED: $e');
  }
  try {
    await SessionManager.initialize().timeout(const Duration(seconds: 5));
  } catch (e) {
    // Preferences are a cache only for the Founder web shell. A storage
    // failure must not prevent FirebaseAuth from rendering the login/access
    // screen.
    debugPrint('WEB_SESSION_INIT_SKIPPED: $e');
  }
  runApp(const ProviderScope(child: RankCrackersWebApp()));
}

class RankCrackersWebApp extends StatelessWidget {
  const RankCrackersWebApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'RankCrackers Web',
      theme: ThemeData.light(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: rcBg,
        colorScheme: const ColorScheme.light(
          primary: rcGold,
          secondary: rcGreen,
          surface: rcSurface,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: rcSurface,
          foregroundColor: rcText,
          elevation: 0,
        ),
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const RcCenteredLoader();
        }
        final user = snapshot.data;
        if (user == null) return const LoginScreen();

        // Phase A2REAL-R2: Check for pending admin invite return
        final pendingToken =
            html.window.sessionStorage['pendingAdminInviteToken'];
        if (pendingToken != null && pendingToken.isNotEmpty) {
          return AdminInviteScreen(token: pendingToken);
        }

        return WebShell(user: user);
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _googleBusy = false;
  String? _error;
  bool _signupMode = false;
  bool _inviteValidated = false;
  String? _invitedEmail;

  @override
  void initState() {
    super.initState();
    final redirectError =
        html.window.sessionStorage.remove('web_google_redirect_error');
    if (redirectError != null && redirectError.isNotEmpty) {
      _error =
          'Google sign-in could not be completed ($redirectError). Please try again.';
    }
    _checkInviteStatus();
  }

  Future<void> _checkInviteStatus() async {
    final pendingToken = html.window.sessionStorage['pendingAdminInviteToken'];
    if (pendingToken != null && pendingToken.isNotEmpty) {
      try {
        final callable = FirebaseFunctions.instance.httpsCallable(
          'validateAdminInvite',
        );
        final result = await callable.call({
          'inviteToken': pendingToken,
        });
        final data = Map<String, dynamic>.from(result.data as Map);
        if (mounted) {
          setState(() {
            _invitedEmail = data['email']?.toString().trim().toLowerCase();
            _inviteValidated = data['success'] == true &&
                _invitedEmail != null &&
                _invitedEmail!.isNotEmpty;
            _signupMode = _inviteValidated;
            if (_inviteValidated) {
              _email.text = _invitedEmail!;
            } else {
              _error = 'This admin invitation is not valid or has expired.';
            }
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _inviteValidated = false;
            _signupMode = false;
            _error = 'This admin invitation is not valid or has expired.';
          });
        }
        debugPrint('Invite validation failed in LoginScreen: $e');
      }
    }
  }

  Future<void> _handleAuth() async {
    if (_busy) return;
    final email = _email.text.trim().toLowerCase();
    final password = _password.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Email and password are required.');
      return;
    }

    // PRE-CHECK: If in invite flow, email must match
    if (_invitedEmail != null && email != _invitedEmail) {
      setState(
        () => _error =
            'This invite is for $_invitedEmail. Please use the invited email.',
      );
      return;
    }

    if (_signupMode && !_inviteValidated) {
      setState(
          () => _error = 'Account creation requires a valid admin invitation.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      if (_signupMode) {
        await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );
        await FirebaseAuth.instance.currentUser?.sendEmailVerification();
        await FirebaseAuth.instance.signOut();
        if (mounted) {
          setState(() => _error =
              'Account created. Verify your email, then sign in to continue.');
        }
      } else {
        await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: email,
          password: password,
        );
        final signedInUser = FirebaseAuth.instance.currentUser;
        final signedInClaims = signedInUser == null
            ? const <String, dynamic>{}
            : (await signedInUser.getIdTokenResult(true)).claims ??
                const <String, dynamic>{};
        final isPrivilegedAccount = signedInClaims['founder'] == true ||
            signedInClaims['admin'] == true;
        if (signedInUser != null &&
            !signedInUser.emailVerified &&
            !isPrivilegedAccount) {
          await FirebaseAuth.instance.signOut();
          if (mounted) {
            setState(
                () => _error = 'Verify your email address before signing in.');
          }
        }
      }
    } on FirebaseAuthException catch (e) {
      final message = switch (e.code) {
        'invalid-credential' ||
        'user-not-found' ||
        'wrong-password' =>
          'Email or password is incorrect.',
        'too-many-requests' =>
          'Too many attempts. Please wait and try again later.',
        'email-already-in-use' =>
          'An account already exists for this email. Use Login instead.',
        'weak-password' => 'Choose a stronger password.',
        _ => 'Unable to complete sign-in. Please try again.',
      };
      setState(() => _error = message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loginWithGoogle() async {
    if (_busy || _googleBusy) return;
    setState(() {
      _googleBusy = true;
      _error = null;
    });
    try {
      final provider = GoogleAuthProvider();
      provider.setCustomParameters({'prompt': 'select_account'});
      // Complete the OAuth transaction in the current browser session. This
      // avoids the redirect callback race that was returning to /login with
      // FirebaseAuth.currentUser still null on Chrome.
      try {
        final result = await FirebaseAuth.instance.signInWithPopup(provider);
        if (result.user == null) {
          await FirebaseAuth.instance.signInWithRedirect(provider);
        }
      } on FirebaseAuthException catch (e) {
        const popupRecoveryCodes = {
          'popup-blocked',
          'popup-closed-by-user',
          'cancelled-popup-request',
        };
        if (!popupRecoveryCodes.contains(e.code)) rethrow;
        await FirebaseAuth.instance.signInWithRedirect(provider);
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() =>
            _error = '${e.code}: ${e.message ?? 'Google sign-in failed.'}');
      }
    } catch (e) {
      if (mounted)
        setState(() => _error = 'Google sign-in failed. Please try again.');
      debugPrint('WEB_GOOGLE_SIGN_IN_FAILED: $e');
    } finally {
      if (mounted) setState(() => _googleBusy = false);
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: rcBg,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: RcPanel(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 70,
                    height: 70,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      // The approved web mark is white-on-black; keep the
                      // black badge so it remains visible on the light panel.
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: rcGold.withValues(alpha: 0.24),
                        width: 1.5,
                      ),
                    ),
                    child: Image.asset(
                      'assets/images/logo_white.png',
                      fit: BoxFit.contain,
                      semanticLabel: 'RankCrackers logo',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Center(
                  child: Text(
                    'RankCrackers',
                    style: TextStyle(
                      color: rcText,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: rcSurfaceAlt,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: rcGold.withValues(alpha: 0.10)),
                    ),
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '\u0924\u0947\u091c\u0938\u094D\u0935\u093F \u0928\u093E\u0935\u0927\u0940\u0924\u092e\u0938\u094D\u0924\u0941\u0964',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            fontStyle: FontStyle.normal,
                            color: rcGold,
                            fontFamilyFallback: [
                              'Nirmala UI',
                              'Mangal',
                              'Kokila',
                              'Noto Sans Devanagari',
                              'Devanagari Sangam MN',
                              'Arial Unicode MS',
                              'sans-serif',
                            ],
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'May Our Learning Be Radiant.',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                            color: rcMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                RcField(controller: _email, label: 'Email'),
                const SizedBox(height: 12),
                RcField(
                  controller: _password,
                  label: 'Password',
                  obscureText: true,
                  onSubmitted: (_) => _handleAuth(),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: rcRed)),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _handleAuth,
                  child: Text(
                    _busy
                        ? (_signupMode
                            ? 'Creating account...'
                            : 'Signing in...')
                        : (_signupMode
                            ? 'Create Account & Join'
                            : 'Email / Password Login'),
                  ),
                ),
                if (_inviteValidated)
                  TextButton(
                    onPressed: () => setState(() => _signupMode = !_signupMode),
                    child: Text(
                      _signupMode
                          ? 'Already have an account? Login'
                          : 'Create account using this admin invite',
                      style: const TextStyle(fontSize: 12, color: rcGold),
                    ),
                  ),
                const SizedBox(height: 4),
                OutlinedButton.icon(
                  onPressed: (_busy || _googleBusy) ? null : _loginWithGoogle,
                  icon: _googleBusy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Image.asset('assets/images/Google.png', width: 18),
                  label: Text(
                    _googleBusy ? 'Connecting...' : 'Continue with Google',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class WebShell extends StatefulWidget {
  final User user;
  const WebShell({super.key, required this.user});

  @override
  State<WebShell> createState() => _WebShellState();
}

class _WebShellState extends State<WebShell> {
  bool _isFounder = false;
  bool _isAdmin = false;
  bool _claimsLoaded = false;
  String? _claimsError;

  @override
  void initState() {
    super.initState();
    _loadClaims();
  }

  Future<void> _loadClaims() async {
    if (mounted) {
      setState(() {
        _claimsLoaded = false;
        _claimsError = null;
      });
    }
    try {
      // The canonical Founder is repaired server-side before the ID token is
      // read. The callable is UID-bound and cannot elevate arbitrary emails.
      try {
        await FirebaseFunctions.instance
            .httpsCallable('bootstrapFounderSession')
            .call();
      } on FirebaseFunctionsException catch (e) {
        // Keep compatibility with a live backend that has not received the
        // bootstrap function yet; claims/profile validation remains required.
        debugPrint('FOUNDER_BOOTSTRAP_UNAVAILABLE: ${e.code}');
      }
      final token = await widget.user.getIdTokenResult(true);
      final claims = token.claims ?? {};
      var claimFounder = claims['founder'] == true;
      var claimAdmin = claims['admin'] == true;

      // A freshly granted Founder can briefly have a stale browser token after
      // Google sign-in. Web must never fall through to the mobile Student panel
      // while the governed Firestore role already identifies this account as a
      // Founder/Admin. Claims remain authoritative when present; this is only a
      // controlled bootstrap fallback for the signed-in user's own record.
      if (!claimFounder && !claimAdmin) {
        final userSnap = await FirebaseFirestore.instance
            .collection('users')
            .doc(widget.user.uid)
            .get();
        final role = (userSnap.data()?['role'] ?? '').toString().toUpperCase();
        claimFounder = role == 'FOUNDER';
        claimAdmin = role == 'ADMIN' || role == 'ADMINISTRATOR';
      }

      if (!mounted) return;
      setState(() {
        _isFounder = claimFounder;
        _isAdmin = claimAdmin;
        _claimsLoaded = true;
      });
    } catch (e) {
      debugPrint('WEB_ACCESS_BOOTSTRAP_FAILED: $e');
      if (!mounted) return;
      setState(() {
        _claimsError =
            'Could not verify your access. Please retry or sign out.';
        _claimsLoaded = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_claimsError != null) return _buildAccessError(_claimsError!);
    if (!_claimsLoaded) return const RcCenteredLoader();

    // Student/User panel is mobile-only. Web is reserved for Founder/Admin console.
    if (!_isFounder && !_isAdmin) {
      return Scaffold(
        appBar: _buildSimpleAppBar(),
        body: const _StudentMobileOnlyScreen(),
      );
    }
    // Command Center Console (Founders and Admins)
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(widget.user.uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _buildAccessError(
            'Could not load your account profile. Please retry or sign out.',
          );
        }
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: RcCenteredLoader());
        }
        if (!snapshot.hasData || !snapshot.data!.exists) {
          return _buildAccessError(
            'Your account profile is unavailable. Contact the Founder.',
          );
        }

        final userDoc = snapshot.data!.data() ?? {};
        final status = userDoc['status'] ?? 'ACTIVE';

        // Founder access is already server-authorized by the verified custom
        // claim. A stale Firestore status must not strand the canonical
        // Founder on an inactive-account screen; ordinary Admin accounts
        // still require an ACTIVE profile.
        if (status != 'ACTIVE' && !_isFounder) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_person_rounded, color: rcRed, size: 48),
                  const SizedBox(height: 16),
                  const Text(
                    'ACCOUNT INACTIVE',
                    style: TextStyle(
                      color: rcText,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Admin access is not active. Contact Founder.',
                    style: const TextStyle(color: rcMuted),
                  ),
                  const SizedBox(height: 24),
                  OutlinedButton(
                    onPressed: () => FirebaseAuth.instance.signOut(),
                    child: const Text('LOGOUT'),
                  ),
                ],
              ),
            ),
          );
        }

        final permissions = Map<String, dynamic>.from(
          userDoc['permissions'] ?? {},
        );
        final roleMode =
            _isFounder ? ConsoleRoleMode.founder : ConsoleRoleMode.admin;

        return Scaffold(
          appBar: _buildCommandAppBar(roleMode),
          body: UnifiedCommandConsole(
            roleMode: roleMode,
            permissions: permissions,
            userDoc: userDoc,
            founderDeliveryPreviewBuilder:
                _isFounder ? (_) => const UserConsole() : null,
          ),
        );
      },
    );
  }

  Widget _buildAccessError(String message) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: rcRed, size: 48),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: rcText)),
            const SizedBox(height: 20),
            FilledButton(onPressed: _loadClaims, child: const Text('RETRY')),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => FirebaseAuth.instance.signOut(),
              child: const Text('SIGN OUT'),
            ),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildSimpleAppBar() {
    return AppBar(
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [Text('RankCrackers')],
      ),
      actions: [
        IconButton(
          tooltip: 'Sign out',
          onPressed: () => FirebaseAuth.instance.signOut(),
          icon: const Icon(Icons.logout_rounded),
        ),
      ],
    );
  }

  PreferredSizeWidget _buildCommandAppBar(ConsoleRoleMode mode) {
    final isFounder = mode == ConsoleRoleMode.founder;
    return AppBar(
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'RankCrackers',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              Text(
                isFounder ? 'Founder Console' : 'Admin Panel',
                style: const TextStyle(fontSize: 11, color: rcMuted),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: 'Sign out',
          onPressed: () => FirebaseAuth.instance.signOut(),
          icon: const Icon(Icons.logout_rounded),
        ),
      ],
    );
  }
}

class _StudentMobileOnlyScreen extends StatelessWidget {
  const _StudentMobileOnlyScreen();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: RcPanel(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                'RankCrackers',
                style: TextStyle(
                  color: rcText,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Student panel is available on mobile app only.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: rcGold,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Founder and Admin consoles run on web. Please use the RankCrackers mobile app for student learning, missions, and dashboard access.',
                textAlign: TextAlign.center,
                style: TextStyle(color: rcMuted, height: 1.5),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => FirebaseAuth.instance.signOut(),
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class UserConsole extends StatelessWidget {
  const UserConsole({super.key});

  @override
  Widget build(BuildContext context) {
    return RcPagePad(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const RcPageTitle(
            title: 'Mission Delivery Preview',
            subtitle:
                'What Students are currently receiving from each mission.',
          ),
          const SizedBox(height: 14),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('mission_realms')
                  .where('userPanelVisible', isEqualTo: true)
                  .where('archived', isEqualTo: false)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError)
                  return Center(
                    child: Text(
                      'Delivery truth unavailable: ${snapshot.error}',
                    ),
                  );
                if (!snapshot.hasData) return const RcCenteredLoader();
                final docs = snapshot.data!.docs;
                final live = docs.where((doc) {
                  final data = doc.data();
                  final visibility = data['visibilityGate'] is Map
                      ? Map<String, dynamic>.from(data['visibilityGate'] as Map)
                      : const <String, dynamic>{};
                  return (data['cardVisible'] == true ||
                          data['userPanelVisible'] == true ||
                          visibility['studentVisible'] == true ||
                          visibility['userPanelVisible'] == true) &&
                      data['archived'] != true;
                }).toList();
                final drafts =
                    docs.where((doc) => !live.contains(doc)).toList();
                return ListView(
                  children: [
                    const Text(
                      'LIVE STUDENT MISSIONS',
                      style: TextStyle(
                        color: rcGold,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _DeliveryMissionGrid(docs: live),
                    if (drafts.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      const Text(
                        'FOUNDER DRAFTS',
                        style: TextStyle(
                          color: rcMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _DeliveryMissionGrid(docs: drafts),
                    ],
                    const SizedBox(height: 18),
                    ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      title: const Text(
                        'DELIVERY DETAILS',
                        style: TextStyle(
                          color: rcGold,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      subtitle: const Text(
                        'Secondary notification and learning-asset review signals.',
                      ),
                      children: [
                        SizedBox(
                          height: 250,
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final width = constraints.maxWidth >= 1000
                                  ? (constraints.maxWidth - 24) / 3
                                  : constraints.maxWidth >= 650
                                      ? (constraints.maxWidth - 12) / 2
                                      : constraints.maxWidth;
                              return SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: width,
                                      child: const _DeliveryReviewCard(
                                        title: 'Notification Delivery',
                                        subtitle:
                                            'Founder notices available to Student delivery.',
                                        collection: 'notification_registry',
                                        icon:
                                            Icons.notifications_active_outlined,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    SizedBox(
                                      width: width,
                                      child: const _DeliveryReviewCard(
                                        title: 'Syllabus Delivery',
                                        subtitle:
                                            'Processed syllabus sources prepared for delivery.',
                                        collection: 'ingestion_refinery',
                                        assetType: 'syllabus',
                                        icon: Icons.description_outlined,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    SizedBox(
                                      width: width,
                                      child: const _DeliveryReviewCard(
                                        title: 'Learning Material Delivery',
                                        subtitle:
                                            'Processed learning assets prepared for delivery.',
                                        collection: 'ingestion_refinery',
                                        assetType: 'study_material',
                                        icon: Icons.menu_book_outlined,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _DeliveryMissionGrid extends StatelessWidget {
  const _DeliveryMissionGrid({required this.docs});
  final List<QueryDocumentSnapshot<Map<String, dynamic>>> docs;
  @override
  Widget build(BuildContext context) {
    if (docs.isEmpty)
      return const Text(
        'No missions in this delivery state.',
        style: const TextStyle(color: rcMuted),
      );
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth >= 1050
            ? (constraints.maxWidth - 24) / 3
            : constraints.maxWidth >= 680
                ? (constraints.maxWidth - 12) / 2
                : constraints.maxWidth;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: docs
              .map(
                (doc) => SizedBox(
                  width: width,
                  child: _MissionDeliveryTruthCard(
                    missionId: doc.id,
                    catalog: doc.data(),
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _MissionDeliveryTruthCard extends StatelessWidget {
  const _MissionDeliveryTruthCard({
    required this.missionId,
    required this.catalog,
  });
  final String missionId;
  final Map<String, dynamic> catalog;
  @override
  Widget build(BuildContext context) {
    final title = (catalog['displayName'] ??
            catalog['title'] ??
            catalog['name'] ??
            missionId)
        .toString();
    final live = catalog['cardVisible'] == true &&
        catalog['userPanelVisible'] == true &&
        catalog['archived'] != true;
    final publication =
        (catalog['studentPublicationState'] ?? (live ? 'LIVE' : 'DRAFT'))
            .toString()
            .toUpperCase();
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(missionId)
          .snapshots(),
      builder: (context, snapshot) {
        final authority = snapshot.data?.exists == true;
        return RcPanel(
          child: Padding(
            padding: const EdgeInsets.all(2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                    Icon(
                      live ? Icons.visibility : Icons.visibility_off_outlined,
                      size: 18,
                      color: live ? rcGreen : rcMuted,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _deliveryFact(
                  'STUDENT VISIBILITY',
                  live ? 'LIVE FOR STUDENTS' : 'NOT LIVE',
                ),
                _deliveryFact('DELIVERY STATUS', live ? 'DELIVERED' : 'DRAFT'),
                _deliveryFact('PUBLICATION', publication.replaceAll('_', ' ')),
                _deliveryFact(
                  'MISSION AUTHORITY',
                  authority ? 'COMPLETE' : 'AUTHORITY REPAIR REQUIRED',
                  warn: !authority,
                ),
                const Divider(color: rcLine),
                Text(
                  authority
                      ? (live
                          ? 'Next action: Monitor delivery health.'
                          : 'Next action: Complete publish readiness.')
                      : 'Next action: Repair Founder authority.',
                  style: const TextStyle(fontSize: 11, color: rcMuted),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _deliveryFact(String label, String value, {bool warn = false}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 7),
        child: Row(
          children: [
            SizedBox(
              width: 118,
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 9,
                  color: rcMuted,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: Text(
                value,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: warn ? rcGold : rcMuted,
                ),
              ),
            ),
          ],
        ),
      );
}

class _DeliveryReviewCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String collection;
  final String? assetType;
  final IconData icon;
  const _DeliveryReviewCard({
    required this.title,
    required this.subtitle,
    required this.collection,
    required this.icon,
    this.assetType,
  });

  Query<Map<String, dynamic>> _query() {
    Query<Map<String, dynamic>> query = FirebaseFirestore.instance.collection(
      collection,
    );
    if (assetType != null) {
      query = query.where('assetType', isEqualTo: assetType);
    }
    return query;
  }

  void _openReview(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: rcSurface,
        insetPadding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760, maxHeight: 620),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, color: rcGold),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              color: rcGold,
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            subtitle,
                            style: const TextStyle(color: rcMuted),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Close',
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(child: _ReviewRecordList(query: _query(), limit: 30)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () => _openReview(context),
      child: RcPanel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: rcGold, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: rcGold,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: rcMuted),
            ),
            const SizedBox(height: 10),
            Expanded(child: _ReviewRecordList(query: _query(), limit: 4)),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => _openReview(context),
                icon: const Icon(Icons.open_in_full_rounded, size: 16),
                label: const Text('Open review'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReviewRecordList extends StatelessWidget {
  final Query<Map<String, dynamic>> query;
  final int limit;
  const _ReviewRecordList({required this.query, required this.limit});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: query.limit(limit).snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return const Text('Backend/data source not connected yet.');
        }
        if (!snapshot.hasData) return const RcCenteredLoader(compact: true);
        final docs = snapshot.data!.docs;
        if (docs.isEmpty) return const Text('No review records yet.');
        return ListView.separated(
          itemCount: docs.length,
          separatorBuilder: (_, __) => const Divider(color: rcLine),
          itemBuilder: (context, index) {
            final data = docs[index].data();
            final displayTitle = data['title'] ??
                data['name'] ??
                data['examName'] ??
                data['fileName'] ??
                docs[index].id;
            final displayBody = data['body'] ??
                data['description'] ??
                data['status'] ??
                data['documentStatus'] ??
                'Ready for delivery review';
            return ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: Tooltip(
                message: displayTitle.toString(),
                child: Text(
                  displayTitle.toString(),
                  maxLines: limit <= 4 ? 2 : 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              subtitle: Tooltip(
                message: displayBody.toString(),
                child: Text(
                  displayBody.toString(),
                  maxLines: limit <= 4 ? 3 : 4,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            );
          },
        );
      },
    );
  }
}
