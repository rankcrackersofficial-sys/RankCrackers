import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_asset_form.dart';
import 'upload_queue_panel.dart';

class UpdateNoticeCenter extends StatelessWidget {
  const UpdateNoticeCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "NOTICE COMMAND",
          subtitle: "Ingest official updates: Results, Cutoffs, and Answer Keys.",
        ),
        SizedBox(height: 24),
        MissionAssetForm(assetType: 'notice'),
        SizedBox(height: 32),
        UploadQueuePanel(assetType: 'notice'),
      ],
    );
  }
}
