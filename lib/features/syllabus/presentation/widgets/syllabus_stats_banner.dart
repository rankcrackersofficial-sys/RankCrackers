import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SyllabusStatsBanner
    extends StatelessWidget {

  final int totalSubjects;

  final int completedSubjects;

  final int weakSubjects;

  const SyllabusStatsBanner({

    super.key,

    required this.totalSubjects,

    required this.completedSubjects,

    required this.weakSubjects,
  });

  double get progress {

    if (totalSubjects == 0) {
      return 0;
    }

    return completedSubjects /
        totalSubjects;
  }

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

        boxShadow: [

          BoxShadow(

            color:
            AppColors.primary
                .withValues(
              alpha: 0.25,
            ),

            blurRadius: 24,

            offset:
            const Offset(0, 12),
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

                width: 54,

                height: 54,

                decoration: BoxDecoration(

                  color:
                  Colors.white
                      .withValues(
                    alpha: 0.15,
                  ),

                  borderRadius:
                  BorderRadius.circular(
                    18,
                  ),
                ),

                child: const Icon(

                  Icons.auto_graph_rounded,

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

                      "Preparation Progress",

                      style:
                      GoogleFonts.poppins(

                        fontSize: 18,

                        fontWeight:
                        FontWeight.w800,

                        color:
                        Colors.white,
                      ),
                    ),

                    const SizedBox(height: 4),

                    Text(

                      "$completedSubjects of $totalSubjects subjects completed",

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

          const SizedBox(height: 26),

          ClipRRect(

            borderRadius:
            BorderRadius.circular(
              20,
            ),

            child:
            LinearProgressIndicator(

              value: progress,

              minHeight: 14,

              backgroundColor:
              Colors.white
                  .withValues(
                alpha: 0.18,
              ),

              color: Colors.white,
            ),
          ),

          const SizedBox(height: 26),

          Row(

            children: [

              Expanded(

                child: _buildStatCard(

                  title: "Completed",

                  value:
                  completedSubjects
                      .toString(),

                  icon:
                  Icons.check_circle_rounded,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(

                child: _buildStatCard(

                  title: "Weak Areas",

                  value:
                  weakSubjects
                      .toString(),

                  icon:
                  Icons.warning_amber_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({

    required String title,

    required String value,

    required IconData icon,
  }) {

    return Container(

      padding:
      const EdgeInsets.symmetric(

        horizontal: 16,

        vertical: 18,
      ),

      decoration: BoxDecoration(

        color:
        Colors.white.withValues(
          alpha: 0.14,
        ),

        borderRadius:
        BorderRadius.circular(
          22,
        ),
      ),

      child: Column(

        children: [

          Icon(

            icon,

            color: Colors.white,

            size: 24,
          ),

          const SizedBox(height: 10),

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

            title,

            textAlign: TextAlign.center,

            style:
            GoogleFonts.poppins(

              fontSize: 11,

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
    );
  }
}