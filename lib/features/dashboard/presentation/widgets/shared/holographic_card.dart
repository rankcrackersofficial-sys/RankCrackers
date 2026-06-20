import 'dart:math';

import 'package:flutter/material.dart';

class HolographicCard
    extends StatefulWidget {

  final Widget child;

  final Color glowColor;

  final bool enableTilt;

  final bool enablePulse;

  const HolographicCard({

    super.key,

    required this.child,

    this.glowColor =
    const Color(0xFFD4AF37),

    this.enableTilt = true,

    this.enablePulse = true,
  });

  @override
  State<HolographicCard>
  createState() =>
      _HolographicCardState();
}

class _HolographicCardState
    extends State<HolographicCard>
    with
        SingleTickerProviderStateMixin {

  late AnimationController
  _controller;

  double rotateX = 0;

  double rotateY = 0;

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
        widget.enablePulse

            ? 0.10 +
            (pulse.abs() *
                0.10)

            : 0.10;

        return GestureDetector(

          onPanUpdate:
          widget.enableTilt

              ? (details) {

            setState(() {

              rotateY =
                  details
                      .delta
                      .dx *
                      0.01;

              rotateX =
                  -details
                      .delta
                      .dy *
                      0.01;
            });
          }

              : null,

          onPanEnd:
              (_) {

            setState(() {

              rotateX = 0;
              rotateY = 0;
            });
          },

          child:
          AnimatedContainer(

            duration:
            const Duration(
              milliseconds: 180,
            ),

            transform:
            Matrix4.identity()

              ..setEntry(
                3,
                2,
                0.001,
              )

              ..rotateX(
                rotateX,
              )

              ..rotateY(
                rotateY,
              ),

            decoration:
            BoxDecoration(

              borderRadius:
              BorderRadius.circular(
                30,
              ),

              boxShadow: [

                BoxShadow(

                  color:
                  widget.glowColor
                      .withValues(
                    alpha:
                    glow,
                  ),

                  blurRadius: 28,

                  spreadRadius: 2,
                ),
              ],
            ),

            child: Stack(

              children: [

                // =========================
                // MAIN GLASS LAYER
                // =========================

                Container(

                  decoration:
                  BoxDecoration(

                    borderRadius:
                    BorderRadius.circular(
                      30,
                    ),

                    gradient:
                    LinearGradient(

                      begin:
                      Alignment
                          .topLeft,

                      end:
                      Alignment
                          .bottomRight,

                      colors: [

                        Colors.white
                            .withValues(
                          alpha:
                          0.06,
                        ),

                        Colors.white
                            .withValues(
                          alpha:
                          0.02,
                        ),
                      ],
                    ),

                    border: Border.all(

                      color:
                      widget
                          .glowColor
                          .withValues(
                        alpha:
                        0.12,
                      ),
                    ),
                  ),
                ),

                // =========================
                // HOLOGRAPHIC SHINE
                // =========================

                Positioned.fill(

                  child: IgnorePointer(

                    child:
                    ClipRRect(

                      borderRadius:
                      BorderRadius.circular(
                        30,
                      ),

                      child: Stack(

                        children: [

                          Positioned(

                            left:
                            -120 +
                                (_controller
                                    .value *
                                    320),

                            top: 0,

                            child:
                            Transform.rotate(

                              angle: -0.45,

                              child:
                              Container(

                                width: 90,

                                height:
                                500,

                                decoration:
                                BoxDecoration(

                                  gradient:
                                  LinearGradient(

                                    colors: [

                                      Colors
                                          .transparent,

                                      Colors.white
                                          .withValues(
                                        alpha:
                                        0.08,
                                      ),

                                      Colors
                                          .transparent,
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // =========================
                // SACRED EDGE GLOW
                // =========================

                Positioned.fill(

                  child: IgnorePointer(

                    child:
                    Container(

                      decoration:
                      BoxDecoration(

                        borderRadius:
                        BorderRadius.circular(
                          30,
                        ),

                        gradient:
                        RadialGradient(

                          colors: [

                            widget.glowColor
                                .withValues(
                              alpha:
                              0.06,
                            ),

                            Colors
                                .transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // =========================
                // CONTENT
                // =========================

                widget.child,
              ],
            ),
          ),
        );
      },
    );
  }
}