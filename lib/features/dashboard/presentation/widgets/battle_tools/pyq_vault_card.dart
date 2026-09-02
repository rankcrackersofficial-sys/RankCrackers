import 'package:flutter/material.dart';

import '../../../../../core/utils/app_routes.dart';
import 'battle_tool_card.dart';

class PyqVaultCard extends StatelessWidget {
  const PyqVaultCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const BattleToolCard(
      title: "PYQ Vault",
      icon: Icons.menu_book_rounded,
      glowIcon: Icons.history_edu_rounded,
      glowColor: Color(0xFFD4AF37),
      route: AppRoutes.pyqVault,
      toolKey: "pyq_vault",
    );
  }
}
