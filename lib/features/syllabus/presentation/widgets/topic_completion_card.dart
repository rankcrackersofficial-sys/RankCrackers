import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class TopicCompletionCard
    extends StatelessWidget {

  final String topicName;

  final String subjectName;

  final bool isCompleted;

  final int solvedQuestions;

  const TopicCompletionCard({

    super.key,

    required this.topicName,

    required this.subjectName,

    required this.isCompleted,

    required this.solvedQuestions,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      margin:
      const EdgeInsets.only(
        bottom: 16,
      ),

      padding:
      const EdgeInsets.all(18),

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

            width: 56,

            height: 56,

            decoration: BoxDecoration(

              gradient:
              isCompleted
                  ? const LinearGradient(

                colors: [

                  Color(0xFF33D17A),

                  Color(0xFF1FA463),
                ],
              )
                  : AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                18,
              ),
            ),

            child: Icon(

              isCompleted
                  ? Icons.check_rounded
                  : Icons.menu_book_rounded,

              color: Colors.white,

              size: 28,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(

                  topicName,

                  maxLines: 1,

                  overflow:
                  TextOverflow.ellipsis,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 15,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors.textPrimary,
                  ),
                ),

                const SizedBox(height: 4),

                Text(

                  subjectName,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

                    fontWeight:
                    FontWeight.w500,

                    color:
                    AppColors.textSecondary,
                  ),
                ),

                const SizedBox(height: 8),

                Text(

                  "$solvedQuestions Questions Solved",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 11,

                    fontWeight:
                    FontWeight.w600,

                    color:
                    AppColors.primary,
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
              vertical: 8,
            ),

            decoration: BoxDecoration(

              color:
              isCompleted
                  ? const Color(
                0xFF33D17A,
              ).withValues(
                alpha: 0.12,
              )
                  : AppColors.primary
                  .withValues(
                alpha: 0.10,
              ),

              borderRadius:
              BorderRadius.circular(
                14,
              ),
            ),

            child: Text(

              isCompleted
                  ? "Completed"
                  : "Pending",

              style:
              GoogleFonts.poppins(

                fontSize: 11,

                fontWeight:
                FontWeight.w700,

                color:
                isCompleted
                    ? const Color(
                  0xFF1FA463,
                )
                    : AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}