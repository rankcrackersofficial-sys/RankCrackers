import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../data/repositories/review_repository.dart';

class ReviewQueueCard extends StatelessWidget {
  final VoidCallback onTap;
  const ReviewQueueCard({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.rate_review_rounded, color: AppColors.gold, size: 20),
                const SizedBox(width: 12),
                Text("REVIEW QUEUE", style: AppTypography.cardTitle),
                const Spacer(),
                const Icon(Icons.chevron_right_rounded, color: Colors.white24),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _miniStat("DigiBook", ReviewRepository.streamPendingDigiBookCount(), Colors.blueAccent),
                _miniStat("Questions", ReviewRepository.streamPendingQuestionCount(), Colors.orangeAccent),
                _miniStat("Syllabus", ReviewRepository.streamPendingSyllabusCount(), Colors.greenAccent),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniStat(String label, Stream<int> stream, Color color) {
    return StreamBuilder<int>(
      stream: stream,
      builder: (context, snapshot) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(snapshot.data?.toString() ?? "0", style: AppTypography.hero.copyWith(fontSize: 20, color: color)),
            Text(label.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white12)),
          ],
        );
      },
    );
  }
}
