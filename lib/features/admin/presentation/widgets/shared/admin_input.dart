import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class AdminInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;

  const AdminInput({
    super.key,
    required this.controller,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: TextField(
        controller: controller,
        style: AppTypography.body.copyWith(fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: AppTypography.body.copyWith(color: Colors.white10, fontSize: 14),
          contentPadding: const EdgeInsets.all(18),
          border: InputBorder.none,
        ),
      ),
    );
  }
}
