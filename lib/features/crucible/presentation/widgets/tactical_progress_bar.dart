import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class TacticalProgressBar extends StatelessWidget {
  final double progress;

  const TacticalProgressBar({
    super.key,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // DNA: Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('DOMINATION PROGRESS', style: AppTypography.label.copyWith(color: AppColors.secondaryText, fontSize: 10)),
            Text('${(progress * 100).toInt()}%', style: AppTypography.cardTitle.copyWith(color: AppColors.gold, fontSize: 14)),
          ],
        ),
        const SizedBox(height: 10), // DNA spacing
        
        ClipRRect(
          borderRadius: BorderRadius.circular(20), // Standardized luxury pill
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: Colors.white.withValues(alpha: 0.05),
            valueColor: const AlwaysStoppedAnimation(AppColors.gold),
          ),
        ),
      ],
    );
  }
}
