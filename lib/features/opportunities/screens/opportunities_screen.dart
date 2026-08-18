import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/governed_not_ready_panel.dart';

class OpportunitiesScreen extends StatelessWidget {
  const OpportunitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: GovernedNotReadyPanel(
        icon: Icons.work_outline_rounded,
        title: 'Career Signals are not ready yet',
        message:
            'Eligibility paths, alerts, age/category benefits, scores and career recommendations will appear only after the Student profile, Founder-approved opportunity rules and governed matching pipeline are available.',
        founderStatus:
            'FOUNDER HEALTH: CAREER SIGNALS GOVERNED PIPELINE REQUIRED',
        checkpoints: [
          'No eligibility score, alert count, path count or category benefit is invented.',
          'Student sees a safe Not Ready state while Founder Web sees the missing pipeline health.',
          'Founder cannot directly edit private Student score, mastery or eligibility truth.',
        ],
      ),
    );
  }
}
