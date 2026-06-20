import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../core/theme/app_typography.dart';

class LiveRevisionCard extends StatelessWidget {
  final String nodeId;

  const LiveRevisionCard({
    super.key,
    required this.nodeId,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('revision_material')
          .doc(nodeId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final data = snapshot.data!.data();
        if (data == null) {
          return const SizedBox();
        }

        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data['topic'] ?? "Revision Note",
                style: AppTypography.hero,
              ),
              const SizedBox(height: 20),
              Text(
                data['content'] ?? "Reinforcing neural pathways...",
                style: AppTypography.body,
              ),
            ],
          ),
        );
      },
    );
  }
}
