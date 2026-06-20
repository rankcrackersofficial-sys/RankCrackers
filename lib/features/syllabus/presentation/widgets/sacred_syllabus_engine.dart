import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum SyllabusNodeState {

  locked,
  active,
  mastered,
  rebuild,
}

class SacredSyllabusNode {

  final String title;

  final String subject;

  final double completion;

  final SyllabusNodeState state;

  final int linkedBattles;

  const SacredSyllabusNode({

    required this.title,

    required this.subject,

    required this.completion,

    required this.state,

    required this.linkedBattles,
  });
}

class SacredSyllabusEngine
    extends StatefulWidget {

  final List<SacredSyllabusNode>
  nodes;

  const SacredSyllabusEngine({

    super.key,

    required this.nodes,
  });

  @override
  State<SacredSyllabusEngine>
  createState() =>
      _SacredSyllabusEngineState();
}

class _SacredSyllabusEngineState
    extends State<
        SacredSyllabusEngine>
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

  Color getNodeColor(
      SyllabusNodeState state,
      ) {

    switch (state) {

      case SyllabusNodeState
          .locked:

        return const Color(
          0xFF7B849B,
        );

      case SyllabusNodeState
          .active:

        return const Color(
          0xFFD4AF37,
        );

      case SyllabusNodeState
          .mastered:

        return const Color(
          0xFF5EDC8D,
        );

      case SyllabusNodeState
          .rebuild:

        return const Color(
          0xFFFF6B6B,
        );
    }
  }

  IconData getNodeIcon(
      SyllabusNodeState state,
      ) {

    switch (state) {

      case SyllabusNodeState
          .locked:

        return Icons.lock_rounded;

      case SyllabusNodeState
          .active:

        return Icons.bolt_rounded;

      case SyllabusNodeState
          .mastered:

        return Icons.workspace_premium_rounded;

      case SyllabusNodeState
          .rebuild:

        return Icons.refresh_rounded;
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

        return Column(

          children:
          widget.nodes.map(

                (node) {

              final color =
              getNodeColor(
                node.state,
              );

              final glow =
                  0.10 +
                      (pulse.abs() *
                          0.10);

              return Container(

                margin:
                const EdgeInsets.only(
                  bottom: 20,
                ),

                padding:
                const EdgeInsets.all(
                  22,
                ),

                decoration:
                BoxDecoration(

                  borderRadius:
                  BorderRadius.circular(
                    30,
                  ),

                  gradient:
                  LinearGradient(

                    begin:
                    Alignment.topLeft,

                    end:
                    Alignment
                        .bottomRight,

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
                    color.withValues(
                      alpha: 0.16,
                    ),
                  ),

                  boxShadow: [

                    BoxShadow(

                      color:
                      color.withValues(
                        alpha:
                        glow,
                      ),

                      blurRadius: 24,
                      spreadRadius: 1,
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

                        Container(

                          height: 56,
                          width: 56,

                          decoration:
                          BoxDecoration(

                            shape:
                            BoxShape
                                .circle,

                            gradient:
                            RadialGradient(

                              colors: [

                                color
                                    .withValues(
                                  alpha:
                                  0.30,
                                ),

                                Colors
                                    .transparent,
                              ],
                            ),
                          ),

                          child: Icon(

                            getNodeIcon(
                              node.state,
                            ),

                            color: color,

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

                                node.title,

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

                              const SizedBox(
                                height: 6,
                              ),

                              Text(

                                node.subject,

                                style:
                                GoogleFonts
                                    .poppins(

                                  color:
                                  Colors
                                      .white60,

                                  fontSize:
                                  12,
                                ),
                              ),
                            ],
                          ),
                        ),

                        Text(

                          '${node.completion.toInt()}%',

                          style:
                          GoogleFonts
                              .cinzel(

                            color: color,

                            fontSize: 22,

                            fontWeight:
                            FontWeight.w700,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(
                      height: 22,
                    ),

                    // =================
                    // PROGRESS
                    // =================

                    ClipRRect(

                      borderRadius:
                      BorderRadius.circular(
                        14,
                      ),

                      child:
                      LinearProgressIndicator(

                        value:
                        node.completion /
                            100,

                        minHeight: 12,

                        backgroundColor:
                        Colors.white
                            .withValues(
                          alpha:
                          0.05,
                        ),

                        valueColor:
                        AlwaysStoppedAnimation(
                          color,
                        ),
                      ),
                    ),

                    const SizedBox(
                      height: 18,
                    ),

                    // =================
                    // FOOTER
                    // =================

                    Row(

                      children: [

                        Icon(

                          Icons
                              .hub_rounded,

                          size: 16,

                          color:
                          color,
                        ),

                        const SizedBox(
                          width: 8,
                        ),

                        Expanded(

                          child: Text(

                            '${node.linkedBattles} linked Crucible battles detected',

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
                        ),

                        Text(

                          node.state
                              .name
                              .toUpperCase(),

                          style:
                          GoogleFonts
                              .cinzel(

                            color: color,

                            fontSize: 10,

                            letterSpacing:
                            1.2,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ).toList(),
        );
      },
    );
  }
}