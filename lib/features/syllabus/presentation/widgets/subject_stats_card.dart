import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SubjectStatsCard extends StatelessWidget {

  final String title;

  final int completedTopics;

  final int totalTopics;

  final double progress;

  const SubjectStatsCard({

    super.key,

    required this.title,

    required this.completedTopics,

    required this.totalTopics,

    required this.progress,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      padding: const EdgeInsets.all(18),

      decoration: BoxDecoration(

        gradient:
        AppColors.primaryGradient,

        borderRadius:
        BorderRadius.circular(24),
      ),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Text(

            title,

            style:
            GoogleFonts.poppins(

              fontSize: 16,

              fontWeight:
              FontWeight.w700,

              color: Colors.white,
            ),
          ),

          const SizedBox(height: 18),

          Text(

            "$completedTopics / $totalTopics Topics",

            style:
            GoogleFonts.poppins(

              fontSize: 13,

              fontWeight:
              FontWeight.w500,

              color:
              Colors.white.withValues(
                alpha: 0.85,
              ),
            ),
          ),

          const SizedBox(height: 16),

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
              Colors.white.withValues(
                alpha: 0.15,
              ),

              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}