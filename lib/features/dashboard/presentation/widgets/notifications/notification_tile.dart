import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class NotificationTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String time;
  final bool isRead;

  const NotificationTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.time,
    this.isRead = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isRead ? Colors.transparent : AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isRead ? Colors.white.withValues(alpha: 0.05) : AppColors.gold.withValues(alpha: 0.1),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_active_rounded,
              color: AppColors.gold,
              size: 18,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.cardTitle.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: AppTypography.subtitle.copyWith(fontSize: 12),
                ),
                const SizedBox(height: 8),
                Text(
                  time,
                  style: AppTypography.label.copyWith(fontSize: 9, color: Colors.white24),
                ),
              ],
            ),
          ),
          if (!isRead)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.gold,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}
