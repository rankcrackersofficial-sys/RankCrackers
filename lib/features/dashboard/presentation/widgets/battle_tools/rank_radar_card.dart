import 'package:flutter/material.dart';

import '../../../../../core/utils/app_routes.dart';
import 'battle_tool_card.dart';

class RankRadarCard extends StatelessWidget {
  const RankRadarCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const BattleToolCard(
      title: "Rank Radar",
      subtitle: "Not Ready",
      icon: Icons.leaderboard_rounded,
      glowIcon: Icons.shield_moon_rounded,
      glowColor: Colors.green,
      route: AppRoutes.progressTracker,
    );
  }
}
