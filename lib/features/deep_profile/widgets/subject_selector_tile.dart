import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import '../data/subject_master.dart';

class SubjectSelectorTile extends StatefulWidget {
  final List<String> selectedSubjects;
  final String stream;
  final Function(List<String>) onChanged;

  const SubjectSelectorTile({
    super.key,
    required this.selectedSubjects,
    required this.stream,
    required this.onChanged,
  });

  @override
  State<SubjectSelectorTile> createState() => _SubjectSelectorTileState();
}

class _SubjectSelectorTileState extends State<SubjectSelectorTile> {
  final TextEditingController _searchController = TextEditingController();
  List<String> _suggestions = [];

  @override
  void initState() {
    super.initState();
    _suggestions = SubjectMaster.getByStream(widget.stream);
  }

  void _onSearch(String query) {
    final all = SubjectMaster.getByStream(widget.stream);
    setState(() {
      if (query.isEmpty) {
        _suggestions = all;
      } else {
        _suggestions = all
            .where((s) => s.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  void _toggleSubject(String subject) {
    final updated = List<String>.from(widget.selectedSubjects);
    if (updated.contains(subject)) {
      updated.remove(subject);
    } else {
      updated.add(subject);
    }
    widget.onChanged(updated);
  }

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Subjects",
              style: AppTypography.label
                  .copyWith(fontSize: 10, color: Colors.white38)),
          const SizedBox(height: 12),
          TextField(
            controller: _searchController,
            onChanged: _onSearch,
            style: AppTypography.body.copyWith(fontSize: 14),
            decoration: InputDecoration(
              hintText: "Search Subject (e.g. Physics)",
              hintStyle: AppTypography.body
                  .copyWith(fontSize: 14, color: Colors.white12),
              prefixIcon: const Icon(Icons.search_rounded,
                  color: AppColors.gold, size: 18),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.03),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
          ),
          const SizedBox(height: 16),
          if (widget.selectedSubjects.isNotEmpty) ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: widget.selectedSubjects
                  .map((s) => _subjectChip(s, true))
                  .toList(),
            ),
            const SizedBox(height: 16),
            const Divider(color: Colors.white10, height: 1),
            const SizedBox(height: 16),
          ],
          SizedBox(
            height: 150,
            child: ListView.builder(
              shrinkWrap: true,
              physics: const BouncingScrollPhysics(),
              itemCount: _suggestions.length,
              itemBuilder: (context, index) {
                final s = _suggestions[index];
                final isSelected = widget.selectedSubjects.contains(s);
                return Material(
                  color: Colors.transparent,
                  child: ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(s,
                        style: AppTypography.body.copyWith(
                            fontSize: 13,
                            color:
                                isSelected ? AppColors.gold : Colors.white70)),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle_rounded,
                            color: AppColors.gold, size: 18)
                        : const Icon(Icons.add_circle_outline_rounded,
                            color: Colors.white10, size: 18),
                    onTap: () => _toggleSubject(s),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _subjectChip(String label, bool isSelected) {
    return GestureDetector(
      onTap: () => _toggleSubject(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: AppTypography.label
                    .copyWith(fontSize: 9, color: AppColors.gold)),
            const SizedBox(width: 4),
            const Icon(Icons.close_rounded, size: 12, color: AppColors.gold),
          ],
        ),
      ),
    );
  }
}
