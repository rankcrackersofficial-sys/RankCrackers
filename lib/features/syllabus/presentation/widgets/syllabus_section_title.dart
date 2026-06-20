import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SyllabusSectionTitle
    extends StatelessWidget {

  final String title;

  final String? subtitle;

  final VoidCallback? onViewAll;

  const SyllabusSectionTitle({

    super.key,

    required this.title,

    this.subtitle,

    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {

    return Row(

      crossAxisAlignment:
      CrossAxisAlignment.end,

      children: [

        Expanded(

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment.start,

            children: [

              Text(

                title,

                style:
                GoogleFonts.poppins(

                  fontSize: 20,

                  fontWeight:
                  FontWeight.w800,

                  color:
                  AppColors.textPrimary,
                ),
              ),

              if (subtitle != null) ...[

                const SizedBox(height: 4),

                Text(

                  subtitle!,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

                    fontWeight:
                    FontWeight.w500,

                    color:
                    AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
        ),

        if (onViewAll != null)

          GestureDetector(

            onTap: onViewAll,

            child: Container(

              padding:
              const EdgeInsets.symmetric(

                horizontal: 14,

                vertical: 8,
              ),

              decoration: BoxDecoration(

                color:
                AppColors.primary
                    .withValues(
                  alpha: 0.08,
                ),

                borderRadius:
                BorderRadius.circular(
                  14,
                ),
              ),

              child: Row(

                children: [

                  Text(

                    "View All",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 11,

                      fontWeight:
                      FontWeight.w700,

                      color:
                      AppColors.primary,
                    ),
                  ),

                  const SizedBox(width: 4),

                  const Icon(

                    Icons.arrow_forward_ios_rounded,

                    size: 12,

                    color:
                    AppColors.primary,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}