import 'package:flutter/material.dart';

import '../../../../../core/utils/app_routes.dart';

import 'battle_tool_card.dart';

class TestArenaCard extends StatelessWidget {
  const TestArenaCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const BattleToolCard(
      title: "Test Arena",
      subtitle: "Not Ready",
      icon: Icons.bolt_rounded,
      glowIcon: Icons.local_fire_department_rounded,
      glowColor: Colors.orange,
      route: AppRoutes.testArena,
    );
  }
}
