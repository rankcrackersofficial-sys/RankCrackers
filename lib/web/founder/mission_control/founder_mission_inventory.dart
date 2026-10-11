import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'mission_inventory_summary.dart';

enum MissionPortfolioFilter { all, live, draft, passive, archived, attention }

class FounderMissionInventory extends StatefulWidget {
  const FounderMissionInventory({super.key, this.onMissionSelected});
  final ValueChanged<String>? onMissionSelected;

  @override
  State<FounderMissionInventory> createState() =>
      _FounderMissionInventoryState();
}

class _FounderMissionInventoryState extends State<FounderMissionInventory> {
  MissionPortfolioFilter _filter = MissionPortfolioFilter.all;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .snapshots(),
      builder: (context, realmsSnapshot) {
        final error = realmsSnapshot.error;
        if (error != null) {
          return _InventoryMessage(
            'Mission inventory unavailable: $error',
            Colors.redAccent,
          );
        }
        if (!realmsSnapshot.hasData) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: LinearProgressIndicator(minHeight: 1),
          );
        }
        final rows = _reconcile(realmsSnapshot.data!.docs);
        final scopeSummary = MissionInventorySummary.fromRealms(
          rows.map((row) => row.realm ?? const <String, dynamic>{}),
        );
        final visible = rows.where(_matchesFilter).toList();
        return LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 1450
                ? 3
                : constraints.maxWidth >= 1050
                ? 2
                : 1;
            final available = constraints.maxWidth - 40 - ((columns - 1) * 12);
            final cardWidth = available / columns;
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _scopeSummary(scopeSummary),
                  const SizedBox(height: 10),
                  _summary(rows),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: MissionPortfolioFilter.values
                        .map(
                          (filter) => ChoiceChip(
                            label: Text(_filterLabel(filter)),
                            selected: _filter == filter,
                            onSelected: (_) => setState(() => _filter = filter),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  if (visible.isEmpty)
                    _EmptyFilterCard(
                      label:
                          'No ${_filterLabel(_filter).toLowerCase()} missions.',
                    )
                  else
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: visible
                          .map(
                            (row) => SizedBox(
                              width: cardWidth,
                              child: _MissionPortfolioCard(
                                row: row,
                                onSelected: widget.onMissionSelected,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _summary(List<_MissionInventoryRecord> rows) {
    final metrics = <(String, int, Color)>[
      (
        'LIVE',
        rows.where((r) => r.kind == MissionPortfolioFilter.live).length,
        Colors.greenAccent,
      ),
      (
        'FOUNDER DRAFTS',
        rows.where((r) => r.kind == MissionPortfolioFilter.draft).length,
        Colors.white70,
      ),
      (
        'PASSIVE',
        rows.where((r) => r.kind == MissionPortfolioFilter.passive).length,
        Colors.orangeAccent,
      ),
      (
        'ARCHIVED',
        rows.where((r) => r.kind == MissionPortfolioFilter.archived).length,
        Colors.white38,
      ),
      (
        'NEEDS ATTENTION',
        rows.where((r) => r.needsAttention).length,
        Colors.amber,
      ),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: metrics.map((m) => _SummaryMetric(m.$1, m.$2, m.$3)).toList(),
    );
  }

  Widget _scopeSummary(MissionInventorySummary summary) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _SummaryMetric('TOTAL MISSIONS', summary.total, Colors.white),
        _SummaryMetric('CENTRAL REALMS', summary.central, Colors.cyanAccent),
        _SummaryMetric('STATE REALMS', summary.state, Colors.amber),
        _SummaryMetric('UT REALMS', summary.ut, Colors.greenAccent),
        _SummaryMetric(
          'UNCLASSIFIED',
          summary.unclassified,
          summary.unclassified == 0 ? Colors.white38 : Colors.orangeAccent,
        ),
      ],
    );
  }

  bool _matchesFilter(_MissionInventoryRecord row) =>
      _filter == MissionPortfolioFilter.all ||
      (_filter == MissionPortfolioFilter.attention
          ? row.needsAttention
          : row.kind == _filter);

  String _filterLabel(MissionPortfolioFilter value) => switch (value) {
    MissionPortfolioFilter.all => 'ALL',
    MissionPortfolioFilter.live => 'LIVE',
    MissionPortfolioFilter.draft => 'DRAFT',
    MissionPortfolioFilter.passive => 'PASSIVE',
    MissionPortfolioFilter.archived => 'ARCHIVED',
    MissionPortfolioFilter.attention => 'NEEDS ATTENTION',
  };

  List<_MissionInventoryRecord> _reconcile(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> realms,
  ) {
    final byId = <String, _MissionInventoryRecord>{};
    for (final doc in realms) {
      byId.putIfAbsent(doc.id, () => _MissionInventoryRecord(doc.id)).realm =
          doc.data();
    }
    final rows = byId.values.toList()
      ..sort((a, b) {
        if (a.studentVisible != b.studentVisible) {
          return a.studentVisible ? -1 : 1;
        }
        return a.displayName.toLowerCase().compareTo(
          b.displayName.toLowerCase(),
        );
      });
    return rows;
  }
}

class _MissionInventoryRecord {
  _MissionInventoryRecord(this.id);
  final String id;
  Map<String, dynamic>? realm;
  Map<String, dynamic>? recruitment;
  Map<String, dynamic>? catalog;

  bool get studentVisible =>
      (realm?['cardVisible'] == true ||
          realm?['userPanelVisible'] == true ||
          (realm?['visibilityGate'] is Map &&
              ((realm?['visibilityGate'] as Map)['studentVisible'] == true ||
                  (realm?['visibilityGate'] as Map)['userPanelVisible'] ==
                      true))) &&
      realm?['archived'] != true;
  String get rawStatus =>
      (realm?['studentPublicationState'] ?? realm?['status'] ?? 'DRAFT')
          .toString()
          .toUpperCase();
  MissionPortfolioFilter get kind {
    if (studentVisible) return MissionPortfolioFilter.live;
    if (rawStatus == 'ARCHIVED') return MissionPortfolioFilter.archived;
    if (rawStatus == 'PASSIVE' || rawStatus == 'HIDDEN') {
      return MissionPortfolioFilter.passive;
    }
    return MissionPortfolioFilter.draft;
  }

  bool get hasCanonicalVariables =>
      realm?['missionVariables'] is Map &&
      (realm?['missionVariables'] as Map).isNotEmpty;
  bool get hasLegacyVariables =>
      realm?['variables'] is List && (realm?['variables'] as List).isNotEmpty;
  bool get sourceReady =>
      _domainMSourcePairReady ||
      realm?['canonicalSourceVersionId'] != null ||
      realm?['sourceAuthorityState'] == 'CANONICAL' ||
      realm?['officialSourceLocator'] != null;
  /// Founder projection only. The backend mission realm remains authoritative;
  /// this prevents a verified Domain-M pair from being mislabelled by legacy
  /// parent-field compatibility checks.
  bool get _domainMSourcePairReady {
    final setup = realm?['missionSetup'];
    final setupStatus = realm?['missionSetupStatus']?.toString();
    final pairStatus = setup is Map ? setup['sourcePairStatus']?.toString() : null;
    const ready = {
      'OFFICIAL_SOURCE_PAIR_READY',
      'READY_FOR_WORKER',
      'DISPATCHED',
      'EXTRACTION_IN_PROGRESS',
      'EXTRACTION_READY',
    };
    return ready.contains(setupStatus) || ready.contains(pairStatus);
  }
  bool get sourceCandidate =>
      realm?['sourceVersionId'] != null || realm?['sourceDocumentId'] != null;
  bool get needsAttention =>
      realm == null ||
      (!sourceReady && !sourceCandidate) ||
      (!hasCanonicalVariables && !hasLegacyVariables);
  String get displayName =>
      (catalog?['displayName'] ??
              realm?['exam_name'] ??
              realm?['displayTitle'] ??
              realm?['title'] ??
              realm?['recruitment_name'] ??
              id)
          .toString();
  String get year =>
      (realm?['examYear'] ??
              realm?['year'] ??
              realm?['exam_year'] ??
              'YEAR PENDING')
          .toString();
  String get category =>
      (realm?['examCategory'] ??
              realm?['exam_category'] ??
              realm?['exam_category'] ??
              'CATEGORY PENDING')
          .toString();
  String get lifecycleLabel => switch (kind) {
    MissionPortfolioFilter.live => 'LIVE FOR STUDENTS',
    MissionPortfolioFilter.draft => 'FOUNDER DRAFT',
    MissionPortfolioFilter.passive => 'PASSIVE',
    MissionPortfolioFilter.archived => 'ARCHIVED',
    _ => rawStatus,
  };
  String get authorityLabel =>
      realm == null ? 'AUTHORITY REPAIR REQUIRED' : 'AUTHORITY CONNECTED';
  String get sourceLabel => sourceReady
      ? 'SOURCE CANONICAL'
      : sourceCandidate
      ? 'SOURCE CANDIDATE'
      : 'NO OFFICIAL SOURCE';
  String get variablesLabel => hasCanonicalVariables
      ? 'VARIABLES READY'
      : hasLegacyVariables
      ? 'VARIABLE REVIEW REQUIRED'
      : 'STRUCTURE UNKNOWN';
  String get pipelineLabel {
    final locks = realm?['contentLocks'] as Map?;
    return locks != null && locks.values.any((v) => v == true)
        ? 'PIPELINE CONNECTED'
        : 'PIPELINE NOT READY';
  }
}

class _MissionPortfolioCard extends StatelessWidget {
  const _MissionPortfolioCard({required this.row, required this.onSelected});
  final _MissionInventoryRecord row;
  final ValueChanged<String>? onSelected;

  @override
  Widget build(BuildContext context) => Card(
    margin: EdgeInsets.zero,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row.displayName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${row.year}  •  ${row.id}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Colors.white54,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                tooltip: 'Mission actions',
                icon: const Icon(Icons.more_horiz, size: 18),
                onSelected: (action) => _handleAction(context, action),
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'open',
                    child: Text('Open mission'),
                  ),
                  if (row.kind == MissionPortfolioFilter.archived)
                    const PopupMenuItem(
                      value: 'restore',
                      child: Text('Restore'),
                    ),
                  if (row.kind != MissionPortfolioFilter.archived)
                    const PopupMenuItem(
                      value: 'archive',
                      child: Text('Archive'),
                    ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text(
                      'Delete permanently',
                      style: TextStyle(color: Colors.redAccent),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _badge(
                row.lifecycleLabel,
                row.studentVisible ? Colors.greenAccent : Colors.white70,
              ),
              if (row.id.toLowerCase().contains('test'))
                _badge('TEST', Colors.orangeAccent),
              if (row.needsAttention) _badge('NEEDS ATTENTION', Colors.amber),
            ],
          ),
          const SizedBox(height: 14),
          _truth(
            'MISSION AUTHORITY',
            row.authorityLabel,
            row.realm == null ? Colors.orangeAccent : Colors.white70,
          ),
          _truth(
            'SOURCE DOCUMENT',
            row.sourceLabel,
            row.sourceReady ? Colors.greenAccent : Colors.orangeAccent,
          ),
          _truth(
            'VARIABLES / STRUCTURE',
            row.variablesLabel,
            row.hasCanonicalVariables
                ? Colors.greenAccent
                : Colors.orangeAccent,
          ),
          _truth('PIPELINE / DELIVERY', row.pipelineLabel, Colors.white70),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: () => onSelected?.call(row.id),
            icon: const Icon(Icons.arrow_forward, size: 13),
            label: const Text('OPEN MISSION'),
          ),
        ],
      ),
    ),
  );

  Future<void> _handleAction(BuildContext context, String action) async {
    if (action == 'open') {
      onSelected?.call(row.id);
      return;
    }
    if (action == 'delete') {
      await _deleteDialog(context);
      return;
    }
    final callableAction = action == 'restore'
        ? 'restore_realm'
        : 'archive_realm';
    try {
      await FirebaseFunctions.instanceFor(
        region: 'us-central1',
      ).httpsCallable('handleSentinelAction').call({
        'action': callableAction,
        'recruitmentId': row.id,
        'payload': {
          'reason': 'Founder portfolio governed $action request',
          'requestId': 'portfolio-${DateTime.now().microsecondsSinceEpoch}',
        },
      });
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$action blocked: $error')));
      }
    }
  }

  Future<void> _deleteDialog(BuildContext context) async {
    final identity = TextEditingController();
    final reason = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('PERMANENT DELETE PREFLIGHT'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Deletion is allowed only when Student history, sources, academic content, publication history and active jobs are absent.',
            ),
            const SizedBox(height: 12),
            Text('Type ${row.id} to confirm.'),
            const SizedBox(height: 8),
            TextField(
              controller: identity,
              decoration: const InputDecoration(
                labelText: 'Mission ID confirmation',
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: reason,
              minLines: 2,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Founder reason (minimum 12 characters)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('CANCEL'),
          ),
          FilledButton(
            onPressed: () {
              if (identity.text.trim() == row.id &&
                  reason.text.trim().length >= 12) {
                Navigator.pop(dialogContext, true);
              }
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('RUN PREFLIGHT AND DELETE'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) {
      identity.dispose();
      reason.dispose();
      return;
    }
    try {
      await FirebaseFunctions.instanceFor(
        region: 'us-central1',
      ).httpsCallable('handleSentinelAction').call({
        'action': 'delete_realm_permanently',
        'recruitmentId': row.id,
        'payload': {
          'reason': reason.text.trim(),
          'missionIdentityConfirmation': identity.text.trim(),
          'requestId':
              'portfolio-delete-${DateTime.now().microsecondsSinceEpoch}',
        },
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${row.id} deleted after dependency preflight.'),
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Delete blocked: $error')));
      }
    }
    identity.dispose();
    reason.dispose();
  }

  Widget _truth(String label, String value, Color color) => Padding(
    padding: const EdgeInsets.only(bottom: 7),
    child: Row(
      children: [
        SizedBox(
          width: 126,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 8,
              color: Colors.white38,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 9,
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
  Widget _badge(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .08),
      borderRadius: BorderRadius.circular(999),
      border: Border.all(color: color.withValues(alpha: .35)),
    ),
    child: Text(
      label,
      style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w700),
    ),
  );
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric(this.label, this.value, this.color);
  final String label;
  final int value;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    width: 150,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: const Color(0xFF0A1018),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: Colors.white10),
    ),
    child: Row(
      children: [
        Text(
          '$value',
          style: TextStyle(
            color: color,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 8,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class _EmptyFilterCard extends StatelessWidget {
  const _EmptyFilterCard({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Container(
    width: 320,
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: Colors.white.withValues(alpha: .02),
      border: Border.all(color: Colors.white10),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(label, style: const TextStyle(color: Colors.white54)),
  );
}

class _InventoryMessage extends StatelessWidget {
  const _InventoryMessage(this.message, this.color);
  final String message;
  final Color color;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Text(message, style: TextStyle(color: color)),
  );
}
