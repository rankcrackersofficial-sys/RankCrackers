import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';

class AccessRoleCard extends StatelessWidget {
  final String title;
  final String count;
  final IconData icon;
  final Color color;

  const AccessRoleCard({
    super.key,
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 16),
          Text(title, style: AppTypography.cardTitle.copyWith(fontSize: 14)),
          const Spacer(),
          Text(count, style: AppTypography.hero.copyWith(fontSize: 18, color: color)),
        ],
      ),
    );
  }
}
