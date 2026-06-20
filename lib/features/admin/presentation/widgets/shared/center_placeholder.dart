import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';

class CenterPlaceholder extends StatelessWidget {
  final String title;
  final IconData icon;
  final String subtitle;

  const CenterPlaceholder({
    super.key,
    required this.title,
    required this.icon,
    this.subtitle = "SOVEREIGN CONTROL PANE INACTIVE",
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white10, size: 80),
          const SizedBox(height: 20),
          Text(
            title,
            style: AppTypography.cardTitle.copyWith(color: Colors.white24, letterSpacing: 2),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: AppTypography.label.copyWith(color: Colors.white12, fontSize: 8),
          ),
        ],
      ),
    );
  }
}
