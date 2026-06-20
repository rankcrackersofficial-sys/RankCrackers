import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

import '../../domain/models/subject_model.dart';

class WeakSubjectsSection
    extends StatelessWidget {

  final List<SubjectModel>
  weakSubjects;

  const WeakSubjectsSection({

    super.key,

    required this.weakSubjects,
  });

  @override
  Widget build(BuildContext context) {

    if (weakSubjects.isEmpty) {

      return Container(

        width: double.infinity,

        padding:
        const EdgeInsets.all(
          22,
        ),

        decoration: BoxDecoration(

          color: Colors.white,

          borderRadius:
          BorderRadius.circular(
            26,
          ),
        ),

        child: Column(

          children: [

            const Icon(

              Icons.verified_rounded,

              color: Colors.green,

              size: 46,
            ),

            const SizedBox(height: 14),

            Text(

              "No Weak Subjects",

              style:
              GoogleFonts.poppins(

                fontSize: 18,

                fontWeight:
                FontWeight.w700,

                color:
                AppColors.textPrimary,
              ),
            ),

            const SizedBox(height: 6),

            Text(

              "Your performance is looking balanced",

              textAlign:
              TextAlign.center,

              style:
              GoogleFonts.poppins(

                fontSize: 12,

                color:
                AppColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return Column(

      children:

      weakSubjects.map(

            (subject) {

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

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                28,
              ),
            ),

            child: Row(

              children: [

                Container(

                  width: 58,
                  height: 58,

                  decoration: BoxDecoration(

                    color:
                    Colors.white.withValues(
                      alpha: 0.14,
                    ),

                    borderRadius:
                    BorderRadius.circular(
                      18,
                    ),
                  ),

                  child: Center(

                    child: Text(

                      subject.icon,

                      style:
                      const TextStyle(
                        fontSize: 28,
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 16),

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
                          Colors.white,
                        ),
                      ),

                      const SizedBox(
                        height: 6,
                      ),

                      Text(

                        "${(subject.accuracy * 100).toInt()}% Accuracy",

                        style:
                        GoogleFonts.poppins(

                          fontSize: 12,

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

                Container(

                  padding:
                  const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),

                  decoration: BoxDecoration(

                    color:
                    Colors.white,

                    borderRadius:
                    BorderRadius.circular(
                      16,
                    ),
                  ),

                  child: Text(

                    "Revise",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 12,

                      fontWeight:
                      FontWeight.w700,

                      color:
                      AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ).toList(),
    );
  }
}