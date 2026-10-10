import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../models/tactical_schedule.dart';

/// TACTICAL SCHEDULE CARD
/// Displays the summary of a preparation block.
class TacticalScheduleCard extends StatelessWidget {
  final TacticalSchedule schedule;

  const TacticalScheduleCard({
    super.key,
    required this.schedule,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'SCHEDULE ${schedule.scheduleIndex + 1}',
                style: AppTypography.section,
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  schedule.type.toUpperCase(),
                  style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '${schedule.targetHours.toStringAsFixed(1)} HOURS',
            style: AppTypography.cardTitle,
          ),
          const SizedBox(height: 10),
          Text(
            '${schedule.nodes.length} MICRO TOPICS',
            style: AppTypography.body,
          ),
          const SizedBox(height: 20),
          Text(
            'COMPLETION BOUNDARY',
            style: AppTypography.label,
          ),
          const SizedBox(height: 6),
          Text(
            DateFormat('dd MMM | hh:mm a').format(schedule.endTime),
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }
}
