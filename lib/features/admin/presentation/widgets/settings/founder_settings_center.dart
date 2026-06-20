import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import '../intelligence/worker_governance_center.dart';
import '../people_access/people_access_center.dart';
import '../system_health/system_health_center.dart';
import '../dashboard/founder_activity_ledger.dart';
import '../intelligence/widgets/budget_consumption_card.dart';
import '../shared/founder_sovereign_scaffold.dart';

class FounderSettingsCenter extends StatelessWidget {
  const FounderSettingsCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _settingsTile(
          context,
          icon: Icons.engineering_rounded,
          title: "WORKER BATTALION",
          subtitle: "Governance & Token Budget",
          screen: const FounderSovereignScaffold(
            body: SingleChildScrollView(child: Padding(padding: EdgeInsets.all(24), child: WorkerGovernanceCenter())),
          ),
        ),
        _settingsTile(
          context,
          icon: Icons.people_alt_rounded,
          title: "PEOPLE & ACCESS",
          subtitle: "Sovereign Role Management",
          screen: const FounderSovereignScaffold(
            body: PeopleAccessCenter(),
          ),
        ),
        _settingsTile(
          context,
          icon: Icons.monitor_heart_rounded,
          title: "SYSTEM HEALTH",
          subtitle: "AI Infrastructure Telemetry",
          screen: const FounderSovereignScaffold(
            body: SystemHealthCenter(),
          ),
        ),
        _settingsTile(
          context,
          icon: Icons.receipt_long_rounded,
          title: "ACTIVITY LEDGER",
          subtitle: "Forensic Command History",
          screen: const FounderSovereignScaffold(
            body: FounderActivityLedger(),
          ),
        ),
        const SizedBox(height: 24),
        const BudgetConsumptionCard(),
      ],
    );
  }

  Widget _settingsTile(BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Widget screen,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: EdgeInsets.zero,
        child: Material(
          color: Colors.transparent,
          child: ListTile(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.gold, size: 20),
            ),
            title: Text(title, style: AppTypography.cardTitle.copyWith(fontSize: 13)),
            subtitle: Text(subtitle, style: AppTypography.label.copyWith(fontSize: 9, color: Colors.white24, letterSpacing: 0.5)),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white10, size: 14),
          ),
        ),
      ),
    );
  }
}
