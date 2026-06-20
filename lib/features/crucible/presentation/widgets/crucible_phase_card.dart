import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../models/crucible_phase.dart';

class CruciblePhaseCard extends StatelessWidget {
  final CruciblePhase phase;

  const CruciblePhaseCard({
    super.key,
    required this.phase,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PHASE ${phase.phaseIndex + 1}',
            style: AppTypography.section,
          ),
          const SizedBox(height: 16),
          Text(
            '${phase.schedules.length} SCHEDULES',
            style: AppTypography.cardTitle,
          ),
          const SizedBox(height: 12),
          Text(
            'MACRO TEST',
            style: AppTypography.label,
          ),
          const SizedBox(height: 6),
          Text(
            phase.macroTestTime.toString(),
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }
}
