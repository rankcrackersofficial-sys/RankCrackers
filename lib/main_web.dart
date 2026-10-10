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
  await SessionManager.initialize();
  runApp(const ProviderScope(child: RankCrackersWebApp()));
}

class RankCrackersWebApp extends StatelessWidget {
  const RankCrackersWebApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'RankCrackers Web',
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: rcBg,
        colorScheme: const ColorScheme.dark(
          primary: rcGold,
          secondary: rcGreen,
          surface: rcSurface,
        ),
      ),
      home: Uri.base.path == '/admin-invite'
          ? AdminInviteScreen(token: Uri.base.queryParameters['token'] ?? '')
          : const AuthGate(),
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
  String? _invitedEmail;

  @override
  void initState() {
    super.initState();
    _checkInviteStatus();
  }

  Future<void> _checkInviteStatus() async {
    final pendingToken = html.window.sessionStorage['pendingAdminInviteToken'];
    if (pendingToken != null && pendingToken.isNotEmpty) {
      setState(() => _signupMode = true); // Default to signup for invites
      try {
        final callable = FirebaseFunctions.instance.httpsCallable(
          'manageUserAccess',
        );
        final result = await callable.call({
          'action': 'validateAdminInvite',
          'inviteToken': pendingToken,
        });
        final data = Map<String, dynamic>.from(result.data as Map);
        if (mounted) {
          setState(() {
            _invitedEmail = data['email']?.toString().trim().toLowerCase();
            if (_invitedEmail != null) {
              _email.text = _invitedEmail!;
            }
          });
        }
      } catch (e) {
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
      } else {
        await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: email,
          password: password,
        );
      }
    } on FirebaseAuthException catch (e) {
      if ((e.code == 'user-not-found' || e.code == 'invalid-credential') &&
          !_signupMode) {
        setState(() {
          _error =
              'No password account found for this email. Switch to Create mode?';
          _signupMode = true;
        });
      } else if (e.code == 'email-already-in-use' && _signupMode) {
        setState(() {
          _error = 'Account already exists. Switch to Login mode?';
          _signupMode = false;
        });
      } else if (e.code == 'invalid-credential' && _signupMode) {
        setState(
          () => _error =
              'Invalid credentials. If this email is linked to Google, use Continue with Google.',
        );
      } else {
        setState(() => _error = e.message ?? e.toString());
      }
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
      await FirebaseAuth.instance.signInWithPopup(provider);
    } catch (e) {
      setState(() => _error = e.toString());
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
      backgroundColor: const Color(0xFF070A12),
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
                      color: const Color(0xFF070A12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: rcGold.withOpacity(0.24),
                        width: 1.5,
                      ),
                    ),
                    child: Image.asset("assets/images/logo.png"),
                  ),
                ),
                const SizedBox(height: 16),
                const Center(
                  child: Text(
                    'RankCrackers',
                    style: TextStyle(
                      color: Colors.white,
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
                      color: Colors.white10,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: rcGold.withOpacity(0.10)),
                    ),
                    child: const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '\u0915\u0930\u094D\u092E\u0923\u094D\u092F\u0947\u0935\u093E\u0927\u093F\u0915\u093E\u0930\u0938\u094D\u0924\u0947',
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
                          "(Your right is to action alone.)",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                            color: Colors.white60,
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
                TextButton(
                  onPressed: () => setState(() => _signupMode = !_signupMode),
                  child: Text(
                    _signupMode
                        ? 'Already have an account? Login'
                        : 'Need an account? Create one',
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

  @override
  void initState() {
    super.initState();
    _loadClaims();
  }

  Future<void> _loadClaims() async {
    final token = await widget.user.getIdTokenResult(true);
    final claims = token.claims ?? {};
    setState(() {
      final bool claimFounder = claims['founder'] == true;
      _isFounder = claimFounder;
      _isAdmin = claims['admin'] == true;

      _claimsLoaded = true;
    });
  }

  @override
  Widget build(BuildContext context) {
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
        if (!snapshot.hasData) return const Scaffold(body: RcCenteredLoader());

        final userDoc = snapshot.data!.data() ?? {};
        final status = userDoc['status'] ?? 'ACTIVE';

        if (status != 'ACTIVE') {
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
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Admin access is not active. Contact Founder.',
                    style: TextStyle(color: Colors.white38),
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
        final roleMode = _isFounder
            ? ConsoleRoleMode.founder
            : ConsoleRoleMode.admin;

        return Scaffold(
          appBar: _buildCommandAppBar(roleMode),
          body: UnifiedCommandConsole(
            roleMode: roleMode,
            permissions: permissions,
            userDoc: userDoc,
            founderDeliveryPreviewBuilder: _isFounder
                ? (_) => const UserConsole()
                : null,
          ),
        );
      },
    );
  }

  PreferredSizeWidget _buildSimpleAppBar() {
    return AppBar(
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.asset(
              'assets/images/logo.png',
              width: 28,
              height: 28,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          const Text('RankCrackers'),
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

  PreferredSizeWidget _buildCommandAppBar(ConsoleRoleMode mode) {
    final isFounder = mode == ConsoleRoleMode.founder;
    return AppBar(
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.asset(
              'assets/images/logo.png',
              width: 30,
              height: 30,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 12),
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
                style: const TextStyle(fontSize: 11, color: Colors.white54),
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
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
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
                style: TextStyle(color: Colors.white60, height: 1.5),
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
                final drafts = docs
                    .where((doc) => !live.contains(doc))
                    .toList();
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
                          color: Colors.white54,
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
        style: TextStyle(color: Colors.white54),
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
    final title =
        (catalog['displayName'] ??
                catalog['title'] ??
                catalog['name'] ??
                missionId)
            .toString();
    final live =
        catalog['cardVisible'] == true &&
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
                      color: live ? Colors.greenAccent : Colors.white38,
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
                  style: const TextStyle(fontSize: 11, color: Colors.white60),
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
                  color: Colors.white38,
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
                  color: warn ? Colors.orangeAccent : Colors.white70,
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
                            style: const TextStyle(color: Colors.white54),
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
              style: const TextStyle(color: Colors.white54),
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
            final displayTitle =
                data['title'] ??
                data['name'] ??
                data['examName'] ??
                data['fileName'] ??
                docs[index].id;
            final displayBody =
                data['body'] ??
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
