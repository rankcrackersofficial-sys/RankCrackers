import 'package:flutter/material.dart';
import '../shared/center_header.dart';
import 'widgets/mission_source_pair_form.dart';

class SyllabusUploadCenter extends StatelessWidget {
  const SyllabusUploadCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "SYLLABUS COMMAND",
          subtitle: "Syllabus extraction starts only from the verified mission source pair.",
        ),
        SizedBox(height: 24),
        MissionSourcePairForm(),
      ],
    );
  }
}
