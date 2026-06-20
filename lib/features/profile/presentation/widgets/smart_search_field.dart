import 'package:flutter/material.dart';
import '../../../../core/widgets/tactical_autocomplete_field.dart';

class SmartSearchField extends StatelessWidget {
  final String title;
  final String hint;
  final TextEditingController controller;
  final List<String> suggestions;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSelected;
  final bool enabled;

  const SmartSearchField({
    super.key,
    required this.title,
    required this.hint,
    required this.controller,
    required this.suggestions,
    required this.onChanged,
    required this.onSelected,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TacticalAutocompleteField(
      title: title,
      hint: hint,
      controller: controller,
      suggestions: suggestions,
      onChanged: onChanged,
      onSelected: onSelected,
      enabled: enabled,
    );
  }
}
