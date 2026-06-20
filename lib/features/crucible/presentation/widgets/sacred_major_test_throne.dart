import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/dark_card.dart';

class SacredMajorTestThrone
    extends StatefulWidget {

  final String title;

  final double readiness;

  final int masteredTopics;

  final int rebuildTopics;

  final int totalTests;

  final Duration remainingTime;

  const SacredMajorTestThrone({

    super.key,

    required this.title,

    required this.readiness,

    required this.masteredTopics,

    required this.rebuildTopics,

    required this.totalTests,

    required this.remainingTime,
  });

  @override
  State<SacredMajorTestThrone>
  createState() =>
      _SacredMajorTestThroneState();
}

class _SacredMajorTestThroneState
    extends State<
        SacredMajorTestThrone>
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
        seconds: 6,
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

  String get formattedTime {

    final days =
        widget.remainingTime.inDays;

    final hours =
    widget.remainingTime.inHours
        .remainder(24);

    final minutes =
    widget.remainingTime
        .inMinutes
        .remainder(60);

    return
      '${days}D '
          '${hours.toString().padLeft(2, '0')}H '
          '${minutes.toString().padLeft(2, '0')}M';
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
            0.22 +
                (pulse.abs() *
                    0.16);

        return DarkCard(

          padding:
          const EdgeInsets.all(
            30,
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
                  alpha: 0.10,
                ),

                const Color(
                  0xFF8B5CF6,
                ).withValues(
                  alpha: 0.04,
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
                alpha: 0.20,
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

                blurRadius: 40,
                spreadRadius: 4,
              ),
            ],
          ),

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment
                .start,

            children: [

              // =====================
              // HEADER
              // =====================

              Row(

                children: [

                  Container(

                    height: 72,
                    width: 72,

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
                            alpha: 0.34,
                          ),

                          Colors
                              .transparent,
                        ],
                      ),
                    ),

                    child: const Icon(

                      Icons
                          .workspace_premium_rounded,

                      color:
                      Color(
                        0xFFD4AF37,
                      ),

                      size: 38,
                    ),
                  ),

                  const SizedBox(
                    width: 20,
                  ),

                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        Text(

                          'Major Test Throne',

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            Colors.white,

                            fontSize: 24,

                            fontWeight:
                            FontWeight.w700,
                          ),
                        ),

                        const SizedBox(
                          height: 6,
                        ),

                        Text(

                          widget.title,

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors
                                .white60,

                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 42,
              ),

              // =====================
              // THRONE CORE
              // =====================

              Center(

                child: Container(

                  height: 240,
                  width: 240,

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
                          alpha:
                          0.38,
                        ),

                        Colors
                            .transparent,
                      ],
                    ),

                    boxShadow: [

                      BoxShadow(

                        color:
                        const Color(
                          0xFFD4AF37,
                        ).withValues(
                          alpha:
                          glow,
                        ),

                        blurRadius:
                        44,

                        spreadRadius:
                        6,
                      ),
                    ],
                  ),

                  child: Center(

                    child: Column(

                      mainAxisAlignment:
                      MainAxisAlignment
                          .center,

                      children: [

                        Text(

                          '${widget.readiness.toInt()}%',

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            Colors.white,

                            fontSize: 44,

                            fontWeight:
                            FontWeight.w700,
                          ),
                        ),

                        const SizedBox(
                          height: 10,
                        ),

                        Text(

                          'Final Readiness',

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors
                                .white60,

                            fontSize: 12,
                          ),
                        ),

                        const SizedBox(
                          height: 16,
                        ),

                        Text(

                          formattedTime,

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            const Color(
                              0xFFD4AF37,
                            ),

                            fontSize: 16,

                            letterSpacing:
                            1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: 40,
              ),

              // =====================
              // METRICS
              // =====================

              Row(

                children: [

                  Expanded(

                    child:
                    _MetricCard(

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

                  const SizedBox(
                    width: 16,
                  ),

                  Expanded(

                    child:
                    _MetricCard(

                      title:
                      'Rebuild',

                      value:
                      widget
                          .rebuildTopics
                          .toString(),

                      color:
                      const Color(
                        0xFFFF6B6B,
                      ),
                    ),
                  ),

                  const SizedBox(
                    width: 16,
                  ),

                  Expanded(

                    child:
                    _MetricCard(

                      title:
                      'Tests',

                      value:
                      widget
                          .totalTests
                          .toString(),

                      color:
                      const Color(
                        0xFF8B5CF6,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 34,
              ),

              // =====================
              // FOOTER
              // =====================

              Container(

                padding:
                const EdgeInsets.all(
                  18,
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

                child: Row(

                  children: [

                    Container(

                      height: 14,
                      width: 14,

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        color:
                        const Color(
                          0xFFD4AF37,
                        ),

                        boxShadow: [

                          BoxShadow(

                            color:
                            const Color(
                              0xFFD4AF37,
                            ).withValues(
                              alpha:
                              0.7,
                            ),

                            blurRadius:
                            16,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                      width: 14,
                    ),

                    Expanded(

                      child: Text(

                        'The final reckoning approaches.',

                        style:
                        GoogleFonts
                            .poppins(

                          color:
                          Colors.white70,

                          fontSize: 12,
                        ),
                      ),
                    ),

                    Text(

                      'DAY 99',

                      style:
                      GoogleFonts
                          .cinzel(

                        color:
                        const Color(
                          0xFFD4AF37,
                        ),

                        fontSize: 11,

                        letterSpacing:
                        1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// =========================================================
// METRIC CARD
// =========================================================

class _MetricCard
    extends StatelessWidget {

  final String title;

  final String value;

  final Color color;

  const _MetricCard({

    required this.title,

    required this.value,

    required this.color,
  });

  @override
  Widget build(
      BuildContext context,
      ) {

    return DarkCard(

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

        boxShadow: [

          BoxShadow(

            color:
            color.withValues(
              alpha: 0.10,
            ),

            blurRadius: 20,
          ),
        ],
      ),

      child: Column(

        children: [

          Text(

            value,

            style:
            GoogleFonts.cinzel(

              color:
              Colors.white,

              fontSize: 24,

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