import 'dart:math';

import 'package:flutter/material.dart';

class DivineParticleEngine
    extends StatefulWidget {

  final Widget child;

  const DivineParticleEngine({

    super.key,

    required this.child,
  });

  @override
  State<DivineParticleEngine>
  createState() =>
      _DivineParticleEngineState();
}

class _DivineParticleEngineState
    extends State<
        DivineParticleEngine>
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
        seconds: 12,
      ),
    )..repeat();
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

        return Stack(

          children: [

            // =====================================
            // FLOATING PARTICLES
            // =====================================

            ...List.generate(

              26,

                  (index) {

                final random =
                Random(index);

                final width =
                    MediaQuery.of(
                      context,
                    ).size.width;

                final height =
                    MediaQuery.of(
                      context,
                    ).size.height;

                final startX =
                    random.nextDouble() *
                        width;

                final baseY =
                    random.nextDouble() *
                        height;

                final animationOffset =
                    (_controller.value *
                        120) %
                        height;

                final currentY =
                    (baseY -
                        animationOffset) %
                        height;

                final size =
                    random.nextDouble() *
                        4 +
                        1.5;

                final opacity =
                    random.nextDouble() *
                        0.25 +
                        0.05;

                return Positioned(

                  left: startX,

                  top: currentY,

                  child: Container(

                    height: size,
                    width: size,

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
                            opacity,
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
                            opacity *
                                0.8,
                          ),

                          blurRadius:
                          10,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // =====================================
            // ENERGY EMBERS
            // =====================================

            ...List.generate(

              12,

                  (index) {

                final random =
                Random(index + 999);

                final width =
                    MediaQuery.of(
                      context,
                    ).size.width;

                final height =
                    MediaQuery.of(
                      context,
                    ).size.height;

                final x =
                    random.nextDouble() *
                        width;

                final baseY =
                    random.nextDouble() *
                        height;

                final pulse =
                sin(
                  (_controller.value *
                      2 *
                      pi) +
                      index,
                );

                final y =
                    baseY +
                        (pulse * 12);

                return Positioned(

                  left: x,
                  top: y,

                  child: Opacity(

                    opacity:
                    0.12 +
                        (pulse.abs() *
                            0.18),

                    child: Container(

                      height: 18,
                      width: 18,

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        gradient:
                        RadialGradient(

                          colors: [

                            const Color(
                              0xFFD4AF37,
                            ),

                            Colors
                                .transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            // =====================================
            // SACRED DUST TRAILS
            // =====================================

            ...List.generate(

              4,

                  (index) {

                final pulse =
                sin(
                  (_controller.value *
                      2 *
                      pi) +
                      index,
                );

                return Positioned(

                  top:
                  120 +
                      (index * 160),

                  left:
                  -40 +
                      (pulse * 20),

                  child:
                  Transform.rotate(

                    angle: -0.4,

                    child: Container(

                      width: 220,

                      height: 1.1,

                      decoration:
                      BoxDecoration(

                        gradient:
                        LinearGradient(

                          colors: [

                            Colors
                                .transparent,

                            const Color(
                              0xFFD4AF37,
                            ).withValues(
                              alpha: 0.06,
                            ),

                            Colors
                                .transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            // =====================================
            // MAIN CONTENT
            // =====================================

            widget.child,
          ],
        );
      },
    );
  }
}