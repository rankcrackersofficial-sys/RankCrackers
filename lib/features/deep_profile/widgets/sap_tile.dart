import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class SapTile extends StatelessWidget {
  final bool isSap;
  final Function(bool) onToggle;

  const SapTile({super.key, required this.isSap, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Specially Abled Person", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
              const SizedBox(height: 4),
              Text(isSap ? "Yes" : "No", style: AppTypography.cardTitle.copyWith(fontSize: 14)),
            ],
          ),
          Switch(
            value: isSap,
            onChanged: onToggle,
            activeThumbColor: AppColors.gold,
            activeTrackColor: AppColors.gold.withValues(alpha: 0.2),
            inactiveThumbColor: Colors.white24,
            inactiveTrackColor: Colors.white10,
          ),
        ],
      ),
    );
  }
}
