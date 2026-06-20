import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import 'package:rank_crackers/features/admin/data/repositories/sentinel_admin_repository.dart';
import '../../review_queue/verification_workspace.dart';

class IntelligenceFeedTile extends StatelessWidget {
  final SentinelDraft draft;
  const IntelligenceFeedTile({super.key, required this.draft});

  @override
  Widget build(BuildContext context) {
    final impactLevel = draft.audit.impactLevel;
    final Color impactColor = _getImpactColor(impactLevel);
    final isLive = draft.rawData['isLive'] ?? true;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.auto_awesome_rounded, color: impactColor, size: 16),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(draft.rawData['recruitment_name'] ?? draft.rawData['title'] ?? 'Discovery Found', 
                        style: AppTypography.body.copyWith(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text("SOURCE: ${draft.audit.provider.toUpperCase()} • CONFIDENCE: ${(draft.audit.confidenceScore * 100).toInt()}%", 
                        style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                    ],
                  ),
                ),
                _statusBadge(isLive ? "LIVE" : "HISTORICAL", isLive ? Colors.greenAccent : Colors.white24),
                const SizedBox(width: 8),
                _impactPill(impactLevel, impactColor),
              ],
            ),
            
            if (draft.rawData['summary'] != null || draft.rawData['organization'] != null || draft.rawData['org'] != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (draft.rawData['organization'] != null || draft.rawData['org'] != null)
                      _previewRow("REALM", draft.rawData['organization'] ?? draft.rawData['org']),
                    if (draft.rawData['vacancy_matrix']?['total_vacancies'] != null || draft.rawData['vacancies'] != null)
                      _previewRow("VACANCIES", (draft.rawData['vacancy_matrix']?['total_vacancies'] ?? draft.rawData['vacancies']).toString()),
                    if (draft.rawData['lastDate'] != null)
                      _previewRow("DEADLINE", draft.rawData['lastDate']),
                    if (draft.rawData['summary'] != null)
                      Text(draft.rawData['summary'], 
                        style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white38),
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: _actionButton(
                    title: "OPEN REVIEW WORKSPACE", 
                    color: AppColors.gold,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => VerificationWorkspace(draft: draft),
                        ),
                      );
                    }
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _actionButton(
                    title: "DOWNLOAD SOURCE", 
                    color: Colors.white10,
                    onTap: () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("DOWNLOAD STARTED...")),
                      );
                      
                      await SentinelAdminRepository.logActivity(
                        type: 'SENTINEL_DOWNLOAD',
                        message: 'Founder triggered source download: ${draft.rawData['title'] ?? draft.id}',
                        metadata: {'draftId': draft.id, 'url': draft.audit.sourceUrl},
                      );
                    }
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _actionButton(
                    title: "REJECT DISCOVERY", 
                    color: Colors.redAccent.withValues(alpha: 0.1),
                    textColor: Colors.redAccent,
                    onTap: () async {
                      await SentinelAdminRepository.handleAction(draftId: draft.id, action: 'reject');
                    }
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getImpactColor(String level) {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return Colors.redAccent;
      case 'HIGH': return Colors.orangeAccent;
      case 'MEDIUM': return Colors.blueAccent;
      case 'LOW': return Colors.greenAccent;
      default: return Colors.white24;
    }
  }

  Widget _statusBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 7, fontWeight: FontWeight.bold)),
    );
  }

  Widget _impactPill(String level, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(level, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold)),
    );
  }

  Widget _previewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text("$label: ", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
          Text(value, style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _actionButton({
    required String title, 
    required Color color, 
    Color? textColor,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      height: 36,
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          backgroundColor: color,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: EdgeInsets.zero,
        ),
        child: Text(
          title, 
          style: AppTypography.cardTitle.copyWith(
            fontSize: 9, 
            color: textColor ?? Colors.white,
          ),
        ),
      ),
    );
  }
}
