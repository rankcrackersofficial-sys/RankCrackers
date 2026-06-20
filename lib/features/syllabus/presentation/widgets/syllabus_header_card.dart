import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SyllabusHeaderCard
    extends StatelessWidget {

  final String examName;

  final int totalSubjects;

  final int completedSubjects;

  final double progress;

  const SyllabusHeaderCard({

    super.key,

    required this.examName,

    required this.totalSubjects,

    required this.completedSubjects,

    required this.progress,
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
          32,
        ),
      ),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Container(

                width: 62,

                height: 62,

                decoration: BoxDecoration(

                  color:
                  Colors.white.withValues(
                    alpha: 0.16,
                  ),

                  borderRadius:
                  BorderRadius.circular(
                    20,
                  ),
                ),

                child: const Icon(

                  Icons.auto_stories_rounded,

                  color: Colors.white,

                  size: 32,
                ),
              ),

              const SizedBox(width: 16),

              Expanded(

                child: Column(

                  crossAxisAlignment:
                  CrossAxisAlignment.start,

                  children: [

                    Text(

                      examName,

                      maxLines: 1,

                      overflow:
                      TextOverflow.ellipsis,

                      style:
                      GoogleFonts.poppins(

                        fontSize: 24,

                        fontWeight:
                        FontWeight.w800,

                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 4),

                    Text(

                      "Complete preparation roadmap",

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
              Colors.white.withValues(
                alpha: 0.18,
              ),

              color: Colors.white,
            ),
          ),

          const SizedBox(height: 18),

          Row(

            children: [

              Expanded(

                child: _buildInfoCard(

                  value:
                  totalSubjects
                      .toString(),

                  label:
                  "Subjects",
                ),
              ),

              const SizedBox(width: 14),

              Expanded(

                child: _buildInfoCard(

                  value:
                  completedSubjects
                      .toString(),

                  label:
                  "Completed",
                ),
              ),

              const SizedBox(width: 14),

              Expanded(

                child: _buildInfoCard(

                  value:
                  "${(progress * 100).toInt()}%",

                  label:
                  "Progress",
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({

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

              fontSize: 20,

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