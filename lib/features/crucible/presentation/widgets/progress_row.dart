import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class ProgressRow extends StatelessWidget {
  final String label;
  final double value;

  const ProgressRow({
    super.key,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.subtitle.copyWith(fontSize: 12),
                ),
              ),
              Text(
                "${(value * 100).toInt()}%",
                style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 11),
              ),
            ],
          ),

          const SizedBox(height: 10),

          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: value,
              minHeight: 4,
              backgroundColor: Colors.white.withValues(alpha: 0.05),
              valueColor: const AlwaysStoppedAnimation(AppColors.gold),
            ),
          ),
        ],
      ),
    );
  }
}
