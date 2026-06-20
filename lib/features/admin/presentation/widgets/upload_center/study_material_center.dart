import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_asset_form.dart';
import 'upload_queue_panel.dart';

class StudyMaterialCenter extends StatelessWidget {
  const StudyMaterialCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "STUDY MATERIAL CENTER",
          subtitle: "Ingest textbooks and notes for automated DigiBook generation.",
        ),
        SizedBox(height: 24),
        MissionAssetForm(assetType: 'study_material'),
        SizedBox(height: 32),
        UploadQueuePanel(assetType: 'study_material'),
      ],
    );
  }
}
