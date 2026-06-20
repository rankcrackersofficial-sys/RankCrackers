import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SyllabusEmptyState
    extends StatelessWidget {

  final String title;

  final String subtitle;

  final String buttonText;

  final VoidCallback onTap;

  const SyllabusEmptyState({

    super.key,

    required this.title,

    required this.subtitle,

    required this.buttonText,

    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      width: double.infinity,

      padding:
      const EdgeInsets.symmetric(

        horizontal: 26,

        vertical: 34,
      ),

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(
          30,
        ),

        border: Border.all(

          color:
          AppColors.border
              .withValues(
            alpha: 0.4,
          ),
        ),

        boxShadow: [

          BoxShadow(

            color:
            Colors.black.withValues(
              alpha: 0.03,
            ),

            blurRadius: 18,

            offset:
            const Offset(0, 8),
          ),
        ],
      ),

      child: Column(

        children: [

          Container(

            width: 90,

            height: 90,

            decoration: BoxDecoration(

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                28,
              ),
            ),

            child: const Icon(

              Icons.auto_stories_rounded,

              color: Colors.white,

              size: 42,
            ),
          ),

          const SizedBox(height: 24),

          Text(

            title,

            textAlign: TextAlign.center,

            style:
            GoogleFonts.poppins(

              fontSize: 22,

              fontWeight:
              FontWeight.w800,

              color:
              AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 10),

          Text(

            subtitle,

            textAlign: TextAlign.center,

            style:
            GoogleFonts.poppins(

              fontSize: 13,

              height: 1.6,

              fontWeight:
              FontWeight.w500,

              color:
              AppColors.textSecondary,
            ),
          ),

          const SizedBox(height: 28),

          InkWell(

            borderRadius:
            BorderRadius.circular(
              18,
            ),

            onTap: onTap,

            child: Container(

              padding:
              const EdgeInsets.symmetric(

                horizontal: 24,

                vertical: 16,
              ),

              decoration: BoxDecoration(

                gradient:
                AppColors.primaryGradient,

                borderRadius:
                BorderRadius.circular(
                  18,
                ),
              ),

              child: Row(

                mainAxisSize:
                MainAxisSize.min,

                children: [

                  const Icon(

                    Icons.play_arrow_rounded,

                    color: Colors.white,

                    size: 22,
                  ),

                  const SizedBox(width: 10),

                  Text(

                    buttonText,

                    style:
                    GoogleFonts.poppins(

                      fontSize: 14,

                      fontWeight:
                      FontWeight.w700,

                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}