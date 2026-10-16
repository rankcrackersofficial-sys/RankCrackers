import 'package:flutter/material.dart';

import '../../../../shared/widgets/governed_not_ready_panel.dart';

class RevisionDeskScreen extends StatelessWidget {
  const RevisionDeskScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: const GovernedNotReadyPanel(
        icon: Icons.refresh_rounded,
        title: 'Revision Desk',
        message:
            'Revision targets, memory-risk alerts, and focus modules will appear as your learning activity is mapped and prioritized.',
      ),
    );
  }
}
