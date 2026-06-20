import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum TimelineState {

  completed,
  active,
  upcoming,
  rebuild,
}

class SacredTimelineNode {

  final String title;

  final String subtitle;

  final TimelineState state;

  final String time;

  const SacredTimelineNode({

    required this.title,

    required this.subtitle,

    required this.state,

    required this.time,
  });
}

class SacredTimeline
    extends StatefulWidget {

  final List<SacredTimelineNode>
  nodes;

  const SacredTimeline({

    super.key,

    required this.nodes,
  });

  @override
  State<SacredTimeline>
  createState() =>
      _SacredTimelineState();
}

class _SacredTimelineState
    extends State<SacredTimeline>
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

  Color getNodeColor(
      TimelineState state,
      ) {

    switch (state) {

      case TimelineState
          .completed:

        return const Color(
          0xFF5EDC8D,
        );

      case TimelineState
          .active:

        return const Color(
          0xFFD4AF37,
        );

      case TimelineState
          .upcoming:

        return const Color(
          0xFF7B849B,
        );

      case TimelineState
          .rebuild:

        return const Color(
          0xFFFF6B6B,
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

        return Column(

          children:
          List.generate(

            widget.nodes.length,

                (index) {

              final node =
              widget.nodes[index];

              final color =
              getNodeColor(
                node.state,
              );

              final bool isLast =
                  index ==
                      widget
                          .nodes
                          .length -
                          1;

              final glow =
              node.state ==
                  TimelineState
                      .active

                  ? 0.14 +
                  (pulse.abs() *
                      0.12)

                  : 0.06;

              return IntrinsicHeight(

                child: Row(

                  crossAxisAlignment:
                  CrossAxisAlignment
                      .start,

                  children: [

                    // =====================
                    // TIMELINE AXIS
                    // =====================

                    Column(

                      children: [

                        // NODE

                        Container(

                          height: 22,
                          width: 22,

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
                                  0.9,
                                ),

                                color
                                    .withValues(
                                  alpha:
                                  0.2,
                                ),
                              ],
                            ),

                            boxShadow: [

                              BoxShadow(

                                color:
                                color
                                    .withValues(
                                  alpha:
                                  glow,
                                ),

                                blurRadius:
                                20,

                                spreadRadius:
                                2,
                              ),
                            ],
                          ),

                          child:
                          node.state ==
                              TimelineState
                                  .completed

                              ? const Icon(

                            Icons
                                .check_rounded,

                            color:
                            Colors
                                .white,

                            size: 14,
                          )

                              : null,
                        ),

                        // LINE

                        if (!isLast)

                          Expanded(

                            child:
                            Container(

                              width: 2,

                              margin:
                              const EdgeInsets.symmetric(
                                vertical:
                                4,
                              ),

                              decoration:
                              BoxDecoration(

                                gradient:
                                LinearGradient(

                                  begin:
                                  Alignment
                                      .topCenter,

                                  end:
                                  Alignment
                                      .bottomCenter,

                                  colors: [

                                    color
                                        .withValues(
                                      alpha:
                                      0.5,
                                    ),

                                    color
                                        .withValues(
                                      alpha:
                                      0.08,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(
                      width: 18,
                    ),

                    // =====================
                    // CONTENT
                    // =====================

                    Expanded(

                      child: Container(

                        margin:
                        const EdgeInsets.only(
                          bottom: 24,
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
                            alpha:
                            0.03,
                          ),

                          border: Border.all(

                            color:
                            color
                                .withValues(
                              alpha:
                              0.12,
                            ),
                          ),

                          boxShadow: [

                            BoxShadow(

                              color:
                              color
                                  .withValues(
                                alpha:
                                glow,
                              ),

                              blurRadius:
                              22,

                              spreadRadius:
                              1,
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
                                ),

                                Text(

                                  node.time,

                                  style:
                                  GoogleFonts
                                      .cinzel(

                                    color:
                                    color,

                                    fontSize:
                                    10,

                                    letterSpacing:
                                    1,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(
                              height: 10,
                            ),

                            Text(

                              node.subtitle,

                              style:
                              GoogleFonts
                                  .poppins(

                                color:
                                Colors
                                    .white60,

                                fontSize:
                                12,

                                height: 1.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}