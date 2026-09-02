import 'package:flutter/material.dart';

import '../../../../../core/utils/app_routes.dart';
import 'battle_tool_card.dart';

class RevisionDeskCard extends StatelessWidget {
  const RevisionDeskCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const BattleToolCard(
      title: "Revision Desk",
      icon: Icons.refresh_rounded,
      glowIcon: Icons.auto_fix_high_rounded,
      glowColor: Colors.blue,
      route: AppRoutes.revisionDesk,
      toolKey: "revision_desk",
    );
  }
}
