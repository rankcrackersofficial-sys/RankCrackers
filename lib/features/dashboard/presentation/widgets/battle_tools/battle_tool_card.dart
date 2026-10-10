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
    final sessionUser =
        ref.watch(sessionUserProvider).valueOrNull ?? SessionUser.getSync();
    final stats = ref.watch(userProfileStatsProvider);
    final totalBattles = stats['totalBattles'] ?? 0;

    // 1. Resolve State Mapping with Student-Safe Labels
    final bool isRPSC = sessionUser.examId.toLowerCase().contains('rpsc') ||
        sessionUser.examName.toUpperCase().contains('RPSC');

    String statusText = 'Active';
    String subtitleText = 'Launch Tool';
    String explanationText = '';
    bool isReady = true;

    if (isRPSC) {
      isReady = false;
      statusText = 'Not Published';
      subtitleText = 'Not Published';
      explanationText =
          'This RPSC 1st Grade tool is currently not published on the platform.';
    } else {
      if (toolKey == 'test_arena') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'Needs Event';
          subtitleText = 'Not Ready';
          explanationText =
              'Test Arena is not ready yet. Standardized test events will appear here when an eligible governed event is available.';
        } else {
          statusText = 'Active';
          subtitleText = 'Standard Mode';
        }
      } else if (toolKey == 'pyq_vault') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'Needs Set';
          subtitleText = 'No PYQ Set';
          explanationText =
              'No previous year question papers are mapped to your current sub-topic selection yet.';
        } else {
          statusText = 'Active';
          subtitleText = 'Standard Mode';
        }
      } else if (toolKey == 'revision_desk') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'Needs State';
          subtitleText = 'No Revision State';
          explanationText =
              'Revision Desk requires active bookmarks or weak-topic history to formulate revision cycles.';
        } else {
          statusText = 'Active';
          subtitleText = 'Standard Mode';
        }
      } else if (toolKey == 'rank_radar') {
        if (totalBattles == 0) {
          isReady = false;
          statusText = 'Needs Data';
          subtitleText = 'Needs Evidence';
          explanationText =
              'Rank Radar estimates percentiles based on verified test performance history.';
        } else {
          statusText = 'Active';
          subtitleText = 'Standard Mode';
        }
      }
    }

    return GestureDetector(
      onTap: isReady
          ? () => context.push(route)
          : () => _showBattleToolStatusSheet(
              context, title, statusText, explanationText),
      child: DarkCard(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: Border.all(
          color: isReady
              ? glowColor.withValues(alpha: 0.4)
              : AppColors.gold.withValues(alpha: 0.25),
          width: 1.0,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: glowColor.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isReady
                          ? glowColor.withValues(alpha: 0.5)
                          : AppColors.gold.withValues(alpha: 0.35),
                      width: 1.0,
                    ),
                  ),
                  child: Icon(
                    icon,
                    color: isReady ? glowColor : AppColors.gold,
                    size: 19,
                  ),
                ),
                Flexible(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: isReady
                          ? AppColors.gold.withValues(alpha: 0.15)
                          : AppColors.gold.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isReady
                            ? AppColors.gold.withValues(alpha: 0.5)
                            : AppColors.gold.withValues(alpha: 0.25),
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      statusText,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.label.copyWith(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: isReady
                            ? AppColors.gold
                            : AppColors.gold.withValues(alpha: 0.8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.cardTitle.copyWith(
                    fontSize: 13.5,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitleText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.subtitle.copyWith(
                    fontSize: 10.5,
                    color: isReady ? AppColors.gold : Colors.white60,
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
              top: BorderSide(color: AppColors.gold, width: 1.5),
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
                    Icons.bolt_rounded,
                    color: AppColors.gold,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      toolTitle,
                      style: AppTypography.hero.copyWith(
                        fontSize: 18,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      statusCode,
                      style: AppTypography.label.copyWith(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                'STATUS',
                style: AppTypography.label.copyWith(
                  fontSize: 11,
                  color: Colors.white70,
                  letterSpacing: 1.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                explanation,
                style: AppTypography.body.copyWith(
                  fontSize: 13,
                  color: Colors.white70,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 24),
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
                    'Got it',
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
