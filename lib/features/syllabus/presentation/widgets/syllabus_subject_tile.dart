import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/models/subject_model.dart';

class SyllabusSubjectTile
    extends StatelessWidget {

  final SubjectModel subject;

  final VoidCallback? onTap;

  const SyllabusSubjectTile({

    super.key,

    required this.subject,

    this.onTap,
  });

  @override
  Widget build(BuildContext context) {

    final double progress =
    subject.totalTopics == 0
        ? 0
        : subject.completedTopics /
        subject.totalTopics;

    return GestureDetector(

      onTap: onTap,

      child: Container(

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
            28,
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

        child: Row(

          children: [

            Container(

              width: 62,

              height: 62,

              decoration: BoxDecoration(

                gradient:
                AppColors.primaryGradient,

                borderRadius:
                BorderRadius.circular(
                  20,
                ),
              ),

              child: const Icon(

                Icons.menu_book_rounded,

                color: Colors.white,

                size: 30,
              ),
            ),

            const SizedBox(width: 18),

            Expanded(

              child: Column(

                crossAxisAlignment:
                CrossAxisAlignment.start,

                children: [

                  Text(

                    subject.name,

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

                  const SizedBox(height: 6),

                  Text(

                    "${subject.completedTopics}/${subject.totalTopics} topics completed",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 12,

                      fontWeight:
                      FontWeight.w500,

                      color:
                      AppColors.textSecondary,
                    ),
                  ),

                  const SizedBox(height: 14),

                  ClipRRect(

                    borderRadius:
                    BorderRadius.circular(
                      20,
                    ),

                    child:
                    LinearProgressIndicator(

                      value: progress,

                      minHeight: 10,

                      backgroundColor:
                      AppColors.primary
                          .withValues(
                        alpha: 0.10,
                      ),

                      color:
                      AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 14),

            Container(

              width: 42,

              height: 42,

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

              child: const Icon(

                Icons.arrow_forward_ios_rounded,

                color:
                AppColors.primary,

                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}