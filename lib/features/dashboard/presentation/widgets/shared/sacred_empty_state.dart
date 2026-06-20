import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SacredEmptyState
    extends StatefulWidget {

  final String title;

  final String subtitle;

  final IconData icon;

  final String actionText;

  final VoidCallback? onAction;

  const SacredEmptyState({

    super.key,

    required this.title,

    required this.subtitle,

    required this.icon,

    this.actionText = 'Begin Journey',

    this.onAction,
  });

  @override
  State<SacredEmptyState>
  createState() =>
      _SacredEmptyStateState();
}

class _SacredEmptyStateState
    extends State<SacredEmptyState>
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
            0.12 +
                (pulse.abs() *
                    0.08);

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
                // SACRED ORB
                // =========================

                Container(

                  height: 150,
                  width: 150,

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
                          0.22,
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

                        blurRadius: 34,
                        spreadRadius: 4,
                      ),
                    ],
                  ),

                  child: Icon(

                    widget.icon,

                    size: 60,

                    color:
                    const Color(
                      0xFFD4AF37,
                    ),
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
                    Colors.white,

                    fontSize: 28,

                    fontWeight:
                    FontWeight.w700,

                    letterSpacing:
                    1,
                  ),
                ),

                const SizedBox(
                  height: 16,
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
                    Colors.white60,

                    fontSize: 14,

                    height: 1.8,
                  ),
                ),

                const SizedBox(
                  height: 36,
                ),

                // =========================
                // ACTION BUTTON
                // =========================

                if (widget.onAction !=
                    null)

                  GestureDetector(

                    onTap:
                    widget.onAction,

                    child:
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

                        gradient:
                        LinearGradient(

                          colors: [

                            const Color(
                              0xFFD4AF37,
                            ).withValues(
                              alpha:
                              0.28,
                            ),

                            const Color(
                              0xFFD4AF37,
                            ).withValues(
                              alpha:
                              0.12,
                            ),
                          ],
                        ),

                        border: Border.all(

                          color:
                          const Color(
                            0xFFD4AF37,
                          ).withValues(
                            alpha:
                            0.24,
                          ),
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
                                .auto_awesome_rounded,

                            color:
                            Color(
                              0xFFD4AF37,
                            ),

                            size: 20,
                          ),

                          const SizedBox(
                            width: 12,
                          ),

                          Text(

                            widget
                                .actionText,

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
                // SACRED FOOTNOTE
                // =========================

                Text(

                  'The cosmos awaits your next step.',

                  textAlign:
                  TextAlign.center,

                  style:
                  GoogleFonts.cinzel(

                    color:
                    const Color(
                      0xFFD4AF37,
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