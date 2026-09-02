import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../data/subject_master.dart';

class SearchableSubjectPicker extends StatefulWidget {
  final String label;
  final List<String> selectedSubjectIds;
  final List<String> suggestions;
  final Function(List<String>) onChanged;

  const SearchableSubjectPicker({
    super.key,
    required this.label,
    required this.selectedSubjectIds,
    required this.suggestions,
    required this.onChanged,
  });

  @override
  State<SearchableSubjectPicker> createState() => _SearchableSubjectPickerState();
}

class _SearchableSubjectPickerState extends State<SearchableSubjectPicker> {
  final TextEditingController _controller = TextEditingController();
  List<String> _filteredResults = [];
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _filteredResults = [];
  }

  void _onSearch(String query) {
    if (query.isEmpty) {
      setState(() => _filteredResults = []);
      return;
    }

    final all = SubjectMaster.generalSubjects.values.toList();
    setState(() {
      _filteredResults = all
          .where((s) => s.toLowerCase().contains(query.toLowerCase()))
          .where((s) => !widget.selectedSubjectIds.contains(SubjectMaster.normalize(s)))
          .take(5)
          .toList();
    });
  }

  void _toggle(String subject) {
    final id = SubjectMaster.normalize(subject);
    final updated = List<String>.from(widget.selectedSubjectIds);
    if (updated.contains(id)) {
      updated.remove(id);
    } else {
      updated.add(id);
    }
    widget.onChanged(updated);
    _controller.clear();
    setState(() => _filteredResults = []);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: AppTypography.label.copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),

        // 🔱 SELECTED CHIPS
        if (widget.selectedSubjectIds.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.selectedSubjectIds.map((id) {
              return Chip(
                label: Text(SubjectMaster.getLabel(id), style: const TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold)),
                backgroundColor: AppColors.gold,
                deleteIcon: const Icon(Icons.close, size: 14, color: Colors.black),
                onDeleted: () => _toggle(SubjectMaster.getLabel(id)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
        ],

        // 🔱 SEARCH BOX
        TextField(
          controller: _controller,
          onChanged: _onSearch,
          onTap: () => setState(() => _isFocused = true),
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: "Search subjects...",
            hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
            prefixIcon: const Icon(Icons.search, color: AppColors.gold, size: 18),
            filled: true,
            fillColor: AppColors.surface,
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.gold)),
          ),
        ),

        // 🔱 SEARCH RESULTS
        if (_filteredResults.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
            child: Column(
              children: _filteredResults.map((s) => ListTile(
                title: Text(s, style: const TextStyle(color: Colors.white, fontSize: 13)),
                onTap: () => _toggle(s),
                dense: true,
              )).toList(),
            ),
          ),

        // 🔱 SUGGESTIONS
        if (widget.suggestions.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text("Suggested", style: AppTypography.label.copyWith(color: Colors.white38, fontSize: 10)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.suggestions.where((s) => !widget.selectedSubjectIds.contains(SubjectMaster.normalize(s))).map((s) {
              return ActionChip(
                label: Text(s, style: const TextStyle(color: Colors.white70, fontSize: 10)),
                backgroundColor: Colors.white.withOpacity(0.05),
                onPressed: () => _toggle(s),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Colors.white10)),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}
