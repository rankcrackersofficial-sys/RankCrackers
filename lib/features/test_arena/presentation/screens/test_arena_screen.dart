import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/governed_not_ready_panel.dart';

class TestArenaScreen extends StatelessWidget {
  const TestArenaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: GovernedNotReadyPanel(
        icon: Icons.bolt_rounded,
        title: 'Test Arena is not ready yet',
        message:
            'Tests, leaderboards, accuracy and analysis will unlock only after verified test blueprints and governed result pipelines are available for the selected mission.',
        founderStatus: 'FOUNDER HEALTH: TEST ARENA NOT READY',
        checkpoints: [
          'No test count, rank, accuracy or static test list is exposed as real Student data.',
          'Founder Web tracks this as a pipeline readiness gap rather than a Student performance fact.',
        ],
      ),
    );
  }
}
