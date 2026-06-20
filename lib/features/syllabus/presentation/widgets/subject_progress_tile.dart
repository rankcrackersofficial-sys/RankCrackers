import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SubjectProgressTile
    extends StatelessWidget {

  final String title;

  final int completedTopics;

  final int totalTopics;

  final double progress;

  final bool isWeak;

  const SubjectProgressTile({

    super.key,

    required this.title,

    required this.completedTopics,

    required this.totalTopics,

    required this.progress,

    this.isWeak = false,
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
          26,
        ),

        border: Border.all(

          color:
          isWeak
              ? Colors.red.withValues(
            alpha: 0.15,
          )
              : AppColors.border
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

            blurRadius: 18,

            offset:
            const Offset(0, 8),
          ),
        ],
      ),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Container(

                width: 52,

                height: 52,

                decoration: BoxDecoration(

                  gradient:
                  AppColors.primaryGradient,

                  borderRadius:
                  BorderRadius.circular(
                    18,
                  ),
                ),

                child: Icon(

                  isWeak
                      ? Icons.warning_amber_rounded
                      : Icons.menu_book_rounded,

                  color: Colors.white,

                  size: 26,
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

                      "$completedTopics / $totalTopics Topics Completed",

                      style:
                      GoogleFonts.poppins(

                        fontSize: 11,

                        fontWeight:
                        FontWeight.w500,

                        color:
                        AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              Container(

                padding:
                const EdgeInsets.symmetric(
                  horizontal: 12,
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

                child: Text(

                  "${(progress * 100).toInt()}%",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 11,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors.primary,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          ClipRRect(

            borderRadius:
            BorderRadius.circular(
              20,
            ),

            child:
            LinearProgressIndicator(

              value: progress,

              minHeight: 12,

              backgroundColor:
              AppColors.primary
                  .withValues(
                alpha: 0.08,
              ),

              color:
              isWeak
                  ? Colors.redAccent
                  : AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}