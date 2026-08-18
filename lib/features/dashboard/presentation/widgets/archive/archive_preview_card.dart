import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/utils/app_routes.dart';
import '../../../../../core/widgets/dark_card.dart';

class ArchivePreviewCard extends StatelessWidget {
  const ArchivePreviewCard({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(AppRoutes.digibook),
      child: DarkCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SACRED ARCHIVE',
              style: AppTypography.cardTitle,
            ),
            const SizedBox(height: 10),
            Text(
              'No mission-scoped archive is ready for this mission yet.',
              style: AppTypography.subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                const Icon(
                  Icons.auto_stories_rounded,
                  color: AppColors.gold,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'ARCHIVE EVIDENCE PENDING',
                    style: AppTypography.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 12,
                  color: AppColors.gold,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
