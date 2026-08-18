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
        title: 'Revision Desk is not ready yet',
        message:
            'Weak topics, revision priority and memory-risk queues will appear only after verified learning evidence and personalization routes are available.',
        founderStatus: 'FOUNDER HEALTH: REVISION LOOP NOT READY',
        checkpoints: [
          'No weak-topic list, progress percent or revision target is invented.',
          'Founder Web can monitor revision readiness without editing mastery or score truth.',
        ],
      ),
    );
  }
}
