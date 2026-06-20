import 'package:flutter/material.dart';
import '../../../../../core/utils/responsive_helper.dart';

import 'pyq_vault_card.dart';
import 'rank_radar_card.dart';
import 'revision_desk_card.dart';
import 'test_arena_card.dart';

class BattleToolsGrid extends StatelessWidget {
  const BattleToolsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    // 🔱 Adaptive Grid v3.0
    int crossAxisCount = ResponsiveHelper.isTablet(context) ? 4 : 2;
    double aspectRatio = ResponsiveHelper.isCompact(context) ? 1.0 : 0.92;

    return GridView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: aspectRatio,
      ),
      children: const [
        TestArenaCard(),
        PyqVaultCard(),
        RevisionDeskCard(),
        RankRadarCard(),
      ],
    );
  }
}
