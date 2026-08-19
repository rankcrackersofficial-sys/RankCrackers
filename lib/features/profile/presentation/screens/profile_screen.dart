import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../shared/widgets/command_header.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../../core/services/support_service.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';
import '../../../../core/utils/responsive_helper.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
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
          const SnackBar(content: Text('🔱 UPLOADING AVATAR...')));

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
            const SnackBar(content: Text('🔱 PROFILE PHOTO UPDATED')));
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Upload Failed: $e')));
      }
    }
  }

  Future<void> _showSupportDialog(String type) async {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text(type.toUpperCase(), style: AppTypography.cardTitle),
        content: TextField(
          controller: controller,
          maxLines: 4,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: "Enter details for the command team...",
            hintStyle: TextStyle(color: Colors.white10),
            border: OutlineInputBorder(
                borderSide: BorderSide(color: AppColors.borderSoft)),
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
                    const SnackBar(content: Text('🔱 TICKET SUBMITTED')));
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
    final readiness = ref.watch(missionReadinessProvider);
    final stats = ref.watch(userProfileStatsProvider);

    final engine = ref.watch(knowledgeEngineProvider);
    final momentum = engine.momentumState;
    final coverage = engine.coverageState;

    return Scaffold(
      backgroundColor: AppColors.background,
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
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: CommandHeader(
                          userName: sessionUser?.name ?? 'Warrior',
                          userPhoto: sessionUser?.photo,
                          examName: sessionUser?.examName ?? 'Mission',
                          readiness: readiness,
                          momentum: momentum,
                        ),
                      ),

                      // 🔱 Performance Fold (Optimized v4.0)
                      SliverPadding(
                        padding: EdgeInsets.symmetric(
                            horizontal: ResponsiveHelper.wp(context, 0.05),
                            vertical: 8),
                        sliver: SliverGrid(
                          delegate: SliverChildListDelegate([
                            _performanceCard(
                                Icons.flash_on_rounded,
                                engine.isInitialized
                                    ? stats['totalBattles'].toString()
                                    : 'Pending',
                                'Battles'),
                            _performanceCard(
                                Icons.auto_graph_rounded,
                                engine.isInitialized
                                    ? '${(readiness?.score ?? 0).toInt()}%'
                                    : 'Pending',
                                'Readiness'),
                            _performanceCard(
                                Icons.local_fire_department,
                                engine.isInitialized
                                    ? '${momentum?.studyStreakDays ?? 0}d'
                                    : 'Pending',
                                'Streak'),
                            _performanceCard(
                                Icons.workspace_premium,
                                engine.isInitialized
                                    ? '${((coverage?.coveragePercent ?? 0) * 100).toInt()}%'
                                    : 'Pending',
                                'Coverage'),
                          ]),
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount:
                                ResponsiveHelper.isTablet(context) ? 4 : 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 2.2,
                          ),
                        ),
                      ),

                      _buildPreparationControls(sessionUser?.examName),
                      _buildAccountSettings(),
                      _buildSupportSection(),
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

  Widget _performanceCard(IconData icon, String value, String label) {
    return DarkCard(
      padding: EdgeInsets.zero,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.gold, size: 16),
          FittedBox(
            fit: BoxFit.scaleDown,
            child:
                Text(value, style: AppTypography.hero.copyWith(fontSize: 20)),
          ),
          Text(label.toUpperCase(),
              style: AppTypography.label
                  .copyWith(fontSize: 6, color: Colors.white24)),
        ],
      ),
    );
  }

  Widget _buildPreparationControls(String? currentExam) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 16,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('PREPARATION'),
            _controlTile(Icons.shield_rounded, 'Current Mission',
                currentExam ?? 'Select Mission',
                onTap: () => context.go(AppRoutes.missionRealm)),
            if (_isAdmin) ...[
              const SizedBox(height: 8),
              _controlTile(Icons.admin_panel_settings_rounded, 'Command Center',
                  'Sovereign Control',
                  onTap: () => context.push(AppRoutes.admin)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAccountSettings() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('ACCOUNT'),
            Row(
              children: [
                Expanded(
                    child: _miniControlTile(Icons.edit_rounded, 'Identity',
                        onTap: () {})),
                const SizedBox(width: 8),
                Expanded(
                    child: _miniControlTile(Icons.camera_alt_rounded, 'Avatar',
                        onTap: _updatePhoto)),
                const SizedBox(width: 8),
                Expanded(
                    child: _miniControlTile(
                        Icons.phone_android_rounded, 'Mobile',
                        onTap: () {})),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _miniControlTile(
                    Icons.block_rounded,
                    'Deactivate',
                    onTap: _deactivateAccount,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _miniControlTile(
                    Icons.delete_forever_rounded,
                    'Delete',
                    onTap: _deleteAccount,
                  ),
                ),
              ],
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
        backgroundColor: AppColors.background,
        title: const Text('Deactivate Account', style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white24)),
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
        backgroundColor: AppColors.background,
        title: const Text('Delete Account', style: TextStyle(color: Colors.white)),
        content: const Text('This will request permanent deletion of all your academic and personal profile data. This action is irreversible. Proceed?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            child: const Text('Cancel', style: TextStyle(color: Colors.white24)),
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

  Widget _buildSupportSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 24,
            ResponsiveHelper.wp(context, 0.05), 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionLabel('SUPPORT'),
            Row(
              children: [
                Expanded(
                    child: _miniControlTile(Icons.help_outline_rounded, 'Help',
                        onTap: () => _showSupportDialog('help'))),
                const SizedBox(width: 8),
                Expanded(
                    child: _miniControlTile(
                        Icons.report_problem_outlined, 'Issue',
                        onTap: () => _showSupportDialog('issue_report'))),
                const SizedBox(width: 8),
                Expanded(
                    child: _miniControlTile(Icons.logout_rounded, 'Exit',
                        onTap: () async {
                  await ref.read(authNotifierProvider.notifier).signOut();
                  if (mounted) context.go(AppRoutes.login);
                })),
              ],
            ),
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
            Row(
              children: [
                Expanded(
                  child: _miniControlTile(
                    Icons.privacy_tip_rounded,
                    'Privacy',
                    onTap: () => _showLegalDialog('Privacy Policy', 'The canonical Privacy Policy text is currently pending legal review from the Founder.'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _miniControlTile(
                    Icons.description_rounded,
                    'Terms',
                    onTap: () => _showLegalDialog('Terms of Service', 'The canonical Terms of Service text is currently pending legal review from the Founder.'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showLegalDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.background,
        title: Text(title, style: const TextStyle(color: Colors.white)),
        content: SingleChildScrollView(
          child: Text(content, style: const TextStyle(color: Colors.white70)),
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

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 4),
      child: Text(text,
          style: AppTypography.label.copyWith(
              fontSize: 7, color: Colors.white30, letterSpacing: 1.0)),
    );
  }

  Widget _controlTile(IconData icon, String title, String value,
      {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            Icon(icon, color: AppColors.gold, size: 16),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: AppTypography.label
                          .copyWith(fontSize: 7, color: Colors.white24)),
                  Text(value,
                      style: AppTypography.cardTitle.copyWith(fontSize: 11)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                size: 10, color: Colors.white10),
          ],
        ),
      ),
    );
  }

  Widget _miniControlTile(IconData icon, String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.gold, size: 14),
            const SizedBox(height: 4),
            Text(label, style: AppTypography.cardTitle.copyWith(fontSize: 9)),
          ],
        ),
      ),
    );
  }

  Widget _buildAdaptiveInsights(KnowledgeEngine engine) {
    final recommendations = engine.getRecommendations(limit: 1);
    final String insight = recommendations.isNotEmpty
        ? "Priority Focus: ${recommendations.first.title}. Strengthening this will boost overall mission readiness."
        : "Mission metrics nominal. Maintain current streak for maximum retention.";

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
                      fontSize: 7,
                      color: AppColors.gold.withValues(alpha: 0.82))),
              const SizedBox(height: 4),
              Text(
                insight,
                style: AppTypography.body
                    .copyWith(fontSize: 10, height: 1.4, color: Colors.white70),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
