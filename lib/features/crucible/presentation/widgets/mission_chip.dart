import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_card.dart';

class MissionChip extends StatelessWidget {
  final int dayCount;

  const MissionChip({
    super.key,
    required this.dayCount,
  });

  @override
  Widget build(BuildContext context) {
    // DarkCard के अंदर से 'decoration' हटा दिया गया है
    return DarkCard(
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 8,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.local_fire_department_rounded,
            size: 14,
            color: AppColors.gold,
          ),
          const SizedBox(width: 8),
          Text(
            "DAY $dayCount • THE CRUCIBLE",
            style: AppTypography.label.copyWith(
              letterSpacing: 2,
              color: AppColors.primaryText.withValues(alpha: 0.82),
            ),
          ),
        ],
      ),
    );
  }
}
