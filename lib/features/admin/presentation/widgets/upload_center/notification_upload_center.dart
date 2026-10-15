import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_source_pair_form.dart';

class NotificationUploadCenter extends StatelessWidget {
  const NotificationUploadCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "NOTIFICATION COMMAND",
          subtitle: "Official notification ingestion is locked to the mission source-pair workflow.",
        ),
        SizedBox(height: 24),
        MissionSourcePairForm(),
      ],
    );
  }
}
