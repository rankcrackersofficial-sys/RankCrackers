import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class FounderMissionInventory extends StatelessWidget {
  const FounderMissionInventory({super.key, this.onMissionSelected});

  final ValueChanged<String>? onMissionSelected;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream:
          FirebaseFirestore.instance.collection('mission_realms').snapshots(),
      builder: (context, realmsSnapshot) {
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream:
              FirebaseFirestore.instance.collection('recruitments').snapshots(),
          builder: (context, recruitmentsSnapshot) {
            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('student_mission_catalog')
                  .snapshots(),
              builder: (context, catalogSnapshot) {
                final error = realmsSnapshot.error ??
                    recruitmentsSnapshot.error ??
                    catalogSnapshot.error;
                if (error != null) {
                  return _InventoryMessage(
                      'Mission inventory unavailable: $error',
                      Colors.redAccent);
                }
                if (!realmsSnapshot.hasData ||
                    !recruitmentsSnapshot.hasData ||
                    !catalogSnapshot.hasData) {
                  return const Padding(
                    padding: EdgeInsets.all(24),
                    child: LinearProgressIndicator(minHeight: 1),
                  );
                }

                final rows = _reconcile(
                  realmsSnapshot.data!.docs,
                  recruitmentsSnapshot.data!.docs,
                  catalogSnapshot.data!.docs,
                );
                if (rows.isEmpty) {
                  return const _InventoryMessage(
                      'NO MISSION RECORDS FOUND', Colors.white38);
                }
                return Column(
                  children: rows
                      .map((row) => _FounderMissionInventoryRow(
                            row: row,
                            onSelected: onMissionSelected,
                          ))
                      .toList(),
                );
              },
            );
          },
        );
      },
    );
  }

  List<_MissionInventoryRecord> _reconcile(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> realms,
    List<QueryDocumentSnapshot<Map<String, dynamic>>> recruitments,
    List<QueryDocumentSnapshot<Map<String, dynamic>>> catalog,
  ) {
    final byId = <String, _MissionInventoryRecord>{};
    for (final doc in realms) {
      byId.putIfAbsent(doc.id, () => _MissionInventoryRecord(doc.id)).realm =
          doc.data();
    }
    for (final doc in recruitments) {
      byId
          .putIfAbsent(doc.id, () => _MissionInventoryRecord(doc.id))
          .recruitment = doc.data();
    }
    for (final doc in catalog) {
      byId.putIfAbsent(doc.id, () => _MissionInventoryRecord(doc.id)).catalog =
          doc.data();
    }
    final rows = byId.values.toList();
    rows.sort((a, b) {
      if (a.studentVisible != b.studentVisible)
        return a.studentVisible ? -1 : 1;
      return a.displayName.toLowerCase().compareTo(b.displayName.toLowerCase());
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
      catalog?['cardVisible'] == true &&
      catalog?['userPanelVisible'] == true &&
      catalog?['archived'] != true;
  bool get hasCanonicalVariables => [realm, recruitment, catalog]
      .whereType<Map<String, dynamic>>()
      .any((source) =>
          source['missionVariables'] is Map &&
          (source['missionVariables'] as Map).isNotEmpty);
  bool get hasLegacyVariables =>
      catalog?['variables'] is List &&
      (catalog?['variables'] as List).isNotEmpty;
  String get displayName => (catalog?['displayName'] ??
          catalog?['title'] ??
          catalog?['name'] ??
          realm?['exam_name'] ??
          realm?['recruitment_name'] ??
          recruitment?['title'] ??
          recruitment?['recruitment_name'] ??
          id)
      .toString();
  String get status => (catalog?['studentPublicationState'] ??
          catalog?['status'] ??
          realm?['status'] ??
          recruitment?['status'] ??
          'UNKNOWN')
      .toString();
  String get year => (catalog?['examYear'] ??
          catalog?['year'] ??
          realm?['exam_year'] ??
          recruitment?['year'] ??
          'YEAR_PENDING')
      .toString();
  String get category => (catalog?['examCategory'] ??
          catalog?['exam_category'] ??
          realm?['exam_category'] ??
          recruitment?['examCategory'] ??
          'CATEGORY_PENDING')
      .toString();
}

class _FounderMissionInventoryRow extends StatelessWidget {
  const _FounderMissionInventoryRow({
    required this.row,
    required this.onSelected,
  });
  final _MissionInventoryRecord row;
  final ValueChanged<String>? onSelected;

  @override
  Widget build(BuildContext context) {
    final realmMissing = row.realm == null;
    final flags = <Widget>[
      _badge(row.studentVisible ? 'STUDENT_VISIBLE' : 'NOT_STUDENT_VISIBLE',
          row.studentVisible ? Colors.greenAccent : Colors.orangeAccent),
      if (realmMissing) _badge('REALM_MISSING', Colors.redAccent),
      if (!row.studentVisible && row.recruitment != null)
        if (realmMissing && row.studentVisible)
          _badge('AUTHORITY_REPAIR_REQUIRED', Colors.redAccent),
      if (realmMissing) _badge('LIFECYCLE_MUTATION_BLOCKED', Colors.redAccent),
      _badge('FOUNDER_ONLY', Colors.orangeAccent),
      if ((row.recruitment?['status'] ?? '').toString().toLowerCase() ==
          'draft')
        _badge('DRAFT', Colors.white54),
      if (row.hasLegacyVariables)
        _badge('LEGACY_VARIABLES', Colors.amberAccent),
      if (!row.hasCanonicalVariables)
        _badge('CANONICAL_VARIABLES_MISSING', Colors.redAccent),
    ];
    return InkWell(
      onTap: () => onSelected?.call(row.id),
      child: Card(
        margin: const EdgeInsets.fromLTRB(24, 6, 24, 6),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(row.displayName,
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              SelectableText(row.id,
                  style: const TextStyle(fontSize: 11, color: Colors.white54)),
              const SizedBox(height: 8),
              Text('${row.year} • ${row.category} • ${row.status}',
                  style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 10),
              Wrap(spacing: 6, runSpacing: 6, children: flags),
              const SizedBox(height: 10),
              Text(
                'Sources: realm=${row.realm != null ? 'YES' : 'NO'} • recruitment=${row.recruitment != null ? 'YES' : 'NO'} • student catalog=${row.catalog != null ? 'YES' : 'NO'}',
                style: const TextStyle(fontSize: 11, color: Colors.white60),
              ),
              if (realmMissing) ...[
                const SizedBox(height: 8),
                const Text(
                  'Inspection only. Canonical realm authority is missing; mutation and permanent deletion must fail closed.',
                  style: TextStyle(fontSize: 11, color: Colors.redAccent),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 8, fontWeight: FontWeight.w700)),
    );
  }
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
