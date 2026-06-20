import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/dark_card.dart';

class SacredMicroTestChamber
    extends StatefulWidget {

  final int totalQuestions;

  final int completedQuestions;

  final Duration remainingTime;

  final String battleTitle;

  final double readiness;

  const SacredMicroTestChamber({

    super.key,

    required this.totalQuestions,

    required this.completedQuestions,

    required this.remainingTime,

    required this.battleTitle,

    required this.readiness,
  });

  @override
  State<SacredMicroTestChamber>
  createState() =>
      _SacredMicroTestChamberState();
}

class _SacredMicroTestChamberState
    extends State<
        SacredMicroTestChamber>
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
        seconds: 3,
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
            0.16 +
                (pulse.abs() *
                    0.12);

        final progress =
            widget.completedQuestions /
                widget.totalQuestions;

        return DarkCard(

          padding:
          const EdgeInsets.all(
            26,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              34,
            ),

            gradient:
            LinearGradient(

              begin:
              Alignment.topLeft,

              end:
              Alignment.bottomRight,

              colors: [

                Colors.white
                    .withValues(
                  alpha: 0.06,
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
                alpha: 0.16,
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

                blurRadius: 28,
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

                    height: 58,
                    width: 58,

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
                            alpha: 0.30,
                          ),

                          Colors
                              .transparent,
                        ],
                      ),
                    ),

                    child: const Icon(

                      Icons
                          .bolt_rounded,

                      color:
                      Color(
                        0xFFD4AF37,
                      ),

                      size: 30,
                    ),
                  ),

                  const SizedBox(
                    width: 16,
                  ),

                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        Text(

                          'Micro Test Chamber',

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            Colors.white,

                            fontSize: 20,

                            fontWeight:
                            FontWeight.w700,
                          ),
                        ),

                        const SizedBox(
                          height: 4,
                        ),

                        Text(

                          widget.battleTitle,

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
                height: 34,
              ),

              // =====================
              // TIMER CORE
              // =====================

              Center(

                child: Container(

                  height: 180,
                  width: 180,

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
                          0.30,
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
                        32,

                        spreadRadius:
                        4,
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

                            fontSize: 28,

                            fontWeight:
                            FontWeight.w700,

                            letterSpacing:
                            1.2,
                          ),
                        ),

                        const SizedBox(
                          height: 10,
                        ),

                        Text(

                          'Sacred Countdown',

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
                height: 34,
              ),

              // =====================
              // PROGRESS
              // =====================

              Row(

                children: [

                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        Text(

                          'Battle Progress',

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors.white,

                            fontSize: 14,

                            fontWeight:
                            FontWeight.w600,
                          ),
                        ),

                        const SizedBox(
                          height: 14,
                        ),

                        ClipRRect(

                          borderRadius:
                          BorderRadius.circular(
                            14,
                          ),

                          child:
                          LinearProgressIndicator(

                            value:
                            progress,

                            minHeight: 12,

                            backgroundColor:
                            Colors.white
                                .withValues(
                              alpha:
                              0.05,
                            ),

                            valueColor:
                            const AlwaysStoppedAnimation(
                              Color(
                                0xFFD4AF37,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(
                    width: 18,
                  ),

                  Text(

                    '${widget.completedQuestions}/${widget.totalQuestions}',

                    style:
                    GoogleFonts
                        .cinzel(

                      color:
                      const Color(
                        0xFFD4AF37,
                      ),

                      fontSize: 22,

                      fontWeight:
                      FontWeight.w700,
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 30,
              ),

              // =====================
              // READINESS
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
                    alpha: 0.22,
                  ),
                ),

                child: Row(

                  children: [

                    Icon(

                      Icons
                          .psychology_alt_rounded,

                      color:
                      const Color(
                        0xFF5EDC8D,
                      ),

                      size: 22,
                    ),

                    const SizedBox(
                      width: 12,
                    ),

                    Expanded(

                      child: Text(

                        'Battle Readiness Stable',

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

                      '${widget.readiness.toInt()}%',

                      style:
                      GoogleFonts
                          .cinzel(

                        color:
                        const Color(
                          0xFF5EDC8D,
                        ),

                        fontSize: 18,

                        fontWeight:
                        FontWeight.w700,
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