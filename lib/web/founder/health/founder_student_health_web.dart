import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/web/founder/theme/founder_light_theme.dart';

class FounderStudentHealthWeb extends StatelessWidget {
  const FounderStudentHealthWeb({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: FounderLightTheme.bg,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'STUDENT HEALTH / PANEL LINKAGE',
            style: TextStyle(
              color: FounderLightTheme.textPrimary,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Founder observability for Student Panel readiness without private score or mastery edits.',
            style: TextStyle(color: FounderLightTheme.textMuted, fontSize: 14),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('telemetry_nexus')
                  .orderBy('timestamp', descending: true)
                  .limit(500)
                  .snapshots(),
              builder: (context, snapshot) {
                final docs = snapshot.data?.docs ?? const [];
                final records = _telemetryRecords(docs);

                if (snapshot.hasError) {
                  return _HealthGrid(
                    records: _fallbackRecords(
                      reason: 'BACKEND HEALTH FEED ERROR',
                    ),
                  );
                }

                if (records.isEmpty) {
                  return _HealthGrid(
                    records: _fallbackRecords(
                      reason:
                          snapshot.connectionState == ConnectionState.waiting
                              ? 'CHECKING BACKEND HEALTH FEED'
                              : 'BACKEND HEALTH FEED NOT PUBLISHED',
                    ),
                  );
                }

                return _HealthGrid(records: records);
              },
            ),
          ),
        ],
      ),
    );
  }

  static List<_HealthRecord> _telemetryRecords(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
  ) {
    final grouped = <String, List<Map<String, dynamic>>>{};
    for (final doc in docs) {
      final data = doc.data();
      if (data['eventName'] != 'student_surface_opened') continue;
      final metadata = Map<String, dynamic>.from(data['metadata'] ?? const {});
      final surface = (metadata['surface'] ?? '').toString();
      if (surface.isEmpty || surface == 'unknown') continue;
      grouped.putIfAbsent(surface, () => []).add(data);
    }

    final records = grouped.entries.map((entry) {
      final events = entry.value;
      final users = events
          .map((event) => (event['userId'] ?? '').toString())
          .where((uid) => uid.isNotEmpty)
          .toSet();
      final missions = events
          .map((event) => (event['recruitmentId'] ?? '').toString())
          .where((mission) => mission.isNotEmpty)
          .toSet();
      final latest = events.first;
      final metadata =
          Map<String, dynamic>.from(latest['metadata'] ?? const {});
      final route = (metadata['route'] ?? entry.key).toString();
      return _HealthRecord(
        id: entry.key,
        surface: _surfaceLabel(entry.key),
        status: 'HEALTHY',
        studentState: '${users.length} students / ${events.length} events',
        founderState: '${missions.length} mission linkage',
        detail: 'Latest verified activity: $route',
        canFounderMutateTruth: false,
      );
    }).toList(growable: false);
    records.sort((a, b) => a.surface.compareTo(b.surface));
    return records;
  }

  static String _surfaceLabel(String surface) {
    const labels = <String, String>{
      'dashboard': 'Dashboard / Mission Status',
      'crucible': 'Crucible',
      'digibook': 'DigiBook',
      'syllabus': 'Syllabus / Knowledge Map',
      'recruitment': 'Career Signals',
      'pyq-vault': 'PYQ Vault',
      'progress-tracker': 'Performance / Progress',
      'revision-desk': 'Revision Desk',
      'test-arena': 'Test Arena',
      'sentinel-center': 'Sentinel Intel',
      'notification-center': 'Notifications',
      'profile': 'Profile',
    };
    return labels[surface] ?? surface.replaceAll('-', ' ');
  }

  static List<_HealthRecord> _fallbackRecords({required String reason}) {
    const rows = [
      (
        'DigiBook',
        'AWAITING RUNTIME PROOF',
        'Founder controls exist. Student runtime proof is required.'
      ),
      (
        'Crucible',
        'AWAITING RUNTIME PROOF',
        'Founder controls exist. Student runtime proof is required.'
      ),
      (
        'Syllabus / Knowledge Map',
        'AWAITING RUNTIME PROOF',
        'Founder controls exist. Student runtime proof is required.'
      ),
      (
        'Career Signals',
        'NOT READY',
        'Governed opportunity matching pipeline is not published.'
      ),
      (
        'Rank Radar',
        'NOT READY',
        'Verified competition/progress projection is not published.'
      ),
      (
        'Performance / Progress',
        'NOT READY',
        'Verified progress analytics projection is not published.'
      ),
      (
        'Notifications',
        'NOT READY',
        'Student-safe notification feed requires governed backend records.'
      ),
      (
        'PYQ Vault',
        'NOT READY',
        'Founder-approved PYQ source pipeline is required.'
      ),
      (
        'Test Arena',
        'NOT READY',
        'Verified test blueprint/result pipeline is required.'
      ),
      (
        'Revision Desk',
        'NOT READY',
        'Personalized revision loop requires verified learning evidence.'
      ),
      (
        'Sentinel Intel',
        'NOT READY',
        'Founder-visible alerts require governed incidents and no private leakage.'
      ),
      (
        'Planner / Schedule',
        'NOT READY',
        'Schedule recommendations require personalization authority.'
      ),
    ];

    return rows
        .map(
          (row) => _HealthRecord(
            id: row.$1.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_'),
            surface: row.$1,
            status: row.$2,
            studentState:
                row.$2 == 'NOT READY' ? 'Safe Not Ready' : 'Safe pending proof',
            founderState: '$reason / ${row.$2}',
            detail: row.$3,
            canFounderMutateTruth: false,
          ),
        )
        .toList(growable: false);
  }
}

class _HealthGrid extends StatelessWidget {
  final List<_HealthRecord> records;

  const _HealthGrid({required this.records});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 420,
        mainAxisExtent: 230,
        crossAxisSpacing: 18,
        mainAxisSpacing: 18,
      ),
      itemCount: records.length,
      itemBuilder: (context, index) => _HealthCard(record: records[index]),
    );
  }
}

class _HealthCard extends StatelessWidget {
  final _HealthRecord record;

  const _HealthCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final healthy = record.status.toUpperCase() == 'HEALTHY';
    final color = healthy ? FounderLightTheme.success : FounderLightTheme.gold;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  record.surface.toUpperCase(),
                  style: const TextStyle(
                    color: FounderLightTheme.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Icon(
                healthy
                    ? Icons.verified_rounded
                    : Icons.pending_actions_rounded,
                color: color,
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 12),
          _pill(record.status, color),
          const SizedBox(height: 12),
          Text(
            record.detail,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: FounderLightTheme.textMuted,
              height: 1.35,
            ),
          ),
          const Spacer(),
          _miniLine('Student', record.studentState),
          const SizedBox(height: 6),
          _miniLine('Founder', record.founderState),
          const SizedBox(height: 8),
          Text(
            record.canFounderMutateTruth
                ? 'Truth mutation authority: BLOCKED'
                : 'Truth mutation authority: NO',
            style: const TextStyle(
              color: FounderLightTheme.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _miniLine(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 64,
          child: Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: FounderLightTheme.textMuted,
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: FounderLightTheme.textSecondary,
              fontSize: 11,
            ),
          ),
        ),
      ],
    );
  }
}

class _HealthRecord {
  final String id;
  final String surface;
  final String status;
  final String studentState;
  final String founderState;
  final String detail;
  final bool canFounderMutateTruth;

  const _HealthRecord({
    required this.id,
    required this.surface,
    required this.status,
    required this.studentState,
    required this.founderState,
    required this.detail,
    required this.canFounderMutateTruth,
  });

  factory _HealthRecord.fromMap(String id, Map<String, dynamic> data) {
    return _HealthRecord(
      id: id,
      surface: (data['surface'] ?? data['surfaceName'] ?? '').toString(),
      status: (data['status'] ?? 'NOT READY').toString(),
      studentState: (data['studentState'] ?? 'Safe state pending').toString(),
      founderState: (data['founderState'] ?? 'Health state pending').toString(),
      detail: (data['detail'] ?? data['message'] ?? 'No detail published.')
          .toString(),
      canFounderMutateTruth: data['canFounderMutateTruth'] == true,
    );
  }
}
