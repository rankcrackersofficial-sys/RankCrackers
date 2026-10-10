import 'package:flutter/material.dart';

import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_colors.dart';

class LatestUpdatesCard extends StatelessWidget {
  final Map<String, String> item;

  const LatestUpdatesCard({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          const Icon(
            Icons.notification_important_rounded,
            color: AppColors.gold,
            size: 18,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  item["title"] ?? "Update",
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.cardTitle.copyWith(
                    fontSize: 13.5,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  "${item["tag"]} • ${item["meta"]}",
                  style: AppTypography.label.copyWith(
                    fontSize: 11.5,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            size: 14,
            color: AppColors.gold,
          ),
        ],
      ),
    );
  }
}
