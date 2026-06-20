import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class RevisionDeskScreen extends StatelessWidget {

  const RevisionDeskScreen({super.key});

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

          "Revision Desk",

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

            // SMART REVISION CARD

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

                    "Smart Revision Engine",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 21,

                      fontWeight:
                      FontWeight.w800,

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Text(

                    "Weak topics automatically prioritized",

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

                      value: 0.64,

                      minHeight: 14,

                      backgroundColor:
                      Colors.white.withValues(
                        alpha: 0.15,
                      ),

                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: 14),

                  Text(

                    "64% Revision Completed",

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

              "Priority Revision",

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
              "Ancient History",
              "42% Accuracy",
              "High Priority",
            ),

            _buildRevisionCard(
              "Indian Polity",
              "51% Accuracy",
              "Medium Priority",
            ),

            _buildRevisionCard(
              "Geography Maps",
              "38% Accuracy",
              "High Priority",
            ),

            _buildRevisionCard(
              "Science Biology",
              "61% Accuracy",
              "Low Priority",
            ),

            const SizedBox(height: 28),

            Text(

              "Today's Revision Targets",

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
                    "Topics",
                    "18",
                    Icons.menu_book_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "MCQs",
                    "240",
                    Icons.quiz_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            Row(

              children: [

                Expanded(

                  child: _buildMiniCard(
                    "Revision Time",
                    "3.5h",
                    Icons.timer_rounded,
                  ),
                ),

                const SizedBox(width: 14),

                Expanded(

                  child: _buildMiniCard(
                    "Weak Areas",
                    "07",
                    Icons.warning_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRevisionCard(
      String title,
      String accuracy,
      String priority,
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

              Icons.refresh_rounded,

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

                  accuracy,

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
              horizontal: 12,
              vertical: 8,
            ),

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

            child: Text(

              priority,

              style:
              GoogleFonts.poppins(

                fontSize: 11,

                fontWeight:
                FontWeight.w700,

                color:
                AppColors.primary,
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