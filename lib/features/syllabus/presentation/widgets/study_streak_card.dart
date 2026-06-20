import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class StudyStreakCard
    extends StatelessWidget {

  final int streakDays;

  final int studyHours;

  final int solvedQuestions;

  const StudyStreakCard({

    super.key,

    required this.streakDays,

    required this.studyHours,

    required this.solvedQuestions,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      width: double.infinity,

      padding:
      const EdgeInsets.all(24),

      decoration: BoxDecoration(

        gradient:
        AppColors.primaryGradient,

        borderRadius:
        BorderRadius.circular(
          30,
        ),
      ),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Container(

                width: 58,

                height: 58,

                decoration: BoxDecoration(

                  color:
                  Colors.white.withValues(
                    alpha: 0.16,
                  ),

                  borderRadius:
                  BorderRadius.circular(
                    18,
                  ),
                ),

                child: const Icon(

                  Icons.local_fire_department_rounded,

                  color: Colors.white,

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

                      "Study Streak",

                      style:
                      GoogleFonts.poppins(

                        fontSize: 22,

                        fontWeight:
                        FontWeight.w800,

                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 4),

                    Text(

                      "Keep consistency alive",

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
            ],
          ),

          const SizedBox(height: 28),

          Row(

            children: [

              Expanded(

                child: _buildStatItem(

                  value:
                  streakDays.toString(),

                  label:
                  "Days",
                ),
              ),

              const SizedBox(width: 14),

              Expanded(

                child: _buildStatItem(

                  value:
                  studyHours.toString(),

                  label:
                  "Hours",
                ),
              ),

              const SizedBox(width: 14),

              Expanded(

                child: _buildStatItem(

                  value:
                  solvedQuestions
                      .toString(),

                  label:
                  "Solved",
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({

    required String value,

    required String label,
  }) {

    return Container(

      padding:
      const EdgeInsets.symmetric(
        vertical: 18,
      ),

      decoration: BoxDecoration(

        color:
        Colors.white.withValues(
          alpha: 0.14,
        ),

        borderRadius:
        BorderRadius.circular(
          20,
        ),
      ),

      child: Column(

        children: [

          Text(

            value,

            style:
            GoogleFonts.poppins(

              fontSize: 22,

              fontWeight:
              FontWeight.w800,

              color: Colors.white,
            ),
          ),

          const SizedBox(height: 4),

          Text(

            label,

            style:
            GoogleFonts.poppins(

              fontSize: 11,

              fontWeight:
              FontWeight.w500,

              color:
              Colors.white.withValues(
                alpha: 0.82,
              ),
            ),
          ),
        ],
      ),
    );
  }
}