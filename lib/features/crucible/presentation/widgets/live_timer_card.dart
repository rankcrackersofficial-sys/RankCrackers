import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class LiveTimerCard extends StatelessWidget {
  final int day;
  final int phase;
  final int hours;

  const LiveTimerCard({
    super.key,
    required this.day,
    required this.phase,
    required this.hours,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'THE CRUCIBLE',
            style: AppTypography.hero.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DAY $day', style: AppTypography.section),
                  const SizedBox(height: 4),
                  Text('PHASE $phase', style: AppTypography.label),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$hours HOURS',
                    style: AppTypography.metric.copyWith(fontSize: 28),
                  ),
                  Text('REMAINING', style: AppTypography.label),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
