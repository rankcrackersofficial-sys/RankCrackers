import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class PerformanceOverviewCard extends StatelessWidget {
  const PerformanceOverviewCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(20, 26, 20, 0),
      padding: const EdgeInsets.all(22),

      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(30),
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Row(
            children: [

              Container(
                width: 54,
                height: 54,

                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(18),
                ),

                child: const Icon(
                  Icons.insights_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    Text(
                      "Performance Overview",

                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 4),

                    Text(
                      "Your preparation analytics",

                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 26),

          Row(
            children: [

              Expanded(
                child: _buildStatCard(
                  title: "Accuracy",
                  value: "74%",
                  icon: Icons.track_changes_rounded,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: _buildStatCard(
                  title: "Rank",
                  value: "#128",
                  icon: Icons.emoji_events_rounded,
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          Row(
            children: [

              Expanded(
                child: _buildStatCard(
                  title: "Tests",
                  value: "42",
                  icon: Icons.edit_note_rounded,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: _buildStatCard(
                  title: "Study Time",
                  value: "186h",
                  icon: Icons.schedule_rounded,
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

      padding: const EdgeInsets.all(16),

      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(22),
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Container(
            width: 42,
            height: 42,

            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),

            child: Icon(
              icon,
              color: Colors.white,
              size: 22,
            ),
          ),

          const SizedBox(height: 18),

          Text(
            value,

            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            title,

            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Colors.white.withValues(alpha: 0.82),
            ),
          ),
        ],
      ),
    );
  }
}