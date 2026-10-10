import 'package:flutter/material.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'progress_row.dart';
import 'subject_block.dart';

class BattleEngineCard extends StatelessWidget {
  final int dayCount;
  final double progress;
  final double missionComplete;
  final double pending;
  final double weakAreas;
  final List<String> activeTopics;
  final bool hasEvidence;

  const BattleEngineCard({
    super.key,
    required this.dayCount,
    required this.progress,
    required this.missionComplete,
    required this.pending,
    required this.weakAreas,
    required this.activeTopics,
    required this.hasEvidence,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // PREMIUM CARD DNA
          Text(
            "98 DAYS BATTLE",
            style: AppTypography.cardTitle.copyWith(
                color: AppColors.gold, letterSpacing: 2.5, fontSize: 11),
          ),

          const SizedBox(height: 18),

          Row(
            children: [
              SizedBox(
                width: 84,
                height: 84,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: hasEvidence ? progress : 0.0,
                      strokeWidth: 6,
                      color: AppColors.gold,
                      backgroundColor: Colors.white.withValues(alpha: 0.05),
                    ),
                    Text(
                      hasEvidence ? "${(progress * 100).toInt()}%" : "--",
                      style: AppTypography.metric.copyWith(fontSize: 16),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Cycle Active",
                      style: AppTypography.label
                          .copyWith(color: AppColors.secondaryText),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Day $dayCount of 98",
                      style: AppTypography.section.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      hasEvidence
                          ? "Mission protocol active."
                          : "Crucible evidence pending.",
                      style: AppTypography.subtitle.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          if (hasEvidence) ...[
            ProgressRow(label: "Mission Complete", value: missionComplete),
            ProgressRow(label: "Pending", value: pending),
            ProgressRow(label: "Weak Areas", value: weakAreas),
          ] else ...[
            _evidencePendingRow("Mission Complete"),
            _evidencePendingRow("Remaining Protocol"),
            _evidencePendingRow("Weak Areas"),
          ],

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.flag_rounded, color: AppColors.gold),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    hasEvidence
                        ? "Current Priority: ${activeTopics.isNotEmpty ? activeTopics.first : 'None'}"
                        : "Current Priority: Evidence pending",
                    style: AppTypography.body,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          if (hasEvidence)
            ...activeTopics.take(3).map(
              (topic) {
                return Padding(
                  padding: const EdgeInsets.only(
                    bottom: 12,
                  ),
                  child: SubjectBlock(
                    title: topic,
                    completed: 'Mission Active',
                    pending: 'Pending Revision',
                  ),
                );
              },
            ),

          const SizedBox(height: 24),

          Row(
            children: [
              const Icon(Icons.timer_rounded, color: AppColors.gold, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hasEvidence
                      ? "Next Micro Test Ready"
                      : "Micro Test Evidence Pending",
                  style: AppTypography.cardTitle.copyWith(fontSize: 13),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Text(
            hasEvidence
                ? "Upcoming test schedule comes from the governed Crucible plan."
                : "No micro test schedule is shown until a governed Crucible plan is available.",
            style: AppTypography.subtitle.copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _evidencePendingRow(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: AppTypography.body.copyWith(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 13,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'EVIDENCE PENDING',
              style: AppTypography.label.copyWith(
                color: Colors.white.withValues(alpha: 0.3),
                fontSize: 8,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
