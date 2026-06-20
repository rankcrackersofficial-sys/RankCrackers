import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';

class FounderBottomNavigation extends StatelessWidget {
  final int activeIndex;
  final Function(int) onTabSwitch;

  const FounderBottomNavigation({
    super.key,
    required this.activeIndex,
    required this.onTabSwitch,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.98),
        border: const Border(top: BorderSide(color: Colors.white10, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _navItem(0, Icons.add_box_rounded, "UPLOADS"),
          _navItem(1, Icons.radar_rounded, "INTEL"),
          _navItem(2, Icons.fact_check_rounded, "REVIEWS"),
          _navItem(3, Icons.account_tree_rounded, "MISSIONS"),
          _navItem(4, Icons.settings_suggest_rounded, "SETTINGS"),
        ],
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final bool active = activeIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => onTabSwitch(index),
        behavior: HitTestBehavior.opaque,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (active)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  height: 3,
                  width: active ? 40 : 0,
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(3)),
                  ),
                ),
                const Spacer(),
                Icon(
                  icon,
                  color: active ? AppColors.gold : Colors.white38,
                  size: 20,
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: AppTypography.label.copyWith(
                    fontSize: 8,
                    fontWeight: active ? FontWeight.bold : FontWeight.normal,
                    color: active ? AppColors.gold : Colors.white38,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
