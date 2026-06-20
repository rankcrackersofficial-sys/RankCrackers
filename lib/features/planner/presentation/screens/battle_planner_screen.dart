import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class AiStudyPlannerScreen extends StatelessWidget {

  const AiStudyPlannerScreen({super.key});

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

          "Smart Study Planner",

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

            // HERO SECTION

            Container(

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

                      const Icon(

                        Icons.auto_awesome_rounded,

                        color: Colors.white,

                        size: 30,
                      ),

                      const SizedBox(width: 12),

                      Expanded(

                        child: Text(

                          "Personalized Study Planner",

                          style:
                          GoogleFonts.poppins(

                            fontSize: 20,

                            fontWeight:
                            FontWeight.w800,

                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  Text(

                    "Daily smart plans based on your weak topics, speed and performance.",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 13,

                      height: 1.6,

                      fontWeight:
                      FontWeight.w500,

                      color:
                      Colors.white.withValues(
                        alpha: 0.84,
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  Row(

                    children: [

                      Expanded(

                        child: _buildTopCard(
                          "Today's Tasks",
                          "08",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildTopCard(
                          "Completed",
                          "05",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildTopCard(
                          "Focus",
                          "82%",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Text(

              "Today's Plan",

              style:
              GoogleFonts.poppins(

                fontSize: 18,

                fontWeight:
                FontWeight.w800,

                color:
                AppColors.textPrimary,
              ),
            ),

            const SizedBox(height: 18),

            _buildTaskCard(
              "Modern History Revision",
              "2 Hours",
              true,
            ),

            _buildTaskCard(
              "Polity MCQ Practice",
              "50 Questions",
              true,
            ),

            _buildTaskCard(
              "Science Weak Topics",
              "1.5 Hours",
              false,
            ),

            _buildTaskCard(
              "Mock Test Analysis",
              "45 Minutes",
              false,
            ),

            const SizedBox(height: 28),

            Text(

              "Weekly Insights",

              style:
              GoogleFonts.poppins(

                fontSize: 18,

                fontWeight:
                FontWeight.w800,

                color:
                AppColors.textPrimary,
              ),
            ),

            const SizedBox(height: 18),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Study Hours",
                    "42h",
                    Icons.timer_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Consistency",
                    "89%",
                    Icons.local_fire_department_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Weak Topics",
                    "07",
                    Icons.warning_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Rank Boost",
                    "+12",
                    Icons.trending_up_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopCard(
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
          alpha: 0.14,
        ),

        borderRadius:
        BorderRadius.circular(
          18,
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

          const SizedBox(height: 6),

          Text(

            title,

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

  Widget _buildTaskCard(
      String title,
      String subtitle,
      bool completed,
      ) {

    return Container(

      margin:
      const EdgeInsets.only(
        bottom: 14,
      ),

      padding:
      const EdgeInsets.all(18),

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(
          24,
        ),

        border: Border.all(

          color:
          AppColors.border
              .withValues(
            alpha: 0.4,
          ),
        ),
      ),

      child: Row(

        children: [

          Container(

            width: 56,

            height: 56,

            decoration: BoxDecoration(

              gradient:
              completed
                  ? AppColors.primaryGradient
                  : LinearGradient(
                colors: [
                  Colors.orange.shade400,
                  Colors.deepOrange.shade400,
                ],
              ),

              borderRadius:
              BorderRadius.circular(
                18,
              ),
            ),

            child: Icon(

              completed
                  ? Icons.check_rounded
                  : Icons.schedule_rounded,

              color: Colors.white,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(

                  title,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 15,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors.textPrimary,
                  ),
                ),

                const SizedBox(height: 6),

                Text(

                  subtitle,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

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
              horizontal: 14,
              vertical: 8,
            ),

            decoration: BoxDecoration(

              color:
              completed
                  ? Colors.green.withValues(
                alpha: 0.12,
              )
                  : Colors.orange.withValues(
                alpha: 0.12,
              ),

              borderRadius:
              BorderRadius.circular(
                14,
              ),
            ),

            child: Text(

              completed
                  ? "Done"
                  : "Pending",

              style:
              GoogleFonts.poppins(

                fontSize: 11,

                fontWeight:
                FontWeight.w700,

                color:
                completed
                    ? Colors.green
                    : Colors.orange,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniCard(
      String title,
      String value,
      IconData icon,
      ) {

    return Container(

      padding:
      const EdgeInsets.all(20),

      decoration: BoxDecoration(

        gradient:
        AppColors.primaryGradient,

        borderRadius:
        BorderRadius.circular(
          26,
        ),
      ),

      child: Column(

        children: [

          Icon(

            icon,

            color: Colors.white,

            size: 28,
          ),

          const SizedBox(height: 14),

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

          const SizedBox(height: 6),

          Text(

            title,

            style:
            GoogleFonts.poppins(

              fontSize: 12,

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