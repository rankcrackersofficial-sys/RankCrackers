import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/dark_card.dart';

class SacredBattleConsole
    extends StatefulWidget {

  final int activeBattles;

  final int rebuildNodes;

  final double readiness;

  final int currentDay;

  const SacredBattleConsole({

    super.key,

    required this.activeBattles,

    required this.rebuildNodes,

    required this.readiness,

    required this.currentDay,
  });

  @override
  State<SacredBattleConsole>
  createState() =>
      _SacredBattleConsoleState();
}

class _SacredBattleConsoleState
    extends State<
        SacredBattleConsole>
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
        seconds: 4,
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
            0.14 +
                (pulse.abs() *
                    0.10);

        return DarkCard(

          padding:
          const EdgeInsets.all(
            24,
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
                alpha: 0.14,
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

                blurRadius: 30,
                spreadRadius: 2,
              ),
            ],
          ),

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment
                .start,

            children: [

              // =========================
              // HEADER
              // =========================

              Row(

                children: [

                  Container(

                    height: 54,
                    width: 54,

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
                          .terminal_rounded,

                      color:
                      Color(
                        0xFFD4AF37,
                      ),

                      size: 28,
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

                          'Sacred Battle Console',

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

                          'Adaptive battlefield telemetry active',

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
                height: 28,
              ),

              // =========================
              // METRICS GRID
              // =========================

              Row(

                children: [

                  Expanded(

                    child:
                    _ConsoleMetric(

                      title:
                      'Active Battles',

                      value:
                      widget
                          .activeBattles
                          .toString(),

                      glow:
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
                    _ConsoleMetric(

                      title:
                      'Rebuild Nodes',

                      value:
                      widget
                          .rebuildNodes
                          .toString(),

                      glow:
                      const Color(
                        0xFFFF6B6B,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 14,
              ),

              Row(

                children: [

                  Expanded(

                    child:
                    _ConsoleMetric(

                      title:
                      'Readiness',

                      value:
                      '${widget.readiness.toInt()}%',

                      glow:
                      const Color(
                        0xFF5EDC8D,
                      ),
                    ),
                  ),

                  const SizedBox(
                    width: 14,
                  ),

                  Expanded(

                    child:
                    _ConsoleMetric(

                      title:
                      'Current Day',

                      value:
                      'Day ${widget.currentDay}',

                      glow:
                      const Color(
                        0xFF8B5CF6,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 30,
              ),

              // =========================
              // STATUS BAR
              // =========================

              Container(

                padding:
                const EdgeInsets.all(
                  16,
                ),

                decoration:
                BoxDecoration(

                  borderRadius:
                  BorderRadius.circular(
                    20,
                  ),

                  color:
                  Colors.black
                      .withValues(
                    alpha: 0.20,
                  ),
                ),

                child: Row(

                  children: [

                    Container(

                      height: 12,
                      width: 12,

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        color:
                        const Color(
                          0xFF5EDC8D,
                        ),

                        boxShadow: [

                          BoxShadow(

                            color:
                            const Color(
                              0xFF5EDC8D,
                            ).withValues(
                              alpha:
                              0.6,
                            ),

                            blurRadius:
                            12,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                      width: 12,
                    ),

                    Expanded(

                      child: Text(

                        'Battlefield synchronization stable',

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

                      'LIVE',

                      style:
                      GoogleFonts
                          .cinzel(

                        color:
                        const Color(
                          0xFFD4AF37,
                        ),

                        fontSize: 10,

                        letterSpacing:
                        1.4,
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
// CONSOLE METRIC
// =========================================================

class _ConsoleMetric
    extends StatelessWidget {

  final String title;

  final String value;

  final Color glow;

  const _ConsoleMetric({

    required this.title,

    required this.value,

    required this.glow,
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
          glow.withValues(
            alpha: 0.16,
          ),
        ),

        boxShadow: [

          BoxShadow(

            color:
            glow.withValues(
              alpha: 0.10,
            ),

            blurRadius: 18,
          ),
        ],
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: GoogleFonts.cinzel(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            title,
            style: GoogleFonts.poppins(
              color: Colors.white60,
              fontSize: 11,
              height: 1.4,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}