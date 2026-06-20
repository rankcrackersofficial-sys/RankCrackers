import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../data/repositories/sentinel_admin_repository.dart';
import '../shared/center_header.dart';
import 'package:intl/intl.dart';

/// 🔱 FOUNDER ACTIVITY LEDGER
/// The physical record of every sovereign command and system intelligence event.
class FounderActivityLedger extends StatelessWidget {
  const FounderActivityLedger({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(
          title: "FOUNDER ACTIVITY LEDGER",
          subtitle: "Complete forensic record of mission operations.",
        ),
        const SizedBox(height: 24),
        StreamBuilder<List<Map<String, dynamic>>>(
          stream: SentinelAdminRepository.streamActivityTimeline(),
          builder: (context, snapshot) {
            final logs = snapshot.data ?? [];
            if (logs.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: Text("LEDGER EMPTY", style: TextStyle(color: Colors.white10))),
              );
            }

            return Column(
              children: logs.map((log) => _ledgerEntry(log)).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _ledgerEntry(Map<String, dynamic> log) {
    final DateTime? ts = log['timestamp'] != null ? (log['timestamp'] as dynamic).toDate() : null;
    final String dateStr = ts != null ? DateFormat('dd MMM, HH:mm:ss').format(ts) : "--:--";
    
    Color accentColor = AppColors.gold;
    IconData icon = Icons.info_outline_rounded;

    switch (log['type']) {
      case 'ACCESS_CHANGE':
        accentColor = Colors.blueAccent;
        icon = Icons.security_rounded;
        break;
      case 'SENTINEL_DISCOVERY':
        accentColor = Colors.greenAccent;
        icon = Icons.radar_rounded;
        break;
      case 'SENTINEL_FAILURE':
        accentColor = Colors.redAccent;
        icon = Icons.error_outline_rounded;
        break;
      case 'SYSTEM_CONFIG':
        accentColor = Colors.orangeAccent;
        icon = Icons.settings_suggest_rounded;
        break;
      case 'SENTINEL_ACTION':
        accentColor = AppColors.gold;
        icon = Icons.gavel_rounded;
        break;
    }

    if (log['impactLevel'] == 'CRITICAL' || log['severity'] == 'HIGH') {
      accentColor = Colors.redAccent;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DarkCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: accentColor, size: 18),
                const SizedBox(width: 12),
                Text(log['type']?.toString().replaceAll('_', ' ') ?? "GENERAL EVENT", 
                  style: AppTypography.label.copyWith(fontSize: 10, color: accentColor)),
                const Spacer(),
                Text(dateStr, style: AppTypography.label.copyWith(fontSize: 9, color: Colors.white24)),
              ],
            ),
            const SizedBox(height: 12),
            Text(log['message'] ?? "", style: AppTypography.body.copyWith(fontSize: 13, fontWeight: FontWeight.bold)),
            if (log['metadata'] != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Text(
                  log['metadata'].toString(),
                  style: const TextStyle(color: Colors.white38, fontSize: 10, fontFamily: 'monospace'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
