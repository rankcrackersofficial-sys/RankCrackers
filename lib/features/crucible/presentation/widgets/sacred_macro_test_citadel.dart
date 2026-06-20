import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/dark_card.dart';

class SacredMacroTestCitadel
    extends StatefulWidget {

  final String title;

  final int totalQuestions;

  final int completedQuestions;

  final Duration remainingTime;

  final double readiness;

  final int rebuildTargets;

  const SacredMacroTestCitadel({

    super.key,

    required this.title,

    required this.totalQuestions,

    required this.completedQuestions,

    required this.remainingTime,

    required this.readiness,

    required this.rebuildTargets,
  });

  @override
  State<SacredMacroTestCitadel>
  createState() =>
      _SacredMacroTestCitadelState();
}

class _SacredMacroTestCitadelState
    extends State<
        SacredMacroTestCitadel>
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

  String get formattedTime {

    final hours =
        widget.remainingTime.inHours;

    final minutes =
    widget.remainingTime
        .inMinutes
        .remainder(60);

    final seconds =
    widget.remainingTime
        .inSeconds
        .remainder(60);

    return
      '${hours.toString().padLeft(2, '0')}:'
          '${minutes.toString().padLeft(2, '0')}:'
          '${seconds.toString().padLeft(2, '0')}';
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
            0.18 +
                (pulse.abs() *
                    0.12);

        final progress =
            widget.completedQuestions /
                widget.totalQuestions;

        return DarkCard(

          padding:
          const EdgeInsets.all(
            28,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              36,
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

                blurRadius: 34,
                spreadRadius: 2,
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

                    height: 64,
                    width: 64,

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
                            alpha: 0.32,
                          ),

                          Colors
                              .transparent,
                        ],
                      ),
                    ),

                    child: const Icon(

                      Icons
                          .castle_rounded,

                      color:
                      Color(
                        0xFFD4AF37,
                      ),

                      size: 34,
                    ),
                  ),

                  const SizedBox(
                    width: 18,
                  ),

                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        Text(

                          'Macro Test Citadel',

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            Colors.white,

                            fontSize: 22,

                            fontWeight:
                            FontWeight.w700,
                          ),
                        ),

                        const SizedBox(
                          height: 4,
                        ),

                        Text(

                          widget.title,

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors
                                .white60,

                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 36,
              ),

              // =====================
              // TIMER
              // =====================

              Center(

                child: Container(

                  height: 210,
                  width: 210,

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
                          0.34,
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
                        38,

                        spreadRadius:
                        5,
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

                          formattedTime,

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            Colors.white,

                            fontSize: 30,

                            fontWeight:
                            FontWeight.w700,

                            letterSpacing:
                            1.5,
                          ),
                        ),

                        const SizedBox(
                          height: 10,
                        ),

                        Text(

                          'Citadel Countdown',

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors
                                .white60,

                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: 36,
              ),

              // =====================
              // PROGRESS
              // =====================

              Text(

                'Macro Battle Progress',

                style:
                GoogleFonts.poppins(

                  color: Colors.white,

                  fontSize: 15,

                  fontWeight:
                  FontWeight.w600,
                ),
              ),

              const SizedBox(
                height: 16,
              ),

              ClipRRect(

                borderRadius:
                BorderRadius.circular(
                  14,
                ),

                child:
                LinearProgressIndicator(

                  value: progress,

                  minHeight: 14,

                  backgroundColor:
                  Colors.white
                      .withValues(
                    alpha: 0.05,
                  ),

                  valueColor:
                  const AlwaysStoppedAnimation(
                    Color(
                      0xFFD4AF37,
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: 14,
              ),

              Row(

                mainAxisAlignment:
                MainAxisAlignment
                    .spaceBetween,

                children: [

                  Text(

                    '${widget.completedQuestions}/${widget.totalQuestions} Questions',

                    style:
                    GoogleFonts.poppins(

                      color:
                      Colors.white60,

                      fontSize: 12,
                    ),
                  ),

                  Text(

                    '${widget.readiness.toInt()}% Ready',

                    style:
                    GoogleFonts.cinzel(

                      color:
                      const Color(
                        0xFF5EDC8D,
                      ),

                      fontSize: 12,
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 32,
              ),

              // =====================
              // REBUILD ALERT
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
                    22,
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
                          0xFFFF6B6B,
                        ),

                        boxShadow: [

                          BoxShadow(

                            color:
                            const Color(
                              0xFFFF6B6B,
                            ).withValues(
                              alpha:
                              0.6,
                            ),

                            blurRadius:
                            14,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                      width: 14,
                    ),

                    Expanded(

                      child: Text(

                        '${widget.rebuildTargets} rebuild targets detected for next phase',

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

                      'PHASE II',

                      style:
                      GoogleFonts
                          .cinzel(

                        color:
                        const Color(
                          0xFFFF6B6B,
                        ),

                        fontSize: 10,

                        letterSpacing:
                        1.2,
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
