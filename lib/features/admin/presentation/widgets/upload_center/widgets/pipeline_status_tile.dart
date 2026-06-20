import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../../../core/models/ingestion_record.dart';
import 'pipeline_progress_steps.dart';
import 'file_metadata_pills.dart';

class PipelineStatusTile extends StatelessWidget {
  final IngestionRecord record;
  const PipelineStatusTile({super.key, required this.record});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                _fileIcon(record.fileType),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(record.fileName, style: AppTypography.cardTitle.copyWith(fontSize: 14)),
                      Text("Refined via AI Ingestion Engine • Confidence: ${record.metadata['confidenceScore'] ?? '0.95'}", 
                        style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white24)),
                    ],
                  ),
                ),
                _statusIcon(record.status),
              ],
            ),
            const SizedBox(height: 12),
            FileMetadataPills(metadata: record.metadata),
            const SizedBox(height: 16),
            PipelineProgressSteps(status: record.status),
          ],
        ),
      ),
    );
  }

  Widget _fileIcon(String type) {
    IconData icon;
    Color color;
    switch (type) {
      case 'pdf': icon = Icons.picture_as_pdf; color = Colors.redAccent; break;
      case 'xlsx': icon = Icons.table_chart; color = Colors.greenAccent; break;
      case 'docx': icon = Icons.description; color = Colors.blueAccent; break;
      default: icon = Icons.insert_drive_file; color = Colors.white24;
    }
    return Icon(icon, color: color, size: 24);
  }

  Widget _statusIcon(String status) {
    if (status == 'received') return const Icon(Icons.sync, color: AppColors.gold, size: 16);
    if (status == 'processing') return const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gold));
    if (status == 'classified' || status == 'under_review') return const Icon(Icons.auto_awesome, color: Colors.blueAccent, size: 16);
    if (status == 'published') return const Icon(Icons.check_circle, color: Colors.greenAccent, size: 16);
    if (status == 'failed') return const Icon(Icons.error_outline, color: Colors.redAccent, size: 16);
    return const Icon(Icons.check_circle_outline, color: Colors.greenAccent, size: 16);
  }
}
