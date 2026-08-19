import 'package:flutter/material.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'blueprint_node.dart';

class MissionBlueprintCard extends StatelessWidget {
  final List<Map<String, dynamic>> missions;
  final bool hasEvidence;

  const MissionBlueprintCard({
    super.key,
    required this.missions,
    this.hasEvidence = true,
  });

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 🔱 PREMIUM CARD DNA: Title
          Text(
            'TODAY\'S DHARMA',
            style: AppTypography.cardTitle.copyWith(color: AppColors.gold, letterSpacing: 2.2, fontSize: 11),
          ),

          const SizedBox(height: 10),

          // 🔱 PREMIUM CARD DNA: Subtitle
          Text(
            hasEvidence
                ? 'Today\'s tactical objectives generated from your weakest and highest priority learning nodes.'
                : 'Tactical priorities will appear after enough learning evidence is available.',
            style: AppTypography.subtitle,
          ),

          const SizedBox(height: 18),

          ...missions.map(
            (mission) {
              return Padding(
                padding: const EdgeInsets.only(
                  bottom: 12,
                ),
                child: BlueprintNode(
                  subject: mission['subject'] ?? '',
                  topics: mission['topics'] ?? '',
                  completed: mission['completed'] ?? '',
                  running: mission['running'] ?? '',
                  locked: mission['locked'] ?? '',
                  onTap: mission['onTap'], // 🔱 Pass the click
                ),
              );
            },
          ),

          const SizedBox(height: 24),

          // Metric/Info Row DNA
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.account_tree_rounded,
                color: AppColors.gold,
                size: 18,
              ),

              const SizedBox(width: 10),

              Expanded(
                child: Text(
                  'Every dharma task is dynamically connected to your cognitive footprint and next battle timer.',
                  style: AppTypography.label.copyWith(fontSize: 10, color: AppColors.secondaryText, height: 1.4),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
