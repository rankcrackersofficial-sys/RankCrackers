import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../models/final_exam.dart';

class FinalExamCard extends StatelessWidget {
  final FinalExam exam;

  const FinalExamCard({
    super.key,
    required this.exam,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            exam.examName,
            style: AppTypography.section,
          ),
          const SizedBox(height: 16),
          Text(
            '${exam.totalQuestions} QUESTIONS',
            style: AppTypography.cardTitle,
          ),
          const SizedBox(height: 12),
          Text(
            '${exam.durationMinutes} MINUTES',
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }
}
