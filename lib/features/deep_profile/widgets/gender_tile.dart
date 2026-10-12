import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';

class GenderTile extends StatelessWidget {
  final String gender;
  final Function(String) onSelect;

  const GenderTile({super.key, required this.gender, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Gender", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
          const SizedBox(height: 12),
          Row(
            children: [
              _genderChip("Male"),
              const SizedBox(width: 10),
              _genderChip("Female"),
              const SizedBox(width: 10),
              _genderChip("Other"),
            ],
          ),
        ],
      ),
    );
  }

  Widget _genderChip(String label) {
    final isSelected = gender == label;
    return GestureDetector(
      onTap: () => onSelect(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.gold : Colors.white10),
        ),
        child: Text(
          label,
          style: AppTypography.label.copyWith(fontSize: 10, color: isSelected ? AppColors.gold : Colors.white54),
        ),
      ),
    );
  }
}
