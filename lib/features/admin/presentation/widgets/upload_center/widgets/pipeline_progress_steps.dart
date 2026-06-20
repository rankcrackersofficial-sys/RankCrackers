import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_typography.dart';

class PipelineProgressSteps extends StatelessWidget {
  final String status;
  const PipelineProgressSteps({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    // 🔱 Physical Workflow Law: Upload -> Classify -> Store -> Publish
    final bool uploaded = status != 'failed';
    final bool classified = status == 'classified' || status == 'under_review' || status == 'published';
    final bool stored = status == 'under_review' || status == 'published';
    final bool published = status == 'published';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _step("Uploaded", uploaded),
        _arrow(),
        _step("Classified", classified),
        _arrow(),
        _step("Review", stored),
        _arrow(),
        _step("Published", published),
      ],
    );
  }

  Widget _step(String label, bool done) {
    return Column(
      children: [
        Icon(done ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, 
          color: done ? Colors.greenAccent : Colors.white10, size: 14),
        const SizedBox(height: 4),
        Text(label.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 7, color: done ? Colors.white70 : Colors.white12)),
      ],
    );
  }

  Widget _arrow() => const Icon(Icons.chevron_right_rounded, color: Colors.white10, size: 12);
}
