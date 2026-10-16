import 'package:flutter/material.dart';

import '../../../../shared/widgets/governed_not_ready_panel.dart';

class PyqVaultScreen extends StatelessWidget {
  const PyqVaultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: const GovernedNotReadyPanel(
        icon: Icons.history_edu_rounded,
        title: 'PYQ Vault',
        message:
            'Previous-year questions, question pattern analysis, and chapter weakness maps will become available once the question bank is fully loaded and synchronized with your active mission.',
      ),
    );
  }
}
