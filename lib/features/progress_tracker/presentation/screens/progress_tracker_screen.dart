import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/governed_not_ready_panel.dart';

class ProgressTrackerScreen extends StatelessWidget {
  const ProgressTrackerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: GovernedNotReadyPanel(
        icon: Icons.leaderboard_rounded,
        title: 'Rank Radar is not ready yet',
        message:
            'Rank, accuracy, streak, competition position and subject trends will appear only after verified progress and competition projections are published for this mission.',
        founderStatus: 'FOUNDER HEALTH: RANK RADAR NOT READY',
        checkpoints: [
          'No rank, score, streak or competition number is invented on the Student Panel.',
          'Founder Web can see this as a missing governed pipeline instead of a fake healthy state.',
        ],
      ),
    );
  }
}
