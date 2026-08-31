import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import '../shared/center_header.dart';
import 'mission_creation_center.dart';
import '../../../../../web/founder/mission_control/mission_variable_authority_panel.dart';
import '../../../../../web/founder/mission_control/founder_mission_inventory.dart';

/// MISSION CONTROL CENTER (Founder-Centric v2.0)
/// Unified Command Stream for Mission Lifecycle Management.
class MissionControlCenter extends StatelessWidget {
  const MissionControlCenter({super.key, this.onMissionSelected});

  final ValueChanged<String>? onMissionSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 60),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 24, 24, 12),
            child: CenterHeader(
              title: "MISSION CONTROL",
              subtitle:
                  "Strategic management of Exam Realms and Prep Missions.",
            ),
          ),

          // SECTION 1: CREATE NEW MISSION REALM (Expandable)
          const _ExpandableSection(
            title: "CREATE NEW MISSION REALM",
            accentColor: AppColors.gold,
            initiallyExpanded: false,
            child: MissionCreationCenter(),
          ),

          const _ExpandableSection(
            title: "MISSION VARIABLES",
            accentColor: Colors.cyanAccent,
            initiallyExpanded: false,
            child: SizedBox(
              height: 640,
              child: MissionVariableAuthorityPanel(),
            ),
          ),

          // SECTION 2: READY TO CREATE MISSIONS (Unlinked Verified Assets)
          const _MissionCreationQueueSection(),

          const Padding(
            padding: EdgeInsets.fromLTRB(24, 24, 24, 6),
            child: CenterHeader(
              title: "RECONCILED MISSION INVENTORY",
              subtitle:
                  "Student-visible missions and Founder lineage across existing canonical sources.",
            ),
          ),
          FounderMissionInventory(onMissionSelected: onMissionSelected),

          // SECTION 3: ACTIVE MISSIONS (Currently Live)
          const _MissionStatusSection(
            title: "ACTIVE MISSIONS",
            status: 'ACTIVE',
            accentColor: Colors.greenAccent,
          ),

          // SECTION 3: PASSIVE MISSIONS
          const _MissionStatusSection(
            title: "PASSIVE MISSIONS",
            status: 'PASSIVE',
            accentColor: Colors.orangeAccent,
          ),

          // SECTION 4: ARCHIVED MISSIONS
          const _MissionStatusSection(
            title: "ARCHIVED MISSIONS",
            status: 'ARCHIVED',
            accentColor: Colors.white24,
          ),
        ],
      ),
    );
  }
}

class _ExpandableSection extends StatelessWidget {
  final String title;
  final Color accentColor;
  final Widget child;
  final bool initiallyExpanded;

  const _ExpandableSection({
    required this.title,
    required this.accentColor,
    required this.child,
    this.initiallyExpanded = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accentColor.withValues(alpha: 0.1)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: initiallyExpanded,
          title: Text(title,
              style: AppTypography.label.copyWith(
                  color: accentColor, letterSpacing: 1.5, fontSize: 10)),
          iconColor: accentColor,
          collapsedIconColor: accentColor.withValues(alpha: 0.5),
          children: [child],
        ),
      ),
    );
  }
}

class _MissionStatusSection extends StatelessWidget {
  final String title;
  final String status;
  final Color accentColor;

  const _MissionStatusSection({
    required this.title,
    required this.status,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
          child: Text(title,
              style: AppTypography.label
                  .copyWith(color: accentColor, fontSize: 9)),
        ),
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('mission_realms')
              .where('status', isEqualTo: status)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: LinearProgressIndicator(
                    color: AppColors.gold, minHeight: 1),
              );
            }
            final docs = snapshot.data?.docs ?? [];
            if (docs.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text("NO MISSIONS IN $status STATE",
                    style: AppTypography.label
                        .copyWith(color: Colors.white10, fontSize: 7)),
              );
            }
            return Column(
              children: docs.map((doc) {
                final data = doc.data() as Map<String, dynamic>;
                return Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
                  child: _MissionRealmTile(
                      data: data, id: doc.id, accentColor: accentColor),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class _MissionCreationQueueSection extends StatelessWidget {
  const _MissionCreationQueueSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
          child: Text("READY TO CREATE MISSIONS (UNLINKED VERIFIED ASSETS)",
              style: AppTypography.label
                  .copyWith(color: Colors.cyanAccent, fontSize: 9)),
        ),
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('recruitments')
              .where('status', isEqualTo: 'review') // Alignment Fix
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: LinearProgressIndicator(
                    color: AppColors.gold, minHeight: 1),
              );
            }
            final docs = snapshot.data?.docs ?? [];
            if (docs.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text("NO UNLINKED ASSETS PENDING MISSION CREATION",
                    style: AppTypography.label
                        .copyWith(color: Colors.white10, fontSize: 7)),
              );
            }
            return Column(
              children: docs.map((doc) {
                final data = doc.data() as Map<String, dynamic>;
                return Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
                  child: _MissionCandidateTile(data: data, id: doc.id),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}

class _MissionCandidateTile extends StatefulWidget {
  final Map<String, dynamic> data;
  final String id;
  const _MissionCandidateTile({required this.data, required this.id});

  @override
  State<_MissionCandidateTile> createState() => _MissionCandidateTileState();
}

class _MissionCandidateTileState extends State<_MissionCandidateTile> {
  bool _isProcessing = false;

  Future<void> _performAction(String action) async {
    setState(() => _isProcessing = true);
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction');
      await callable.call({
        'action': action,
        'recruitmentId': widget.id,
      });
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text("Action Failed: $e")));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.data['title'] ?? 'Unknown Candidate',
              style: AppTypography.cardTitle.copyWith(
                  fontSize: 13,
                  color: Colors.cyanAccent.withValues(alpha: 0.8))),
          const SizedBox(height: 8),
          Text("ORG: ${widget.data['org']} | YEAR: ${widget.data['year']}",
              style: AppTypography.label
                  .copyWith(fontSize: 7, color: Colors.white12)),
          const SizedBox(height: 16),
          if (_isProcessing)
            const LinearProgressIndicator(color: AppColors.gold, minHeight: 1)
          else
            Row(
              children: [
                _actionButton(
                    "MANIFEST REALM",
                    Icons.auto_awesome_motion_rounded,
                    Colors.cyanAccent,
                    () => _performAction('manifest_realm')),
                const SizedBox(width: 8),
                _actionButton("REJECT", Icons.close_rounded, Colors.redAccent,
                    () => _performAction('reject_candidate')),
              ],
            ),
        ],
      ),
    );
  }

  Widget _actionButton(
      String label, IconData icon, Color color, VoidCallback onTap) {
    return TextButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 12, color: color.withValues(alpha: 0.8)),
      label: Text(label,
          style: TextStyle(
              color: color.withValues(alpha: 0.8),
              fontSize: 8,
              fontWeight: FontWeight.bold)),
      style: TextButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.05),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}

class _MissionRealmTile extends StatefulWidget {
  final Map<String, dynamic> data;
  final String id;
  final Color accentColor;
  const _MissionRealmTile(
      {required this.data, required this.id, required this.accentColor});

  @override
  State<_MissionRealmTile> createState() => _MissionRealmTileState();
}

class _MissionRealmTileState extends State<_MissionRealmTile> {
  bool _isProcessing = false;

  Future<void> _performGovernedAction(
    String action,
    String label, {
    bool destructive = false,
  }) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('$label MISSION'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.data['recruitment_name'] ?? widget.id),
            const SizedBox(height: 4),
            SelectableText(widget.id, style: const TextStyle(fontSize: 11)),
            const SizedBox(height: 12),
            if (destructive)
              const Text(
                'Permanent delete cannot be undone and will proceed only after dependency preflight.',
                style: TextStyle(color: Colors.redAccent),
              ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Founder reason (minimum 12 characters)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('CANCEL')),
          FilledButton(
            style: destructive
                ? FilledButton.styleFrom(backgroundColor: Colors.redAccent)
                : null,
            onPressed: () {
              if (reasonController.text.trim().length < 12) return;
              Navigator.pop(dialogContext, true);
            },
            child: Text(
                destructive ? 'RUN PREFLIGHT AND DELETE' : 'CONFIRM $label'),
          ),
        ],
      ),
    );
    final reason = reasonController.text.trim();
    reasonController.dispose();
    if (confirmed != true) return;
    setState(() => _isProcessing = true);
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction');
      await callable.call({
        'action': action,
        'recruitmentId': widget.id,
        'payload': {
          'reason': reason,
          'requestId': 'web-life-${DateTime.now().microsecondsSinceEpoch}',
        },
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$label completed for ${widget.id}.')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('$label blocked: $e')));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.data['status'] ?? 'UNKNOWN';

    return DarkCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                    widget.data['recruitment_name'] ?? 'Unknown Mission',
                    style: AppTypography.cardTitle
                        .copyWith(fontSize: 13, color: Colors.white70)),
              ),
              _statusBadge(status, widget.accentColor),
            ],
          ),
          const SizedBox(height: 8),
          Text(
              "ORG: ${widget.data['organization']} | YEAR: ${widget.data['exam_year']}",
              style: AppTypography.label
                  .copyWith(fontSize: 7, color: Colors.white12)),
          const SizedBox(height: 16),
          if (_isProcessing)
            const Center(
                child: LinearProgressIndicator(
                    color: AppColors.gold, minHeight: 1))
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                // Context-Aware Actions based on Status Transition Law
                if (status != 'ACTIVE')
                  _actionButton(
                      "ACTIVATE",
                      Icons.rocket_launch_rounded,
                      Colors.greenAccent,
                      () => _performGovernedAction('launch_realm', 'ACTIVATE')),

                if (status == 'ACTIVE')
                  _actionButton(
                      "MAKE PASSIVE",
                      Icons.pause_circle_outline_rounded,
                      Colors.orangeAccent,
                      () =>
                          _performGovernedAction('pause_realm', 'DEACTIVATE')),

                if (status == 'ACTIVE')
                  _actionButton("POST UPDATE", Icons.notification_add_rounded,
                      AppColors.gold, _showUpdateDialog),

                _actionButton(
                    "EDIT", Icons.edit_note_rounded, Colors.white10, () {}),

                if (status != 'ARCHIVED')
                  _actionButton(
                      "ARCHIVE",
                      Icons.archive_outlined,
                      Colors.redAccent,
                      () => _performGovernedAction('archive_realm', 'ARCHIVE')),

                _actionButton(
                  "DELETE",
                  Icons.delete_forever_outlined,
                  Colors.red,
                  () => _performGovernedAction(
                    'delete_realm_permanently',
                    'PERMANENT DELETE',
                    destructive: true,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Future<void> _showUpdateDialog() async {
    String selectedType = 'EXAM_DATE';
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    final linkController = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppColors.background,
          title: Text("POST MISSION UPDATE",
              style: AppTypography.label.copyWith(color: AppColors.gold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: selectedType,
                  dropdownColor: AppColors.surface,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: const InputDecoration(
                      labelText: "Update Type",
                      labelStyle: TextStyle(color: Colors.white38)),
                  items: [
                    'EXAM_DATE',
                    'ADMIT_CARD',
                    'ANSWER_KEY',
                    'RESULT',
                    'NOTICE',
                    'CORRIGENDUM'
                  ]
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (val) => setModalState(() => selectedType = val!),
                ),
                TextField(
                    controller: titleController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(labelText: "Title")),
                TextField(
                    controller: contentController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(labelText: "Content"),
                    maxLines: 3),
                TextField(
                    controller: linkController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(
                        labelText: "External Link (Optional)")),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("CANCEL")),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                setState(() => _isProcessing = true);
                try {
                  final callable =
                      FirebaseFunctions.instanceFor(region: 'us-central1')
                          .httpsCallable('handleSentinelAction');
                  await callable.call({
                    'action': 'post_mission_update',
                    'recruitmentId': widget.id,
                    'payload': {
                      'updateType': selectedType,
                      'title': titleController.text,
                      'content': contentController.text,
                      'link': linkController.text,
                    }
                  });
                } catch (e) {
                  ScaffoldMessenger.of(context)
                      .showSnackBar(SnackBar(content: Text("Post Failed: $e")));
                } finally {
                  if (mounted) setState(() => _isProcessing = false);
                }
              },
              child: const Text("POST UPDATE"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String status, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(status,
          style: TextStyle(
              color: color, fontSize: 7, fontWeight: FontWeight.bold)),
    );
  }

  Widget _actionButton(
      String label, IconData icon, Color color, VoidCallback onTap) {
    return TextButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 12, color: color.withValues(alpha: 0.8)),
      label: Text(label,
          style: TextStyle(
              color: color.withValues(alpha: 0.8),
              fontSize: 8,
              fontWeight: FontWeight.bold)),
      style: TextButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.05),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
