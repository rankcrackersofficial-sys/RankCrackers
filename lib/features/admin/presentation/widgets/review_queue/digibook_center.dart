import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../../../../../core/models/digibook_block.dart';
import '../../../../../core/backend/digibook_repository.dart';
import '../../../../../core/backend/question_repository.dart';
import '../../../../../core/services/content_governance_service.dart';
import '../../../../../core/engines/question_engine/mcq_generator.dart';
import '../shared/center_header.dart';
import '../shared/status_pill.dart';

class DigiBookCenter extends StatelessWidget {
  const DigiBookCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "DIGIBOOK CONTENT REFINERY", subtitle: "Manage mission-specific learning material."),
        const SizedBox(height: 24),
        Text("PENDING REVIEW", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<DigiBookBlock>>(
          stream: DigiBookRepository.streamReview(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("No blocks pending review.", style: TextStyle(color: Colors.white10));
            return Column(
              children: list.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(b.type.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 10)),
                          StatusPill(status: b.status),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(b.content, style: AppTypography.body.copyWith(fontSize: 12)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TacticalButton(
                              title: "VERIFY & PUBLISH", 
                              onTap: () async {
                                final adminId = FirebaseAuth.instance.currentUser?.uid ?? 'manual_admin';
                                await ContentGovernanceService.verifyBlock(block: b, adminId: adminId);
                                await ContentGovernanceService.publishBlock(b.copyWith(status: 'verified'));
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
        const SizedBox(height: 40),
        Text("PUBLISHED CONTENT", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<DigiBookBlock>>(
          stream: DigiBookRepository.streamPublished(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("No published blocks.", style: TextStyle(color: Colors.white10));
            return Column(
              children: list.map((b) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.book_outlined, color: AppColors.gold, size: 20),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(b.type.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 10)),
                                const SizedBox(height: 4),
                                Text(b.content, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.body.copyWith(fontSize: 12)),
                              ],
                            ),
                          ),
                          StatusPill(status: b.status),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TacticalButton(
                        title: "GENERATE MCQ", 
                        onTap: () async {
                          final generator = McqGenerator();
                          final question = generator.generate(
                            block: b, 
                            contextPool: list, 
                            examId: 'unmapped', 
                            subjectId: 'unmapped', 
                            nodeId: b.atomicTopicId
                          );
                          await QuestionRepository.save(question);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('MCQ GENERATED: Injected to Review Queue.')));
                          }
                        }
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
