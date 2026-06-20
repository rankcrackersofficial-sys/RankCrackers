import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RankWarrior {

  final String name;

  final int rank;

  final double readiness;

  final int battleWins;

  final int rebuilds;

  final Color aura;

  const RankWarrior({

    required this.name,

    required this.rank,

    required this.readiness,

    required this.battleWins,

    required this.rebuilds,

    required this.aura,
  });
}

class SacredRankMatrix
    extends StatefulWidget {

  final List<RankWarrior>
  warriors;

  const SacredRankMatrix({

    super.key,

    required this.warriors,
  });

  @override
  State<SacredRankMatrix>
  createState() =>
      _SacredRankMatrixState();
}

class _SacredRankMatrixState
    extends State<
        SacredRankMatrix>
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

        return Container(

          padding:
          const EdgeInsets.all(
            24,
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

                Colors.white
                    .withValues(
                  alpha: 0.05,
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
                alpha: 0.14,
              ),
            ),
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
                            alpha: 0.30,
                          ),

                          Colors
                              .transparent,
                        ],
                      ),
                    ),

                    child: const Icon(

                      Icons
                          .emoji_events_rounded,

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

                          'Sacred Rank Matrix',

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

                          'Adaptive battlefield rankings live',

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
                height: 32,
              ),

              // =====================
              // WARRIORS
              // =====================

              ...widget.warriors.map(

                    (warrior) {

                  final glow =
                      0.10 +
                          (pulse.abs() *
                              0.10);

                  return Container(

                    margin:
                    const EdgeInsets.only(
                      bottom: 20,
                    ),

                    padding:
                    const EdgeInsets.all(
                      20,
                    ),

                    decoration:
                    BoxDecoration(

                      borderRadius:
                      BorderRadius.circular(
                        28,
                      ),

                      color:
                      Colors.white
                          .withValues(
                        alpha: 0.03,
                      ),

                      border: Border.all(

                        color:
                        warrior.aura
                            .withValues(
                          alpha: 0.16,
                        ),
                      ),

                      boxShadow: [

                        BoxShadow(

                          color:
                          warrior.aura
                              .withValues(
                            alpha:
                            glow,
                          ),

                          blurRadius:
                          22,
                        ),
                      ],
                    ),

                    child: Row(

                      children: [

                        // =================
                        // RANK CORE
                        // =================

                        Container(

                          height: 68,
                          width: 68,

                          decoration:
                          BoxDecoration(

                            shape:
                            BoxShape
                                .circle,

                            gradient:
                            RadialGradient(

                              colors: [

                                warrior.aura
                                    .withValues(
                                  alpha:
                                  0.32,
                                ),

                                Colors
                                    .transparent,
                              ],
                            ),
                          ),

                          child: Center(

                            child: Text(

                              '#${warrior.rank}',

                              style:
                              GoogleFonts
                                  .cinzel(

                                color:
                                Colors
                                    .white,

                                fontSize:
                                22,

                                fontWeight:
                                FontWeight
                                    .w700,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(
                          width: 18,
                        ),

                        // =================
                        // CONTENT
                        // =================

                        Expanded(

                          child: Column(

                            crossAxisAlignment:
                            CrossAxisAlignment
                                .start,

                            children: [

                              Text(

                                warrior.name,

                                style:
                                GoogleFonts
                                    .poppins(

                                  color:
                                  Colors
                                      .white,

                                  fontSize:
                                  15,

                                  fontWeight:
                                  FontWeight
                                      .w600,
                                ),
                              ),

                              const SizedBox(
                                height: 10,
                              ),

                              Row(

                                children: [

                                  Icon(

                                    Icons
                                        .bolt_rounded,

                                    color:
                                    warrior
                                        .aura,

                                    size: 16,
                                  ),

                                  const SizedBox(
                                    width: 6,
                                  ),

                                  Text(

                                    '${warrior.battleWins} Battle Wins',

                                    style:
                                    GoogleFonts
                                        .poppins(

                                      color:
                                      Colors
                                          .white60,

                                      fontSize:
                                      11,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(
                                height: 6,
                              ),

                              Row(

                                children: [

                                  Icon(

                                    Icons
                                        .refresh_rounded,

                                    color:
                                    warrior
                                        .aura,

                                    size: 16,
                                  ),

                                  const SizedBox(
                                    width: 6,
                                  ),

                                  Text(

                                    '${warrior.rebuilds} Rebuild Cycles',

                                    style:
                                    GoogleFonts
                                        .poppins(

                                      color:
                                      Colors
                                          .white60,

                                      fontSize:
                                      11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // =================
                        // READINESS
                        // =================

                        Column(

                          children: [

                            Text(

                              '${warrior.readiness.toInt()}%',

                              style:
                              GoogleFonts
                                  .cinzel(

                                color:
                                warrior.aura,

                                fontSize:
                                22,

                                fontWeight:
                                FontWeight
                                    .w700,
                              ),
                            ),

                            const SizedBox(
                              height: 4,
                            ),

                            Text(

                              'Ready',

                              style:
                              GoogleFonts
                                  .poppins(

                                color:
                                Colors
                                    .white54,

                                fontSize:
                                10,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}