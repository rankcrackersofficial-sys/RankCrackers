import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class ProgressTrackerScreen extends StatelessWidget {
  const ProgressTrackerScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor:
      const Color(0xFFF4F8FF),

      appBar: AppBar(

        elevation: 0,

        backgroundColor:
        AppColors.primary,

        title: Text(

          "Progress Tracker",

          style:
          GoogleFonts.poppins(

            fontWeight:
            FontWeight.w700,

            color: Colors.white,
          ),
        ),
      ),

      body: SingleChildScrollView(

        physics:
        const BouncingScrollPhysics(),

        padding:
        const EdgeInsets.all(20),

        child: Column(

          crossAxisAlignment:
          CrossAxisAlignment.start,

          children: [

            // =====================================
            // TOP PERFORMANCE CARD
            // =====================================

            Container(

              width: double.infinity,

              padding:
              const EdgeInsets.all(
                24,
              ),

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

                  Text(

                    "Your Performance",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 24,

                      fontWeight:
                      FontWeight.w800,

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(

                    "Track your preparation journey",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 12,

                      fontWeight:
                      FontWeight.w500,

                      color:
                      Colors.white.withValues(
                        alpha: 0.84,
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  Row(

                    children: [

                      Expanded(
                        child: _buildTopStat(
                          "Rank",
                          "#82",
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildTopStat(
                          "Accuracy",
                          "78%",
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildTopStat(
                          "Streak",
                          "24",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            Text(

              "Subject Performance",

              style:
              GoogleFonts.poppins(

                fontSize: 20,

                fontWeight:
                FontWeight.w800,

                color:
                AppColors.textPrimary,
              ),
            ),

            const SizedBox(height: 18),

            _buildSubjectCard(
              "History",
              "82%",
              0.82,
            ),

            _buildSubjectCard(
              "Polity",
              "76%",
              0.76,
            ),

            _buildSubjectCard(
              "Reasoning",
              "68%",
              0.68,
            ),

            _buildSubjectCard(
              "Science",
              "71%",
              0.71,
            ),

            const SizedBox(height: 30),

            Text(

              "Daily Activity",

              style:
              GoogleFonts.poppins(

                fontSize: 20,

                fontWeight:
                FontWeight.w800,

                color:
                AppColors.textPrimary,
              ),
            ),

            const SizedBox(height: 18),

            Container(

              width: double.infinity,

              padding:
              const EdgeInsets.all(
                24,
              ),

              decoration: BoxDecoration(

                color: Colors.white,

                borderRadius:
                BorderRadius.circular(
                  28,
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

                children: [

                  _buildActivityTile(
                    "Tests Attempted",
                    "12",
                    Icons.bolt_rounded,
                  ),

                  const SizedBox(height: 18),

                  _buildActivityTile(
                    "Study Hours",
                    "6.5 Hr",
                    Icons.timer_rounded,
                  ),

                  const SizedBox(height: 18),

                  _buildActivityTile(
                    "Revision Sessions",
                    "4",
                    Icons.refresh_rounded,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopStat(
      String title,
      String value,
      ) {

    return Container(

      padding:
      const EdgeInsets.symmetric(
        vertical: 16,
      ),

      decoration: BoxDecoration(

        color:
        Colors.white.withValues(
          alpha: 0.12,
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

              fontSize: 18,

              fontWeight:
              FontWeight.w800,

              color: Colors.white,
            ),
          ),

          const SizedBox(height: 4),

          Text(

            title,

            style:
            GoogleFonts.poppins(

              fontSize: 11,

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

  Widget _buildSubjectCard(
      String subject,
      String accuracy,
      double progress,
      ) {

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

            blurRadius: 10,

            offset:
            const Offset(0, 5),
          ),
        ],
      ),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Row(

            children: [

              Expanded(

                child: Text(

                  subject,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 16,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors.textPrimary,
                  ),
                ),
              ),

              Text(

                accuracy,

                style:
                GoogleFonts.poppins(

                  fontSize: 14,

                  fontWeight:
                  FontWeight.w700,

                  color:
                  AppColors.primary,
                ),
              ),
            ],
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

              minHeight: 12,

              backgroundColor:
              AppColors.primary.withValues(
                alpha: 0.10,
              ),

              color:
              AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityTile(
      String title,
      String value,
      IconData icon,
      ) {

    return Row(

      children: [

        Container(

          width: 52,
          height: 52,

          decoration: BoxDecoration(

            gradient:
            AppColors.primaryGradient,

            borderRadius:
            BorderRadius.circular(
              18,
            ),
          ),

          child: Icon(
            icon,
            color: Colors.white,
          ),
        ),

        const SizedBox(width: 16),

        Expanded(

          child: Text(

            title,

            style:
            GoogleFonts.poppins(

              fontSize: 14,

              fontWeight:
              FontWeight.w600,

              color:
              AppColors.textPrimary,
            ),
          ),
        ),

        Text(

          value,

          style:
          GoogleFonts.poppins(

            fontSize: 15,

            fontWeight:
            FontWeight.w700,

            color:
            AppColors.primary,
          ),
        ),
      ],
    );
  }
}