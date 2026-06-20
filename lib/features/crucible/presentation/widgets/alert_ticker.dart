import 'package:flutter/material.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class AlertTicker extends StatelessWidget {
  final List<String> alerts;
  final int currentAlert;

  const AlertTicker({
    super.key,
    required this.alerts,
    required this.currentAlert,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      border: Border.all(color: AppColors.error.withValues(alpha: 0.1)),
      child: Row(
        children: [
          const Icon(
            Icons.notification_important_rounded,
            color: AppColors.error,
            size: 20,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 500),
              child: Text(
                alerts[currentAlert],
                key: ValueKey<int>(currentAlert),
                style: AppTypography.label.copyWith(
                  color: AppColors.primaryText.withValues(alpha: 0.8),
                  letterSpacing: 0.5,
                  fontSize: 11,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
