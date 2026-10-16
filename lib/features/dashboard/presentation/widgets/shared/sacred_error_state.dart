import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SacredErrorState
    extends StatefulWidget {

  final String title;

  final String subtitle;

  final VoidCallback? onRetry;

  const SacredErrorState({

    super.key,

    required this.title,

    required this.subtitle,

    this.onRetry,
  });

  @override
  State<SacredErrorState>
  createState() =>
      _SacredErrorStateState();
}

class _SacredErrorStateState
    extends State<SacredErrorState>
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
    final scheme = Theme.of(context).colorScheme;

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

        return Center(

          child: Padding(

            padding:
            const EdgeInsets.all(
              24,
            ),

            child: Column(

              mainAxisAlignment:
              MainAxisAlignment
                  .center,

              children: [

                // =========================
                // FRACTURED ORB
                // =========================

                Container(

                  height: 160,
                  width: 160,

                  decoration:
                  BoxDecoration(

                    shape:
                    BoxShape.circle,

                    gradient:
                    RadialGradient(

                      colors: [

                        const Color(
                          0xFFFF6B6B,
                        ).withValues(
                          alpha:
                          0.26,
                        ),

                        Colors
                            .transparent,
                      ],
                    ),

                    boxShadow: [

                      BoxShadow(

                        color:
                        const Color(
                          0xFFFF6B6B,
                        ).withValues(
                          alpha:
                          glow,
                        ),

                        blurRadius:
                        34,

                        spreadRadius:
                        4,
                      ),
                    ],
                  ),

                  child: Stack(

                    alignment:
                    Alignment.center,

                    children: [

                      Transform.rotate(

                        angle:
                        pulse * 0.04,

                        child: const Icon(

                          Icons
                              .crisis_alert_rounded,

                          size: 72,

                          color:
                          Color(
                            0xFFFF6B6B,
                          ),
                        ),
                      ),

                      Positioned(

                        top: 40,
                        right: 42,

                        child: Container(

                          height: 10,
                          width: 10,

                          decoration:
                          BoxDecoration(

                            shape:
                            BoxShape
                                .circle,

                            color:
                            scheme.onSurface
                                .withValues(
                              alpha:
                              0.9,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(
                  height: 36,
                ),

                // =========================
                // TITLE
                // =========================

                Text(

                  widget.title,

                  textAlign:
                  TextAlign.center,

                  style:
                  GoogleFonts.cinzel(

                    color:
                    scheme.onSurface,

                    fontSize: 28,

                    fontWeight:
                    FontWeight.w700,

                    letterSpacing:
                    1,
                  ),
                ),

                const SizedBox(
                  height: 18,
                ),

                // =========================
                // SUBTITLE
                // =========================

                Text(

                  widget.subtitle,

                  textAlign:
                  TextAlign.center,

                  style:
                  GoogleFonts.poppins(

                    color:
                    scheme.onSurfaceVariant,

                    fontSize: 14,

                    height: 1.8,
                  ),
                ),

                const SizedBox(
                  height: 38,
                ),

                // =========================
                // RETRY BUTTON
                // =========================

                if (widget.onRetry !=
                    null)

                  GestureDetector(

                    onTap:
                    widget.onRetry,

                    child:
                    Container(

                      padding:
                      const EdgeInsets.symmetric(

                        horizontal: 30,
                        vertical: 18,
                      ),

                      decoration:
                      BoxDecoration(

                        borderRadius:
                        BorderRadius.circular(
                          24,
                        ),

                        gradient:
                        LinearGradient(

                          colors: [

                            const Color(
                              0xFFFF6B6B,
                            ).withValues(
                              alpha:
                              0.28,
                            ),

                            const Color(
                              0xFFFF6B6B,
                            ).withValues(
                              alpha:
                              0.12,
                            ),
                          ],
                        ),

                        border: Border.all(

                          color:
                          const Color(
                            0xFFFF6B6B,
                          ).withValues(
                            alpha:
                            0.24,
                          ),
                        ),

                        boxShadow: [

                          BoxShadow(

                            color:
                            const Color(
                              0xFFFF6B6B,
                            ).withValues(
                              alpha:
                              glow,
                            ),

                            blurRadius:
                            24,

                            spreadRadius:
                            1,
                          ),
                        ],
                      ),

                      child: Row(

                        mainAxisSize:
                        MainAxisSize.min,

                        children: [

                          const Icon(

                            Icons
                                .restart_alt_rounded,

                            color:
                            Color(
                              0xFFFF6B6B,
                            ),

                            size: 22,
                          ),

                          const SizedBox(
                            width: 12,
                          ),

                          Text(

                            'Reforge Connection',

                            style:
                            GoogleFonts
                                .poppins(

                              color:
                              Colors
                                  .white,

                              fontSize:
                              14,

                              fontWeight:
                              FontWeight
                                  .w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(
                  height: 28,
                ),

                // =========================
                // FOOTNOTE
                // =========================

                Text(

                  'Even fractured systems can be reforged.',

                  textAlign:
                  TextAlign.center,

                  style:
                  GoogleFonts.cinzel(

                    color:
                    const Color(
                      0xFFFF6B6B,
                    ).withValues(
                      alpha: 0.7,
                    ),

                    fontSize: 11,

                    letterSpacing:
                    1.2,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
