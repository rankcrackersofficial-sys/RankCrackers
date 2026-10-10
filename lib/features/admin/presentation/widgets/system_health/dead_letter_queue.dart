import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../../../data/repositories/health_repository.dart';
import '../shared/center_header.dart';
import '../shared/center_placeholder.dart';

class DeadLetterQueue extends StatelessWidget {
  const DeadLetterQueue({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "DEAD LETTER QUEUE", subtitle: "Failed AI tasks and physical source errors."),
        const SizedBox(height: 24),
        StreamBuilder<List<Map<String, dynamic>>>(
          stream: HealthRepository.streamDeadLetterQueue(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) {
              return const SizedBox(
                height: 400,
                child: CenterPlaceholder(title: "DLQ CLEAR", icon: Icons.verified_user_rounded)
              );
            }
            return Column(
              children: list.map((error) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 16),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text("TASK: ${error['taskId'] ?? error['id'] ?? 'UNKNOWN'}", 
                              style: AppTypography.cardTitle.copyWith(fontSize: 10),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text("Type: ${error['type']}", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                      const SizedBox(height: 4),
                      Text("Reason: ${error['error']}", 
                        style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white38),
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 12),
                      TacticalButton(
                        title: "RETRY TASK", 
                        onTap: () async {
                          // Re-inject into queue logic
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
