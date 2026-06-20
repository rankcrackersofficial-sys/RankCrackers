import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class QualificationTile extends StatelessWidget {
  final String qualification;
  final Function(String) onSelect;

  const QualificationTile({super.key, required this.qualification, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final levels = ["12th Pass", "Diploma", "Graduate", "Post Graduate", "PhD"];
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Highest Qualification", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
          const SizedBox(height: 12),
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: qualification.isEmpty ? null : qualification,
              hint: Text("Select Qualification", style: AppTypography.body.copyWith(fontSize: 14, color: Colors.white24)),
              dropdownColor: AppColors.surface,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.gold),
              isExpanded: true,
              items: levels.map((l) => DropdownMenuItem(
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
