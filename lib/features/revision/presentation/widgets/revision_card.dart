import 'package:flutter/material.dart';

import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_card.dart';

class RevisionCard extends StatelessWidget {
  final String title;
  final String subtitle;

  const RevisionCard({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      border: Border.all(
        color: AppColors.error.withValues(alpha: 0.16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 🔱 PREMIUM CARD DNA: Title
          Text(
            title.toUpperCase(),
            style: AppTypography.cardTitle.copyWith(color: AppColors.error),
          ),

          const SizedBox(height: 10),

          // 🔱 PREMIUM CARD DNA: Subtitle
          Text(
            subtitle,
            style: AppTypography.subtitle,
          ),

          const SizedBox(height: 18),

          // 🔱 PREMIUM CARD DNA: Metric Row
          Row(
            children: [
              const Icon(
                Icons.bolt_rounded,
                color: AppColors.error,
                size: 18,
              ),

              const SizedBox(width: 8),

              Text(
                'CRITICAL REBUILD REQUIRED',
                style: AppTypography.label.copyWith(color: AppColors.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
