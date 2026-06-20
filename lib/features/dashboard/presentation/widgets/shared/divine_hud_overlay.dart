import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class DivineHudOverlay
    extends StatefulWidget {

  final Widget child;

  final String phase;

  final int currentDay;

  final double readiness;

  const DivineHudOverlay({

    super.key,

    required this.child,

    required this.phase,

    required this.currentDay,

    required this.readiness,
  });

  @override
  State<DivineHudOverlay>
  createState() =>
      _DivineHudOverlayState();
}

class _DivineHudOverlayState
    extends State<
        DivineHudOverlay>
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
            0.12 +
                (pulse.abs() *
                    0.08);

        return Stack(

          children: [

            // =====================================
            // MAIN CONTENT
            // =====================================

            widget.child,

            // =====================================
            // TOP HUD
            // =====================================

            Positioned(

              top: 12,
              left: 16,
              right: 16,

              child: IgnorePointer(

                child: SafeArea(

                  child: Row(

                    children: [

                      // =========================
                      // PHASE HUD
                      // =========================

                      Expanded(

                        child:
                        _HudCard(

                          glow:
                          glow,

                          icon:
                          Icons
                              .auto_awesome_rounded,

                          title:
                          widget
                              .phase,

                          subtitle:
                          'Sacred Phase',
                        ),
                      ),

                      const SizedBox(
                        width: 12,
                      ),

                      // =========================
                      // DAY HUD
                      // =========================

                      Expanded(

                        child:
                        _HudCard(

                          glow:
                          glow,

                          icon:
                          Icons
                              .calendar_month_rounded,

                          title:
                          'Day ${widget.currentDay}',

                          subtitle:
                          'Crucible Cycle',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // =====================================
            // BOTTOM RIGHT READINESS
            // =====================================

            Positioned(

              right: 18,
              bottom: 110,

              child: IgnorePointer(

                child: Container(

                  padding:
                  const EdgeInsets.all(
                    18,
                  ),

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
                          0.24 +
                              glow,
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

                        blurRadius: 22,
                        spreadRadius: 2,
                      ),
                    ],
                  ),

                  child: Column(

                    mainAxisSize:
                    MainAxisSize.min,

                    children: [

                      Text(

                        '${widget.readiness.toInt()}%',

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
                        height: 4,
                      ),

                      Text(

                        'Ready',

                        style:
                        GoogleFonts.poppins(

                          color:
                          Colors.white70,

                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // =====================================
            // LEFT ENERGY BAR
            // =====================================

            Positioned(

              left: 8,
              top:
              MediaQuery.of(
                context,
              ).size.height *
                  0.28,

              child: IgnorePointer(

                child: Container(

                  width: 4,
                  height: 180,

                  decoration:
                  BoxDecoration(

                    borderRadius:
                    BorderRadius.circular(
                      20,
                    ),

                    gradient:
                    LinearGradient(

                      begin:
                      Alignment.topCenter,

                      end: Alignment
                          .bottomCenter,

                      colors: [

                        const Color(
                          0xFFD4AF37,
                        ).withValues(
                          alpha:
                          0.9,
                        ),

                        const Color(
                          0xFFD4AF37,
                        ).withValues(
                          alpha:
                          0.1,
                        ),
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

                        blurRadius: 16,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

// =========================================================
// HUD CARD
// =========================================================

class _HudCard
    extends StatelessWidget {

  final IconData icon;

  final String title;

  final String subtitle;

  final double glow;

  const _HudCard({

    required this.icon,

    required this.title,

    required this.subtitle,

    required this.glow,
  });

  @override
  Widget build(
      BuildContext context,
      ) {

    return Container(

      padding:
      const EdgeInsets.symmetric(

        horizontal: 16,
        vertical: 14,
      ),

      decoration:
      BoxDecoration(

        borderRadius:
        BorderRadius.circular(
          22,
        ),

        color:
        Colors.black.withValues(
          alpha: 0.24,
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

            blurRadius: 18,
            spreadRadius: 1,
          ),
        ],
      ),

      child: Row(

        children: [

          Icon(

            icon,

            color:
            const Color(
              0xFFD4AF37,
            ),

            size: 20,
          ),

          const SizedBox(
            width: 12,
          ),

          Expanded(

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment
                  .start,

              children: [

                Text(

                  title,

                  maxLines: 1,

                  overflow:
                  TextOverflow
                      .ellipsis,

                  style:
                  GoogleFonts.poppins(

                    color:
                    Colors.white,

                    fontSize: 13,

                    fontWeight:
                    FontWeight.w600,
                  ),
                ),

                const SizedBox(
                  height: 2,
                ),

                Text(

                  subtitle,

                  style:
                  GoogleFonts.poppins(

                    color:
                    Colors.white54,

                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}