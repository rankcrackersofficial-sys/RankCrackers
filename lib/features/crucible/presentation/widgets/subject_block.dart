import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class SubjectBlock extends StatelessWidget {
  final String title;
  final String completed;
  final String pending;

  const SubjectBlock({
    super.key,
    required this.title,
    required this.completed,
    required this.pending,
  });

  @override
  Widget build(BuildContext context) {
    final completedCount = int.tryParse(completed.split(' ')[0]) ?? 0;
    final pendingCount = int.tryParse(pending.split(' ')[0]) ?? 0;
    final total = completedCount + pendingCount;
    final progressValue = total > 0 ? completedCount / total : 0.0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.label.copyWith(letterSpacing: 1.2, fontSize: 10),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          _statusRow(Icons.check_circle_rounded, completed, Colors.green),
          const SizedBox(height: 8),
          _statusRow(Icons.pending_actions_rounded, pending, Colors.orange),

          const SizedBox(height: 18),

          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: progressValue,
              backgroundColor: Colors.white.withValues(alpha: 0.05),
              color: AppColors.gold.withValues(alpha: 0.4),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusRow(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color.withValues(alpha: 0.6)),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: AppTypography.subtitle.copyWith(fontSize: 12),
          ),
        ),
      ],
    );
  }
}
