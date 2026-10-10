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
        title: 'Rank Radar',
        message:
            'Subject analysis, target completion trends, and learning performance tracking will become available as you participate in active battles and complete modules.',
      ),
    );
  }
}
