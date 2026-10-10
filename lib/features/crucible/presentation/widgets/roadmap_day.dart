import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class RoadmapDay extends StatelessWidget {
  final String day;
  final String firstTask;
  final String secondTask;
  final String thirdTask;
  final bool locked;
  final VoidCallback? onTap;

  const RoadmapDay({
    super.key,
    required this.day,
    required this.firstTask,
    required this.secondTask,
    required this.thirdTask,
    this.locked = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: locked ? null : onTap,
      child: DarkCard(
        padding: const EdgeInsets.all(18),
        backgroundColor: locked ? Colors.transparent : AppColors.surface,
        border: Border.all(
          color: locked ? Colors.white10 : AppColors.gold.withValues(alpha: 0.1),
        ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                day,
                style: AppTypography.label.copyWith(
                  color: locked ? Colors.white24 : AppColors.gold,
                  fontSize: 11,
                ),
              ),
              const Spacer(),
              if (locked)
                const Icon(Icons.lock_outline_rounded, size: 14, color: Colors.white24)
              else
                const Icon(Icons.check_circle_outline_rounded, size: 14, color: AppColors.gold),
            ],
          ),
          if (!locked) ...[
            const SizedBox(height: 14),
            _taskItem(firstTask),
            _taskItem(secondTask),
            _taskItem(thirdTask),
          ] else
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Text(
                "Locked behind active missions",
                style: AppTypography.body.copyWith(fontSize: 12, color: Colors.white10),
              ),
            ),
        ],
      ),
    ),);
  }

  Widget _taskItem(String task) {
    if (task.isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 4,
            decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              task,
              style: AppTypography.body.copyWith(fontSize: 13, color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }
}
