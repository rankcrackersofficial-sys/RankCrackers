import 'dart:math';

import 'package:flutter/material.dart';

class AnimatedTacticalNoirBackground
    extends StatefulWidget {

  final Widget child;

  const AnimatedTacticalNoirBackground({

    super.key,

    required this.child,
  });

  @override
  State<AnimatedTacticalNoirBackground>
  createState() =>
      _AnimatedTacticalNoirBackgroundState();
}

class _AnimatedTacticalNoirBackgroundState
    extends State<
        AnimatedTacticalNoirBackground>
    with
        TickerProviderStateMixin {

  late AnimationController
  _starController;

  late AnimationController
  _auraController;

  late Animation<double>
  _starAnimation;

  late Animation<double>
  _auraAnimation;

  @override
  void initState() {

    super.initState();

    // =====================================
    // STAR TWINKLE
    // =====================================

    _starController =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 4,
      ),
    )..repeat(
      reverse: true,
    );

    _starAnimation =
        Tween<double>(

          begin: 0.3,
          end: 1.0,

        ).animate(

          CurvedAnimation(

            parent:
            _starController,

            curve:
            Curves.easeInOut,
          ),
        );

    // =====================================
    // GOLDEN AURA
    // =====================================

    _auraController =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 6,
      ),
    )..repeat(
      reverse: true,
    );

    _auraAnimation =
        Tween<double>(

          begin: 0.8,
          end: 1.2,

        ).animate(

          CurvedAnimation(

            parent:
            _auraController,

            curve:
            Curves.easeInOut,
          ),
        );
  }

  @override
  void dispose() {

    _starController.dispose();

    _auraController.dispose();

    super.dispose();
  }

  @override
  Widget build(
      BuildContext context,
      ) {

    return AnimatedBuilder(

      animation:
      Listenable.merge([

        _starController,
        _auraController,
      ]),

      builder:
          (context, child) {

        return Stack(

          children: [

            // =================================
            // BASE COSMOS
            // =================================

            Container(

              decoration:
              const BoxDecoration(

                gradient:
                LinearGradient(

                  begin:
                  Alignment
                      .topCenter,

                  end:
                  Alignment
                      .bottomCenter,

                  colors: [

                    Color(
                      0xFF05060C,
                    ),

                    Color(
                      0xFF0B0E17,
                    ),

                    Color(
                      0xFF101522,
                    ),
                  ],
                ),
              ),
            ),

            // =================================
            // TOP GOLDEN AURA
            // =================================

            Positioned(

              top: -120,
              right: -100,

              child:
              Transform.scale(

                scale:
                _auraAnimation
                    .value,

                child: Container(

                  height: 320,
                  width: 320,

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
                          alpha: 0.16,
                        ),

                        Colors
                            .transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // =================================
            // BOTTOM AURA
            // =================================

            Positioned(

              bottom: -140,
              left: -120,

              child:
              Transform.scale(

                scale:
                _auraAnimation
                    .value,

                child: Container(

                  height: 340,
                  width: 340,

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
                          alpha: 0.08,
                        ),

                        Colors
                            .transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // =================================
            // TWINKLING STARS
            // =================================

            ...List.generate(

              90,

                  (index) {

                final random =
                Random(index);

                final top =
                    random.nextDouble() *
                        MediaQuery.of(
                          context,
                        ).size.height;

                final left =
                    random.nextDouble() *
                        MediaQuery.of(
                          context,
                        ).size.width;

                final size =
                    random.nextDouble() *
                        2.6 +
                        0.5;

                final opacity =
                    random.nextDouble() *
                        0.7 +
                        0.2;

                return Positioned(

                  top: top,
                  left: left,

                  child: Opacity(

                    opacity:
                    opacity *
                        _starAnimation
                            .value,

                    child: Container(

                      height: size,
                      width: size,

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        color:
                        Colors.white,

                        boxShadow: [

                          BoxShadow(

                            color:
                            Colors.white
                                .withValues(
                              alpha:
                              0.6,
                            ),

                            blurRadius:
                            8,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),

            // =================================
            // SACRED LIGHT LINES
            // =================================

            Positioned(

              top: 140,
              left: -40,

              child:
              Transform.rotate(

                angle: -0.35,

                child: Container(

                  width: 180,
                  height: 1.2,

                  color:
                  Colors.white
                      .withValues(
                    alpha: 0.04,
                  ),
                ),
              ),
            ),

            Positioned(

              bottom: 240,
              right: -20,

              child:
              Transform.rotate(

                angle: 0.25,

                child: Container(

                  width: 160,
                  height: 1,

                  color:
                  Colors.white
                      .withValues(
                    alpha: 0.03,
                  ),
                ),
              ),
            ),

            // =================================
            // CHILD CONTENT
            // =================================

            widget.child,
          ],
        );
      },
    );
  }
}
