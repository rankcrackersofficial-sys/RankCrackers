import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../data/repositories/review_repository.dart';

class ReviewQueueSummary extends StatelessWidget {
  const ReviewQueueSummary({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _liveStat("DigiBook", ReviewRepository.streamPendingDigiBookCount(), Colors.blueAccent),
        _liveStat("Questions", ReviewRepository.streamPendingQuestionCount(), Colors.orangeAccent),
        _liveStat("Syllabus", ReviewRepository.streamPendingSyllabusCount(), Colors.greenAccent),
      ],
    );
  }

  Widget _liveStat(String label, Stream<int> stream, Color color) {
    return StreamBuilder<int>(
      stream: stream,
      builder: (context, snapshot) {
        final value = snapshot.data?.toString() ?? "--";
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: AppTypography.hero.copyWith(fontSize: 24, color: color)),
            Text(label.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
          ],
        );
      },
    );
  }
}
