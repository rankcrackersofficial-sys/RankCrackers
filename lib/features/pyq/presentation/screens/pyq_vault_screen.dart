import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/governed_not_ready_panel.dart';

class PyqVaultScreen extends StatelessWidget {
  const PyqVaultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: GovernedNotReadyPanel(
        icon: Icons.history_edu_rounded,
        title: 'PYQ Vault is not ready yet',
        message:
            'Previous-year questions, pattern analysis and weakness maps will appear only after Founder-approved PYQ sources are verified and published through the governed pipeline.',
        founderStatus: 'FOUNDER HEALTH: PYQ VAULT SOURCE PIPELINE REQUIRED',
        checkpoints: [
          'No question count, accuracy, year range or pattern insight is shown unless it comes from verified backend records.',
          'Founder Web receives a Not Ready health signal while the PYQ pipeline is incomplete.',
        ],
      ),
    );
  }
}
