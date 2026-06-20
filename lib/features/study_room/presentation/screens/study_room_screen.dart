import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class StudyRoomScreen extends StatelessWidget {

  const StudyRoomScreen({super.key});

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

          "Study Room",

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

                        Icons.school_rounded,

                        color: Colors.white,

                        size: 30,
                      ),

                      const SizedBox(width: 12),

                      Expanded(

                        child: Text(

                          "Focused Learning Zone",

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

                  const SizedBox(height: 16),

                  Text(

                    "Stay focused with live study sessions and productivity tracking.",

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
                          "Live Users",
                          "12.8K",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildTopCard(
                          "Rooms",
                          "324",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildTopCard(
                          "Focus Time",
                          "4.5h",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Text(

              "Active Study Rooms",

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

            _buildRoomCard(
              "History Marathon",
              "1.2K Students Active",
              Icons.history_edu_rounded,
            ),

            _buildRoomCard(
              "Polity Practice Room",
              "842 Students Active",
              Icons.gavel_rounded,
            ),

            _buildRoomCard(
              "Science Revision",
              "932 Students Active",
              Icons.science_rounded,
            ),

            _buildRoomCard(
              "Night Study Group",
              "2.8K Students Active",
              Icons.nightlight_round,
            ),

            const SizedBox(height: 28),

            Text(

              "Today's Productivity",

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
                    "Sessions",
                    "08",
                    Icons.play_circle_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Focus",
                    "92%",
                    Icons.center_focus_strong_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Hours",
                    "6.2h",
                    Icons.timer_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Rank",
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

  Widget _buildRoomCard(
      String title,
      String subtitle,
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

            child: Icon(

              icon,

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