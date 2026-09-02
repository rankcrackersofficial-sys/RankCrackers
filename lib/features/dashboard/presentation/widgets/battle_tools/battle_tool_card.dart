import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/providers/session_provider.dart';
import '../../providers/dashboard_provider.dart';

class BattleToolCard extends ConsumerWidget {
  final String title;
  final IconData icon;
  final IconData glowIcon;
  final Color glowColor;
  final String route;
  final String toolKey; // 'test_arena', 'pyq_vault', 'revision_desk', 'rank_radar'
  final bool featured;

  const BattleToolCard({
    super.key,
    required this.title,
    required this.icon,
    required this.glowIcon,
    required this.glowColor,
    required this.route,
    required this.toolKey,
    this.featured = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull ?? SessionUser.getSync();
    final stats = ref.watch(userProfileStatsProvider);
    final totalBattles = stats['totalBattles'] ?? 0;

    // 1. Resolve State Mapping
    final bool isRPSC = sessionUser.examId.toLowerCase().contains('rpsc') ||
        sessionUser.examName.toUpperCase().contains('RPSC');

    String statusText = 'ACTIVE';
    String subtitleText = 'Launch Tool';
    String explanationText = '';
    bool isReady = true;

    if (isRPSC) {
      isReady = false;
      statusText = 'MISSION_CONTENT_NOT_PUBLISHED';
      subtitleText = 'Not Published';
      explanationText = 'This RPSC 1st Grade tool is currently not published on the cloud platform. Sync with academic mentors is required.';
    } else {
      if (toolKey == 'test_arena') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'NEEDS_EVIDENCE';
          subtitleText = 'Needs Evidence';
          explanationText = 'Test Arena requires active diagnostic evidence to dynamically calibrate practice papers. Complete a topic diagnostic or practice session first.';
        } else {
          statusText = 'ACTIVE';
          subtitleText = 'Standard Mode';
        }
      } else if (toolKey == 'pyq_vault') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'NO_PYQ_SET';
          subtitleText = 'No PYQ Set';
          explanationText = 'No previous year question papers are mapped to your current sub-topic selection. Generate learning evidence first.';
        } else {
          statusText = 'ACTIVE';
          subtitleText = 'Standard Mode';
        }
      } else if (toolKey == 'revision_desk') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'NO_REVISION_STATE';
          subtitleText = 'No Revision State';
          explanationText = 'Revision Desk requires active bookmarks or weak-node history to formulate revision cycles. Practice more to activate.';
        } else {
          statusText = 'ACTIVE';
          subtitleText = 'Standard Mode';
        }
      } else if (toolKey == 'rank_radar') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'INSUFFICIENT_RANK_EVIDENCE';
          subtitleText = 'Needs Evidence';
          explanationText = 'Rank Radar utilizes overall exam percentile and battle performance history to estimate state-wide ranks. Insufficient evidence generated.';
        } else {
          statusText = 'ACTIVE';
          subtitleText = 'Standard Mode';
        }
      }
    }

    return GestureDetector(
      onTap: isReady
          ? () => context.push(route)
          : () => _showBattleToolStatusSheet(context, title, statusText, explanationText),
      child: DarkCard(
        padding: const EdgeInsets.all(16),
        border: Border.all(
          color: isReady
              ? (featured ? AppColors.gold.withValues(alpha: 0.4) : AppColors.borderSoft)
              : AppColors.borderSoft.withValues(alpha: 0.4),
          width: 1.0,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(
                  icon,
                  color: isReady ? AppColors.gold : Colors.white60,
                  size: 20,
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isReady ? AppColors.gold.withValues(alpha: 0.1) : Colors.white10,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isReady ? AppColors.gold.withValues(alpha: 0.3) : Colors.white24,
                      width: 0.8,
                    ),
                  ),
                  child: Text(
                    statusText,
                    style: AppTypography.label.copyWith(
                      fontSize: 7.5,
                      fontWeight: FontWeight.bold,
                      color: isReady ? AppColors.gold : Colors.white60,
                    ),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.cardTitle.copyWith(
                    fontSize: 13,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitleText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.subtitle.copyWith(
                    fontSize: 9.5,
                    color: isReady ? AppColors.gold : Colors.white70,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showBattleToolStatusSheet(
    BuildContext context,
    String toolTitle,
    String statusCode,
    String explanation,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF090D1A),
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border(
              top: BorderSide(color: Colors.redAccent, width: 1.5),
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.security_rounded,
                    color: AppColors.gold,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      toolTitle.toUpperCase(),
                      style: AppTypography.hero.copyWith(
                        fontSize: 18,
                        color: Colors.white,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      statusCode,
                      style: AppTypography.label.copyWith(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.redAccent,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                'STATUS DISCLOSURE',
                style: AppTypography.label.copyWith(
                  fontSize: 9,
                  color: Colors.white38,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                explanation,
                style: AppTypography.body.copyWith(
                  fontSize: 12,
                  color: Colors.white70,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16213E),
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    '[ Got it ]',
                    style: AppTypography.button.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
