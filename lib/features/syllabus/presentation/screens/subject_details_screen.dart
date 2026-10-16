import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

import '../../domain/models/subject_model.dart';

import '../widgets/subject_topic_tile.dart';

class SubjectDetailsScreen
    extends StatelessWidget {

  final SubjectModel subject;

  const SubjectDetailsScreen({

    super.key,

    required this.subject,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(

      backgroundColor:
      scheme.surface,

      appBar: AppBar(

        elevation: 0,

        backgroundColor:
        AppColors.primary,

        title: Text(

          subject.name,

          style:
          GoogleFonts.poppins(

            fontWeight:
            FontWeight.w700,

            color: scheme.onPrimary,
          ),
        ),
      ),

      body: SingleChildScrollView(

        padding:
        const EdgeInsets.all(20),

        child: Column(

          crossAxisAlignment:
          CrossAxisAlignment.start,

          children: [

            // =========================
            // HEADER CARD
            // =========================

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

                    subject.icon,

                    style:
                    const TextStyle(
                      fontSize: 42,
                    ),
                  ),

                  const SizedBox(
                    height: 14,
                  ),

                  Text(

                    subject.name,

                    style:
                    GoogleFonts.poppins(

                      fontSize: 24,

                      fontWeight:
                      FontWeight.w800,

                      color:
                      scheme.onPrimary,
                    ),
                  ),

                  const SizedBox(
                    height: 10,
                  ),

                  Text(

                    "${subject.completedQuestions} / ${subject.totalQuestions} Questions Completed",

                    style:
                    GoogleFonts.poppins(

                      fontSize: 12,

                      color:
                      scheme.onPrimary
                          .withValues(
                        alpha: 0.82,
                      ),
                    ),
                  ),

                  const SizedBox(
                    height: 22,
                  ),

                  ClipRRect(

                    borderRadius:
                    BorderRadius.circular(
                      20,
                    ),

                    child:
                    LinearProgressIndicator(

                      value:
                      subject.completedQuestions /
                          subject.totalQuestions,

                      minHeight: 14,

                      backgroundColor:
                      scheme.onPrimary
                          .withValues(
                        alpha: 0.18,
                      ),

                      color:
                      scheme.onPrimary,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            Text(

              "Topics",

              style:
              GoogleFonts.poppins(

                fontSize: 20,

                fontWeight:
                FontWeight.w800,

                color:
                scheme.onSurface,
              ),
            ),

            const SizedBox(height: 18),

            ...subject.topics.map(

                  (topic) {

                return SubjectTopicTile(

                  topic: topic,

                  completed:
                  subject.accuracy >
                      0.60,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
