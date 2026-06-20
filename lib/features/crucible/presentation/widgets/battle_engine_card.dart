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

  const BattleEngineCard({
    super.key,
    required this.dayCount,
    required this.progress,
    required this.missionComplete,
    required this.pending,
    required this.weakAreas,
    required this.activeTopics,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 🔱 PREMIUM CARD DNA
          Text(
            "99 DAYS BATTLE",
            style: AppTypography.cardTitle.copyWith(color: AppColors.gold, letterSpacing: 2.5, fontSize: 11),
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
                      value: progress,
                      strokeWidth: 6,
                      color: AppColors.gold,
                      backgroundColor: Colors.white.withValues(alpha: 0.05),
                    ),
                    Text(
                      "${(progress * 100).toInt()}%",
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
                      style: AppTypography.label.copyWith(color: AppColors.secondaryText),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Day $dayCount of 99",
                      style: AppTypography.section.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Mission protocol active.",
                      style: AppTypography.subtitle.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          ProgressRow(label: "Mission Complete", value: missionComplete),
          ProgressRow(label: "Pending", value: pending),
          ProgressRow(label: "Weak Areas", value: weakAreas),

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
                    "Current Priority: ${activeTopics.isNotEmpty ? activeTopics.first : 'None'}",
                    style: AppTypography.body,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

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
                  "Next Micro Test Ready",
                  style: AppTypography.cardTitle.copyWith(fontSize: 13),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Text(
            "Upcoming: 50 Questions Micro Test • Tomorrow • 9 AM",
            style: AppTypography.subtitle.copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}
