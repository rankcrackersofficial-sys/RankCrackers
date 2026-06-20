import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class SubjectStatsCard extends StatelessWidget {

  final String title;
  final int completed;
  final int total;
  final double progress;

  const SubjectStatsCard({
    super.key,
    required this.title,
    required this.completed,
    required this.total,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      padding: const EdgeInsets.all(18),

      decoration: BoxDecoration(

        gradient: AppColors.primaryGradient,

        borderRadius: BorderRadius.circular(24),
      ),

      child: Column(

        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          Text(

            title,

            style: GoogleFonts.poppins(

              color: Colors.white,

              fontSize: 16,

              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 12),

          Text(

            "$completed / $total Topics",

            style: GoogleFonts.poppins(

              color: Colors.white.withValues(alpha: 0.85),

              fontSize: 12,

              fontWeight: FontWeight.w500,
            ),
          ),

          const Spacer(),

          ClipRRect(

            borderRadius: BorderRadius.circular(20),

            child: LinearProgressIndicator(

              value: progress,

              minHeight: 10,

              backgroundColor: Colors.white.withValues(alpha: 0.18),

              color: Colors.white,
            ),
          ),

          const SizedBox(height: 10),

          Align(

            alignment: Alignment.centerRight,

            child: Text(

              "${(progress * 100).toInt()}%",

              style: GoogleFonts.poppins(

                color: Colors.white,

                fontSize: 12,

                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}