import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';

class EmploymentTile extends StatelessWidget {
  final String status;
  final Function(String) onSelect;

  const EmploymentTile({super.key, required this.status, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final options = ["Unemployed", "Private Sector", "Government", "Self-Employed"];
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Employment Status", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: options.map((o) => _employmentChip(o)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _employmentChip(String label) {
    final isSelected = status == label;
    return GestureDetector(
      onTap: () => onSelect(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
