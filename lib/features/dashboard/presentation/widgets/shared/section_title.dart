import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_colors.dart';

class SectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool gold;

  const SectionTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.gold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTypography.cardTitle.copyWith(
            color: gold ? AppColors.gold : AppColors.primaryText,
          ),
        ),

        if (subtitle != null) ...[
          const SizedBox(height: 4),

          Text(
            subtitle!,
            style: AppTypography.label,
          ),
        ],
      ],
    );
  }
}
