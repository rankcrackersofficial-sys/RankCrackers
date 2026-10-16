import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/theme/app_theme_controller.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../../core/services/support_service.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';
import '../../../../core/utils/responsive_helper.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/deep_profile/providers/warrior_profile_provider.dart';
import 'package:rank_crackers/features/deep_profile/screens/career_profile_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Color get _surface => Theme.of(context).colorScheme.surfaceContainerHighest;
  Color get _background => Theme.of(context).colorScheme.surface;
  Color get _text => Theme.of(context).colorScheme.onSurface;
  Color get _muted => Theme.of(context).colorScheme.onSurfaceVariant;
  Color get _border => Theme.of(context).colorScheme.outline;
  Color get _onPrimary => Theme.of(context).colorScheme.onPrimary;

  bool _isAdmin = false;

  @override
  void initState() {
    super.initState();
    _checkAdmin();
  }

  Future<void> _checkAdmin() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final idToken = await user.getIdTokenResult();
    if (mounted) {
      setState(() {
        _isAdmin = idToken.claims?['admin'] == true ||
            idToken.claims?['founder'] == true;
      });
    }
  }

  Future<void> _updatePhoto() async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 500,
    );

    if (image != null) {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('UPLOADING AVATAR...')));

      try {
        final storageRef = FirebaseStorage.instance
            .ref()
            .child('user_photos')
            .child('${user.uid}.jpg');
        await storageRef.putFile(File(image.path));
        final url = await storageRef.getDownloadURL();
        await SessionManager.saveStudentPhoto(url);
        await user.updatePhotoURL(url);
        if (!mounted) return;
        ref.invalidate(sessionUserProvider);
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('PROFILE PHOTO UPDATED')));
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Upload Failed: $e')));
      }
    }
  }

  Future<void> _updateIdentityDialog() async {
    final sessionUser = ref.read(sessionUserProvider).valueOrNull;
    final controller = TextEditingController(text: sessionUser?.name);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: _surface,
        title: Text("EDIT IDENTITY", style: TextStyle(color: _text)),
        content: TextField(
          controller: controller,
          style: TextStyle(color: _text),
          decoration: InputDecoration(
            labelText: "Display Name",
            labelStyle: TextStyle(color: _muted),
            border: OutlineInputBorder(
                borderSide: BorderSide(color: _border)),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("CANCEL", style: TextStyle(color: _muted))),
          TextButton(
            onPressed: () async {
              if (controller.text.isEmpty) return;
              final user = FirebaseAuth.instance.currentUser;
              if (user != null) {
                await user.updateDisplayName(controller.text);
                await SessionManager.saveStudentName(controller.text);
                await FirebaseFirestore.instance.collection('users').doc(user.uid).update({
                  'name': controller.text,
                });
                ref.invalidate(sessionUserProvider);
              }
              if (context.mounted) Navigator.pop(context);
            },
            child: Text("SAVE", style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );
  }

  Future<void> _showMobileVerificationDialog() async {
    final sessionUser = ref.read(sessionUserProvider).valueOrNull;
    final controller = TextEditingController(text: sessionUser?.phone);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: _surface,
        title: Text("MOBILE & VERIFICATION", style: TextStyle(color: _text)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Ensure your contact number is verified to receive priority mission communications.",
              style: TextStyle(color: _muted, fontSize: 12),
            ),
            SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.phone,
              style: TextStyle(color: _text),
              decoration: InputDecoration(
                labelText: "Mobile Number",
                labelStyle: TextStyle(color: _muted),
                border: OutlineInputBorder(
                    borderSide: BorderSide(color: _border)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("CANCEL", style: TextStyle(color: _muted))),
          TextButton(
            onPressed: () async {
              if (controller.text.isEmpty) return;
              final user = FirebaseAuth.instance.currentUser;
              if (user != null) {
                await FirebaseFirestore.instance.collection('users').doc(user.uid).update({
                  'phone': controller.text,
                });
                await SessionManager.saveStudentMobile(controller.text);
                ref.invalidate(sessionUserProvider);
              }
              if (context.mounted) Navigator.pop(context);
            },
            child: Text("VERIFY & SAVE", style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );
  }

  Future<void> _showSupportDialog(String type) async {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: _surface,
        title: Text(type == 'issue_report' ? 'REPORT AN ISSUE' : 'SUBMIT GENERAL INQUIRY', style: AppTypography.cardTitle),
        content: TextField(
          controller: controller,
          maxLines: 4,
          style: TextStyle(color: _text),
          decoration: InputDecoration(
            hintText: "Enter details for the command team...",
            hintStyle: TextStyle(color: _muted),
            border: OutlineInputBorder(
                borderSide: BorderSide(color: _border)),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("CANCEL")),
          TextButton(
            onPressed: () async {
              if (controller.text.isEmpty) return;
              await SupportService.createTicket(
                  type: type, message: controller.text);
              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('TICKET SUBMITTED')));
              }
            },
            child:
                const Text("SUBMIT", style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;

    final engine = ref.watch(knowledgeEngineProvider);

    final warriorProfile = ref.watch(warriorProfileProvider);
    final firebaseUid = FirebaseAuth.instance.currentUser?.uid;
    if (warriorProfile == null && firebaseUid != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(warriorProfileProvider.notifier).loadProfile(firebaseUid);
      });
    }

    return Scaffold(
      backgroundColor: _background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                      maxWidth: ResponsiveHelper.isTablet(context)
                          ? 700
                          : double.infinity),
                  child: CustomScrollView(
                    physics: BouncingScrollPhysics(),
                    slivers: [
                      _buildProfileSection(sessionUser),
                      _buildCareerProfileSliver(warriorProfile),
                      _buildMissionSection(sessionUser?.examName),
                      _buildAccountPrivacySection(sessionUser),
                      _buildAppearanceSection(),
                      _buildHelpSupportSection(),
                      _buildSessionSection(),
                      _buildDangerZoneSection(),
                      _buildLegalSection(),
                      _buildAdaptiveInsights(engine),

                      const SliverToBoxAdapter(child: SizedBox(height: 100)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }



  Widget _sectionLabel(String text) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8, left: 4),
      child: Text(text,
          style: AppTypography.label.copyWith(
              fontSize: 9, color: _muted, letterSpacing: 1.0, fontWeight: FontWeight.bold)),
    );
  }

  Widget _settingsListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color iconColor = AppColors.gold,
    Color titleColor = _text,
    bool isDestructive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: Border.all(
          color: isDestructive ? Colors.red.withValues(alpha: 0.3) : _border,
          width: 1.0,
        ),
        child: Row(
          children: [
            Icon(icon, color: isDestructive ? Colors.redAccent : iconColor, size: 18),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.cardTitle.copyWith(
                      fontSize: 13, 
                      color: isDestructive ? Colors.redAccent : titleColor,
                      fontWeight: isDestructive ? FontWeight.bold : null,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.subtitle.copyWith(fontSize: 10, color: isDestructive ? Colors.red.withValues(alpha: 0.5) : _muted),
                  ),
                ],
              ),
            ),
            if (!isDestructive)
              Icon(Icons.arrow_forward_ios_rounded, size: 12, color: _muted),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileSection(SessionUser? sessionUser) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 16,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('PROFILE'),
            DarkCard(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _updatePhoto,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: _surface,
                          backgroundImage: sessionUser?.photo != null
                              ? NetworkImage(sessionUser!.photo!)
                              : null,
                          child: sessionUser?.photo == null
                              ? Icon(Icons.person_rounded, size: 28, color: _muted)
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.gold,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.camera_alt_rounded,
                              size: 10,
                              color: _onPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sessionUser?.name ?? 'Warrior',
                          style: AppTypography.cardTitle.copyWith(fontSize: 15, color: _text),
                        ),
                        SizedBox(height: 2),
                        Text(
                          sessionUser?.email ?? 'Identity Verified',
                          style: AppTypography.subtitle.copyWith(fontSize: 11, color: _muted),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: _updateIdentityDialog,
                    child: const Text(
                      'Edit Profile',
                      style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCareerProfileSliver(WarriorProfile? profile) {
    final addedCount = profile?.careerProfileAddedCount ?? 0;
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('CAREER'),
            DarkCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Career Profile',
                        style: AppTypography.cardTitle.copyWith(color: AppColors.gold),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          '$addedCount of 7 key details added',
                          style: AppTypography.subtitle.copyWith(color: AppColors.gold, fontWeight: FontWeight.bold, fontSize: 10),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Build a more accurate picture of your education, goals and career preferences.',
                    style: AppTypography.body.copyWith(color: _muted, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CareerProfileScreen(),
                          ),
                        ).then((_) {
                          final user = FirebaseAuth.instance.currentUser;
                          if (user != null) {
                            ref.read(warriorProfileProvider.notifier).loadProfile(user.uid);
                          }
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _surface,
                        foregroundColor: _text,
                        side: BorderSide(color: _border),
                        padding: EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Update Career Profile',
                        style: AppTypography.button.copyWith(color: _text, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMissionSection(String? currentExam) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('MISSION'),
            DarkCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentExam ?? 'Select Mission',
                          style: AppTypography.cardTitle.copyWith(fontSize: 16, color: _text),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Active Preparation Stream',
                          style: TextStyle(color: _muted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => context.push(AppRoutes.missionRealm),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _surface,
                      foregroundColor: _text,
                      side: BorderSide(color: _border),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Change Mission',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.gold),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppColors.gold),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountPrivacySection(SessionUser? sessionUser) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('ACCOUNT & PRIVACY'),
            _settingsListTile(
              icon: Icons.person_outline_rounded,
              title: 'Personal Details',
              subtitle: 'Name, Email & Enrollment Credentials',
              onTap: _updateIdentityDialog,
            ),
            SizedBox(height: 8),
            _settingsListTile(
              icon: Icons.phone_android_rounded,
              title: 'Mobile & Verification',
              subtitle: sessionUser?.phone ?? 'Not Verified',
              onTap: _showMobileVerificationDialog,
            ),
            SizedBox(height: 8),
            _settingsListTile(
              icon: Icons.privacy_tip_outlined,
              title: 'Privacy',
              subtitle: 'Manage data preferences and privacy settings',
              onTap: () => _showLegalDialog('Privacy Policy', 'Your academic progress and career matches are private and protected under strict governed access controls. Only you can view your performance insights.'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHelpSupportSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('HELP & SUPPORT'),
            _settingsListTile(
              icon: Icons.bug_report_outlined,
              title: 'Report an Issue',
              subtitle: 'Report software bugs, layout glitches or syllabus errors',
              onTap: () => _showSupportDialog('issue_report'),
            ),
            SizedBox(height: 8),
            _settingsListTile(
              icon: Icons.help_outline_rounded,
              title: 'Help Center',
              subtitle: 'Submit general queries to academic mentors',
              onTap: () => _showSupportDialog('help'),
            ),
            if (_isAdmin) ...[
              SizedBox(height: 8),
              _settingsListTile(
                icon: Icons.admin_panel_settings_rounded,
                title: 'Command Center',
                subtitle: 'Sovereign Administrator Dashboard',
                onTap: () => context.push(AppRoutes.admin),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAppearanceSection() {
    final choice = AppThemeScope.of(context).choice;
    final label = switch (choice) {
      AppThemeChoice.lightLuxe => 'Light Luxe',
      AppThemeChoice.luxuryNight => 'Luxury Night',
      AppThemeChoice.system => 'Follow device',
    };

    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('APPEARANCE'),
            _settingsListTile(
              icon: choice == AppThemeChoice.lightLuxe
                  ? Icons.light_mode_rounded
                  : Icons.dark_mode_rounded,
              title: 'Theme',
              subtitle: label,
              onTap: _showThemePicker,
            ),
          ],
        ),
      ),
    );
  }

  void _showThemePicker() {
    final controller = AppThemeScope.of(context);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: _surface,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.light_mode_rounded, color: AppColors.gold),
              title: Text('Light Luxe', style: TextStyle(color: _text)),
              subtitle: Text('Bright, clean study surfaces', style: TextStyle(color: _muted)),
              trailing: controller.choice == AppThemeChoice.lightLuxe
                  ? Icon(Icons.check_rounded, color: AppColors.gold)
                  : null,
              onTap: () async {
                await controller.setChoice(AppThemeChoice.lightLuxe);
                if (sheetContext.mounted) Navigator.pop(sheetContext);
              },
            ),
            ListTile(
              leading: Icon(Icons.dark_mode_rounded, color: AppColors.gold),
              title: Text('Luxury Night', style: TextStyle(color: _text)),
              subtitle: Text('Deep contrast for focused study', style: TextStyle(color: _muted)),
              trailing: controller.choice == AppThemeChoice.luxuryNight
                  ? Icon(Icons.check_rounded, color: AppColors.gold)
                  : null,
              onTap: () async {
                await controller.setChoice(AppThemeChoice.luxuryNight);
                if (sheetContext.mounted) Navigator.pop(sheetContext);
              },
            ),
            ListTile(
              leading: Icon(Icons.brightness_auto_rounded, color: AppColors.gold),
              title: Text('Follow device', style: TextStyle(color: _text)),
              subtitle: Text('Use the device appearance setting', style: TextStyle(color: _muted)),
              trailing: controller.choice == AppThemeChoice.system
                  ? Icon(Icons.check_rounded, color: AppColors.gold)
                  : null,
              onTap: () async {
                await controller.setChoice(AppThemeChoice.system);
                if (sheetContext.mounted) Navigator.pop(sheetContext);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildLegalSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('LEGAL'),
            _settingsListTile(
              icon: Icons.gavel_rounded,
              title: 'Terms of Service',
              subtitle: 'Terms, conditions and governed platform guidelines',
              onTap: () => _showLegalDialog('Terms of Service', 'By utilizing this sovereign preparation platform, you agree to comply with academic honesty and verification guidelines.'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('SESSION'),
            GestureDetector(
              onTap: () async {
                await ref.read(authNotifierProvider.notifier).signOut();
                if (mounted) context.go(AppRoutes.login);
              },
              child: DarkCard(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Icon(Icons.logout_rounded, color: _muted, size: 18),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Log Out',
                        style: AppTypography.cardTitle.copyWith(fontSize: 14, color: _text),
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios_rounded, size: 12, color: _muted),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDangerZoneSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'DANGER ZONE',
              style: AppTypography.label.copyWith(
                fontSize: 9,
                color: Colors.red.withValues(alpha: 0.8),
                letterSpacing: 1.0,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
              ),
              child: Column(
                children: [
                  _settingsListTile(
                    icon: Icons.block_rounded,
                    title: 'Deactivate Account',
                    subtitle: 'Temporarily disable your active session',
                    onTap: _deactivateAccount,
                    isDestructive: true,
                  ),
                  Divider(color: Colors.red.withValues(alpha: 0.1), height: 1),
                  _settingsListTile(
                    icon: Icons.delete_forever_rounded,
                    title: 'Delete Account',
                    subtitle: 'Permanently erase all academic history',
                    onTap: _deleteAccount,
                    isDestructive: true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deactivateAccount() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _background,
        title: Text('Deactivate Account', style: TextStyle(color: _text)),
        content: Text('Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.', style: TextStyle(color: _muted)),
        actions: [
          TextButton(
            child: Text('Cancel', style: TextStyle(color: _muted)),
            onPressed: () => Navigator.of(ctx).pop(false),
          ),
          TextButton(
            child: const Text('Deactivate', style: TextStyle(color: AppColors.gold)),
            onPressed: () => Navigator.of(ctx).pop(true),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await FirebaseFirestore.instance.collection('users').doc(user.uid).update({
        'status': 'deactivated',
        'updatedAt': FieldValue.serverTimestamp(),
      });
      await ref.read(authNotifierProvider.notifier).signOut();
      await SessionManager.logout();
      if (mounted) context.go(AppRoutes.login);
    }
  }

  Future<void> _deleteAccount() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _background,
        title: Text('Delete Account', style: TextStyle(color: _text)),
        content: Text('This will request permanent deletion of all your academic and personal profile data. This action is irreversible. Proceed?', style: TextStyle(color: _muted)),
        actions: [
          TextButton(
            child: Text('Cancel', style: TextStyle(color: _muted)),
            onPressed: () => Navigator.of(ctx).pop(false),
          ),
          TextButton(
            child: const Text('Request Deletion', style: TextStyle(color: Colors.red)),
            onPressed: () => Navigator.of(ctx).pop(true),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await FirebaseFirestore.instance.collection('users').doc(user.uid).update({
        'deleteRequested': true,
        'status': 'deletion_pending',
        'updatedAt': FieldValue.serverTimestamp(),
      });
      await ref.read(authNotifierProvider.notifier).signOut();
      await SessionManager.logout();
      if (mounted) context.go(AppRoutes.login);
    }
  }

  void _showLegalDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _background,
        title: Text(title, style: TextStyle(color: _text)),
        content: SingleChildScrollView(
          child: Text(content, style: TextStyle(color: _muted)),
        ),
        actions: [
          TextButton(
            child: const Text('Close', style: TextStyle(color: AppColors.gold)),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildAdaptiveInsights(KnowledgeEngine engine) {
    final stats = ref.watch(userProfileStatsProvider);
    final totalBattles = stats['totalBattles'] ?? 0;
    final momentum = engine.momentumState;
    final streak = momentum?.studyStreakDays ?? 0;

    final recommendations = engine.getRecommendations(limit: 1);
    
    final bool hasEvidence = engine.isInitialized && (totalBattles > 0 || streak > 0 || recommendations.isNotEmpty);

    final String insight = hasEvidence
        ? (recommendations.isNotEmpty
            ? "Priority Focus: ${recommendations.first.title}. Strengthening this will boost overall mission readiness."
            : "Mission metrics nominal. Maintain current streak of ${streak}d for maximum retention.")
        : "No learning evidence found yet. Complete a topic diagnostic or practice session to unlock personalized insights.";

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: DarkCard(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('ADAPTIVE INSIGHT',
                  style: AppTypography.label.copyWith(
                      fontSize: 8,
                      color: AppColors.gold)),
              SizedBox(height: 4),
              Text(
                insight,
                style: AppTypography.body
                    .copyWith(fontSize: 10, height: 1.4, color: _muted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
