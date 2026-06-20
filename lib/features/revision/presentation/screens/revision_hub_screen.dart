import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class RevisionHubScreen extends StatelessWidget {

  const RevisionHubScreen({super.key});

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

          "Revision Hub",

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

                        Icons.refresh_rounded,

                        color: Colors.white,

                        size: 30,
                      ),

                      const SizedBox(width: 12),

                      Expanded(

                        child: Text(

                          "Daily Revision System",

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

                    "Revise smarter with quick revision targets and memory boosting sessions.",

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
                          "Today's Revision",
                          "68%",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildTopCard(
                          "Pending",
                          "12",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildTopCard(
                          "Completed",
                          "24",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Text(

              "Revision Targets",

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

            _buildRevisionCard(
              "Modern History",
              "Revolt & Congress Sessions",
              "82%",
            ),

            _buildRevisionCard(
              "Indian Polity",
              "Fundamental Rights",
              "76%",
            ),

            _buildRevisionCard(
              "Science Biology",
              "Human Body System",
              "64%",
            ),

            _buildRevisionCard(
              "Geography",
              "Indian Rivers & Soil",
              "71%",
            ),

            const SizedBox(height: 28),

            Text(

              "Revision Insights",

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
                    "Retention",
                    "84%",
                    Icons.psychology_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Speed",
                    "1.4x",
                    Icons.speed_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Streak",
                    "18 Days",
                    Icons.local_fire_department_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Memory",
                    "Strong",
                    Icons.workspace_premium_rounded,
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

            textAlign: TextAlign.center,

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

  Widget _buildRevisionCard(
      String title,
      String subtitle,
      String progress,
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
          AppColors.border.withValues(
            alpha: 0.4,
          ),
        ),
      ),

      child: Column(

        children: [

          Row(

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

              Text(

                progress,

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

          const SizedBox(height: 16),

          ClipRRect(

            borderRadius:
            BorderRadius.circular(
              20,
            ),

            child:
            LinearProgressIndicator(

              value:
              double.parse(
                progress.replaceAll(
                  "%",
                  "",
                ),
              ) /
                  100,

              minHeight: 10,

              backgroundColor:
              AppColors.border,

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

            textAlign: TextAlign.center,

            style:
            GoogleFonts.poppins(

              fontSize: 20,

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