import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class GovernedNotReadyPanel extends StatelessWidget {
  final String title;
  final String message;
  final String founderStatus;
  final IconData icon;
  final List<String> checkpoints;

  const GovernedNotReadyPanel({
    super.key,
    required this.title,
    required this.message,
    this.founderStatus = '',
    this.icon = Icons.hourglass_empty_rounded,
    this.checkpoints = const [],
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints:
                  BoxConstraints(minHeight: constraints.maxHeight - 48),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 520),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.borderSoft),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.28),
                        blurRadius: 24,
                        offset: const Offset(0, 14),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(icon, color: AppColors.gold, size: 30),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              title,
                              style: AppTypography.cardTitle.copyWith(
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        message,
                        style: AppTypography.body.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
