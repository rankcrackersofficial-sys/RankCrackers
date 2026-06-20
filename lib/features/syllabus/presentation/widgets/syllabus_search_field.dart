import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SyllabusSearchField
    extends StatelessWidget {

  final TextEditingController controller;

  final ValueChanged<String>? onChanged;

  const SyllabusSearchField({

    super.key,

    required this.controller,

    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(
          24,
        ),

        border: Border.all(

          color:
          AppColors.border
              .withValues(
            alpha: 0.45,
          ),
        ),

        boxShadow: [

          BoxShadow(

            color:
            Colors.black.withValues(
              alpha: 0.03,
            ),

            blurRadius: 16,

            offset:
            const Offset(0, 8),
          ),
        ],
      ),

      child: TextField(

        controller: controller,

        onChanged: onChanged,

        style:
        GoogleFonts.poppins(

          fontSize: 14,

          fontWeight:
          FontWeight.w600,

          color:
          AppColors.textPrimary,
        ),

        decoration: InputDecoration(

          border: InputBorder.none,

          contentPadding:
          const EdgeInsets.symmetric(

            horizontal: 20,

            vertical: 18,
          ),

          prefixIcon: Container(

            margin:
            const EdgeInsets.all(10),

            decoration: BoxDecoration(

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                14,
              ),
            ),

            child: const Icon(

              Icons.search_rounded,

              color: Colors.white,

              size: 22,
            ),
          ),

          hintText:
          "Search subject or topic",

          hintStyle:
          GoogleFonts.poppins(

            fontSize: 13,

            fontWeight:
            FontWeight.w500,

            color:
            AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}