import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';

class DegreeSelectorTile extends StatelessWidget {
  final String label;
  final String selectedDegree;
  final List<String> options;
  final Function(String) onSelect;

  const DegreeSelectorTile({
    super.key,
    required this.label,
    required this.selectedDegree,
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
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selectedDegree.isEmpty ? null : selectedDegree,
              hint: Text("Select Degree", style: AppTypography.body.copyWith(fontSize: 14, color: Colors.white24)),
              dropdownColor: AppColors.surface,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gold),
              isExpanded: true,
              items: options.map((l) => DropdownMenuItem(
                value: l,
                child: Text(l, style: AppTypography.body.copyWith(fontSize: 14)),
              )).toList(),
              onChanged: (val) => onSelect(val ?? ""),
            ),
          ),
        ],
      ),
    );
  }
}
