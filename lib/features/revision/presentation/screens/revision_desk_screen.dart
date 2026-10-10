import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/governed_not_ready_panel.dart';

class RevisionDeskScreen extends StatelessWidget {
  const RevisionDeskScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: GovernedNotReadyPanel(
        icon: Icons.refresh_rounded,
        title: 'Revision Desk',
        message:
            'Revision targets, memory-risk alerts, and focus modules will appear as your learning activity is mapped and prioritized.',
      ),
    );
  }
}
