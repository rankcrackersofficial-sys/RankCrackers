import 'dart:math';

import 'package:flutter/material.dart';

class LivingNodeGlowEngine
    extends StatefulWidget {

  final Widget child;

  final Color glowColor;

  final bool isWeak;

  final bool isActive;

  final bool isRebuild;

  const LivingNodeGlowEngine({

    super.key,

    required this.child,

    required this.glowColor,

    this.isWeak = false,

    this.isActive = false,

    this.isRebuild = false,
  });

  @override
  State<LivingNodeGlowEngine>
  createState() =>
      _LivingNodeGlowEngineState();
}

class _LivingNodeGlowEngineState
    extends State<
        LivingNodeGlowEngine>
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
        seconds: 2,
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

        // =====================================
        // BASE PULSE
        // =====================================

        double pulse =
        sin(
          _controller.value *
              2 *
              pi,
        );

        double glowStrength =
        0.08;

        // =====================================
        // ACTIVE NODE
        // =====================================

        if (widget.isActive) {

          glowStrength =
              0.18 +
                  (pulse.abs() *
                      0.12);
        }

        // =====================================
        // WEAK NODE
        // =====================================

        if (widget.isWeak) {

          glowStrength =
              0.14 +
                  (pulse.abs() *
                      0.18);
        }

        // =====================================
        // REBUILD NODE
        // =====================================

        if (widget.isRebuild) {

          glowStrength =
              0.20 +
                  (pulse.abs() *
                      0.22);
        }

        return AnimatedContainer(

          duration:
          const Duration(
            milliseconds: 300,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              28,
            ),

            boxShadow: [

              BoxShadow(

                color:
                widget.glowColor
                    .withValues(
                  alpha:
                  glowStrength,
                ),

                blurRadius:
                widget.isRebuild
                    ? 34
                    : 24,

                spreadRadius:
                widget.isRebuild
                    ? 3
                    : 1,
              ),
            ],
          ),

          child: Stack(

            children: [

              // =================================
              // ENERGY AURA
              // =================================

              Positioned.fill(

                child: IgnorePointer(

                  child: Opacity(

                    opacity:
                    glowStrength *
                        0.5,

                    child: Container(

                      decoration:
                      BoxDecoration(

                        borderRadius:
                        BorderRadius.circular(
                          28,
                        ),

                        gradient:
                        RadialGradient(

                          colors: [

                            widget.glowColor
                                .withValues(
                              alpha:
                              0.18,
                            ),

                            Colors
                                .transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // =================================
              // SACRED PARTICLES
              // =================================

              if (widget.isActive ||
                  widget.isRebuild)

                ...List.generate(

                  6,

                      (index) {

                    final random =
                    Random(index);

                    final top =
                        random.nextDouble() *
                            100;

                    final left =
                        random.nextDouble() *
                            240;

                    final particlePulse =
                    sin(
                      (_controller
                          .value *
                          2 *
                          pi) +
                          index,
                    );

                    return Positioned(

                      top:
                      top +
                          (particlePulse *
                              4),

                      left: left,

                      child: Opacity(

                        opacity:
                        0.12 +
                            (particlePulse
                                .abs() *
                                0.2),

                        child: Container(

                          height: 4,
                          width: 4,

                          decoration:
                          BoxDecoration(

                            shape:
                            BoxShape
                                .circle,

                            color:
                            widget
                                .glowColor,
                          ),
                        ),
                      ),
                    );
                  },
                ),

              // =================================
              // CHILD
              // =================================

              widget.child,
            ],
          ),
        );
      },
    );
  }
}