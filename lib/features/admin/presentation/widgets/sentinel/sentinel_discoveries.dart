import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/backend/sentinel_repository.dart';
import '../../../../../core/models/sentinel_draft.dart';
import '../shared/center_header.dart';
import '../shared/center_placeholder.dart';
import 'widgets/discovery_mini_metrics.dart';
import 'widgets/discovery_tile.dart';

class SentinelDiscoveries extends StatelessWidget {
  const SentinelDiscoveries({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(
          title: "SENTINEL NETWORK", 
          subtitle: "Machine-driven mission discovery and extraction."
        ),
        const SizedBox(height: 24),
        
        const DiscoveryMiniMetrics(),

        const SizedBox(height: 32),
        Text("NEW DISCOVERIES", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        
        StreamBuilder<List<SentinelDraft>>(
          stream: SentinelRepository.streamPending(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const CenterPlaceholder(title: "NO NEW DISCOVERIES", icon: Icons.radar_rounded);
            return Column(
              children: list.map((d) => DiscoveryTile(draft: d)).toList(),
            );
          },
        ),
      ],
    );
  }
}
