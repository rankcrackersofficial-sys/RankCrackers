import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class KnowledgeNode {

  final String title;

  final Offset position;

  final double mastery;

  final Color color;

  final bool unlocked;

  const KnowledgeNode({

    required this.title,

    required this.position,

    required this.mastery,

    required this.color,

    required this.unlocked,
  });
}

class SacredKnowledgeConstellation
    extends StatefulWidget {

  final List<KnowledgeNode>
  nodes;

  const SacredKnowledgeConstellation({

    super.key,

    required this.nodes,
  });

  @override
  State<SacredKnowledgeConstellation>
  createState() =>
      _SacredKnowledgeConstellationState();
}

class _SacredKnowledgeConstellationState
    extends State<
        SacredKnowledgeConstellation>
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
        seconds: 5,
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

        return Container(

          height: 520,

          padding:
          const EdgeInsets.all(
            24,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              36,
            ),

            gradient:
            LinearGradient(

              begin:
              Alignment.topLeft,

              end:
              Alignment.bottomRight,

              colors: [

                Colors.white
                    .withValues(
                  alpha: 0.05,
                ),

                Colors.white
                    .withValues(
                  alpha: 0.02,
                ),
              ],
            ),

            border: Border.all(

              color:
              const Color(
                0xFFD4AF37,
              ).withValues(
                alpha: 0.14,
              ),
            ),
          ),

          child: Stack(

            children: [

              // =========================
              // CONNECTION LINES
              // =========================

              CustomPaint(

                size: const Size(
                  double.infinity,
                  double.infinity,
                ),

                painter:
                _ConstellationPainter(
                  nodes:
                  widget.nodes,
                ),
              ),

              // =========================
              // NODES
              // =========================

              ...widget.nodes.map(

                    (node) {

                  final glow =
                      0.12 +
                          (pulse.abs() *
                              0.10);

                  return Positioned(

                    left:
                    node.position.dx,

                    top:
                    node.position.dy,

                    child: Column(

                      children: [

                        Container(

                          height:
                          node.unlocked
                              ? 78
                              : 64,

                          width:
                          node.unlocked
                              ? 78
                              : 64,

                          decoration:
                          BoxDecoration(

                            shape:
                            BoxShape
                                .circle,

                            gradient:
                            RadialGradient(

                              colors: [

                                node.color
                                    .withValues(
                                  alpha:
                                  node
                                      .unlocked
                                      ? 0.34
                                      : 0.10,
                                ),

                                Colors
                                    .transparent,
                              ],
                            ),

                            boxShadow: [

                              BoxShadow(

                                color:
                                node.color
                                    .withValues(
                                  alpha:
                                  glow,
                                ),

                                blurRadius:
                                28,

                                spreadRadius:
                                2,
                              ),
                            ],
                          ),

                          child: Center(

                            child: Text(

                              '${node.mastery.toInt()}%',

                              style:
                              GoogleFonts
                                  .cinzel(

                                color:
                                Colors
                                    .white,

                                fontSize:
                                15,

                                fontWeight:
                                FontWeight
                                    .w700,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(
                          height: 12,
                        ),

                        SizedBox(

                          width: 110,

                          child: Text(

                            node.title,

                            textAlign:
                            TextAlign
                                .center,

                            style:
                            GoogleFonts
                                .poppins(

                              color:
                              Colors
                                  .white70,

                              fontSize:
                              11,

                              height:
                              1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

// =============================================
// CONSTELLATION PAINTER
// =============================================

class _ConstellationPainter
    extends CustomPainter {

  final List<KnowledgeNode>
  nodes;

  _ConstellationPainter({

    required this.nodes,
  });

  @override
  void paint(
      Canvas canvas,
      Size size,
      ) {

    final paint =
    Paint()

      ..color =
      const Color(
        0xFFD4AF37,
      ).withValues(
        alpha: 0.10,
      )

      ..strokeWidth = 1.4;

    for (
    int i = 0;
    i < nodes.length - 1;
    i++
    ) {

      final start =
      Offset(

        nodes[i]
            .position
            .dx +
            38,

        nodes[i]
            .position
            .dy +
            38,
      );

      final end =
      Offset(

        nodes[i + 1]
            .position
            .dx +
            38,

        nodes[i + 1]
            .position
            .dy +
            38,
      );

      canvas.drawLine(
        start,
        end,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(
      covariant
      CustomPainter oldDelegate,
      ) {

    return true;
  }
}