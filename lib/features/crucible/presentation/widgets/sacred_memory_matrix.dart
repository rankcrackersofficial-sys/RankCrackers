import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/dark_card.dart';

class MemoryNode {

  final String topic;

  final double stability;

  final double decayRisk;

  final Color color;

  const MemoryNode({

    required this.topic,

    required this.stability,

    required this.decayRisk,

    required this.color,
  });
}

class SacredMemoryMatrix
    extends StatefulWidget {

  final List<MemoryNode>
  nodes;

  const SacredMemoryMatrix({

    super.key,

    required this.nodes,
  });

  @override
  State<SacredMemoryMatrix>
  createState() =>
      _SacredMemoryMatrixState();
}

class _SacredMemoryMatrixState
    extends State<
        SacredMemoryMatrix>
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

        return DarkCard(

          padding:
          const EdgeInsets.all(
            24,
          ),

          decoration:
          BoxDecoration(

            borderRadius:
            BorderRadius.circular(
              32,
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

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment
                .start,

            children: [

              // =========================
              // HEADER
              // =========================

              Row(

                children: [

                  Container(

                    height: 54,
                    width: 54,

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
                            alpha: 0.28,
                          ),

                          Colors
                              .transparent,
                        ],
                      ),
                    ),

                    child: const Icon(

                      Icons
                          .psychology_alt_rounded,

                      color:
                      Color(
                        0xFFD4AF37,
                      ),

                      size: 28,
                    ),
                  ),

                  const SizedBox(
                    width: 16,
                  ),

                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        Text(

                          'Sacred Memory Matrix',

                          style:
                          GoogleFonts
                              .cinzel(

                            color:
                            Colors.white,

                            fontSize: 20,

                            fontWeight:
                            FontWeight.w700,
                          ),
                        ),

                        const SizedBox(
                          height: 4,
                        ),

                        Text(

                          'Adaptive cognitive resonance tracking',

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors
                                .white60,

                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(
                height: 30,
              ),

              // =========================
              // MEMORY NODES
              // =========================

              ...widget.nodes.map(

                    (node) {

                  final glow =
                      0.08 +
                          (pulse.abs() *
                              0.08);

                  return DarkCard(

                    margin:
                    const EdgeInsets.only(
                      bottom: 18,
                    ),

                    padding:
                    const EdgeInsets.all(
                      18,
                    ),

                    decoration:
                    BoxDecoration(

                      borderRadius:
                      BorderRadius.circular(
                        24,
                      ),

                      color:
                      Colors.white
                          .withValues(
                        alpha: 0.03,
                      ),

                      border: Border.all(

                        color:
                        node.color
                            .withValues(
                          alpha: 0.16,
                        ),
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
                          18,
                        ),
                      ],
                    ),

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        Row(

                          children: [

                            Expanded(

                              child: Text(

                                node.topic,

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
                            ),

                            Text(

                              '${node.stability.toInt()}%',

                              style:
                              GoogleFonts
                                  .cinzel(

                                color:
                                node.color,

                                fontSize:
                                18,

                                fontWeight:
                                FontWeight
                                    .w700,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(
                          height: 16,
                        ),

                        ClipRRect(

                          borderRadius:
                          BorderRadius.circular(
                            12,
                          ),

                          child:
                          LinearProgressIndicator(

                            value:
                            node.stability /
                                100,

                            minHeight: 10,

                            backgroundColor:
                            Colors.white
                                .withValues(
                              alpha:
                              0.05,
                            ),

                            valueColor:
                            AlwaysStoppedAnimation(
                              node.color,
                            ),
                          ),
                        ),

                        const SizedBox(
                          height: 14,
                        ),

                        Row(

                          children: [

                            Icon(

                              Icons
                                  .warning_amber_rounded,

                              size: 16,

                              color:
                              Colors.white54,
                            ),

                            const SizedBox(
                              width: 8,
                            ),

                            Text(

                              'Decay Risk: ${node.decayRisk.toInt()}%',

                              style:
                              GoogleFonts
                                  .poppins(

                                color:
                                Colors
                                    .white54,

                                fontSize:
                                11,
                              ),
                            ),
                          ],
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