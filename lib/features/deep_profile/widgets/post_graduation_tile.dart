import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'subject_selector_tile.dart';

class PostGraduationTile extends StatelessWidget {
  final bool isCompleted;
  final String stream;
  final List<String> subjects;
  final Function(bool) onToggle;
  final Function(String) onStreamChanged;
  final Function(List<String>) onSubjectsChanged;

  const PostGraduationTile({
    super.key,
    required this.isCompleted,
    required this.stream,
    required this.subjects,
    required this.onToggle,
    required this.onStreamChanged,
    required this.onSubjectsChanged,
  });

  @override
  Widget build(BuildContext context) {
    final streams = ["Arts", "Science", "Commerce", "Management", "Education", "Law", "Engineering"];

    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Post Graduation Completed?", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
                  const SizedBox(height: 4),
                  Text(isCompleted ? "Yes" : "No", style: AppTypography.cardTitle.copyWith(fontSize: 14)),
                ],
              ),
              Switch(
                value: isCompleted,
                onChanged: onToggle,
                activeThumbColor: AppColors.gold,
                activeTrackColor: AppColors.gold.withValues(alpha: 0.2),
                inactiveThumbColor: Colors.white24,
                inactiveTrackColor: Colors.white10,
              ),
            ],
          ),
          if (isCompleted) ...[
            const SizedBox(height: 20),
            const Divider(color: Colors.white10, height: 1),
            const SizedBox(height: 20),
            Text("PG Stream", style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white38)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: streams.map((s) => _streamChip(s)).toList(),
            ),
            const SizedBox(height: 20),
            SubjectSelectorTile(
              selectedSubjects: subjects,
              stream: stream,
              onChanged: onSubjectsChanged,
            ),
          ],
        ],
      ),
    );
  }

  Widget _streamChip(String label) {
    final isSelected = stream == label;
    return GestureDetector(
      onTap: () => onStreamChanged(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.gold : Colors.white10),
        ),
        child: Text(
          label,
          style: AppTypography.label.copyWith(fontSize: 10, color: isSelected ? AppColors.gold : Colors.white54),
        ),
      ),
    );
  }
}
