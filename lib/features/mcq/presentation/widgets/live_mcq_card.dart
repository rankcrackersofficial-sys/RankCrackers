import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../core/mcq_fetch_engine.dart';

class LiveMCQCard extends StatelessWidget {
  final String nodeId;

  const LiveMCQCard({
    super.key,
    required this.nodeId,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: MCQFetchEngine.stream(nodeId),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final data = snapshot.data!.data();
        if (data == null) {
          return const Center(
            child: Text("Combat set is being prepared...", style: TextStyle(color: Colors.white70)),
          );
        }

        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(data['topic'] ?? "Battle Set", style: AppTypography.hero),
              const SizedBox(height: 20),
              Text(
                data['content'] ?? "Analyzing battlefield data...",
                style: AppTypography.body,
              ),
            ],
          ),
        );
      },
    );
  }
}
