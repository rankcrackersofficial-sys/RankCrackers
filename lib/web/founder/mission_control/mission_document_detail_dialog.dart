import 'package:flutter/material.dart';
import '../theme/founder_light_theme.dart';

class MissionDocumentDetailDialog extends StatelessWidget {
  final String missionId;
  final String documentId;
  final Map<String, dynamic>? data;
  final String? taskId;
  final VoidCallback? onReviewAtoms;
  final VoidCallback? onReviewQuestions;

  const MissionDocumentDetailDialog({
    super.key,
    required this.missionId,
    required this.documentId,
    this.data,
    this.taskId,
    this.onReviewAtoms,
    this.onReviewQuestions,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: FounderLightTheme.surface,
      title: Text('Document: $documentId'),
      content: SingleChildScrollView(
        child: Text((data ?? {}).toString()),
      ),
      actions: [
        if (onReviewAtoms != null)
          TextButton(
            onPressed: onReviewAtoms,
            child: const Text('Review atoms'),
          ),
        if (onReviewQuestions != null)
          TextButton(
            onPressed: onReviewQuestions,
            child: const Text('Review questions'),
          ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
      ],
    );
  }
}
