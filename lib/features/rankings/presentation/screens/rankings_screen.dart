import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class RankingsScreen extends StatelessWidget {

  const RankingsScreen({super.key});

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

          "National Rankings",

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

                        Icons.emoji_events_rounded,

                        color: Colors.white,

                        size: 30,
                      ),

                      const SizedBox(width: 12),

                      Expanded(

                        child: Text(

                          "Your National Position",

                          style:
                          GoogleFonts.poppins(

                            fontSize: 21,

                            fontWeight:
                            FontWeight.w800,

                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  Center(

                    child: Column(

                      children: [

                        Text(

                          "#82",

                          style:
                          GoogleFonts.poppins(

                            fontSize: 54,

                            fontWeight:
                            FontWeight.w900,

                            color: Colors.white,
                          ),
                        ),

                        const SizedBox(height: 8),

                        Text(

                          "Top 3% Aspirants",

                          style:
                          GoogleFonts.poppins(

                            fontSize: 14,

                            fontWeight:
                            FontWeight.w600,

                            color:
                            Colors.white.withValues(
                              alpha: 0.84,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  Row(

                    children: [

                      Expanded(

                        child: _buildStatCard(
                          "Score",
                          "742",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildStatCard(
                          "Tests",
                          "24",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildStatCard(
                          "Accuracy",
                          "78%",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Text(

              "Top Performers",

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

            _buildRankCard(
              "#1",
              "Aarav Sharma",
              "98% Accuracy",
              Icons.workspace_premium_rounded,
            ),

            _buildRankCard(
              "#2",
              "Priyanshu Raj",
              "96% Accuracy",
              Icons.workspace_premium_rounded,
            ),

            _buildRankCard(
              "#3",
              "Kunal Verma",
              "95% Accuracy",
              Icons.workspace_premium_rounded,
            ),

            _buildRankCard(
              "#82",
              "You",
              "78% Accuracy",
              Icons.local_fire_department_rounded,
            ),

            const SizedBox(height: 28),

            Text(

              "This Week",

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
                    "Rank Boost",
                    "+12",
                    Icons.trending_up_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "XP Earned",
                    "480",
                    Icons.flash_on_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Win Rate",
                    "81%",
                    Icons.analytics_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Streak",
                    "26",
                    Icons.local_fire_department_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
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

  Widget _buildRankCard(
      String rank,
      String name,
      String score,
      IconData icon,
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

            width: 58,

            height: 58,

            decoration: BoxDecoration(

              gradient:
              AppColors.primaryGradient,

              borderRadius:
              BorderRadius.circular(
                18,
              ),
            ),

            child: Center(

              child: Text(

                rank,

                style:
                GoogleFonts.poppins(

                  fontSize: 16,

                  fontWeight:
                  FontWeight.w800,

                  color: Colors.white,
                ),
              ),
            ),
          ),

          const SizedBox(width: 16),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(

                  name,

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

                  score,

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

          Icon(

            icon,

            color:
            AppColors.primary,

            size: 28,
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