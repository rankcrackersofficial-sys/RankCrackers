import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';

class MissionCategorySelector extends StatelessWidget {
  final String selectedCategory;
  final Function(String) onCategoryChanged;

  const MissionCategorySelector({
    super.key,
    required this.selectedCategory,
    required this.onCategoryChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("EXAM CATEGORY", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
        const SizedBox(height: 8),
        Row(
          children: [
            _categoryChip("COMPETITIVE", 'competitive'),
            const SizedBox(width: 10),
            _categoryChip("QUALIFYING", 'qualifying'),
          ],
        ),
      ],
    );
  }

  Widget _categoryChip(String label, String value) {
    final active = selectedCategory == value;
    return GestureDetector(
      onTap: () => onCategoryChanged(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? AppColors.gold : Colors.white10),
        ),
        child: Text(label, style: AppTypography.label.copyWith(color: active ? AppColors.gold : Colors.white24, fontSize: 9)),
      ),
    );
  }
}
