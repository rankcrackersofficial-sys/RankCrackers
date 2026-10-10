import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../../../shared/widgets/tactical_button.dart';
import '../../../../data/repositories/sentinel_admin_repository.dart';
import '../../../../../../core/models/sentinel_draft.dart';
import '../../shared/status_pill.dart';

class DiscoveryTile extends StatelessWidget {
  final SentinelDraft draft;
  const DiscoveryTile({super.key, required this.draft});

  @override
  Widget build(BuildContext context) {
    final impactLevel = draft.audit.impactLevel;
    final Color impactColor = impactLevel == 'CRITICAL' ? Colors.redAccent : (impactLevel == 'HIGH' ? Colors.orangeAccent : Colors.blueAccent);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.radar_rounded, color: impactColor, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(draft.rawData['title'] ?? 'Unknown discovery', 
                        style: AppTypography.cardTitle.copyWith(fontSize: 14)),
                      Text("TYPE: ${draft.type.toUpperCase()} • IMPACT: $impactLevel", 
                        style: AppTypography.label.copyWith(fontSize: 8, color: impactColor.withValues(alpha: 0.7))),
                    ],
                  ),
                ),
                StatusPill(status: draft.status, color: Colors.blue),
              ],
            ),
            
            const SizedBox(height: 16),
            
            if (draft.rawData['org'] != null)
              _metadataRow("ORGANIZATION", draft.rawData['org']),
            if (draft.rawData['lastDate'] != null)
              _metadataRow("DEADLINE", draft.rawData['lastDate']),
            
            const SizedBox(height: 20),
            
            Row(
              children: [
                Expanded(
                  child: TacticalButton(
                    title: "PUBLISH MISSION", 
                    onTap: () async {
                      await SentinelAdminRepository.handleAction(draftId: draft.id, action: 'publish');
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('MISSION PUBLISHED: Intelligence delivered to feed.')));
                      }
                    }
                  ),
                ),
                const SizedBox(width: 8),
                _actionIcon(Icons.edit_note_rounded, Colors.white30, () => _showReclassifyDialog(context)),
                const SizedBox(width: 8),
                _actionIcon(Icons.delete_sweep_rounded, Colors.redAccent.withValues(alpha: 0.5), () async {
                   await SentinelAdminRepository.handleAction(draftId: draft.id, action: 'reject');
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _metadataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text("$label: ", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
          Text(value, style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _actionIcon(IconData icon, Color color, VoidCallback onTap) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: IconButton(
        onPressed: onTap,
        icon: Icon(icon, color: color, size: 18),
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  void _showReclassifyDialog(BuildContext context) {
    final List<String> types = ['recruitment', 'syllabus', 'digibook', 'mcq', 'news_alert'];
    String selected = draft.type;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0C121D),
        title: Text("RECLASSIFY DISCOVERY", style: AppTypography.cardTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: types.map((t) => RadioListTile<String>(
            title: Text(t.toUpperCase(), style: const TextStyle(color: Colors.white70, fontSize: 12)),
            value: t,
            groupValue: selected,
            onChanged: (v) => selected = v!,
          )).toList(),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("CANCEL")),
          TextButton(
            onPressed: () async {
              await SentinelAdminRepository.handleAction(
                draftId: draft.id, 
                action: 'reclassify', 
                payload: {'newType': selected}
              );
              if (context.mounted) Navigator.pop(context);
            }, 
            child: const Text("UPDATE", style: TextStyle(color: Colors.blueAccent))
          ),
        ],
      ),
    );
  }
}
