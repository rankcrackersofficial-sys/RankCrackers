import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_asset_form.dart';
import 'upload_queue_panel.dart';

class NotificationUploadCenter extends StatelessWidget {
  const NotificationUploadCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "NOTIFICATION COMMAND",
          subtitle: "Ingest official notices to trigger machine extraction.",
        ),
        SizedBox(height: 24),
        MissionAssetForm(assetType: 'notification'),
        SizedBox(height: 32),
        UploadQueuePanel(assetType: 'recruitment_notification'),
      ],
    );
  }
}
