import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../models/pyq_entry.dart';

class PyqCard extends StatelessWidget {
  final PyqEntry pyq;

  const PyqCard({
    super.key,
    required this.pyq,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // PREMIUM CARD DNA: Title
          Text(
            pyq.question,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.cardTitle,
          ),

          const SizedBox(height: 10),

          // PREMIUM CARD DNA: Subtitle
          Text(
            'Examined in ${pyq.year}. Crucial concept for active preparation cycles.',
            style: AppTypography.subtitle,
          ),

          const SizedBox(height: 18),

          // PREMIUM CARD DNA: Metric Row
          Row(
            children: [
              const Icon(
                Icons.history_edu_rounded,
                color: AppColors.gold,
                size: 18,
              ),

              const SizedBox(width: 8),

              Text(
                'REPEAT FREQUENCY: ${pyq.frequency}',
                style: AppTypography.label,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
