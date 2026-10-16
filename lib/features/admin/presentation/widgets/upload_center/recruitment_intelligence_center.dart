import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import 'package:rank_crackers/core/backend/sentinel_repository.dart';
import 'package:rank_crackers/shared/widgets/tactical_button.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import '../shared/center_header.dart';
import '../intelligence/widgets/intelligence_feed_tile.dart';

/// RECRUITMENT INTELLIGENCE CENTER (Hardened v4.1)
/// Strategic monitoring chamber for the Founder.
class RecruitmentIntelligenceCenter extends StatefulWidget {
  const RecruitmentIntelligenceCenter({super.key});

  @override
  State<RecruitmentIntelligenceCenter> createState() =>
      _RecruitmentIntelligenceCenterState();
}

class _RecruitmentIntelligenceCenterState
    extends State<RecruitmentIntelligenceCenter> {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Expanded(
              child: CenterHeader(
                title: "INTELLIGENCE ROOM",
                subtitle:
                    "Strategic monitoring of mission signals and AI discoveries.",
              ),
            ),
            SizedBox(
              width: 180,
              child: TacticalButton(
                title: "MANUAL CREATE",
                onTap: () => _showManualCreationDialog(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),

        // Section: RECRUITMENT CANDIDATES (AI-verified and ready for manifestation)
        _candidatesSection(),
        const SizedBox(height: 40),

        _categorySection(
          "HIGH PRIORITY SIGNALS",
          'CRITICAL',
          color: Colors.redAccent,
          icon: Icons.priority_high_rounded,
        ),
        const SizedBox(height: 40),

        _categorySection(
          "PENDING VERIFICATION",
          'HIGH',
          color: AppColors.gold,
          icon: Icons.fact_check_rounded,
        ),
        const SizedBox(height: 40),

        _categorySection(
          "SCOUT SIGNALS",
          'MEDIUM',
          color: Colors.blueAccent,
          icon: Icons.radar_rounded,
        ),

        const SizedBox(height: 80),
      ],
    );
  }

  void _showManualCreationDialog(BuildContext context) {
    final titleController = TextEditingController();
    final orgController = TextEditingController();
    final yearController = TextEditingController(
      text: DateTime.now().year.toString(),
    );
    final reasonController = TextEditingController();
    bool isProcessing = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: Text("MANUAL RECRUITMENT", style: AppTypography.heading),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "Section 10 Rule: Only allowed for new commissions or unavailable documents.",
                  style: AppTypography.label.copyWith(
                    fontSize: 7,
                    color: Colors.white24,
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: "RECRUITMENT TITLE",
                  ),
                ),
                TextField(
                  controller: orgController,
                  decoration: const InputDecoration(
                    labelText: "ORGANIZATION / BOARD",
                  ),
                ),
                TextField(
                  controller: yearController,
                  decoration: const InputDecoration(labelText: "EXAM YEAR"),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(
                    labelText: "REASON FOR MANUAL CREATION",
                  ),
                ),

                if (isProcessing) ...[
                  const SizedBox(height: 20),
                  const CircularProgressIndicator(color: AppColors.gold),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("CANCEL"),
            ),
            TextButton(
              onPressed: isProcessing
                  ? null
                  : () async {
                      final String title = titleController.text.trim();
                      final String org = orgController.text.trim();
                      final int? year = int.tryParse(yearController.text);

                      if (title.isEmpty || org.isEmpty || year == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text("ALL FIELDS REQUIRED / INVALID YEAR"),
                          ),
                        );
                        return;
                      }

                      setModalState(() => isProcessing = true);
                      try {
                        final callable = FirebaseFunctions.instanceFor(
                          region: 'us-central1',
                        ).httpsCallable('handleSentinelAction');
                        await callable.call({
                          'action': 'create_recruitment_candidate',
                          'payload': {
                            'title': title,
                            'organization': org,
                            'year': year,
                            'reason': reasonController.text.trim(),
                          },
                        });
                        if (mounted) Navigator.pop(context);
                      } catch (e) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text("Error: $e")));
                      } finally {
                        if (mounted) setModalState(() => isProcessing = false);
                      }
                    },
              child: const Text(
                "MANIFEST CANDIDATE",
                style: TextStyle(color: AppColors.gold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _candidatesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.rocket_launch_rounded,
              color: Colors.greenAccent,
              size: 16,
            ),
            const SizedBox(width: 8),
            Text(
              "MISSION CANDIDATES",
              style: AppTypography.cardTitle.copyWith(
                fontSize: 12,
                color: Colors.greenAccent,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('sentinel_drafts')
              .where('status', whereIn: ['verified', 'auto_passed'])
              .snapshots(),
          builder: (context, snapshot) {
            final docs = snapshot.data?.docs ?? [];
            if (docs.isEmpty) return const SizedBox.shrink();

            return Column(
              children: docs.map((doc) {
                final data = doc.data() as Map<String, dynamic>;
                return _CandidateTile(id: doc.id, data: data);
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _categorySection(
    String title,
    String impactLevel, {
    required Color color,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 8),
            Text(
              title,
              style: AppTypography.cardTitle.copyWith(
                fontSize: 12,
                color: color,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        StreamBuilder<List<SentinelDraft>>(
          stream: SentinelRepository.streamPending(),
          builder: (context, snapshot) {
            final list = (snapshot.data ?? [])
                .where((d) => d.audit.impactLevel.toUpperCase() == impactLevel)
                .toList();

            if (list.isEmpty) {
              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.02),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
                child: const Center(
                  child: Text(
                    "NO NEW SIGNALS",
                    style: TextStyle(
                      color: Colors.white10,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              );
            }
            return Column(
              children: list
                  .map((d) => IntelligenceFeedTile(draft: d))
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _CandidateTile extends StatefulWidget {
  final String id;
  final Map<String, dynamic> data;
  const _CandidateTile({required this.id, required this.data});

  @override
  State<_CandidateTile> createState() => _CandidateTileState();
}

class _CandidateTileState extends State<_CandidateTile> {
  bool _isManifesting = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.data['title'] ?? 'Unknown',
                    style: AppTypography.cardTitle.copyWith(fontSize: 13),
                  ),
                  Text(
                    "${widget.data['org']} | ${widget.data['year']}",
                    style: AppTypography.label.copyWith(
                      fontSize: 8,
                      color: Colors.white24,
                    ),
                  ),
                ],
              ),
            ),
            if (_isManifesting)
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.gold,
                ),
              )
            else
              TextButton(
                onPressed: () async {
                  setState(() => _isManifesting = true);
                  try {
                    final callable = FirebaseFunctions.instanceFor(
                      region: 'us-central1',
                    ).httpsCallable('handleSentinelAction');
                    await callable.call({
                      'action': 'manifest_realm',
                      'recruitmentId': widget.id,
                    });
                  } catch (e) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text("Error: $e")));
                  } finally {
                    if (mounted) setState(() => _isManifesting = false);
                  }
                },
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.gold.withValues(alpha: 0.1),
                ),
                child: const Text(
                  "MANIFEST REALM",
                  style: TextStyle(
                    color: AppColors.gold,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
