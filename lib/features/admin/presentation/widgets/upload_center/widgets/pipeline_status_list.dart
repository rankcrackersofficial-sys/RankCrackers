import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/firebase/firestore_service.dart';
import '../../../../../../core/models/ingestion_record.dart';
import '../../shared/center_placeholder.dart';
import 'pipeline_status_tile.dart';

class PipelineStatusList extends StatelessWidget {
  const PipelineStatusList({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 40),
        Text("INGESTION PIPELINE STATUS", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<Map<String, dynamic>>>(
          stream: FirestoreService.streamCollection('ingestion_refinery'),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const CenterPlaceholder(title: "PIPELINE CLEAR", icon: Icons.playlist_add_check_rounded);
            return Column(
              children: list.reversed.map((data) {
                final record = IngestionRecord.fromMap(data);
                return PipelineStatusTile(record: record);
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}
