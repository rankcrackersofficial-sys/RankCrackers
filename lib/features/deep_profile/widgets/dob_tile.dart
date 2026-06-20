import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class DobTile extends StatelessWidget {
  final DateTime? dob;
  final VoidCallback onTap;

  const DobTile({super.key, this.dob, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            const Icon(Icons.calendar_month_rounded, color: AppColors.gold, size: 22),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Date of Birth", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
                const SizedBox(height: 4),
                Text(
                  dob != null ? DateFormat('dd MMM yyyy').format(dob!) : "Not Provided",
                  style: AppTypography.cardTitle.copyWith(fontSize: 14),
                ),
              ],
            ),
            const Spacer(),
            const Icon(Icons.edit_rounded, color: Colors.white12, size: 16),
          ],
        ),
      ),
    );
  }
}
