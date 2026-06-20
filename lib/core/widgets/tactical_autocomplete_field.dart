import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utils/responsive_helper.dart';

class TacticalAutocompleteField extends StatefulWidget {
  final String title;
  final String hint;
  final TextEditingController controller;
  final List<String> suggestions;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSelected;
  final bool enabled;
  final FocusNode? focusNode;

  const TacticalAutocompleteField({
    super.key,
    required this.title,
    required this.hint,
    required this.controller,
    required this.suggestions,
    required this.onChanged,
    required this.onSelected,
    this.enabled = true,
    this.focusNode,
  });

  @override
  State<TacticalAutocompleteField> createState() => _TacticalAutocompleteFieldState();
}

class _TacticalAutocompleteFieldState extends State<TacticalAutocompleteField> {
  late FocusNode _internalFocusNode;

  @override
  void initState() {
    super.initState();
    _internalFocusNode = widget.focusNode ?? FocusNode();
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _internalFocusNode.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          widget.title,
          style: AppTypography.label.copyWith(
            fontSize: ResponsiveHelper.sp(context, 8),
            color: Colors.white24,
          ),
        ),
        SizedBox(height: ResponsiveHelper.compactGap(context) * 0.4),
        
        // 🔱 Forensic Fix: Removed LayoutBuilder wrapper to stabilize semantics tree.
        // We use a GlobalKey to get the width of the field for the dropdown.
        RawAutocomplete<String>(
          textEditingController: widget.controller,
          focusNode: _internalFocusNode,
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return widget.suggestions.take(5);
            }
            return widget.suggestions.where((String option) {
              return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
            }).take(5);
          },
          onSelected: (String selection) {
            widget.onSelected(selection);
            _internalFocusNode.unfocus();
          },
          fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
            return Container(
              height: ResponsiveHelper.fieldHeight(context),
              child: TextField(
                controller: textEditingController,
                focusNode: focusNode,
                enabled: widget.enabled,
                onChanged: widget.onChanged,
                style: AppTypography.body.copyWith(
                  color: widget.enabled ? Colors.white : Colors.white24,
                  fontSize: ResponsiveHelper.sp(context, 14),
                ),
                decoration: InputDecoration(
                  hintText: widget.enabled ? widget.hint : 'Disabled',
                  hintStyle: AppTypography.body.copyWith(
                    color: Colors.white10,
                    fontSize: ResponsiveHelper.sp(context, 13),
                  ),
                  filled: true,
                  fillColor: widget.enabled 
                      ? AppColors.surface 
                      : AppColors.surface.withValues(alpha: 0.4),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.borderSoft),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.gold, width: 1.0),
                  ),
                ),
              ),
            );
          },
          optionsViewBuilder: (context, onSelected, options) {
            return Align(
              alignment: Alignment.topLeft,
              child: ExcludeSemantics( // 🔱 Forensic Fix: Prevents semantics tree corruption during overlay transitions
                child: Material(
                  elevation: 8,
                  color: Colors.transparent,
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.8, 
                    constraints: const BoxConstraints(maxWidth: 400),
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderSoft),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: options.map((String option) {
                        return ListTile(
                          dense: true,
                          visualDensity: VisualDensity.compact,
                          title: Text(
                            option,
                            style: AppTypography.body.copyWith(fontSize: 13),
                          ),
                          onTap: () => onSelected(option),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
