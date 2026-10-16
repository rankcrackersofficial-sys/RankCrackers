import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../theme/founder_light_theme.dart';

/// Read-only Founder view of the server-side authority watch.
///
/// This screen deliberately reports registry evidence only. It never presents
/// a healthy/online state when the worker has not written a heartbeat.
class MissionWatchWeb extends StatelessWidget {
  const MissionWatchWeb({super.key});

  static const _slots = <String>['00:00 IST', '06:00 IST', '12:00 IST', '18:00 IST'];

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('worker_registry')
          .doc('authority_watch')
          .snapshots(),
      builder: (context, snapshot) {
        final data = snapshot.data?.data();
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Header(data: data, hasError: snapshot.hasError),
              const SizedBox(height: 20),
              _EvidenceBanner(data: data, hasError: snapshot.hasError),
              const SizedBox(height: 20),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _ScheduleCard(data: data)),
                  const SizedBox(width: 16),
                  Expanded(child: _RunEvidenceCard(data: data)),
                ],
              ),
              const SizedBox(height: 20),
              _SlotGrid(data: data),
            ],
          ),
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  final Map<String, dynamic>? data;
  final bool hasError;

  const _Header({required this.data, required this.hasError});

  @override
  Widget build(BuildContext context) {
    final status = hasError
        ? 'READ ERROR'
        : data == null
            ? 'NO RUN EVIDENCE'
            : _statusFor(data!);
    final color = status == 'ONLINE'
        ? FounderLightTheme.success
        : status == 'DEGRADED'
            ? FounderLightTheme.warning
            : FounderLightTheme.textMuted;
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('MISSION WATCH', style: _overline),
              const SizedBox(height: 6),
              Text('Authority watch & mission change control',
                  style: _title),
              const SizedBox(height: 6),
              Text('Four governed checks per day • Asia/Kolkata',
                  style: _bodyMuted),
            ],
          ),
        ),
        _StatusPill(label: status, color: color),
      ],
    );
  }
}

class _EvidenceBanner extends StatelessWidget {
  final Map<String, dynamic>? data;
  final bool hasError;

  const _EvidenceBanner({required this.data, required this.hasError});

  @override
  Widget build(BuildContext context) {
    final message = hasError
        ? 'Registry could not be read. No worker state is being inferred.'
        : data == null
            ? 'The worker registry has no authority_watch document yet. Run evidence is not available.'
            : 'This panel is read-only. It reflects the latest server heartbeat and scan evidence.';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: FounderLightTheme.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.visibility_outlined, size: 19, color: FounderLightTheme.gold),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: _bodyMuted)),
        ],
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  final Map<String, dynamic>? data;

  const _ScheduleCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return _Card(
      title: 'GOVERNED SCHEDULE',
      icon: Icons.schedule_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Authority watch runs at four fixed slots.',
              style: _body),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: MissionWatchWeb._slots
                .map((slot) => _SlotChip(label: slot))
                .toList(),
          ),
          const SizedBox(height: 14),
          Text('Timezone: ${(data?['timeZone'] ?? 'Asia/Kolkata').toString()}',
              style: _caption),
        ],
      ),
    );
  }
}

class _RunEvidenceCard extends StatelessWidget {
  final Map<String, dynamic>? data;

  const _RunEvidenceCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final lastSuccess = _displayTimestamp(data?['lastSuccessAt']);
    final lastRun = _displayTimestamp(data?['lastRunAt']);
    final failures = data?['failedAuthorities'];
    return _Card(
      title: 'LATEST EVIDENCE',
      icon: Icons.fact_check_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Metric(label: 'Last successful scan', value: lastSuccess),
          const SizedBox(height: 10),
          _Metric(label: 'Last worker run', value: lastRun),
          const SizedBox(height: 10),
          _Metric(
            label: 'Failed authorities',
            value: failures is List ? '${failures.length}' : '0 / not reported',
          ),
        ],
      ),
    );
  }
}

class _SlotGrid extends StatelessWidget {
  final Map<String, dynamic>? data;

  const _SlotGrid({required this.data});

  @override
  Widget build(BuildContext context) {
    return _Card(
      title: 'DAILY WATCH WINDOWS',
      icon: Icons.view_week_outlined,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final columns = constraints.maxWidth > 700 ? 4 : 2;
          return GridView.count(
            crossAxisCount: columns,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.8,
            children: MissionWatchWeb._slots
                .map((slot) => _SlotEvidence(slot: slot, data: data))
                .toList(),
          );
        },
      ),
    );
  }
}

class _SlotEvidence extends StatelessWidget {
  final String slot;
  final Map<String, dynamic>? data;

  const _SlotEvidence({required this.slot, required this.data});

  @override
  Widget build(BuildContext context) {
    final slotKey = slot.split(' ').first;
    final raw = data?['slotEvidence'];
    final evidence = raw is Map ? raw[slotKey] : null;
    final hasEvidence = evidence != null;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: hasEvidence ? FounderLightTheme.surface : FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasEvidence ? FounderLightTheme.success.withValues(alpha: .35) : FounderLightTheme.border,
        ),
      ),
      child: Row(
        children: [
          Icon(hasEvidence ? Icons.check_circle_outline : Icons.hourglass_empty,
              size: 18,
              color: hasEvidence ? FounderLightTheme.success : FounderLightTheme.textMuted),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(slot, style: _label),
                const SizedBox(height: 2),
                Text(hasEvidence ? 'EVIDENCE RECORDED' : 'WAITING FOR RUN',
                    style: _caption),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;

  const _Card({required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: FounderLightTheme.gold),
              const SizedBox(width: 8),
              Text(title, style: _overline),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;

  const _Metric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(child: Text(label, style: _bodyMuted)),
        const SizedBox(width: 10),
        Flexible(child: Text(value, style: _label, textAlign: TextAlign.right)),
      ],
    );
  }
}

class _SlotChip extends StatelessWidget {
  final String label;

  const _SlotChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(9),
        border: Border.all(color: FounderLightTheme.border),
      ),
      child: Text(label, style: _label),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: .35)),
      ),
      child: Text(label, style: _label.copyWith(color: color)),
    );
  }
}

const _overline = TextStyle(
  fontSize: 11,
  fontWeight: FontWeight.w800,
  letterSpacing: 1.1,
  color: FounderLightTheme.textMuted,
);
const _title = TextStyle(
  fontSize: 22,
  fontWeight: FontWeight.w800,
  color: FounderLightTheme.textPrimary,
);
const _body = TextStyle(fontSize: 14, color: FounderLightTheme.textSecondary);
const _bodyMuted = TextStyle(fontSize: 13, color: FounderLightTheme.textMuted);
const _caption = TextStyle(fontSize: 11, color: FounderLightTheme.textMuted);
const _label = TextStyle(
  fontSize: 12,
  fontWeight: FontWeight.w700,
  color: FounderLightTheme.textSecondary,
);

String _statusFor(Map<String, dynamic> data) {
  final status = data['status']?.toString().toUpperCase();
  if (status == 'ONLINE' || status == 'HEALTHY') return 'ONLINE';
  if (status == 'DEGRADED' || status == 'ERROR' || status == 'FAILED') return 'DEGRADED';
  if (data['success'] == true) return 'ONLINE';
  return 'DEGRADED';
}

String _displayTimestamp(dynamic value) {
  if (value is Timestamp) return value.toDate().toLocal().toString();
  if (value is DateTime) return value.toLocal().toString();
  if (value == null || value.toString().trim().isEmpty) return 'Not recorded';
  return value.toString();
}
