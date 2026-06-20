import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SubjectTopicTile
    extends StatelessWidget {

  final String topic;

  final bool completed;

  const SubjectTopicTile({

    super.key,

    required this.topic,

    required this.completed,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      margin:
      const EdgeInsets.only(
        bottom: 12,
      ),

      padding:
      const EdgeInsets.symmetric(
        horizontal: 18,
        vertical: 16,
      ),

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(
          20,
        ),

        border: Border.all(

          color:
          AppColors.border
              .withValues(
            alpha: 0.4,
          ),
        ),
      ),

      child: Row(

        children: [

          Container(

            width: 42,
            height: 42,

            decoration: BoxDecoration(

              gradient:
              completed

                  ? AppColors
                  .primaryGradient

                  : null,

              color:
              completed
                  ? null
                  : const Color(
                0xFFF2F5FF,
              ),

              borderRadius:
              BorderRadius.circular(
                14,
              ),
            ),

            child: Icon(

              completed

                  ? Icons.check_rounded

                  : Icons.menu_book_rounded,

              color:

              completed

                  ? Colors.white

                  : AppColors.primary,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(

                  topic,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 14,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors
                        .textPrimary,
                  ),
                ),

                const SizedBox(
                  height: 4,
                ),

                Text(

                  completed

                      ? "Completed"

                      : "Pending",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 11,

                    fontWeight:
                    FontWeight.w500,

                    color:

                    completed

                        ? Colors.green

                        : AppColors
                        .textSecondary,
                  ),
                ),
              ],
            ),
          ),

          Icon(

            Icons.arrow_forward_ios_rounded,

            size: 16,

            color:
            AppColors.textSecondary,
          ),
        ],
      ),
    );
  }
}