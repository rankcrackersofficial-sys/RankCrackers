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
    return GestureDetector(
      onTap: () => context.push(route),
      child: DarkCard(
        padding: const EdgeInsets.all(18),
        border: featured ? Border.all(color: AppColors.gold.withValues(alpha: 0.3), width: 1.2) : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🔱 PREMIUM CARD DNA: Icon/Metric
            Icon(
              icon,
              color: AppColors.gold,
              size: 20,
            ),

            const Spacer(),

            // 🔱 PREMIUM CARD DNA: Title
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.cardTitle.copyWith(fontSize: 14),
            ),

            const SizedBox(height: 6),

            // 🔱 PREMIUM CARD DNA: Subtitle
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.subtitle.copyWith(fontSize: 10),
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                Text(
                  "LAUNCH",
                  style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.gold),
                ),
                const Spacer(),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 10,
                  color: AppColors.gold,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
