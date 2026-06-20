import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class LockedRoadmapCard extends StatelessWidget {
  final bool isElite;

  const LockedRoadmapCard({super.key, required this.isElite});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('MISSION ROADMAP', style: AppTypography.label),
            if (!isElite)
              const Icon(Icons.lock_outline_rounded, color: AppColors.gold, size: 16),
          ],
        ),
        const SizedBox(height: 16),
        
        // Roadmap Steps
        _roadmapStep('Day 17', 'Constitutional Framework', true),
        _roadmapStep('Day 18', 'Parliamentary System', isElite),
        _roadmapStep('Day 19', 'State Executive', isElite),
        _roadmapStep('Day 20', 'Local Governance', isElite),

        if (!isElite)
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: Text(
              '+ 80 more days of tactical preparation locked.',
              style: AppTypography.body.copyWith(fontSize: 12, color: AppColors.gold.withValues(alpha: 0.6)),
            ),
          ),
      ],
    );
  }

  Widget _roadmapStep(String day, String title, bool unlocked) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: unlocked ? AppColors.gold : Colors.white10,
            ),
          ),
          const SizedBox(width: 16),
          Text(day, style: AppTypography.body.copyWith(
            fontWeight: FontWeight.bold,
            color: unlocked ? Colors.white : Colors.white24,
          )),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title, style: AppTypography.body.copyWith(
              color: unlocked ? Colors.white70 : Colors.white10,
            )),
          ),
        ],
      ),
    );
  }
}
