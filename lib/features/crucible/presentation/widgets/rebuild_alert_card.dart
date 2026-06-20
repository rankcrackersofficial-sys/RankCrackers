import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_card.dart';

class RebuildAlertCard extends StatelessWidget {
  final String subject;

  const RebuildAlertCard({
    super.key,
    required this.subject,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 20),
              const SizedBox(width: 10),
              Text('REBUILD REQUIRED', style: AppTypography.section.copyWith(color: AppColors.error)),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            '$subject retention is falling below tactical threshold. Immediate reconstruction recommended.',
            style: AppTypography.body.copyWith(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}
