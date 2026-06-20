import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/archive_provider.dart';

class ArchiveScreen extends ConsumerWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final realmsAsync = ref.watch(activeRealmsStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.screenPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // =====================
                // HEADER
                // =====================
                Text('The Archive', style: AppTypography.hero),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Sacred knowledge realm connected to your mission.',
                  style: AppTypography.subtitle,
                ),
                const SizedBox(height: 28),

                // =====================
                // SEARCH (Static for now)
                // =====================
                _buildSearchField(),
                const SizedBox(height: 28),

                // =====================
                // SECTION
                // =====================
                Text('Active Knowledge Realms', style: AppTypography.cardTitle),
                const SizedBox(height: 18),

                Expanded(
                  child: realmsAsync.when(
                    data: (realms) {
                      if (realms.isEmpty) {
                        return const Center(
                          child: Text(
                            "No active realms found in the archive.",
                            style: TextStyle(color: Colors.white24),
                          ),
                        );
                      }
                      return ListView.builder(
                        physics: const BouncingScrollPhysics(),
                        itemCount: realms.length,
                        itemBuilder: (context, index) {
                          final realm = realms[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _ArchiveNodeCard(realm: realm),
                          );
                        },
                      );
                    },
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.gold),
                    ),
                    error: (err, stack) => Center(
                      child: Text(
                        "Error loading archive: $err",
                        style: const TextStyle(color: Colors.redAccent),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchField() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.08)),
      ),
      child: TextField(
        style: AppTypography.body.copyWith(color: Colors.white),
        decoration: InputDecoration(
          border: InputBorder.none,
          icon: const Icon(Icons.search_rounded, color: AppColors.gold),
          hintText: 'Search knowledge realms...',
          hintStyle: AppTypography.body.copyWith(color: Colors.white38),
        ),
      ),
    );
  }
}

class _ArchiveNodeCard extends StatelessWidget {
  final RecruitmentRealm realm;
  const _ArchiveNodeCard({required this.realm});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _showAssetDrawer(context, realm),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withValues(alpha: 0.04),
              Colors.white.withValues(alpha: 0.02),
            ],
          ),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.10)),
        ),
        child: Row(
          children: [
            Container(
              height: 52,
              width: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.12),
              ),
              child: const Icon(Icons.auto_stories_rounded, color: AppColors.gold),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(realm.recruitmentName, style: AppTypography.cardTitle),
                  const SizedBox(height: 6),
                  Text(
                    "${realm.organization} • ${realm.examYear}",
                    style: AppTypography.label,
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.gold),
          ],
        ),
      ),
    );
  }

  void _showAssetDrawer(BuildContext context, RecruitmentRealm realm) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "MISSION ASSETS",
                style: AppTypography.label.copyWith(color: AppColors.gold, letterSpacing: 2),
              ),
              const SizedBox(height: 8),
              Text(
                realm.recruitmentName,
                style: AppTypography.hero.copyWith(fontSize: 20),
              ),
              const SizedBox(height: 24),
              if (realm.assets.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                    child: Text(
                      "No downloadable assets available yet.",
                      style: TextStyle(color: Colors.white24),
                    ),
                  ),
                )
              else
                ...realm.assets.map((asset) => _AssetTile(asset: asset, realmId: realm.realmId)),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}

class _AssetTile extends ConsumerWidget {
  final Map<String, dynamic> asset;
  final String realmId;
  const _AssetTile({required this.asset, required this.realmId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String type = (asset['type'] ?? 'unknown').toString().toUpperCase();
    final String title = asset['title'] ?? 'Download Asset';
    final String url = asset['url'] ?? '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        tileColor: Colors.white.withValues(alpha: 0.03),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        leading: Icon(
          _getIconForType(type),
          color: AppColors.gold,
        ),
        title: Text(title, style: AppTypography.body.copyWith(fontWeight: FontWeight.bold)),
        subtitle: Text(type, style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
        trailing: const Icon(Icons.file_download_outlined, color: Colors.white24),
        onTap: () async {
          if (url.isNotEmpty) {
            // 🔱 Secure Download Flow (Audit GAP Hardened)
            final repo = ref.read(archiveRepositoryProvider);
            final secureUrl = await repo.getSecureUrl(url, realmId: realmId, assetType: type);
            
            if (secureUrl != null) {
              final uri = Uri.parse(secureUrl);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
            } else {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Unable to generate secure link."))
                );
              }
            }
          }
        },
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'NOTIFICATION':
        return Icons.campaign_rounded;
      case 'SYLLABUS':
        return Icons.account_tree_rounded;
      case 'PYQ':
        return Icons.history_edu_rounded;
      default:
        return Icons.description_rounded;
    }
  }
}
