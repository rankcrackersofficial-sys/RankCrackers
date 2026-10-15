import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/widgets/premium_button.dart';

/// The diagnostic entry is intentionally unavailable until a server-
/// authoritative, authenticated and mission-bound attempt contract exists.
class DiagnosticTestScreen extends StatelessWidget {
  const DiagnosticTestScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_clock_rounded,
                color: AppColors.gold, size: 64),
            const SizedBox(height: 24),
            Text('Diagnostic Not Ready', style: AppTypography.hero),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'This diagnostic entry is unavailable until a verified mission-bound attempt is ready.',
                textAlign: TextAlign.center,
                style: AppTypography.body,
              ),
            ),
            const SizedBox(height: 32),
            PremiumButton(
              text: 'Back to Realms',
              onTap: () => context.go(AppRoutes.missionRealm),
            ),
          ],
        ),
      ),
    );
  }
}
