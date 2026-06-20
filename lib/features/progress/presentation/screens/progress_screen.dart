import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class ProgressScreen extends StatelessWidget {

  const ProgressScreen({super.key});

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

          "Progress Analytics",

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

            // OVERVIEW CARD

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

                  Text(

                    "Overall Performance",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 20,

                      fontWeight:
                      FontWeight.w800,

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Text(

                    "Your preparation is improving consistently",

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

                  const SizedBox(height: 24),

                  ClipRRect(

                    borderRadius:
                    BorderRadius.circular(
                      20,
                    ),

                    child:
                    LinearProgressIndicator(

                      value: 0.72,

                      minHeight: 14,

                      backgroundColor:
                      Colors.white.withValues(
                        alpha: 0.15,
                      ),

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 16),

                  Text(

                    "72% Completed",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 14,

                      fontWeight:
                      FontWeight.w700,

                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Text(

              "Subject Accuracy",

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

            _buildSubjectCard(
              "History",
              "42%",
            ),

            _buildSubjectCard(
              "Polity",
              "68%",
            ),

            _buildSubjectCard(
              "Science",
              "74%",
            ),

            _buildSubjectCard(
              "Reasoning",
              "82%",
            ),

            const SizedBox(height: 28),

            Text(

              "Weekly Stats",

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
                    "Tests",
                    "24",
                    Icons.quiz_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Study Hours",
                    "52h",
                    Icons.timer_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Rank",
                    "#82",
                    Icons.emoji_events_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Accuracy",
                    "71%",
                    Icons.analytics_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectCard(
      String subject,
      String accuracy,
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

            width: 52,

            height: 52,

            decoration: BoxDecoration(

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                16,
              ),
            ),

            child: const Icon(

              Icons.menu_book_rounded,

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

                  subject,

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

                ClipRRect(

                  borderRadius:
                  BorderRadius.circular(
                    20,
                  ),

                  child:
                  LinearProgressIndicator(

                    value:
                    double.parse(
                      accuracy.replaceAll(
                        "%",
                        "",
                      ),
                    ) /
                        100,

                    minHeight: 8,

                    backgroundColor:
                    AppColors.primary
                        .withValues(
                      alpha: 0.08,
                    ),

                    color:
                    AppColors.primary,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 16),

          Text(

            accuracy,

            style:
            GoogleFonts.poppins(

              fontSize: 16,

              fontWeight:
              FontWeight.w800,

              color:
              AppColors.primary,
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