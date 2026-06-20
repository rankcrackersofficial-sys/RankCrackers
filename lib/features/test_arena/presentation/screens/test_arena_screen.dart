import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class TestArenaScreen extends StatelessWidget {
  const TestArenaScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final List<Map<String, dynamic>> tests = [

      {
        "title": "RAS Full Test",
        "questions": "150 Questions",
        "time": "180 Min",
      },

      {
        "title": "Polity Mega Test",
        "questions": "50 Questions",
        "time": "60 Min",
      },

      {
        "title": "Reasoning Sprint",
        "questions": "30 Questions",
        "time": "25 Min",
      },

      {
        "title": "History Rapid Quiz",
        "questions": "25 Questions",
        "time": "20 Min",
      },

      {
        "title": "Current Affairs",
        "questions": "40 Questions",
        "time": "35 Min",
      },
    ];

    return Scaffold(

      backgroundColor:
      const Color(0xFFF4F8FF),

      appBar: AppBar(

        elevation: 0,

        backgroundColor:
        AppColors.primary,

        title: Text(

          "Test Arena",

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

            // =========================================
            // TOP CARD
            // =========================================

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

                    "Compete. Improve. Dominate.",

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

                    "Real exam-like test environment",

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

                  const SizedBox(height: 26),

                  Row(

                    children: [

                      Expanded(
                        child: _buildStatCard(
                          "Tests",
                          "248",
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildStatCard(
                          "Accuracy",
                          "78%",
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildStatCard(
                          "Rank",
                          "#82",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            Text(

              "Available Tests",

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

            ListView.builder(

              shrinkWrap: true,

              physics:
              const NeverScrollableScrollPhysics(),

              itemCount:
              tests.length,

              itemBuilder:
                  (context, index) {

                final test =
                tests[index];

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

                  child: Row(

                    children: [

                      Container(

                        width: 62,
                        height: 62,

                        decoration: BoxDecoration(

                          gradient:
                          AppColors.primaryGradient,

                          borderRadius:
                          BorderRadius.circular(
                            20,
                          ),
                        ),

                        child: const Icon(

                          Icons.bolt_rounded,

                          color: Colors.white,

                          size: 30,
                        ),
                      ),

                      const SizedBox(width: 16),

                      Expanded(

                        child: Column(

                          crossAxisAlignment:
                          CrossAxisAlignment.start,

                          children: [

                            Text(

                              test["title"],

                              style:
                              GoogleFonts.poppins(

                                fontSize: 16,

                                fontWeight:
                                FontWeight.w700,

                                color:
                                AppColors.textPrimary,
                              ),
                            ),

                            const SizedBox(
                              height: 6,
                            ),

                            Text(

                              "${test["questions"]} • ${test["time"]}",

                              style:
                              GoogleFonts.poppins(

                                fontSize: 12,

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
                          horizontal: 18,
                          vertical: 12,
                        ),

                        decoration: BoxDecoration(

                          gradient:
                          AppColors.primaryGradient,

                          borderRadius:
                          BorderRadius.circular(
                            16,
                          ),
                        ),

                        child: Text(

                          "Start",

                          style:
                          GoogleFonts.poppins(

                            fontWeight:
                            FontWeight.w700,

                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
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
}