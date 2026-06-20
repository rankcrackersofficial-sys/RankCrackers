import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_card.dart';

class CurrentMissionCard extends StatelessWidget {
  final List<String> missions;

  const CurrentMissionCard({
    super.key,
    required this.missions,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('CURRENT MISSIONS', style: AppTypography.section.copyWith(color: AppColors.gold)),
          const SizedBox(height: 18),
          ...missions.map((e) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.radio_button_unchecked_rounded, color: AppColors.gold, size: 18),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(e, style: AppTypography.body),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
