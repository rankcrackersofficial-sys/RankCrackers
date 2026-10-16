import 'dart:typed_data';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/features/admin/core/admin_storage_service.dart';
import 'package:rank_crackers/shared/widgets/tactical_button.dart';

/// Founder-only, mission-bound source-pair upload. Both documents are staged
/// first and finalized together by the trusted callable; neither document is
/// self-certified by the browser.
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
  Uint8List? notificationBytes;
  Uint8List? syllabusBytes;
  String? notificationName;
  String? syllabusName;
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

  Future<void> _pick(bool notification) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf'],
      withData: true,
    );
    final file = result?.files.single;
    if (file?.bytes == null) return;
    setState(() {
      if (notification) {
        notificationBytes = file!.bytes;
        notificationName = file.name;
      } else {
        syllabusBytes = file!.bytes;
        syllabusName = file.name;
      }
    });
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
        syllabusOfficialUrl.isEmpty ||
        notificationBytes == null ||
        syllabusBytes == null) {
      _message(
          'Mission, cycle, authority, both official URLs and both PDFs are required.');
      return;
    }
    setState(() => busy = true);
    try {
      final stamp = DateTime.now().microsecondsSinceEpoch;
      final notificationPath =
          'ingestion_refinery/mission_source_staging/${stamp}_notification.pdf';
      final syllabusPath =
          'ingestion_refinery/mission_source_staging/${stamp}_syllabus.pdf';
      await AdminStorageService.upload(
          bytes: notificationBytes!,
          path: notificationPath,
          contentType: 'application/pdf');
      await AdminStorageService.upload(
          bytes: syllabusBytes!,
          path: syllabusPath,
          contentType: 'application/pdf');
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
          'notificationStagedStoragePath': notificationPath,
          'syllabusStagedStoragePath': syllabusPath,
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
              'Both official PDFs are required. The server verifies authority URL bytes before queueing decomposition.',
              style: AppTypography.label
                  .copyWith(color: Colors.white60, fontSize: 10)),
          const SizedBox(height: 20),
          _field('CANONICAL MISSION ID', mission, hint: 'e.g. ssc_cgl'),
          _field('CYCLE KEY', cycle, hint: 'e.g. 2027'),
          _field('AUTHORITY KEY', authority, hint: 'e.g. nta'),
          _field('NOTIFICATION OFFICIAL HTTPS URL', notificationUrl),
          _field('SYLLABUS OFFICIAL HTTPS URL', syllabusUrl),
          Row(children: [
            Expanded(
                child: TacticalButton(
                    title: notificationName == null
                        ? 'SELECT NOTIFICATION PDF'
                        : notificationName!,
                    onTap: busy ? null : () => _pick(true))),
            const SizedBox(width: 12),
            Expanded(
                child: TacticalButton(
                    title: syllabusName == null
                        ? 'SELECT SYLLABUS PDF'
                        : syllabusName!,
                    onTap: busy ? null : () => _pick(false)))
          ]),
          const SizedBox(height: 16),
          TacticalButton(
              title: busy ? 'VERIFYING AND QUEUING…' : 'FINALIZE SOURCE PAIR',
              onTap: busy ? null : _finalize,
              color: AppColors.gold),
        ]),
      );
}
