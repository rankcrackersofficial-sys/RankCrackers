import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/models/subject_model.dart';

class SubjectProgressCard
    extends StatelessWidget {

  final SubjectModel subject;

  const SubjectProgressCard({

    super.key,

    required this.subject,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      margin:
      const EdgeInsets.only(
        bottom: 16,
      ),

      padding:
      const EdgeInsets.all(
        20,
      ),

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(
          26,
        ),

        boxShadow: [

          BoxShadow(

            color:
            Colors.black.withValues(
              alpha: 0.04,
            ),

            blurRadius: 12,

            offset:
            const Offset(0, 6),
          ),
        ],
      ),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Text(

                subject.icon,

                style:
                const TextStyle(
                  fontSize: 26,
                ),
              ),

              const SizedBox(width: 12),

              Expanded(

                child: Column(

                  crossAxisAlignment:
                  CrossAxisAlignment.start,

                  children: [

                    Text(

                      subject.name,

                      style:
                      GoogleFonts.poppins(

                        fontSize: 16,

                        fontWeight:
                        FontWeight.w700,

                        color:
                        AppColors.textPrimary,
                      ),
                    ),

                    const SizedBox(
                      height: 3,
                    ),

                    Text(

                      "${subject.completedQuestions}/${subject.totalQuestions} Questions",

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

              Container(

                padding:
                const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),

                decoration: BoxDecoration(

                  gradient:
                  AppColors.primaryGradient,

                  borderRadius:
                  BorderRadius.circular(
                    14,
                  ),
                ),

                child: Text(

                  "${(subject.accuracy * 100).toInt()}%",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

                    fontWeight:
                    FontWeight.w700,

                    color: Colors.white,
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

              value:
              subject.progress,

              minHeight: 12,

              backgroundColor:
              AppColors.primary.withValues(
                alpha: 0.10,
              ),

              color:
              AppColors.primary,
            ),
          ),

          const SizedBox(height: 18),

          Wrap(

            spacing: 8,
            runSpacing: 8,

            children:

            subject.topics.map(

                  (topic) {

                return Container(

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

                    topic,

                    style:
                    GoogleFonts.poppins(

                      fontSize: 10,

                      fontWeight:
                      FontWeight.w600,

                      color:
                      AppColors.primary,
                    ),
                  ),
                );
              },
            ).toList(),
          ),
        ],
      ),
    );
  }
}