import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class StatusPill extends StatelessWidget {
  final String status;
  final Color? color;

  const StatusPill({
    super.key,
    required this.status,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? _determineColor(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: effectiveColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: effectiveColor),
      ),
      child: Text(
        status.toUpperCase(),
        style: AppTypography.label.copyWith(color: effectiveColor, fontSize: 8),
      ),
    );
  }

  Color _determineColor(String status) {
    switch (status.toLowerCase()) {
      case 'published':
      case 'completed':
      case 'verified':
      case 'success':
        return Colors.green;
      case 'review':
      case 'under_review':
      case 'pending':
      case 'draft':
        return AppColors.gold;
      case 'failed':
      case 'rejected':
        return Colors.redAccent;
      case 'processing':
      case 'received':
        return Colors.blue;
      default:
        return Colors.white24;
    }
  }
}
