import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class BranchSelectorTile extends StatelessWidget {
  final String label;
  final String selectedBranch;
  final List<String> options;
  final Function(String) onSelect;

  const BranchSelectorTile({
    super.key,
    required this.label,
    required this.selectedBranch,
    required this.options,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: options.map((o) => _branchChip(o)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _branchChip(String label) {
    final isSelected = selectedBranch == label;
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
