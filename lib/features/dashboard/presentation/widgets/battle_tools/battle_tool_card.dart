import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class BattleToolCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final IconData glowIcon;
  final Color glowColor;
  final String route;
  final bool featured;

  const BattleToolCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.glowIcon,
    required this.glowColor,
    required this.route,
    this.featured = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isReady = subtitle != "Not Ready";

    return GestureDetector(
      onTap: isReady
          ? () => context.push(route)
          : () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFF111625),
                  content: Text(
                    '$title is not ready for this mission.',
                    style: AppTypography.body.copyWith(color: Colors.white70),
                  ),
                ),
              );
            },
      child: DarkCard(
        padding: const EdgeInsets.all(18),
        border: featured && isReady
            ? Border.all(color: AppColors.gold.withValues(alpha: 0.3), width: 1.2)
            : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🔱 PREMIUM CARD DNA: Icon/Metric
            Icon(
              icon,
              color: isReady ? AppColors.gold : Colors.white24,
              size: 20,
            ),

            const Spacer(),

            // 🔱 PREMIUM CARD DNA: Title
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.cardTitle.copyWith(
                fontSize: 14,
                color: isReady ? Colors.white : Colors.white38,
              ),
            ),

            const SizedBox(height: 6),

            // 🔱 PREMIUM CARD DNA: Subtitle
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.subtitle.copyWith(
                fontSize: 10,
                color: isReady ? AppColors.gold.withValues(alpha: 0.7) : Colors.white24,
              ),
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                Text(
                  isReady ? "LAUNCH" : "LOCKED",
                  style: AppTypography.label.copyWith(
                    fontSize: 8,
                    color: isReady ? AppColors.gold : Colors.white24,
                  ),
                ),
                const Spacer(),
                Icon(
                  isReady ? Icons.arrow_forward_ios_rounded : Icons.lock_outline_rounded,
                  size: 10,
                  color: isReady ? AppColors.gold : Colors.white24,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
