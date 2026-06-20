import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SacredButton
    extends StatefulWidget {

  final String title;

  final VoidCallback onTap;

  final IconData? icon;

  final Color glowColor;

  final bool isPrimary;

  const SacredButton({

    super.key,

    required this.title,

    required this.onTap,

    this.icon,

    this.glowColor =
    const Color(0xFFD4AF37),

    this.isPrimary = true,
  });

  @override
  State<SacredButton>
  createState() =>
      _SacredButtonState();
}

class _SacredButtonState
    extends State<SacredButton>
    with
        SingleTickerProviderStateMixin {

  late AnimationController
  _controller;

  bool isPressed = false;

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

        return GestureDetector(

          onTapDown: (_) {

            setState(() {

              isPressed = true;
            });
          },

          onTapUp: (_) {

            setState(() {

              isPressed = false;
            });

            widget.onTap();
          },

          onTapCancel: () {

            setState(() {

              isPressed = false;
            });
          },

          child: AnimatedScale(

            duration:
            const Duration(
              milliseconds: 140,
            ),

            scale:
            isPressed
                ? 0.96
                : 1,

            child: Container(

              padding:
              const EdgeInsets.symmetric(

                horizontal: 22,
                vertical: 18,
              ),

              decoration:
              BoxDecoration(

                borderRadius:
                BorderRadius.circular(
                  24,
                ),

                gradient:
                widget.isPrimary

                    ? LinearGradient(

                  begin:
                  Alignment
                      .topLeft,

                  end:
                  Alignment
                      .bottomRight,

                  colors: [

                    widget
                        .glowColor
                        .withValues(
                      alpha:
                      0.30,
                    ),

                    widget
                        .glowColor
                        .withValues(
                      alpha:
                      0.12,
                    ),
                  ],
                )

                    : null,

                color:
                widget.isPrimary
                    ? null
                    : Colors.white
                    .withValues(
                  alpha: 0.03,
                ),

                border: Border.all(

                  color:
                  widget.glowColor
                      .withValues(
                    alpha: 0.24,
                  ),
                ),

                boxShadow: [

                  BoxShadow(

                    color:
                    widget.glowColor
                        .withValues(
                      alpha:
                      glow,
                    ),

                    blurRadius: 24,
                    spreadRadius: 1,
                  ),
                ],
              ),

              child: Row(

                mainAxisAlignment:
                MainAxisAlignment
                    .center,

                children: [

                  if (widget.icon !=
                      null)

                    Icon(

                      widget.icon,

                      color:
                      widget
                          .glowColor,

                      size: 20,
                    ),

                  if (widget.icon !=
                      null)

                    const SizedBox(
                      width: 12,
                    ),

                  Text(

                    widget.title,

                    style:
                    GoogleFonts.poppins(

                      color:
                      Colors.white,

                      fontSize: 15,

                      fontWeight:
                      FontWeight.w600,

                      letterSpacing:
                      0.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}