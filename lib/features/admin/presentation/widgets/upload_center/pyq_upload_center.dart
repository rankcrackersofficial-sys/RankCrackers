import 'package:flutter/material.dart';
import '../shared/center_header.dart';

/// PYQ ingestion is owned by the backend official-source pipeline.
/// This page intentionally exposes no manual upload action.
class PyqUploadCenter extends StatelessWidget {
  const PyqUploadCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: const [
        CenterHeader(
          title: "PYQ COMMAND",
          subtitle: "Official PYQs are acquired and processed by the mission backend.",
        ),
        SizedBox(height: 24),
        _PyqPipelineNotice(),
      ],
    );
  }
}

class _PyqPipelineNotice extends StatelessWidget {
  const _PyqPipelineNotice();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lock_clock_outlined, color: Theme.of(context).colorScheme.secondary),
            const SizedBox(height: 16),
            Text(
              "AUTOMATED OFFICIAL INGESTION NOT YET ENABLED",
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            Text(
              "Manual PYQ course uploads are disabled. The backend must acquire papers from "
              "the competent authority after the mission syllabus is verified, bind each file "
              "to its official source and SHA-256, extract question appearances, resolve the "
              "effective official answer key, map current-syllabus scope, and hold records for "
              "review before publication.",
            ),
            const SizedBox(height: 12),
            Text(
              "No PYQ is treated as official or published until that server-side pipeline is "
              "implemented and its evidence gates pass. Restricted or unavailable official "
              "papers remain explicitly unavailable; coaching copies are not substituted.",
            ),
          ],
        ),
      ),
    );
  }
}
