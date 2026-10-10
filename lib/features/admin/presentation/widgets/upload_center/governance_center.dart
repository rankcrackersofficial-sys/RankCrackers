import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../../../../../core/models/recruitment.dart';
import '../../../../../core/backend/recruitment_repository.dart';
import '../../../data/admin_upload_engine.dart';
import '../shared/center_header.dart';
import '../shared/status_pill.dart';

class GovernanceCenter extends StatelessWidget {
  const GovernanceCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "SOVEREIGN GOVERNANCE GATE", subtitle: "Verify and publish missions for the battalion."),
        const SizedBox(height: 24),
        Text("MISSION LIFECYCLE MANAGEMENT", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<Recruitment>>(
          stream: RecruitmentRepository.stream(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            final drafts = list.where((r) => r.status != 'published').toList();
            
            if (drafts.isEmpty) return const Text("No missions in draft/review state.");
            return Column(
              children: drafts.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: DarkCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(r.title, style: AppTypography.cardTitle),
                          StatusPill(status: r.status),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text("DNA: ${r.state} • ${r.examCategory} • v${r.version}", style: AppTypography.body.copyWith(fontSize: 12, color: Colors.white38)),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => AdminUploadEngine.updateRecruitmentStatus(r.id, 'review'),
                              style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white10)),
                              child: const Text("MARK REVIEW", style: TextStyle(fontSize: 10, color: Colors.white38)),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TacticalButton(
                              title: "VALIDATE & PUBLISH", 
                              onTap: () async {
                                final success = await AdminUploadEngine.publishRecruitment(r);
                                if (context.mounted && success) {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${r.title} PUBLISHED')));
                                } else if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('❌ VALIDATION FAILED: Hierarchy Incomplete.')));
                                }
                              }
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              )).toList(),
            );
          },
        ),
      ],
    );
  }
}
