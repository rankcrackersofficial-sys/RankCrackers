import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class BlueprintNode extends StatelessWidget {
  final String subject;
  final String topics;
  final String completed;
  final String running;
  final String locked;
  final VoidCallback? onTap; // Audit Fix: Added onTap

  const BlueprintNode({
    super.key,
    required this.subject,
    required this.topics,
    required this.completed,
    required this.running,
    required this.locked,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
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
                    subject,
                    style: AppTypography.cardTitle.copyWith(fontSize: 14),
                  ),
                ),
                if (onTap != null)
                  const Icon(Icons.open_in_new_rounded, size: 14, color: AppColors.gold),
              ],
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _chip(topics, const Color(0xFF4D7CFE)),
                _chip(completed, Colors.green),
                _chip(running, Colors.orange),
                _chip(locked, AppColors.error),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Text(
        text,
        style: AppTypography.label.copyWith(fontSize: 9, color: color.withValues(alpha: 0.8)),
      ),
    );
  }
}
