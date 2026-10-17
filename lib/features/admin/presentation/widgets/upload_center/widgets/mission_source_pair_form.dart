import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/shared/widgets/tactical_button.dart';

/// Mission-bound source-pair finalizer.
///
/// The Founder web surface is intentionally URL-only: the backend acquires,
/// hashes, verifies and queues the official bytes. There is no browser upload
/// or human verification path in this control.
class MissionSourcePairForm extends StatefulWidget {
  final String initialMission;
  final String initialCycle;
  final String initialAuthority;
  final String initialNotificationUrl;
  final String initialSyllabusUrl;

  const MissionSourcePairForm({
    super.key,
    this.initialMission = '',
    this.initialCycle = '',
    this.initialAuthority = '',
    this.initialNotificationUrl = '',
    this.initialSyllabusUrl = '',
  });

  @override
  State<MissionSourcePairForm> createState() => _MissionSourcePairFormState();
}

class _MissionSourcePairFormState extends State<MissionSourcePairForm> {
  final mission = TextEditingController();
  final cycle = TextEditingController();
  final authority = TextEditingController();
  final notificationUrl = TextEditingController();
  final syllabusUrl = TextEditingController();
  bool busy = false;

  @override
  void initState() {
    super.initState();
    mission.text = widget.initialMission;
    cycle.text = widget.initialCycle;
    authority.text = widget.initialAuthority;
    notificationUrl.text = widget.initialNotificationUrl;
    syllabusUrl.text = widget.initialSyllabusUrl;
  }

  @override
  void dispose() {
    mission.dispose();
    cycle.dispose();
    authority.dispose();
    notificationUrl.dispose();
    syllabusUrl.dispose();
    super.dispose();
  }

  Future<void> _finalize() async {
    // Keep mission-bound web forms safe even if a Flutter rebuild temporarily
    // replaces a controller before its initial text is restored.
    final missionId = mission.text.trim().isEmpty
        ? widget.initialMission
        : mission.text.trim();
    final cycleKey =
        cycle.text.trim().isEmpty ? widget.initialCycle : cycle.text.trim();
    final authorityKey = authority.text.trim().isEmpty
        ? widget.initialAuthority
        : authority.text.trim();
    final notificationOfficialUrl = notificationUrl.text.trim().isEmpty
        ? widget.initialNotificationUrl
        : notificationUrl.text.trim();
    final syllabusOfficialUrl = syllabusUrl.text.trim().isEmpty
        ? widget.initialSyllabusUrl
        : syllabusUrl.text.trim();
    if (missionId.isEmpty ||
        cycleKey.isEmpty ||
        authorityKey.isEmpty ||
        notificationOfficialUrl.isEmpty ||
        syllabusOfficialUrl.isEmpty) {
      _message('Mission, cycle, authority and both official URLs are required.');
      return;
    }
    setState(() => busy = true);
    try {
      final response =
          await FirebaseFunctions.instanceFor(region: 'us-central1')
              .httpsCallable('handleSentinelAction')
              .call({
        'action': 'force_finalize_mission_source_pair',
        'payload': {
          'missionId': missionId,
          'cycleKey': cycleKey,
          'authorityKey': authorityKey,
          'sourceLanguage': 'english',
          'notificationSourceUrl': notificationOfficialUrl,
          'syllabusSourceUrl': syllabusOfficialUrl,
        },
      });
      _message(
          'Verified pair queued: ${response.data['pairResult']?['taskId'] ?? 'READY'}');
    } catch (error) {
      _message('Source pair was not finalized: $error');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  void _message(String value) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(value)));

  Widget _field(String label, TextEditingController controller,
      {String? hint}) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final foreground = isLight ? Colors.black87 : Colors.white;
    final muted = isLight ? Colors.black54 : Colors.white60;
    final hintColor = isLight ? Colors.black38 : Colors.white24;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        style: TextStyle(color: foreground),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          labelStyle: TextStyle(color: muted),
          hintStyle: TextStyle(color: hintColor),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => DarkCard(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('VERIFIED MISSION SOURCE PAIR',
              style: AppTypography.label
                  .copyWith(color: AppColors.gold, fontSize: 12)),
          const SizedBox(height: 8),
          Text(
              'The backend acquires both official PDFs, verifies their origin and queues decomposition automatically.',
              style: AppTypography.label
                  .copyWith(color: Colors.white60, fontSize: 10)),
          const SizedBox(height: 20),
          _field('CANONICAL MISSION ID', mission, hint: 'e.g. ssc_cgl'),
          _field('CYCLE KEY', cycle, hint: 'e.g. 2027'),
          _field('AUTHORITY KEY', authority, hint: 'e.g. nta'),
          _field('NOTIFICATION OFFICIAL HTTPS URL', notificationUrl),
          _field('SYLLABUS OFFICIAL HTTPS URL', syllabusUrl),
          Text('No upload or manual verification is required. The server fetches and independently verifies both official PDFs.',
              style: AppTypography.label.copyWith(color: Colors.white54, fontSize: 10)),
          TacticalButton(
              title: busy ? 'VERIFYING AND QUEUING…' : 'FINALIZE SOURCE PAIR',
              onTap: busy ? null : _finalize,
              color: AppColors.gold),
        ]),
      );
}
