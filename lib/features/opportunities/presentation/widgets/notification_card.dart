import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/models/notification_item.dart';
import '../../../../core/models/notification_priority.dart';

class NotificationCard extends StatelessWidget {
  final NotificationItem item;
  final VoidCallback? onTap;

  const NotificationCard({
    super.key,
    required this.item,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: DarkCard(
          padding: const EdgeInsets.all(16),
          border: item.read 
            ? Border.all(color: scheme.outline)
            : Border.all(color: AppColors.gold.withValues(alpha: 0.5), width: 1.2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _priorityIndicator(item.priority, scheme.onSurfaceVariant),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(item.source.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.gold)),
                        Text(_timeAgo(item.createdAt), style: AppTypography.label.copyWith(fontSize: 8, color: scheme.onSurfaceVariant)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.title, 
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.cardTitle.copyWith(fontSize: 14, color: item.read ? scheme.onSurfaceVariant : scheme.onSurface)
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.body, 
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.body.copyWith(fontSize: 12, color: item.read ? scheme.onSurfaceVariant : scheme.onSurface)
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _priorityIndicator(NotificationPriority priority, Color muted) {
    Color color;
    switch (priority) {
      case NotificationPriority.critical: color = AppColors.error; break;
      case NotificationPriority.high: color = AppColors.gold; break;
      case NotificationPriority.medium: color = AppColors.info; break;
      case NotificationPriority.low: color = muted; break;
    }
    return Container(
      width: 4,
      height: 40,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }
}
