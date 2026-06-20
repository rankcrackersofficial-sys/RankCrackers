import 'dart:math';

import 'package:flutter/material.dart';

class CosmicBackground
    extends StatelessWidget {

  final Widget child;

  const CosmicBackground({

    super.key,

    required this.child,
  });

  @override
  Widget build(
      BuildContext context,
      ) {

    return Stack(

      children: [

        // =========================================
        // BASE BACKGROUND
        // =========================================

        Container(

          decoration:
          const BoxDecoration(

            gradient:
            LinearGradient(

              begin:
              Alignment.topCenter,

              end:
              Alignment.bottomCenter,

              colors: [

                Color(0xFF06070D),

                Color(0xFF0B0E17),

                Color(0xFF111522),
              ],
            ),
          ),
        ),

        // =========================================
        // GOLDEN AURA
        // =========================================

        Positioned(

          top: -120,
          right: -80,

          child: Container(

            height: 280,
            width: 280,

            decoration:
            BoxDecoration(

              shape: BoxShape.circle,

              gradient:
              RadialGradient(

                colors: [

                  const Color(
                    0xFFD4AF37,
                  ).withValues(
                    alpha: 0.16,
                  ),

                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        Positioned(

          bottom: -140,
          left: -100,

          child: Container(

            height: 300,
            width: 300,

            decoration:
            BoxDecoration(

              shape: BoxShape.circle,

              gradient:
              RadialGradient(

                colors: [

                  const Color(
                    0xFFD4AF37,
                  ).withValues(
                    alpha: 0.10,
                  ),

                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // =========================================
        // STARS
        // =========================================

        ...List.generate(

          80,

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
                    2.4 +
                    0.5;

            final opacity =
                random.nextDouble() *
                    0.7 +
                    0.2;

            return Positioned(

              top: top,
              left: left,

              child: Container(

                height: size,
                width: size,

                decoration:
                BoxDecoration(

                  shape: BoxShape.circle,

                  color:
                  Colors.white
                      .withValues(
                    alpha:
                    opacity,
                  ),

                  boxShadow: [

                    BoxShadow(

                      color:
                      Colors.white
                          .withValues(
                        alpha:
                        opacity *
                            0.6,
                      ),

                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
            );
          },
        ),

        // =========================================
        // SACRED GLOW LINES
        // =========================================

        Positioned(

          top: 120,
          left: -40,

          child: Transform.rotate(

            angle: -0.4,

            child: Container(

              height: 1.2,
              width: 180,

              color:
              Colors.white
                  .withValues(
                alpha: 0.04,
              ),
            ),
          ),
        ),

        Positioned(

          bottom: 220,
          right: -20,

          child: Transform.rotate(

            angle: 0.3,

            child: Container(

              height: 1,
              width: 140,

              color:
              Colors.white
                  .withValues(
                alpha: 0.03,
              ),
            ),
          ),
        ),

        // =========================================
        // CHILD CONTENT
        // =========================================

        child,
      ],
    );
  }
}