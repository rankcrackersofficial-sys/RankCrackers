import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class TestAnalysisScreen extends StatelessWidget {

  const TestAnalysisScreen({super.key});

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

          "Test Analysis",

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

            // HERO CARD

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

                        Icons.insights_rounded,

                        color: Colors.white,

                        size: 30,
                      ),

                      const SizedBox(width: 12),

                      Expanded(

                        child: Text(

                          "Deep Performance Breakdown",

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

                  const SizedBox(height: 18),

                  Text(

                    "Track weak areas, accuracy, speed and test growth in real-time.",

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

                  ClipRRect(

                    borderRadius:
                    BorderRadius.circular(
                      20,
                    ),

                    child:
                    LinearProgressIndicator(

                      value: 0.78,

                      minHeight: 14,

                      backgroundColor:
                      Colors.white.withValues(
                        alpha: 0.16,
                      ),

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 14),

                  Text(

                    "78% Overall Accuracy",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 13,

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

              "Recent Test Reports",

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

            _buildTestCard(
              "Full Mock Test #12",
              "Score: 142 / 200",
              "Accuracy 78%",
            ),

            _buildTestCard(
              "History Subject Test",
              "Score: 84 / 100",
              "Accuracy 82%",
            ),

            _buildTestCard(
              "Polity Speed Test",
              "Score: 72 / 100",
              "Accuracy 69%",
            ),

            _buildTestCard(
              "Science Revision Test",
              "Score: 91 / 120",
              "Accuracy 76%",
            ),

            const SizedBox(height: 28),

            Text(

              "Performance Insights",

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
                    "Weak Topics",
                    "07",
                    Icons.warning_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Strong Areas",
                    "18",
                    Icons.workspace_premium_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Speed",
                    "1.2m",
                    Icons.speed_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "National Rank",
                    "#82",
                    Icons.emoji_events_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTestCard(
      String title,
      String marks,
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

            width: 56,

            height: 56,

            decoration: BoxDecoration(

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                18,
              ),
            ),

            child: const Icon(

              Icons.quiz_rounded,

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

                  marks,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

                    fontWeight:
                    FontWeight.w500,

                    color:
                    AppColors.textSecondary,
                  ),
                ),

                const SizedBox(height: 4),

                Text(

                  accuracy,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 11,

                    fontWeight:
                    FontWeight.w700,

                    color:
                    AppColors.primary,
                  ),
                ),
              ],
            ),
          ),

          Container(

            width: 44,

            height: 44,

            decoration: BoxDecoration(

              color:
              AppColors.primary
                  .withValues(
                alpha: 0.08,
              ),

              borderRadius:
              BorderRadius.circular(
                14,
              ),
            ),

            child: const Icon(

              Icons.arrow_forward_ios_rounded,

              size: 18,

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