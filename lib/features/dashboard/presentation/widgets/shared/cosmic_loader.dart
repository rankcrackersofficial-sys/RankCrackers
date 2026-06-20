import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CosmicLoader
    extends StatefulWidget {

  final String? message;

  final double size;

  const CosmicLoader({

    super.key,

    this.message,

    this.size = 140,
  });

  @override
  State<CosmicLoader>
  createState() =>
      _CosmicLoaderState();
}

class _CosmicLoaderState
    extends State<CosmicLoader>
    with
        TickerProviderStateMixin {

  late AnimationController
  _rotationController;

  late AnimationController
  _pulseController;

  @override
  void initState() {

    super.initState();

    // =====================================
    // ROTATION
    // =====================================

    _rotationController =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 8,
      ),
    )..repeat();

    // =====================================
    // PULSE
    // =====================================

    _pulseController =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 2,
      ),
    )..repeat(
      reverse: true,
    );
  }

  @override
  void dispose() {

    _rotationController.dispose();

    _pulseController.dispose();

    super.dispose();
  }

  @override
  Widget build(
      BuildContext context,
      ) {

    return AnimatedBuilder(

      animation:
      Listenable.merge([

        _rotationController,
        _pulseController,
      ]),

      builder:
          (context, child) {

        final pulse =
        sin(
          _pulseController
              .value *
              2 *
              pi,
        );

        final glow =
            0.16 +
                (pulse.abs() *
                    0.18);

        return Column(

          mainAxisAlignment:
          MainAxisAlignment
              .center,

          children: [

            // =================================
            // LOADER CORE
            // =================================

            SizedBox(

              height: widget.size,
              width: widget.size,

              child: Stack(

                alignment:
                Alignment.center,

                children: [

                  // =========================
                  // OUTER RING
                  // =========================

                  Transform.rotate(

                    angle:
                    _rotationController
                        .value *
                        2 *
                        pi,

                    child: Container(

                      height:
                      widget.size,

                      width:
                      widget.size,

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        border: Border.all(

                          color:
                          const Color(
                            0xFFD4AF37,
                          ).withValues(
                            alpha: 0.14,
                          ),

                          width: 1.8,
                        ),
                      ),
                    ),
                  ),

                  // =========================
                  // MIDDLE ORBIT
                  // =========================

                  Transform.rotate(

                    angle:
                    -_rotationController
                        .value *
                        1.5 *
                        pi,

                    child: Container(

                      height:
                      widget.size *
                          0.72,

                      width:
                      widget.size *
                          0.72,

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        border: Border.all(

                          color:
                          const Color(
                            0xFFD4AF37,
                          ).withValues(
                            alpha: 0.24,
                          ),

                          width: 1.4,
                        ),
                      ),
                    ),
                  ),

                  // =========================
                  // SACRED CORE
                  // =========================

                  Container(

                    height:
                    widget.size *
                        0.26,

                    width:
                    widget.size *
                        0.26,

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
                            0.95,
                          ),

                          const Color(
                            0xFFD4AF37,
                          ).withValues(
                            alpha:
                            0.20,
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

                          blurRadius:
                          26,

                          spreadRadius:
                          4,
                        ),
                      ],
                    ),
                  ),

                  // =========================
                  // PARTICLES
                  // =========================

                  ...List.generate(

                    6,

                        (index) {

                      final angle =
                      ((_rotationController
                          .value *
                          2 *
                          pi) +
                          (index *
                              pi /
                              3));

                      final radius =
                          widget.size *
                              0.42;

                      final dx =
                          cos(angle) *
                              radius;

                      final dy =
                          sin(angle) *
                              radius;

                      return Transform.translate(

                        offset:
                        Offset(
                          dx,
                          dy,
                        ),

                        child: Container(

                          height: 8,
                          width: 8,

                          decoration:
                          BoxDecoration(

                            shape:
                            BoxShape
                                .circle,

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
                                  glow,
                                ),

                                blurRadius:
                                12,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(
              height: 32,
            ),

            // =================================
            // MESSAGE
            // =================================

            Text(

              widget.message ??
                  'Forging Sacred Systems...',

              textAlign:
              TextAlign.center,

              style:
              GoogleFonts.poppins(

                color:
                Colors.white70,

                fontSize: 14,

                fontWeight:
                FontWeight.w500,

                letterSpacing:
                0.3,
              ),
            ),

            const SizedBox(
              height: 10,
            ),

            Text(

              'Madhav Consciousness Active',

              style:
              GoogleFonts.cinzel(

                color:
                const Color(
                  0xFFD4AF37,
                ),

                fontSize: 11,

                letterSpacing:
                1.2,
              ),
            ),
          ],
        );
      },
    );
  }
}