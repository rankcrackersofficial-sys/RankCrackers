import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum OrbState {

  stable,
  warning,
  danger,
  transcend,
}

class SacredStatusOrb
    extends StatefulWidget {

  final String title;

  final String value;

  final OrbState state;

  final IconData icon;

  const SacredStatusOrb({

    super.key,

    required this.title,

    required this.value,

    required this.state,

    required this.icon,
  });

  @override
  State<SacredStatusOrb>
  createState() =>
      _SacredStatusOrbState();
}

class _SacredStatusOrbState
    extends State<SacredStatusOrb>
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

  Color get orbColor {

    switch (widget.state) {

      case OrbState.stable:
        return const Color(
          0xFF5EDC8D,
        );

      case OrbState.warning:
        return const Color(
          0xFFD4AF37,
        );

      case OrbState.danger:
        return const Color(
          0xFFFF6B6B,
        );

      case OrbState.transcend:
        return const Color(
          0xFF8B5CF6,
        );
    }
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
            0.18 +
                (pulse.abs() *
                    0.14);

        return Container(

          padding:
          const EdgeInsets.all(
            20,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              28,
            ),

            color:
            Colors.white
                .withValues(
              alpha: 0.03,
            ),

            border: Border.all(

              color:
              orbColor.withValues(
                alpha: 0.18,
              ),
            ),

            boxShadow: [

              BoxShadow(

                color:
                orbColor.withValues(
                  alpha: glow,
                ),

                blurRadius: 28,
                spreadRadius: 1,
              ),
            ],
          ),

          child: Column(

            mainAxisAlignment:
            MainAxisAlignment
                .center,

            children: [

              // =========================
              // ORB
              // =========================

              Container(

                height: 72,
                width: 72,

                decoration:
                BoxDecoration(

                  shape:
                  BoxShape.circle,

                  gradient:
                  RadialGradient(

                    colors: [

                      orbColor.withValues(
                        alpha: 0.35,
                      ),

                      orbColor.withValues(
                        alpha: 0.04,
                      ),
                    ],
                  ),

                  boxShadow: [

                    BoxShadow(

                      color:
                      orbColor
                          .withValues(
                        alpha:
                        glow,
                      ),

                      blurRadius: 24,
                      spreadRadius: 2,
                    ),
                  ],
                ),

                child: Icon(

                  widget.icon,

                  color: orbColor,

                  size: 32,
                ),
              ),

              const SizedBox(
                height: 18,
              ),

              // =========================
              // VALUE
              // =========================

              Text(

                widget.value,

                style:
                GoogleFonts.cinzel(

                  color:
                  Colors.white,

                  fontSize: 24,

                  fontWeight:
                  FontWeight.w700,
                ),
              ),

              const SizedBox(
                height: 6,
              ),

              // =========================
              // TITLE
              // =========================

              Text(

                widget.title,

                textAlign:
                TextAlign.center,

                style:
                GoogleFonts.poppins(

                  color:
                  Colors.white60,

                  fontSize: 12,

                  height: 1.5,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}