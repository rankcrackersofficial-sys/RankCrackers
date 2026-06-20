import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class WeakTopicCard
    extends StatelessWidget {

  final String topicName;

  final String subjectName;

  final double accuracy;

  const WeakTopicCard({

    super.key,

    required this.topicName,

    required this.subjectName,

    required this.accuracy,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      margin:
      const EdgeInsets.only(
        bottom: 16,
      ),

      padding:
      const EdgeInsets.all(18),

      decoration: BoxDecoration(

        gradient:
        LinearGradient(

          begin: Alignment.topLeft,

          end: Alignment.bottomRight,

          colors: [

            const Color(0xFF4F7DFF),

            const Color(0xFF315EFb),
          ],
        ),

        borderRadius:
        BorderRadius.circular(
          24,
        ),
      ),

      child: Row(

        children: [

          Container(

            width: 54,

            height: 54,

            decoration: BoxDecoration(

              color:
              Colors.white.withValues(
                alpha: 0.16,
              ),

              borderRadius:
              BorderRadius.circular(
                18,
              ),
            ),

            child: const Icon(

              Icons.warning_amber_rounded,

              color: Colors.white,

              size: 28,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(

                  topicName,

                  maxLines: 1,

                  overflow:
                  TextOverflow.ellipsis,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 16,

                    fontWeight:
                    FontWeight.w700,

                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 4),

                Text(

                  subjectName,

                  style:
                  GoogleFonts.poppins(

                    fontSize: 12,

                    fontWeight:
                    FontWeight.w500,

                    color:
                    Colors.white
                        .withValues(
                      alpha: 0.82,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          Column(

            children: [

              Text(

                "${(accuracy * 100).toInt()}%",

                style:
                GoogleFonts.poppins(

                  fontSize: 18,

                  fontWeight:
                  FontWeight.w800,

                  color: Colors.white,
                ),
              ),

              Text(

                "Accuracy",

                style:
                GoogleFonts.poppins(

                  fontSize: 10,

                  fontWeight:
                  FontWeight.w500,

                  color:
                  Colors.white
                      .withValues(
                    alpha: 0.78,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}