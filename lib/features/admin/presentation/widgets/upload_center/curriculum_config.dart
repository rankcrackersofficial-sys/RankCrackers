import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../shared/center_header.dart';
import '../shared/admin_input.dart';

class CurriculumConfig extends StatelessWidget {
  const CurriculumConfig({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        _CrucibleCenter(),
        SizedBox(height: 24),
        _AssessmentCenter(),
      ],
    );
  }
}

class _CrucibleCenter extends StatelessWidget {
  const _CrucibleCenter();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const CenterHeader(title: "CRUCIBLE PROTOCOL CENTER", subtitle: "Define high-intensity training algorithms."),
        const SizedBox(height: 24),
        DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("PROTOCOL v2.1 (ACTIVE)", style: AppTypography.label.copyWith(color: AppColors.gold)),
              const SizedBox(height: 16),
              Text("Algorithm: Delta Spaced Repetition", style: AppTypography.body.copyWith(fontSize: 12)),
              Text("Intensity: High (0.8 Mastery Threshold)", style: AppTypography.body.copyWith(fontSize: 12)),
              const SizedBox(height: 24),
              TacticalButton(title: "MODIFY PROTOCOL", onTap: () {}),
            ],
          ),
        ),
      ],
    );
  }
}

class _AssessmentCenter extends StatelessWidget {
  const _AssessmentCenter();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const CenterHeader(title: "ASSESSMENT ORCHESTRATOR", subtitle: "Configure diagnostic and progression drills."),
        const SizedBox(height: 24),
        DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("DEPLOY DIAGNOSTIC DRILL", style: AppTypography.label.copyWith(color: AppColors.gold)),
              const SizedBox(height: 20),
              AdminInput(controller: TextEditingController(), hint: "Target Recruitment ID"),
              const SizedBox(height: 12),
              AdminInput(controller: TextEditingController(), hint: "Question Count (e.g. 50)"),
              const SizedBox(height: 24),
              TacticalButton(title: "INITIALIZE DRILL", onTap: () {}),
            ],
          ),
        ),
      ],
    );
  }
}
