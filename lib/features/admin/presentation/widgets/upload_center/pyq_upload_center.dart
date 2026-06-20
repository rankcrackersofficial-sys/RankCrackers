import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_asset_form.dart';
import 'upload_queue_panel.dart';

class PyqUploadCenter extends StatelessWidget {
  const PyqUploadCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "PYQ COMMAND",
          subtitle: "Ingest Previous Year Questions to feed the bank.",
        ),
        SizedBox(height: 24),
        MissionAssetForm(assetType: 'pyq'),
        SizedBox(height: 32),
        UploadQueuePanel(assetType: 'pyq'),
      ],
    );
  }
}
