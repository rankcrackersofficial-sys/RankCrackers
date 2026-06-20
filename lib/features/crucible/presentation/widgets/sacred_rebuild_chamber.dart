import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/dark_card.dart';

class RebuildNode {

  final String topic;

  final String weakness;

  final int failedQuestions;

  final double recovery;

  final Color color;

  const RebuildNode({

    required this.topic,

    required this.weakness,

    required this.failedQuestions,

    required this.recovery,

    required this.color,
  });
}

class SacredRebuildChamber
    extends StatefulWidget {

  final List<RebuildNode>
  rebuildNodes;

  const SacredRebuildChamber({

    super.key,

    required this.rebuildNodes,
  });

  @override
  State<SacredRebuildChamber>
  createState() =>
      _SacredRebuildChamberState();
}

class _SacredRebuildChamberState
    extends State<
        SacredRebuildChamber>
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
              34,
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
                0xFFFF6B6B,
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

              // =====================
              // HEADER
              // =====================

              Row(

                children: [

                  Container(

                    height: 58,
                    width: 58,

                    decoration:
                    BoxDecoration(

                      shape:
                      BoxShape.circle,

                      gradient:
                      RadialGradient(

                        colors: [

                          const Color(
                            0xFFFF6B6B,
                          ).withValues(
                            alpha: 0.30,
                          ),

                          Colors
                              .transparent,
                        ],
                      ),
                    ),

                    child: const Icon(

                      Icons
                          .local_fire_department_rounded,

                      color:
                      Color(
                        0xFFFF6B6B,
                      ),

                      size: 30,
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

                          'Sacred Rebuild Chamber',

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

                          'Weakness reinforcement cycle active',

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
                height: 32,
              ),

              // =====================
              // REBUILD NODES
              // =====================

              ...widget.rebuildNodes.map(

                    (node) {

                  final glow =
                      0.10 +
                          (pulse.abs() *
                              0.10);

                  return DarkCard(

                    margin:
                    const EdgeInsets.only(
                      bottom: 20,
                    ),

                    padding:
                    const EdgeInsets.all(
                      20,
                    ),

                    decoration:
                    BoxDecoration(

                      borderRadius:
                      BorderRadius.circular(
                        26,
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
                          alpha: 0.18,
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
                          22,
                        ),
                      ],
                    ),

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                      children: [

                        // =================
                        // TOP ROW
                        // =================

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
                                  15,

                                  fontWeight:
                                  FontWeight
                                      .w600,
                                ),
                              ),
                            ),

                            Text(

                              '${node.recovery.toInt()}%',

                              style:
                              GoogleFonts
                                  .cinzel(

                                color:
                                node.color,

                                fontSize:
                                20,

                                fontWeight:
                                FontWeight
                                    .w700,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(
                          height: 14,
                        ),

                        // =================
                        // WEAKNESS
                        // =================

                        Text(

                          node.weakness,

                          style:
                          GoogleFonts
                              .poppins(

                            color:
                            Colors.white60,

                            fontSize: 12,

                            height: 1.7,
                          ),
                        ),

                        const SizedBox(
                          height: 18,
                        ),

                        // =================
                        // RECOVERY BAR
                        // =================

                        ClipRRect(

                          borderRadius:
                          BorderRadius.circular(
                            14,
                          ),

                          child:
                          LinearProgressIndicator(

                            value:
                            node.recovery /
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
                          height: 16,
                        ),

                        // =================
                        // FOOTER
                        // =================

                        Row(

                          children: [

                            Icon(

                              Icons
                                  .dangerous_rounded,

                              size: 16,

                              color:
                              node.color,
                            ),

                            const SizedBox(
                              width: 8,
                            ),

                            Text(

                              '${node.failedQuestions} failed battle questions detected',

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