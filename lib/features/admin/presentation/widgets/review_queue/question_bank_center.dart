import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../../../../../core/models/question_model.dart';
import '../../../../../core/backend/question_repository.dart';
import '../../../../../core/services/content_governance_service.dart';
import '../shared/center_header.dart';
import '../shared/status_pill.dart';

class QuestionBankCenter extends StatelessWidget {
  const QuestionBankCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "QUESTION BANK VAULT", subtitle: "Governance for assessment evidence and PYQs."),
        const SizedBox(height: 24),
        Text("PENDING REVIEW", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<QuestionModel>>(
          stream: QuestionRepository.streamReview(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("No questions pending review.");
            return Column(
              children: list.map((q) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("${q.subjectId} • ${q.difficulty.name.toUpperCase()}", style: AppTypography.label.copyWith(fontSize: 10)),
                          StatusPill(status: q.status),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(q.question, style: AppTypography.body.copyWith(fontSize: 12)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TacticalButton(
                              title: "VERIFY & PUBLISH", 
                              onTap: () async {
                                final adminId = FirebaseAuth.instance.currentUser?.uid ?? 'manual_admin';
                                await ContentGovernanceService.verifyQuestion(question: q, adminId: adminId);
                                await ContentGovernanceService.publishQuestion(q.copyWith(status: 'verified'));
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
        Text("PUBLISHED VAULT", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<QuestionModel>>(
          stream: QuestionRepository.streamPublished(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("No published questions.");
            return Column(
              children: list.map((q) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.help_outline_rounded, color: AppColors.gold, size: 20),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("${q.subjectId} • ${q.difficulty.name.toUpperCase()}", style: AppTypography.label.copyWith(fontSize: 10)),
                            const SizedBox(height: 4),
                            Text(q.question, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.body.copyWith(fontSize: 12)),
                          ],
                        ),
                      ),
                      StatusPill(status: q.status),
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
