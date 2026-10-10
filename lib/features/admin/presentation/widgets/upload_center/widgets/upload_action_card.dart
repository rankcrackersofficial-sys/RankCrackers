import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';

import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../../../shared/widgets/tactical_button.dart';
import '../../../../../../core/services/universal_ingestion_service.dart';

class UploadActionCard extends StatelessWidget {
  const UploadActionCard({super.key});

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(Icons.cloud_upload_outlined, color: AppColors.gold, size: 48),
          const SizedBox(height: 16),
          Text("GENERIC ASSET INGESTION", style: AppTypography.cardTitle),
          const SizedBox(height: 8),
          Text("PDF, DOCX, XLSX, JSON, IMAGE", style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white24)),
          const SizedBox(height: 24),
          TacticalButton(
            title: "SELECT SOURCE FILE", 
            onTap: () async {
              final result = await FilePicker.platform.pickFiles(
                type: FileType.custom,
                allowedExtensions: ['pdf', 'docx', 'xlsx', 'json', 'csv', 'txt'],
                withData: true, 
              );

              if (result != null && result.files.single.bytes != null) {
                final pickedFile = result.files.single;
                await UniversalIngestionService.registerSource(
                  fileName: pickedFile.name,
                  bytes: pickedFile.bytes!,
                  file: kIsWeb ? null : File(pickedFile.path!),
                  assetType: 'generic',
                  recruitmentId: 'unmapped',
                  documentStatus: 'LIVE',
                );
                
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('INGESTION TRIGGERED: Asset uploaded and worker notified.')));
                }
              }
            },
          ),
        ],
      ),
    );
  }
}
