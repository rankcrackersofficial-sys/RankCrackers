import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../models/professional_credential.dart';

class ProfessionalQualificationTile extends StatelessWidget {
  final List<String> selectedIds;
  final Function(String, bool) onToggle;

  const ProfessionalQualificationTile({
    super.key,
    required this.selectedIds,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Professional Qualifications", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: ProfessionalCredential.masterList.map((cred) {
              final isSelected = selectedIds.contains(cred.id);
              return _qualChip(cred.label, cred.id, isSelected);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _qualChip(String label, String id, bool isSelected) {
    return GestureDetector(
      onTap: () => onToggle(id, !isSelected),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isSelected ? AppColors.gold : Colors.white10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) const Icon(Icons.check_circle_rounded, color: AppColors.gold, size: 14),
            if (isSelected) const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.label.copyWith(fontSize: 11, color: isSelected ? AppColors.gold : Colors.white54),
            ),
          ],
        ),
      ),
    );
  }
}
