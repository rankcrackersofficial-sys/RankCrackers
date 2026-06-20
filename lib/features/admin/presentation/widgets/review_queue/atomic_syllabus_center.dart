import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../shared/widgets/tactical_button.dart';
import '../../../data/admin_upload_engine.dart';
import '../shared/center_header.dart';
import '../shared/admin_input.dart';

class AtomicSyllabusCenter extends StatefulWidget {
  const AtomicSyllabusCenter({super.key});

  @override
  State<AtomicSyllabusCenter> createState() => _AtomicSyllabusCenterState();
}

class _AtomicSyllabusCenterState extends State<AtomicSyllabusCenter> {
  final examController = TextEditingController();
  final subjectController = TextEditingController();
  final chapterController = TextEditingController();
  final topicController = TextEditingController();
  bool loading = false;

  Future<void> upload() async {
    if (topicController.text.isEmpty) return;
    setState(() => loading = true);
    try {
      await AdminUploadEngine.uploadNode(
        exam: examController.text,
        subject: subjectController.text,
        chapter: chapterController.text,
        topic: topicController.text,
      );
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ATOMIC NODE UPLOADED')));
      topicController.clear();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "ATOMIC SYLLABUS REFINERY", subtitle: "Atomize and map mission knowledge."),
        const SizedBox(height: 24),
        DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("INGEST KNOWLEDGE ATOM", style: AppTypography.label.copyWith(color: AppColors.gold)),
              const SizedBox(height: 24),
              AdminInput(controller: examController, hint: "Target Mission"),
              const SizedBox(height: 14),
              AdminInput(controller: subjectController, hint: "Subject Segment"),
              const SizedBox(height: 14),
              AdminInput(controller: chapterController, hint: "Operational Chapter"),
              const SizedBox(height: 14),
              AdminInput(controller: topicController, hint: "Micro Topic Unit"),
              const SizedBox(height: 30),
              TacticalButton(title: "MAP ATOMIC NODE", onTap: upload),
            ],
          ),
        ),
      ],
    );
  }
}
