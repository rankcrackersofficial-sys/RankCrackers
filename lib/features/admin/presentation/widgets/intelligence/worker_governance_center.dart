import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/worker_registry.dart';
import 'package:rank_crackers/features/admin/data/repositories/worker_registry_repository.dart';
import 'widgets/worker_card.dart';

class WorkerGovernanceCenter extends StatelessWidget {
  const WorkerGovernanceCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("WORKER BATTALION", style: AppTypography.cardTitle.copyWith(fontSize: 12)),
            TextButton(
              onPressed: () => WorkerRegistryRepository.bootstrapBattalion(), 
              child: Text("BOOTSTRAP", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.blueAccent)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        StreamBuilder<List<WorkerRegistry>>(
          stream: WorkerRegistryRepository.streamRegistry(),
          builder: (context, snapshot) {
            final workers = snapshot.data ?? [];
            if (workers.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Text("NO WORKERS REGISTERED", style: TextStyle(color: Colors.white10)),
                ),
              );
            }

            return Column(
              children: workers.map((w) => WorkerCard(worker: w)).toList(),
            );
          },
        ),
      ],
    );
  }
}
