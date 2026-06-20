import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';

class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData? icon;

  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 9, color: Colors.white38)),
              if (icon != null) Icon(icon, color: color, size: 16),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: AppTypography.hero.copyWith(fontSize: 24, color: color)),
        ],
      ),
    );
  }
}
