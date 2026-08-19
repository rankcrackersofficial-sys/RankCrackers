import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../../../data/india_states.dart';
import '../../../../data/india_districts.dart';
import '../providers/auth_provider.dart';

class UnifiedIdentityScreen extends ConsumerStatefulWidget {
  const UnifiedIdentityScreen(
      {super.key,
      this.forceProfileSetupForTest = false,
      this.disableFirebaseAuthLookupForTest = false,
      this.disableAnimationsForTest = false});

  final bool forceProfileSetupForTest;
  final bool disableFirebaseAuthLookupForTest;
  final bool disableAnimationsForTest;

  @override
  ConsumerState<UnifiedIdentityScreen> createState() =>
      _UnifiedIdentityScreenState();
}

class _UnifiedIdentityScreenState extends ConsumerState<UnifiedIdentityScreen>
    with SingleTickerProviderStateMixin {
  // Controllers
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController stateController = TextEditingController();
  final TextEditingController districtController = TextEditingController();

  // Focus Nodes
  final FocusNode emailFocusNode = FocusNode();
  final FocusNode passwordFocusNode = FocusNode();
  final FocusNode stateFocusNode = FocusNode();
  final FocusNode districtFocusNode = FocusNode();

  // State
  List<String> districtsList = [];
  bool _isSaving = false;
  bool _identityEstablished = false;
  bool _passwordVisible = false;

  bool get _canSubmitIdentity =>
      nameController.text.trim().isNotEmpty &&
      mobileController.text.trim().length == 10 &&
      stateController.text.trim().isNotEmpty &&
      districtController.text.trim().isNotEmpty;

  late AnimationController _animationController;
  late Animation<double> glowAnimation;

  static const Color goldAccent = AppColors.gold;
  static const Color royalBlack = AppColors.background;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    if (widget.disableAnimationsForTest) {
      _animationController.value = 0.5;
    } else {
      _animationController.repeat(reverse: true);
    }

    glowAnimation = Tween<double>(begin: 0.06, end: 0.14).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    for (final controller in [
      nameController,
      mobileController,
      stateController,
      districtController,
    ]) {
      controller.addListener(_refreshIdentityCta);
    }

    emailFocusNode.addListener(_refreshIdentityCta);
    passwordFocusNode.addListener(_refreshIdentityCta);

    if (!widget.disableFirebaseAuthLookupForTest) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        nameController.text = user.displayName ?? '';
        _checkAndRehydrateProfile(user);
      }
    }
  }

  Future<void> _checkAndRehydrateProfile(User user) async {
    try {
      final doc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get(
        const GetOptions(source: Source.server)
      ).timeout(const Duration(seconds: 3));
      
      final data = doc.data();
      final exists = doc.exists && (data?['name']?.toString().isNotEmpty ?? false);
      if (exists && data != null && mounted) {
        final name = data['name']?.toString() ?? '';
        final city = data['city']?.toString() ?? '';
        final mobile = data['mobile']?.toString() ?? '';
        final stateStr = data['state']?.toString() ?? '';

        await SessionManager.completeLogin();
        await SessionManager.completeProfile(studentName: name, studentCity: city);
        await SessionManager.saveFirebaseIdentity(uid: user.uid, email: user.email ?? '');
        await SessionManager.saveStudentMobile(mobile);
        
        final prefs = await SharedPreferences.getInstance();
        if (stateStr.isNotEmpty) {
          await prefs.setString('user_state', stateStr);
        }

        if (mounted) {
          setState(() {
            _identityEstablished = true;
          });
          context.go(AppRoutes.missionRealm);
        }
      }
    } catch (e) {
      debugPrint('🔱 PROFILE AUTO REHYDRATE FAIL: $e');
    }
  }

  void _refreshIdentityCta() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    for (final controller in [
      nameController,
      mobileController,
      stateController,
      districtController,
    ]) {
      controller.removeListener(_refreshIdentityCta);
    }
    emailController.dispose();
    passwordController.dispose();
    nameController.dispose();
    mobileController.dispose();
    stateController.dispose();
    districtController.dispose();
    emailFocusNode.removeListener(_refreshIdentityCta);
    passwordFocusNode.removeListener(_refreshIdentityCta);
    emailFocusNode.dispose();
    passwordFocusNode.dispose();
    stateFocusNode.dispose();
    districtFocusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  // AUTH ACTIONS
  Future<void> _onEmailLogin() async {
    debugPrint('E01_LOGIN_BUTTON_PRESSED');
    FocusScope.of(context).unfocus();
    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      debugPrint('E_VALIDATION_FAILED=email');
      _showSnackBar("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      debugPrint('E_VALIDATION_FAILED=password');
      _showSnackBar("Password must be at least 6 characters");
      return;
    }

    final success = await ref.read(authNotifierProvider.notifier).authenticate(
          email: email,
          password: password,
        );

    if (success && mounted) {
      debugPrint('E06_ROUTE_DECISION_STARTED');
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        setState(() {
          nameController.text = user.displayName ?? '';
        });
      }
      debugPrint('E07_ROUTE_DECISION_COMPLETE');
    } else {
      final error = ref.read(authNotifierProvider).errorMessage;
      if (error != null) _showSnackBar(error);
    }
  }

  Future<void> _continueWithGoogle() async {
    debugPrint('G01_GOOGLE_BUTTON_PRESSED');
    FocusScope.of(context).unfocus();
    final success =
        await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    if (success && mounted) {
      debugPrint('G13_ROUTE_DECISION_STARTED');
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        setState(() {
          nameController.text = user.displayName ?? '';
        });
      }
      debugPrint('G14_ROUTE_DECISION_COMPLETE');
    } else {
      final error = ref.read(authNotifierProvider).errorMessage;
      if (error != null) _showSnackBar(error);
    }
  }

  Future<void> _forgotPassword() async {
    final email = emailController.text.trim();
    if (email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      _showSnackBar("Please enter your email to reset password");
      return;
    }
    final success =
        await ref.read(authNotifierProvider.notifier).forgotPassword(email);
    if (success) _showSnackBar("Password reset link sent to your email.");
  }

  Future<void> _switchAccount() async {
    if (_isSaving) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _identityEstablished = false;
      _isSaving = false;
    });
    await ref.read(authNotifierProvider.notifier).signOut();
    await SessionManager.logout();
    if (!mounted) return;
    context.go(AppRoutes.login);
  }

  // IDENTITY ACTIONS
  Future<void> _establishIdentity() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    if (nameController.text.trim().isEmpty) {
      _showSnackBar("Please enter your name");
      return;
    }
    if (mobileController.text.length != 10) {
      _showSnackBar("Please enter a 10-digit mobile number");
      return;
    }
    if (stateController.text.isEmpty || districtController.text.isEmpty) {
      _showSnackBar("Please select your location");
      return;
    }

    setState(() => _isSaving = true);

    try {
      final name = nameController.text.trim();
      final city = districtController.text.trim();
      final mobile = mobileController.text.trim();
      final stateStr = stateController.text.trim();

      // Step 1: Save local truth immediately.
      await SessionManager.completeLogin();
      await SessionManager.completeProfile(
          studentName: name, studentCity: city);
      await SessionManager.saveFirebaseIdentity(
          uid: user.uid, email: user.email ?? '');
      await SessionManager.saveStudentMobile(mobile);

      debugPrint('PROFILE SAVED');

      if (mounted) {
        setState(() => _identityEstablished = true);
      }

      // Step 2: Show the established badge briefly before dashboard navigation.
      await Future.delayed(const Duration(milliseconds: 500));

      if (!mounted) return;
      debugPrint("GOING TO MISSION REALM");
      context.go(AppRoutes.missionRealm);

      // Step 3: Background operations run after navigation starts.
      // These run after navigation starts and don't block the user.
      unawaited(FirestoreService.saveUserProfile(uid: user.uid, profileData: {
        'name': name,
        'city': city,
        'state': stateStr,
        'mobile': mobile,
        'onboardingCompleted': true,
        'updatedAt': FieldValue.serverTimestamp(),
        'email': user.email,
        'photoUrl': user.photoURL,
      }).then((_) => debugPrint("CLOUD SYNC COMPLETE")));

      // LEVEL-12.4
      // Disable hydration temporarily
      /*
      unawaited(KnowledgeEngine.instance.initialize(recruitment: /* mission selected later in Mission Realm */ null, force: true)
          .timeout(const Duration(seconds: 10))
          .then((_) => debugPrint("ENGINE HYDRATION TRIGGERED")));
      */
    } catch (e) {
      _showSnackBar("Identity Save Error: $e");
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  // MODAL SELECTORS
  void _showSearchSheet({
    required String title,
    required List<String> items,
    required Function(String) onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: royalBlack,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        List<String> filteredItems = items;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: ResponsiveHelper.hp(context, 0.8),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  Text(title,
                      style:
                          AppTypography.cardTitle.copyWith(color: goldAccent)),
                  const SizedBox(height: 16),
                  TextField(
                    autofocus: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: "Search...",
                      hintStyle: const TextStyle(color: Colors.white24),
                      prefixIcon: const Icon(Icons.search, color: goldAccent),
                      filled: true,
                      fillColor: Colors.white10,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none),
                    ),
                    onChanged: (val) {
                      setModalState(() {
                        filteredItems = items
                            .where((i) =>
                                i.toLowerCase().contains(val.toLowerCase()))
                            .toList();
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.builder(
                      itemCount: filteredItems.length,
                      itemBuilder: (context, index) {
                        return Material(
                          color: Colors.transparent,
                          child: ListTile(
                            title: Text(filteredItems[index],
                                style: const TextStyle(color: Colors.white70)),
                            onTap: () {
                              onSelected(filteredItems[index]);
                              Navigator.pop(context);
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          backgroundColor: const Color(0xFF111625),
          content:
              Text(message, style: GoogleFonts.poppins(color: Colors.white))),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user ?? FirebaseAuth.instance.currentUser;
    final showProfileSetup = widget.forceProfileSetupForTest || user != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      resizeToAvoidBottomInset: true,
      body: TacticalNoirBackground(
        child: Stack(
          children: [
            _buildAura(),
            SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  Widget content = Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                          height: ResponsiveHelper.sectionSpacing(context)),
                      _buildLogo(),
                      SizedBox(height: ResponsiveHelper.compactGap(context)),
                      _buildHeader(),
                      SizedBox(
                          height: ResponsiveHelper.sectionSpacing(context)),
                      if (showProfileSetup) ...[
                        _buildAccountControlBar(user?.email),
                        SizedBox(height: ResponsiveHelper.compactGap(context)),
                      ],
                      if (!showProfileSetup)
                        _buildLoginSection(authState.isLoading)
                      else
                        _buildIdentityForm(userPhotoUrl: user?.photoURL),
                      SizedBox(
                          height: ResponsiveHelper.sectionSpacing(context)),
                      _buildFooter(),
                    ],
                  );
                  return SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    padding: EdgeInsets.symmetric(
                      horizontal: ResponsiveHelper.wp(context, 0.07),
                      vertical: ResponsiveHelper.compactGap(context),
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 500),
                        child: content,
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAura() {
    final double screenHeight = ResponsiveHelper.height(context);
    final double screenWidth = ResponsiveHelper.width(context);
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Stack(
          children: [
            Positioned(
              top: -screenHeight * 0.12,
              left: -screenWidth * 0.26,
              child: Container(
                width: screenWidth * 0.86,
                height: screenWidth * 0.86,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [
                    goldAccent.withValues(alpha: glowAnimation.value * 0.78),
                    Colors.transparent,
                  ]),
                ),
              ),
            ),
            Positioned(
              right: -screenWidth * 0.28,
              bottom: screenHeight * 0.08,
              child: Container(
                width: screenWidth * 0.92,
                height: screenWidth * 0.92,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [
                    const Color(0xFF1C7FA3).withValues(alpha: 0.075),
                    const Color(0xFF0B1D33).withValues(alpha: 0.035),
                    Colors.transparent,
                  ]),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildLogo() {
    return Center(
      child: Image.asset(
        "assets/images/logo.png",
        height: ResponsiveHelper.isCompact(context) ? 50 : 80,
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Text(
          "RankCrackers",
          style: GoogleFonts.sora(
            fontSize: ResponsiveHelper.sp(context, 24),
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
        ),
        Text(
          "SOVEREIGN IDENTITY",
          style: AppTypography.label.copyWith(
            fontSize: 8,
            color: goldAccent.withValues(alpha: .6),
            letterSpacing: 2,
          ),
        ),
      ],
    );
  }

  Widget _buildAccountControlBar(String? email) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.68),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        children: [
          Icon(
            Icons.account_circle_outlined,
            size: 16,
            color: goldAccent.withValues(alpha: 0.72),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              email?.isNotEmpty == true ? email! : 'Signed in account',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.subtitle.copyWith(fontSize: 10),
            ),
          ),
          TextButton.icon(
            onPressed: _switchAccount,
            style: TextButton.styleFrom(
              foregroundColor: goldAccent,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              minimumSize: const Size(0, 32),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            icon: const Icon(Icons.logout_rounded, size: 15),
            label: Text(
              'Switch',
              style: AppTypography.label.copyWith(fontSize: 9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginSection(bool isLoading) {
    return Column(
      children: [
        _miniField(
          emailController,
          "Email Address",
          Icons.email_outlined,
          keyboard: TextInputType.emailAddress,
          focusNode: emailFocusNode,
          minimalSurface: true,
        ),
        const SizedBox(height: 12),
        _miniField(
          passwordController,
          "Password",
          Icons.lock_outline_rounded,
          obscure: !_passwordVisible,
          focusNode: passwordFocusNode,
          minimalSurface: true,
          suffixIcon: IconButton(
            tooltip: _passwordVisible ? "Hide password" : "Show password",
            splashRadius: 18,
            onPressed: () =>
                setState(() => _passwordVisible = !_passwordVisible),
            icon: Icon(
              _passwordVisible
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: goldAccent.withValues(alpha: 0.54),
              size: 18,
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: _forgotPassword,
            style: TextButton.styleFrom(
                padding: EdgeInsets.zero, minimumSize: const Size(50, 30)),
            child: Text("Forgot Password?",
                style: GoogleFonts.poppins(
                    color: goldAccent.withValues(alpha: 0.8), fontSize: 11)),
          ),
        ),
        const SizedBox(height: 12),
        PremiumButton(
            text: "LOGIN / CONTINUE",
            onTap: _onEmailLogin,
            isLoading: isLoading),
        const SizedBox(height: 20),
        Row(
          children: [
            const Expanded(child: Divider(color: Colors.white10)),
            Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text("OR",
                    style: AppTypography.label
                        .copyWith(fontSize: 8, color: Colors.white24))),
            const Expanded(child: Divider(color: Colors.white10)),
          ],
        ),
        const SizedBox(height: 20),
        InkWell(
          onTap: isLoading ? null : _continueWithGoogle,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            width: double.infinity,
            height: 56,
            decoration: BoxDecoration(
              gradient: AppColors.madhavCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: goldAccent.withValues(alpha: isLoading ? 0.32 : 0.2),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        goldAccent.withValues(alpha: 0.78),
                      ),
                    ),
                  )
                else
                  Image.asset("assets/images/google.png", width: 20),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    isLoading ? "Opening Google..." : "Continue with Google",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIdentityForm({
    String? userPhotoUrl,
  }) {
    return Container(
      padding: EdgeInsets.all(ResponsiveHelper.isCompact(context) ? 14 : 18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.surface2.withValues(alpha: 0.96),
            AppColors.surface.withValues(alpha: 0.98),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.92)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.34),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
          BoxShadow(
            color: AppColors.gold.withValues(alpha: 0.035),
            blurRadius: 18,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildProfilePhotoPrompt(userPhotoUrl),
          const SizedBox(height: 14),
          _miniField(
            nameController,
            "Full Name",
            Icons.person_outline_rounded,
            capitalization: TextCapitalization.words,
            onChanged: (value) {
              if (value.isNotEmpty) {
                final formatted = value
                    .split(' ')
                    .map((e) => e.isEmpty
                        ? ''
                        : '${e[0].toUpperCase()}${e.substring(1).toLowerCase()}')
                    .join(' ');
                if (formatted != value) {
                  nameController.value = TextEditingValue(
                    text: formatted,
                    selection:
                        TextSelection.collapsed(offset: formatted.length),
                  );
                }
              }
            },
          ),
          const SizedBox(height: 12),
          _miniField(
            mobileController,
            "Mobile Number",
            Icons.phone_android_rounded,
            keyboard: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          _miniSelector(
            title: "STATE / UT",
            hint: "Select State",
            controller: stateController,
            onTap: () => _showSearchSheet(
              title: "Select State",
              items: IndiaStates.statesAndUTs,
              onSelected: (val) {
                setState(() {
                  stateController.text = val;
                  districtController.clear();
                });
              },
            ),
          ),
          const SizedBox(height: 12),
          _miniSelector(
            title: "DISTRICT",
            hint: "Select District",
            controller: districtController,
            enabled: stateController.text.isNotEmpty,
            onTap: () {
              if (stateController.text.isEmpty) return;
              _showSearchSheet(
                title: "Select District",
                items: IndiaDistricts.districts[stateController.text] ?? [],
                onSelected: (val) =>
                    setState(() => districtController.text = val),
              );
            },
          ),
          const SizedBox(height: 24),
          if (_identityEstablished)
            _buildIdentityEstablishedBadge()
          else
            _SovereignIdentityCta(
              text: _isSaving ? "ESTABLISHING IDENTITY" : "ESTABLISH IDENTITY",
              isLoading: _isSaving,
              enabled: _canSubmitIdentity && !_isSaving,
              onTap:
                  _canSubmitIdentity && !_isSaving ? _establishIdentity : null,
            ),
        ],
      ),
    );
  }

  Widget _buildProfilePhotoPrompt(String? userPhotoUrl) {
    final hasPhoto = userPhotoUrl != null && userPhotoUrl.isNotEmpty;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => _showSnackBar(
        "Profile photo can be updated after identity setup.",
      ),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.elevatedSurface.withValues(alpha: 0.96),
              AppColors.surface2.withValues(alpha: 0.92),
            ],
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.9)),
        ),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: goldAccent.withValues(alpha: 0.38), width: 1.2),
                image: hasPhoto
                    ? DecorationImage(
                        image: NetworkImage(userPhotoUrl),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: hasPhoto
                  ? null
                  : Icon(
                      Icons.person_add_alt_1_rounded,
                      color: goldAccent.withValues(alpha: 0.82),
                      size: 25,
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Profile Photo",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.cardTitle.copyWith(fontSize: 13),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    hasPhoto
                        ? "Synced from your signed-in account."
                        : "Your profile photo can be added after identity setup.",
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.subtitle.copyWith(fontSize: 10),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.camera_alt_rounded,
              color: goldAccent.withValues(alpha: 0.65),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIdentityEstablishedBadge() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 62),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.elevatedSurface.withValues(alpha: 0.96),
            AppColors.surface.withValues(alpha: 0.98),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: goldAccent.withValues(alpha: 0.46)),
        boxShadow: [
          BoxShadow(
            color: goldAccent.withValues(alpha: 0.11),
            blurRadius: 22,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: goldAccent.withValues(alpha: 0.12),
              border: Border.all(color: goldAccent.withValues(alpha: 0.5)),
            ),
            child: const Icon(
              Icons.verified_rounded,
              color: goldAccent,
              size: 19,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "IDENTITY ESTABLISHED",
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.sora(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.9,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  "Sovereign profile secured",
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.subtitle.copyWith(fontSize: 10),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Center(
      child: Text(
        "Secure | Sovereign | AI Driven",
        style: AppTypography.label.copyWith(
          fontSize: 7,
          color: Colors.white12,
        ),
      ),
    );
  }

  Widget _miniField(
    TextEditingController controller,
    String hint,
    IconData icon, {
    TextInputType keyboard = TextInputType.text,
    bool obscure = false,
    TextCapitalization capitalization = TextCapitalization.none,
    Function(String)? onChanged,
    FocusNode? focusNode,
    bool minimalSurface = false,
    Widget? suffixIcon,
  }) {
    final isFocused = focusNode?.hasFocus ?? false;
    final fieldBorder = minimalSurface
        ? (isFocused
            ? goldAccent.withValues(alpha: 0.42)
            : goldAccent.withValues(alpha: 0.18))
        : AppColors.border.withValues(alpha: 0.95);
    final fieldFill = minimalSurface
        ? Colors.transparent
        : AppColors.elevatedSurface.withValues(alpha: 0.94);
    final fieldGradient = minimalSurface
        ? LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.surface2.withValues(alpha: isFocused ? 0.44 : 0.34),
              AppColors.surface.withValues(alpha: isFocused ? 0.36 : 0.28),
            ],
          )
        : null;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      height: minimalSurface ? 56 : ResponsiveHelper.fieldHeight(context),
      decoration: BoxDecoration(
        color: fieldFill,
        gradient: fieldGradient,
        borderRadius: BorderRadius.circular(minimalSurface ? 16 : 12),
        border: Border.all(color: fieldBorder, width: 1),
        boxShadow: minimalSurface
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        keyboardType: keyboard,
        obscureText: obscure,
        textCapitalization: capitalization,
        onChanged: onChanged,
        autofillHints: keyboard == TextInputType.emailAddress
            ? const [AutofillHints.email]
            : obscure
                ? const [AutofillHints.password]
                : null,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            color: Colors.white.withValues(alpha: minimalSurface ? 0.34 : 0.10),
            fontSize: 13,
          ),
          prefixIcon: Icon(icon,
              color: goldAccent.withValues(alpha: minimalSurface ? 0.62 : 0.56),
              size: 18),
          suffixIcon: suffixIcon,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _miniSelector({
    required String title,
    required String hint,
    required TextEditingController controller,
    required VoidCallback onTap,
    bool enabled = true,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        height: ResponsiveHelper.fieldHeight(context),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: enabled
              ? AppColors.elevatedSurface.withValues(alpha: 0.94)
              : AppColors.surface.withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.95)),
        ),
        child: Row(
          children: [
            Icon(Icons.location_on_outlined,
                color: goldAccent.withValues(alpha: 0.5), size: 18),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                controller.text.isEmpty ? hint : controller.text,
                style: TextStyle(
                  color:
                      controller.text.isEmpty ? Colors.white10 : Colors.white70,
                  fontSize: 13,
                ),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded,
                color: Colors.white10, size: 18),
          ],
        ),
      ),
    );
  }
}

class _SovereignIdentityCta extends StatefulWidget {
  const _SovereignIdentityCta({
    required this.text,
    required this.enabled,
    required this.isLoading,
    required this.onTap,
  });

  final String text;
  final bool enabled;
  final bool isLoading;
  final VoidCallback? onTap;

  @override
  State<_SovereignIdentityCta> createState() => _SovereignIdentityCtaState();
}

class _SovereignIdentityCtaState extends State<_SovereignIdentityCta> {
  bool _pressed = false;

  static const Color _gold = Color(0xFFD4AF37);
  static const Color _deepGold = Color(0xFF8F6D1D);
  static const Color _black = Color(0xFF070A12);

  void _setPressed(bool value) {
    if (!widget.enabled || widget.isLoading) return;
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final active = widget.enabled || widget.isLoading;
    final goldStrength = active ? 1.0 : 0.34;

    return Semantics(
      button: !widget.isLoading,
      enabled: widget.enabled,
      label: widget.text,
      child: GestureDetector(
        onTap: widget.enabled && !widget.isLoading ? widget.onTap : null,
        onTapDown: (_) => _setPressed(true),
        onTapCancel: () => _setPressed(false),
        onTapUp: (_) => _setPressed(false),
        child: AnimatedScale(
          duration: const Duration(milliseconds: 90),
          curve: Curves.easeOut,
          scale: _pressed ? 0.985 : 1,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: double.infinity,
            constraints: const BoxConstraints(minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 11),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color.lerp(
                      const Color(0xFF33270F), _gold, 0.28 * goldStrength)!,
                  Color.lerp(
                      _black, const Color(0xFF171109), 0.72 * goldStrength)!,
                  Color.lerp(_black, _deepGold, 0.28 * goldStrength)!,
                ],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: _gold.withValues(alpha: active ? 0.58 : 0.18),
              ),
              boxShadow: [
                BoxShadow(
                  color: _gold.withValues(alpha: active ? 0.14 : 0.0),
                  blurRadius: 22,
                  offset: const Offset(0, 10),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.32),
                  blurRadius: 12,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned.fill(
                  top: 0,
                  bottom: null,
                  child: Container(
                    height: 1,
                    decoration: BoxDecoration(
                      color:
                          Colors.white.withValues(alpha: active ? 0.24 : 0.06),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(18),
                      ),
                    ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 29,
                      height: 29,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _black.withValues(alpha: 0.36),
                        border: Border.all(
                          color: _gold.withValues(alpha: active ? 0.42 : 0.16),
                        ),
                      ),
                      child: Icon(
                        Icons.shield_outlined,
                        color: _gold.withValues(alpha: active ? 0.86 : 0.32),
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 11),
                    Flexible(
                      child: Text(
                        widget.text,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.sora(
                          color: active
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.38),
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.9,
                        ),
                      ),
                    ),
                    if (widget.isLoading) ...[
                      const SizedBox(width: 11),
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            _gold.withValues(alpha: 0.82),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
