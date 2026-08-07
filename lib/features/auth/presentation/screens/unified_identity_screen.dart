import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../../../data/india_states.dart';
import '../../../../data/india_districts.dart';
import '../../../../core/models/recruitment.dart';
import '../providers/auth_provider.dart';
import '../providers/mission_realm_provider.dart';

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
  // 🔱 Controllers
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController stateController = TextEditingController();
  final TextEditingController districtController = TextEditingController();
  final TextEditingController missionController = TextEditingController();

  // 🔱 Focus Nodes
  final FocusNode stateFocusNode = FocusNode();
  final FocusNode districtFocusNode = FocusNode();
  final FocusNode missionFocusNode = FocusNode();

  // 🔱 State
  List<String> districtsList = [];
  Recruitment? selectedMission;
  bool _isSaving = false;

  late AnimationController _animationController;
  late Animation<double> glowAnimation;

  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color royalBlack = Color(0xFF070A12);

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

    if (!widget.disableFirebaseAuthLookupForTest) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        nameController.text = user.displayName ?? '';
      }
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    nameController.dispose();
    mobileController.dispose();
    stateController.dispose();
    districtController.dispose();
    missionController.dispose();
    stateFocusNode.dispose();
    districtFocusNode.dispose();
    missionFocusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  // 🔱 AUTH ACTIONS
  Future<void> _onEmailLogin() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      _showSnackBar("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      _showSnackBar("Password must be at least 6 characters");
      return;
    }

    final success = await ref.read(authNotifierProvider.notifier).authenticate(
          email: email,
          password: password,
        );

    if (success && mounted) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        setState(() {
          nameController.text = user.displayName ?? '';
        });
      }
    } else {
      final error = ref.read(authNotifierProvider).errorMessage;
      if (error != null) _showSnackBar(error);
    }
  }

  Future<void> _continueWithGoogle() async {
    final success =
        await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    if (success && mounted) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        setState(() {
          nameController.text = user.displayName ?? '';
        });
      }
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

  // 🔱 IDENTITY ACTIONS
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
    if (selectedMission == null) {
      _showSnackBar("Please select your target mission");
      return;
    }

    setState(() => _isSaving = true);

    try {
      final name = nameController.text.trim();
      final city = districtController.text.trim();
      final mobile = mobileController.text.trim();
      final stateStr = stateController.text.trim();

      // 🔱 STEP 1: Save Local Truth Immediately (Non-blocking)
      await SessionManager.completeLogin(); // 🔱 Ensure login state is marked
      await SessionManager.completeProfile(
          studentName: name, studentCity: city);
      await SessionManager.saveFirebaseIdentity(
          uid: user.uid, email: user.email ?? '');
      await SessionManager.saveStudentMobile(mobile);

      await SessionManager.saveMissionIdentity(
        examId: selectedMission!.examId,
        examName: selectedMission!.title,
        recruitmentId: selectedMission!.id,
        examBlueprintId: selectedMission!.examBlueprintId,
        variantId: selectedMission!.variantCode,
      );

      debugPrint("🔱 PROFILE SAVED");
      debugPrint("🔱 MISSION SAVED");

      // 🔱 STEP 2: Execute Instant Navigation after brief buffer for disk flush
      await Future.delayed(const Duration(milliseconds: 500));

      if (!mounted) return;
      debugPrint("🔱 GOING TO DASHBOARD");
      context.go(AppRoutes.dashboard);

      // 🔱 STEP 3: Background Operations (Sovereign Threading)
      // These run after navigation starts and don't block the user.
      unawaited(FirestoreService.saveUserProfile(uid: user.uid, profileData: {
        'name': name,
        'city': city,
        'state': stateStr,
        'mobile': mobile,
        'onboardingCompleted': true,
        'selectedExam': selectedMission!.examId,
        'selectedExamName': selectedMission!.title,
        'updatedAt': FieldValue.serverTimestamp(),
        'email': user.email,
        'photoUrl': user.photoURL,
      }).then((_) => debugPrint("🔱 CLOUD SYNC COMPLETE")));

      // 🔱 LEVEL-12.4
      // Disable hydration temporarily
      /*
      unawaited(KnowledgeEngine.instance.initialize(recruitment: selectedMission, force: true)
          .timeout(const Duration(seconds: 10))
          .then((_) => debugPrint("🔱 ENGINE HYDRATION TRIGGERED")));
      */
    } catch (e) {
      _showSnackBar("Identity Save Error: $e");
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  // 🔱 MODAL SELECTORS
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
                        return ListTile(
                          title: Text(filteredItems[index],
                              style: const TextStyle(color: Colors.white70)),
                          onTap: () {
                            onSelected(filteredItems[index]);
                            Navigator.pop(context);
                          },
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
    final user = authState.user;
    final showProfileSetup = widget.forceProfileSetupForTest || user != null;
    final allMissions = ref.watch(publishedRecruitmentsProvider);

    return Scaffold(
      backgroundColor: royalBlack,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          _buildAura(),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                Widget content = Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: ResponsiveHelper.sectionSpacing(context)),
                    _buildLogo(),
                    SizedBox(height: ResponsiveHelper.compactGap(context)),
                    _buildHeader(),
                    SizedBox(height: ResponsiveHelper.sectionSpacing(context)),
                    if (!showProfileSetup)
                      _buildLoginSection(authState.isLoading)
                    else
                      _buildIdentityForm(allMissions),
                    SizedBox(height: ResponsiveHelper.sectionSpacing(context)),
                    _buildFooter(),
                  ],
                );

                if (ResponsiveHelper.isCompact(context)) {
                  return SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: EdgeInsets.symmetric(
                        horizontal: ResponsiveHelper.wp(context, 0.07)),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 500),
                        child: content,
                      ),
                    ),
                  );
                }

                return Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 500),
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                          horizontal: ResponsiveHelper.wp(context, 0.07)),
                      child: content,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAura() {
    final double screenHeight = ResponsiveHelper.height(context);
    final double screenWidth = ResponsiveHelper.width(context);
    return Positioned(
      top: -screenHeight * 0.1,
      left: -screenWidth * 0.2,
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Container(
            width: screenWidth * 0.8,
            height: screenWidth * 0.8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [
                goldAccent.withValues(alpha: glowAnimation.value),
                Colors.transparent
              ]),
            ),
          );
        },
      ),
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

  Widget _buildLoginSection(bool isLoading) {
    return Column(
      children: [
        _miniField(emailController, "Email Address", Icons.email_outlined,
            keyboard: TextInputType.emailAddress),
        const SizedBox(height: 12),
        _miniField(passwordController, "Password", Icons.lock_outline_rounded,
            obscure: true),
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
          onTap: _continueWithGoogle,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            height: 56,
            decoration: BoxDecoration(
              gradient: AppColors.madhavCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: goldAccent.withValues(alpha: 0.2)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset("assets/images/google.png", width: 20),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    "Continue with Google",
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

  Widget _buildIdentityForm(List<Recruitment> missions) {
    return Column(
      children: [
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
                  selection: TextSelection.collapsed(offset: formatted.length),
                );
              }
            }
          },
        ),
        const SizedBox(height: 12),
        _miniField(
            mobileController, "Mobile Number", Icons.phone_android_rounded,
            keyboard: TextInputType.phone),
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
        const SizedBox(height: 12),
        _miniSelector(
          title: "TARGET MISSION",
          hint: "Select Exam",
          controller: missionController,
          onTap: () => _showSearchSheet(
            title: "Select Target Mission",
            items: missions.map((m) => m.title).toList(),
            onSelected: (val) {
              setState(() {
                missionController.text = val;
                selectedMission = missions.firstWhere((m) => m.title == val);
              });
            },
          ),
        ),
        const SizedBox(height: 24),
        PremiumButton(
          text: "ESTABLISH IDENTITY",
          onTap: _establishIdentity,
          isLoading: _isSaving,
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Center(
      child: Text(
        "Secure • Sovereign • AI Driven",
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
  }) {
    return Container(
      height: ResponsiveHelper.fieldHeight(context),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboard,
        obscureText: obscure,
        textCapitalization: capitalization,
        onChanged: onChanged,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.white10, fontSize: 13),
          prefixIcon:
              Icon(icon, color: goldAccent.withValues(alpha: 0.5), size: 18),
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
              ? AppColors.surface
              : AppColors.surface.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderSoft),
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
