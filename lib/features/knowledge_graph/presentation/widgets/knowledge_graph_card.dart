import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

class KnowledgeGraphCard extends StatelessWidget {
  final String nodeId;
  final List<String> linked;

  const KnowledgeGraphCard({
    super.key,
    required this.nodeId,
    required this.linked,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            nodeId,
            style: AppTypography.section,
          ),
          const SizedBox(height: 16),
          Text(
            '${linked.length} CONNECTED TOPICS',
            style: AppTypography.cardTitle,
          ),
          const SizedBox(height: 14),
          ...linked.map((e) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                e,
                style: AppTypography.body,
              ),
            );
          }),
        ],
      ),
    );
  }
}
