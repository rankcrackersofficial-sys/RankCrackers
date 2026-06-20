import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/firebase/firestore_service.dart';
import '../shared/center_header.dart';

class AiWorkerCenter extends StatelessWidget {
  const AiWorkerCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "AI WORKER COMMAND", subtitle: "Monitor automated intelligence execution."),
        const SizedBox(height: 24),
        
        Text("ACTIVE EXECUTION QUEUE", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<Map<String, dynamic>>>(
          stream: FirestoreService.streamAIQueue(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("Queue empty. All workers standing by.", style: TextStyle(color: Colors.white24, fontSize: 12));
            return Column(
              children: list.map((task) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.pending_actions_rounded, color: AppColors.gold, size: 20),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(task['type']?.toString().toUpperCase() ?? 'UNKNOWN TASK', 
                              style: AppTypography.cardTitle.copyWith(fontSize: 12),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text("ID: ${task['id'] ?? '...'} • PAYLOAD: ${task['payload']?['id'] ?? task['payload']?['unitId'] ?? 'N/A'}", 
                              style: AppTypography.body.copyWith(fontSize: 8, color: Colors.white24),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text("PENDING", style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 7, fontWeight: FontWeight.bold)),
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
