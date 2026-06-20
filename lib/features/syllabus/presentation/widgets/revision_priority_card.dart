import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class RevisionPriorityCard
    extends StatelessWidget {

  final String title;

  final String subtitle;

  final int revisionCount;

  final Color color;

  const RevisionPriorityCard({

    super.key,

    required this.title,

    required this.subtitle,

    required this.revisionCount,

    required this.color,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      margin:
      const EdgeInsets.only(
        bottom: 16,
      ),

      padding:
      const EdgeInsets.all(20),

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
            alpha: 0.4,
          ),
        ),

        boxShadow: [

          BoxShadow(

            color:
            Colors.black.withValues(
              alpha: 0.03,
            ),

            blurRadius: 14,

            offset:
            const Offset(0, 8),
          ),
        ],
      ),

      child: Row(

        children: [

          Container(

            width: 58,

            height: 58,

            decoration: BoxDecoration(

              color:
              color.withValues(
                alpha: 0.12,
              ),

              borderRadius:
              BorderRadius.circular(
                18,
              ),
            ),

            child: Icon(

              Icons.refresh_rounded,

              color: color,

              size: 30,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(

                  title,

                  maxLines: 1,

                  overflow:
                  TextOverflow.ellipsis,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 16,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors.textPrimary,
                  ),
                ),

                const SizedBox(height: 4),

                Text(

                  subtitle,

                  maxLines: 2,

                  overflow:
                  TextOverflow.ellipsis,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

                    fontWeight:
                    FontWeight.w500,

                    color:
                    AppColors.textSecondary,

                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          Container(

            padding:
            const EdgeInsets.symmetric(

              horizontal: 14,

              vertical: 10,
            ),

            decoration: BoxDecoration(

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                16,
              ),
            ),

            child: Column(

              children: [

                Text(

                  revisionCount.toString(),

                  style:
                  GoogleFonts.poppins(

                    fontSize: 18,

                    fontWeight:
                    FontWeight.w800,

                    color: Colors.white,
                  ),
                ),

                Text(

                  "Revisions",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 10,

                    fontWeight:
                    FontWeight.w500,

                    color:
                    Colors.white
                        .withValues(
                      alpha: 0.82,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}