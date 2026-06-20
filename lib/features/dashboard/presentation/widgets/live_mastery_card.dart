import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class LiveMasteryCard extends StatelessWidget {
  const LiveMasteryCard({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return const SizedBox();

    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.streamProgress(user.uid),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox();

        final progress = snapshot.data!;
        double average = 0;

        if (progress.isNotEmpty) {
          average = progress
                  .map((e) => (e['mastery'] as num).toDouble())
                  .reduce((a, b) => a + b) /
              progress.length;
        }

        return DarkCard(
          child: Column(
            children: [
              Text(
                '${(average * 100).toInt()}%',
                style: AppTypography.hero,
              ),
              const SizedBox(height: 12),
              Text(
                'LIVE MASTERY',
                style: AppTypography.label,
              ),
            ],
          ),
        );
      },
    );
  }
}
