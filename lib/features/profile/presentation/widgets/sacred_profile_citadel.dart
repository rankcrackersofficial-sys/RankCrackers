import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SacredProfileCitadel
    extends StatefulWidget {

  final String warriorName;

  final String title;

  final double readiness;

  final int battlesWon;

  final int rebuildCycles;

  final int masteredTopics;

  const SacredProfileCitadel({

    super.key,

    required this.warriorName,

    required this.title,

    required this.readiness,

    required this.battlesWon,

    required this.rebuildCycles,

    required this.masteredTopics,
  });

  @override
  State<SacredProfileCitadel>
  createState() =>
      _SacredProfileCitadelState();
}

class _SacredProfileCitadelState
    extends State<
        SacredProfileCitadel>
    with
        SingleTickerProviderStateMixin {

  late AnimationController
  _controller;

  @override
  void initState() {

    super.initState();

    _controller =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 5,
      ),
    )..repeat(
      reverse: true,
    );
  }

  @override
  void dispose() {

    _controller.dispose();

    super.dispose();
  }

  @override
  Widget build(
      BuildContext context,
      ) {

    return AnimatedBuilder(

      animation: _controller,

      builder:
          (context, child) {

        final pulse =
        sin(
          _controller.value *
              2 *
              pi,
        );

        final glow =
            0.16 +
                (pulse.abs() *
                    0.12);

        return Container(

          padding:
          const EdgeInsets.all(
            28,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              38,
            ),

            gradient:
            LinearGradient(

              begin:
              Alignment.topLeft,

              end:
              Alignment.bottomRight,

              colors: [

                const Color(
                  0xFFD4AF37,
                ).withValues(
                  alpha: 0.08,
                ),

                Colors.white
                    .withValues(
                  alpha: 0.02,
                ),
              ],
            ),

            border: Border.all(

              color:
              const Color(
                0xFFD4AF37,
              ).withValues(
                alpha: 0.18,
              ),
            ),

            boxShadow: [

              BoxShadow(

                color:
                const Color(
                  0xFFD4AF37,
                ).withValues(
                  alpha: glow,
                ),

                blurRadius: 36,
                spreadRadius: 3,
              ),
            ],
          ),

          child: Column(

            children: [

              // =====================
              // AVATAR CORE
              // =====================

              Container(

                height: 140,
                width: 140,

                decoration:
                BoxDecoration(

                  shape:
                  BoxShape.circle,

                  gradient:
                  RadialGradient(

                    colors: [

                      const Color(
                        0xFFD4AF37,
                      ).withValues(
                        alpha: 0.36,
                      ),

                      Colors.transparent,
                    ],
                  ),

                  boxShadow: [

                    BoxShadow(

                      color:
                      const Color(
                        0xFFD4AF37,
                      ).withValues(
                        alpha: glow,
                      ),

                      blurRadius: 40,
                      spreadRadius: 5,
                    ),
                  ],
                ),

                child: Center(

                  child: Text(

                    widget.warriorName
                        .substring(0, 1)
                        .toUpperCase(),

                    style:
                    GoogleFonts.cinzel(

                      color:
                      Colors.white,

                      fontSize: 56,

                      fontWeight:
                      FontWeight.w700,
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: 28,
              ),

              // =====================
              // NAME
              // =====================

              Text(

                widget.warriorName,

                style:
                GoogleFonts.cinzel(

                  color: Colors.white,

                  fontSize: 28,

                  fontWeight:
                  FontWeight.w700,
                ),
              ),

              const SizedBox(
                height: 8,
              ),

              Text(

                widget.title,

                style:
                GoogleFonts.poppins(

                  color:
                  const Color(
                    0xFFD4AF37,
                  ),

                  fontSize: 14,

                  fontWeight:
                  FontWeight.w500,
                ),
              ),

              const SizedBox(
                height: 34,
              ),

              // =====================
              // READINESS CORE
              // =====================

              Container(

                padding:
                const EdgeInsets.symmetric(

                  horizontal: 28,
                  vertical: 18,
                ),

                decoration:
                BoxDecoration(

                  borderRadius:
                  BorderRadius.circular(
                    24,
                  ),

                  color:
                  Colors.black
                      .withValues(
                    alpha: 0.24,
                  ),
                ),

                child: Column(

                  children: [

                    Text(

                      '${widget.readiness.toInt()}%',

                      style:
                      GoogleFonts.cinzel(

                        color:
                        const Color(
                          0xFF5EDC8D,
                        ),

                        fontSize: 34,

                        fontWeight:
                        FontWeight.w700,
                      ),
                    ),

                    const SizedBox(
                      height: 6,
                    ),

                    Text(

                      'Battle Readiness',

                      style:
                      GoogleFonts.poppins(

                        color:
                        Colors.white60,

                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(
                height: 34,
              ),

              // =====================
              // METRICS
              // =====================

              Row(

                children: [

                  Expanded(

                    child:
                    _ProfileMetric(

                      title:
                      'Battles',

                      value:
                      widget
                          .battlesWon
                          .toString(),

                      color:
                      const Color(
                        0xFFD4AF37,
                      ),
                    ),
                  ),

                  const SizedBox(
                    width: 14,
                  ),

                  Expanded(

                    child:
                    _ProfileMetric(

                      title:
                      'Rebuilds',

                      value:
                      widget
                          .rebuildCycles
                          .toString(),

                      color:
                      const Color(
                        0xFFFF6B6B,
                      ),
                    ),
                  ),

                  const SizedBox(
                    width: 14,
                  ),

                  Expanded(

                    child:
                    _ProfileMetric(

                      title:
                      'Mastered',

                      value:
                      widget
                          .masteredTopics
                          .toString(),

                      color:
                      const Color(
                        0xFF5EDC8D,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 32,
              ),

              // =====================
              // FOOTER
              // =====================

              Text(

                'Forged through discipline and sacred battles.',

                textAlign:
                TextAlign.center,

                style:
                GoogleFonts.cinzel(

                  color:
                  Colors.white54,

                  fontSize: 11,

                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// =========================================
// PROFILE METRIC
// =========================================

class _ProfileMetric
    extends StatelessWidget {

  final String title;

  final String value;

  final Color color;

  const _ProfileMetric({

    required this.title,

    required this.value,

    required this.color,
  });

  @override
  Widget build(
      BuildContext context,
      ) {

    return Container(

      padding:
      const EdgeInsets.all(
        18,
      ),

      decoration:
      BoxDecoration(

        borderRadius:
        BorderRadius.circular(
          22,
        ),

        color:
        Colors.white.withValues(
          alpha: 0.03,
        ),

        border: Border.all(

          color:
          color.withValues(
            alpha: 0.16,
          ),
        ),
      ),

      child: Column(

        children: [

          Text(

            value,

            style:
            GoogleFonts.cinzel(

              color:
              Colors.white,

              fontSize: 22,

              fontWeight:
              FontWeight.w700,
            ),
          ),

          const SizedBox(
            height: 8,
          ),

          Text(

            title,

            style:
            GoogleFonts.poppins(

              color:
              Colors.white60,

              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}