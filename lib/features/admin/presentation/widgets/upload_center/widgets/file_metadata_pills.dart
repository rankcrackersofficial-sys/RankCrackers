import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_typography.dart';

class FileMetadataPills extends StatelessWidget {
  final Map<String, dynamic> metadata;
  const FileMetadataPills({super.key, required this.metadata});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _metaPill("TYPE: ${metadata['type'] ?? 'Unknown'}", Colors.blueAccent),
        const SizedBox(width: 8),
        _metaPill("DEST: ${metadata['destination'] ?? 'Registry'}", Colors.orangeAccent),
      ],
    );
  }

  Widget _metaPill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1), 
        borderRadius: BorderRadius.circular(6), 
        border: Border.all(color: color.withValues(alpha: 0.2))
      ),
      child: Text(text.toUpperCase(), style: AppTypography.label.copyWith(color: color, fontSize: 7)),
    );
  }
}
