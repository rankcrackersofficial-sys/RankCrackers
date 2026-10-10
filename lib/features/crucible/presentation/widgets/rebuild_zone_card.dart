import 'package:flutter/material.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class RebuildZoneCard extends StatelessWidget {
  final int weakZones;
  final String priorityTopic;

  const RebuildZoneCard({
    super.key,
    required this.weakZones,
    required this.priorityTopic,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      border: Border.all(color: AppColors.error.withValues(alpha: 0.16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // PREMIUM CARD DNA: Title
          Text(
            'RESTORATION REQUIRED',
            style: AppTypography.cardTitle.copyWith(color: AppColors.error),
          ),

          const SizedBox(height: 10),

          // PREMIUM CARD DNA: Subtitle
          Text(
            '$priorityTopic requires immediate reinforcement. Tactical rebuild protocol is now active.',
            style: AppTypography.subtitle,
          ),

          const SizedBox(height: 18),

          // PREMIUM CARD DNA: Metric Row
          Row(
            children: [
              const Icon(
                Icons.restore_rounded,
                color: AppColors.error,
                size: 18,
              ),

              const SizedBox(width: 8),

              Text(
                '$weakZones ZONES AT RISK',
                style: AppTypography.label.copyWith(color: AppColors.error),
              ),

              const Spacer(),

              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 12,
                color: AppColors.error,
              ),
            ],
          ),

          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.flag_rounded,
                  color: AppColors.error,
                  size: 18,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Priority Rebuild: $priorityTopic',
                    style: AppTypography.body,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
