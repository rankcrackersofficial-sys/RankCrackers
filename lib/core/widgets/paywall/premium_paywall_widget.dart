import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../dark_card.dart';
import '../premium_button.dart';
import '../../utils/app_routes.dart';

class PremiumPaywallWidget extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback? onUpgrade;

  const PremiumPaywallWidget({
    super.key,
    this.title = 'Your next advantage',
    this.description =
        'Go deeper with guided explanations, focused revision and a clearer path through today’s study.',
    this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Blur Effect for content behind
        ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
            child: Container(
              color: Colors.black.withValues(alpha: 0.1),
            ),
          ),
        ),

        Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: DarkCard(
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    color: AppColors.gold,
                    size: 42,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: AppTypography.cardTitle,
                  ),
                  const SizedBox(height: 18),
                  Text(
                    description,
                    textAlign: TextAlign.center,
                    style: AppTypography.body,
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: PremiumButton(
                      text: 'UPGRADE TO ELITE',
                      onTap: onUpgrade ??
                          () => context.push(AppRoutes.eliteAccess),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
