import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import 'sentinel_discoveries.dart';
import 'notification_center.dart';

class SentinelCommand extends StatelessWidget {
  const SentinelCommand({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          TabBar(
            dividerColor: Colors.transparent,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white30,
            labelStyle: AppTypography.label.copyWith(fontSize: 10, fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: "DISCOVERIES"),
              Tab(text: "BROADCASTS"),
            ],
          ),
          const Expanded(
            child: TabBarView(
              children: [
                SentinelDiscoveries(),
                NotificationCenter(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
