import 'package:flutter/material.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'roadmap_day.dart';

class TacticalRoadmapCard extends StatelessWidget {
  final List<Map<String, dynamic>> roadmap;

  const TacticalRoadmapCard({
    super.key,
    required this.roadmap,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 🔱 PREMIUM CARD DNA: Title
          Text(
            "TACTICAL ROADMAP",
            style: AppTypography.cardTitle.copyWith(color: AppColors.gold, letterSpacing: 2.2, fontSize: 11),
          ),

          const SizedBox(height: 24),

          ...roadmap.map(
            (dayPlan) {
              return Padding(
                padding: const EdgeInsets.only(
                  bottom: 16,
                ),
                child: RoadmapDay(
                  day: dayPlan['day'],
                  firstTask: dayPlan['firstTask'],
                  secondTask: dayPlan['secondTask'],
                  thirdTask: dayPlan['thirdTask'],
                  locked: dayPlan['locked'] ?? false,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
