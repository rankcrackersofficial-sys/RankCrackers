import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import 'package:rank_crackers/core/backend/sentinel_repository.dart';
import '../shared/center_header.dart';
import 'worker_governance_center.dart';
import 'widgets/budget_consumption_card.dart';
import 'widgets/intelligence_feed_tile.dart';

/// INTELLIGENCE COMMAND CENTER
/// Strategic orchestration of the autonomous scouting battalion.
class IntelligenceCommandCenter extends StatelessWidget {
  const IntelligenceCommandCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(
          title: "INTELLIGENCE COMMAND",
          subtitle: "Physical orchestration of the autonomous scouting battalion.",
        ),
        const SizedBox(height: 24),
        
        // Section 1: Budget Consumption
        const BudgetConsumptionCard(),
        
        const SizedBox(height: 40),
        
        // Section 2: Worker Control Center & Telemetry
        const WorkerGovernanceCenter(),

        const SizedBox(height: 40),
        
        // Section 3: Intelligence Feed
        Text("INTELLIGENCE FEED", style: AppTypography.cardTitle.copyWith(fontSize: 12)),
        const SizedBox(height: 16),
        StreamBuilder<List<SentinelDraft>>(
          stream: SentinelRepository.streamPending(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: Text("FEED CLEAR", style: TextStyle(color: Colors.white10))),
              );
            }
            return Column(
              children: list.map((d) => IntelligenceFeedTile(draft: d)).toList(),
            );
          },
        ),
      ],
    );
  }
}
