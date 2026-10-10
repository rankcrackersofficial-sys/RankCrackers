import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/tactical_noir_background.dart';

class BattleArenaScreen extends StatelessWidget {

  const BattleArenaScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor:
      AppColors.background,

      appBar: AppBar(

        elevation: 0,

        backgroundColor:
        AppColors.primary,

        title: Text(

          "Battle Arena",

          style:
          GoogleFonts.poppins(

            fontWeight:
            FontWeight.w700,

            color: Colors.white,
          ),
        ),
      ),

      body: TacticalNoirBackground(
        child: SingleChildScrollView(

        physics:
        const BouncingScrollPhysics(),

        padding:
        const EdgeInsets.all(20),

        child: Column(

          crossAxisAlignment:
          CrossAxisAlignment.start,

          children: [

            // LIVE BATTLE CARD

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

                      Container(

                        padding:
                        const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),

                        decoration: BoxDecoration(

                          color:
                          Colors.red,

                          borderRadius:
                          BorderRadius.circular(
                            12,
                          ),
                        ),

                        child: Text(

                          "LIVE",

                          style:
                          GoogleFonts.poppins(

                            fontSize: 11,

                            fontWeight:
                            FontWeight.w700,

                            color: Colors.white,
                          ),
                        ),
                      ),

                      const Spacer(),

                      const Icon(

                        Icons.local_fire_department_rounded,

                        color: Colors.white,
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  Text(

                    "Modern History Sprint",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 22,

                      fontWeight:
                      FontWeight.w800,

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Text(

                    "Compete with real aspirants in live battle mode",

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

                  Row(

                    children: [

                      Expanded(

                        child: _buildLiveStat(
                          "Players",
                          "1,248",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildLiveStat(
                          "Questions",
                          "30",
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: _buildLiveStat(
                          "Prize",
                          "500 XP",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Text(

              "Upcoming Battles",

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

            _buildBattleCard(
              "Indian Polity Clash",
              "Today • 7:30 PM",
              "824 Players Joined",
            ),

            _buildBattleCard(
              "Science Rapid Fire",
              "Today • 9:00 PM",
              "612 Players Joined",
            ),

            _buildBattleCard(
              "Rajasthan GK Challenge",
              "Tomorrow • 6:00 PM",
              "1,120 Players Joined",
            ),

            const SizedBox(height: 28),

            Text(

              "Your Arena Stats",

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
                    "Rank",
                    "#82",
                    Icons.emoji_events_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Wins",
                    "34",
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
                    "XP",
                    "4.8K",
                    Icons.flash_on_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Accuracy",
                    "78%",
                    Icons.analytics_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildLiveStat(
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

              fontSize: 17,

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

  Widget _buildBattleCard(
      String title,
      String time,
      String players,
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

              Icons.sports_esports_rounded,

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

                  time,

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

                  players,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 11,

                    fontWeight:
                    FontWeight.w600,

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