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
  const MissionSourcePairForm({super.key});

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
  void dispose() {
    mission.dispose(); cycle.dispose(); authority.dispose();
    notificationUrl.dispose(); syllabusUrl.dispose();
    super.dispose();
  }

  Future<void> _pick(bool notification) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom, allowedExtensions: const ['pdf'], withData: true,
    );
    final file = result?.files.single;
    if (file?.bytes == null) return;
    setState(() {
      if (notification) {
        notificationBytes = file!.bytes; notificationName = file.name;
      } else {
        syllabusBytes = file!.bytes; syllabusName = file.name;
      }
    });
  }

  Future<void> _finalize() async {
    if (mission.text.trim().isEmpty || cycle.text.trim().isEmpty ||
        authority.text.trim().isEmpty || notificationUrl.text.trim().isEmpty ||
        syllabusUrl.text.trim().isEmpty || notificationBytes == null || syllabusBytes == null) {
      _message('Mission, cycle, authority, both official URLs and both PDFs are required.');
      return;
    }
    setState(() => busy = true);
    try {
      final stamp = DateTime.now().microsecondsSinceEpoch;
      final notificationPath = 'ingestion_refinery/mission_source_staging/${stamp}_notification.pdf';
      final syllabusPath = 'ingestion_refinery/mission_source_staging/${stamp}_syllabus.pdf';
      await AdminStorageService.upload(bytes: notificationBytes!, path: notificationPath, contentType: 'application/pdf');
      await AdminStorageService.upload(bytes: syllabusBytes!, path: syllabusPath, contentType: 'application/pdf');
      final response = await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction').call({
        'action': 'force_finalize_mission_source_pair',
        'payload': {
          'missionId': mission.text.trim(), 'cycleKey': cycle.text.trim(),
          'authorityKey': authority.text.trim(), 'sourceLanguage': 'english',
          'notificationSourceUrl': notificationUrl.text.trim(),
          'syllabusSourceUrl': syllabusUrl.text.trim(),
          'notificationStagedStoragePath': notificationPath,
          'syllabusStagedStoragePath': syllabusPath,
        },
      });
      _message('Verified pair queued: ${response.data['pairResult']?['taskId'] ?? 'READY'}');
    } catch (error) {
      _message('Source pair was not finalized: $error');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  void _message(String value) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(value)));

  Widget _field(String label, TextEditingController controller, {String? hint}) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextField(controller: controller, style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(labelText: label, hintText: hint,
        labelStyle: const TextStyle(color: Colors.white60), hintStyle: const TextStyle(color: Colors.white24)),),
  );

  @override
  Widget build(BuildContext context) => DarkCard(
    padding: const EdgeInsets.all(24),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('VERIFIED MISSION SOURCE PAIR', style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 12)),
      const SizedBox(height: 8),
      Text('Both official PDFs are required. The server verifies authority URL bytes before queueing decomposition.',
        style: AppTypography.label.copyWith(color: Colors.white60, fontSize: 10)),
      const SizedBox(height: 20),
      _field('CANONICAL MISSION ID', mission, hint: 'e.g. ssc_cgl'),
      _field('CYCLE KEY', cycle, hint: 'e.g. 2027'),
      _field('AUTHORITY KEY', authority, hint: 'e.g. nta'),
      _field('NOTIFICATION OFFICIAL HTTPS URL', notificationUrl),
      _field('SYLLABUS OFFICIAL HTTPS URL', syllabusUrl),
      Row(children: [Expanded(child: TacticalButton(title: notificationName == null ? 'SELECT NOTIFICATION PDF' : notificationName!, onTap: busy ? null : () => _pick(true))), const SizedBox(width: 12), Expanded(child: TacticalButton(title: syllabusName == null ? 'SELECT SYLLABUS PDF' : syllabusName!, onTap: busy ? null : () => _pick(false)))]),
      const SizedBox(height: 16),
      TacticalButton(title: busy ? 'VERIFYING AND QUEUING…' : 'FINALIZE SOURCE PAIR', onTap: busy ? null : _finalize, color: AppColors.gold),
    ]),
  );
}
