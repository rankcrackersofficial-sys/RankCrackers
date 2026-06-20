import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/upload_action_card.dart';
import 'widgets/pipeline_status_list.dart';

class IngestionRefineryCenter extends StatelessWidget {
  const IngestionRefineryCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "UNIVERSAL INGESTION REFINERY",
          subtitle: "Source material intake and canonical correction.",
        ),
        SizedBox(height: 24),
        UploadActionCard(),
        PipelineStatusList(),
      ],
    );
  }
}
