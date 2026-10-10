import 'package:flutter/material.dart';

import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/theme/app_typography.dart';
import '../../models/digibook_content.dart';

class LiveDigiBookCard extends StatelessWidget {
  final MicroTopicNode node;
  final DigiBookContent payload; // Decoupled

  const LiveDigiBookCard({
    super.key,
    required this.node,
    required this.payload,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            node.title,
            style: AppTypography.hero,
          ),
          const SizedBox(
            height: 12,
          ),
          Text(
            node.chapter.replaceAll('_', ' ').toUpperCase(),
            style: AppTypography.subtitle,
          ),
          const SizedBox(
            height: 24,
          ),
          Text(
            payload.beginnerContent,
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }
}
