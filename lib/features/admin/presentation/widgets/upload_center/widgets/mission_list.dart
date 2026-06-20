import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/models/recruitment.dart';
import '../../../../../../core/backend/recruitment_repository.dart';
import 'mission_tile.dart';

class MissionList extends StatelessWidget {
  const MissionList({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 32),
        Text("ACTIVE MISSIONS", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<Recruitment>>(
          stream: RecruitmentRepository.stream(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("No missions deployed.");
            return Column(
              children: list.map((r) => MissionTile(recruitment: r)).toList(),
            );
          },
        ),
      ],
    );
  }
}
