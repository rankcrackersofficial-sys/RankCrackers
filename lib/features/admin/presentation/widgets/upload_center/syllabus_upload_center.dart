import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_asset_form.dart';
import 'upload_queue_panel.dart';

class SyllabusUploadCenter extends StatelessWidget {
  const SyllabusUploadCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "SYLLABUS COMMAND",
          subtitle: "Atomize and map mission knowledge structures.",
        ),
        SizedBox(height: 24),
        MissionAssetForm(assetType: 'syllabus'),
        SizedBox(height: 32),
        UploadQueuePanel(assetType: 'syllabus'),
      ],
    );
  }
}
