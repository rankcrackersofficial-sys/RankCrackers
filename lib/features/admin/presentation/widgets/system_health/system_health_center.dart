import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import 'system_vitals.dart';
import 'ai_worker_center.dart';
import 'dead_letter_queue.dart';
import 'audit_center.dart';

class SystemHealthCenter extends StatelessWidget {
  const SystemHealthCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4, 
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            dividerColor: Colors.transparent,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white30,
            labelStyle: AppTypography.label.copyWith(fontSize: 10, fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: "VITALS"),
              Tab(text: "AI WORKERS"),
              Tab(text: "DLQ / ERRORS"),
              Tab(text: "AUDIT LOGS"),
            ],
          ),
          const Expanded(
            child: TabBarView(
              children: [
                SystemVitals(),
                AiWorkerCenter(),
                DeadLetterQueue(),
                AuditCenter(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
