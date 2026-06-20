import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../data/repositories/sentinel_admin_repository.dart';
import 'package:intl/intl.dart';

class ActivityTimeline extends StatelessWidget {
  const ActivityTimeline({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("FOUNDER ACTIVITY TIMELINE", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<Map<String, dynamic>>>(
          stream: SentinelAdminRepository.streamActivityTimeline(),
          builder: (context, snapshot) {
            final logs = snapshot.data ?? [];
            if (logs.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(child: Text("NO RECENT ACTIVITY", style: TextStyle(color: Colors.white10))),
              );
            }

            return Column(
              children: logs.map((log) => _activityTile(log)).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _activityTile(Map<String, dynamic> log) {
    final DateTime? ts = log['timestamp'] != null ? (log['timestamp'] as dynamic).toDate() : null;
    final String timeStr = ts != null ? DateFormat('HH:mm').format(ts) : "--:--";
    
    Color accentColor = AppColors.gold;
    if (log['impactLevel'] == 'CRITICAL' || log['severity'] == 'HIGH') {
      accentColor = Colors.redAccent;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Text(timeStr, style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
                const SizedBox(height: 8),
                Container(width: 2, height: 20, color: Colors.white10),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(log['message'] ?? "", style: AppTypography.body.copyWith(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(log['type']?.toString().replaceAll('_', ' ') ?? "", 
                    style: AppTypography.label.copyWith(fontSize: 8, color: accentColor.withValues(alpha: 0.5))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
