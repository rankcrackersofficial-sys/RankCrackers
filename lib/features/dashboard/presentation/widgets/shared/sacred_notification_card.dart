import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum NotificationRealm {

  crucible,
  rebuild,
  archive,
  warning,
  transcend,
}

class SacredNotificationCard
    extends StatefulWidget {

  final String title;

  final String subtitle;

  final String timestamp;

  final NotificationRealm realm;

  final VoidCallback? onTap;

  const SacredNotificationCard({

    super.key,

    required this.title,

    required this.subtitle,

    required this.timestamp,

    required this.realm,

    this.onTap,
  });

  @override
  State<SacredNotificationCard>
  createState() =>
      _SacredNotificationCardState();
}

class _SacredNotificationCardState
    extends State<
        SacredNotificationCard>
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

  Color get realmColor {

    switch (widget.realm) {

      case NotificationRealm
          .crucible:

        return const Color(
          0xFFD4AF37,
        );

      case NotificationRealm
          .rebuild:

        return const Color(
          0xFFFF8C42,
        );

      case NotificationRealm
          .archive:

        return const Color(
          0xFF5EDC8D,
        );

      case NotificationRealm
          .warning:

        return const Color(
          0xFFFF6B6B,
        );

      case NotificationRealm
          .transcend:

        return const Color(
          0xFF8B5CF6,
        );
    }
  }

  IconData get realmIcon {

    switch (widget.realm) {

      case NotificationRealm
          .crucible:

        return Icons
            .local_fire_department_rounded;

      case NotificationRealm
          .rebuild:

        return Icons
            .refresh_rounded;

      case NotificationRealm
          .archive:

        return Icons
            .auto_stories_rounded;

      case NotificationRealm
          .warning:

        return Icons
            .warning_amber_rounded;

      case NotificationRealm
          .transcend:

        return Icons
            .auto_awesome_rounded;
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
            0.10 +
                (pulse.abs() *
                    0.08);

        return GestureDetector(

          onTap:
          widget.onTap,

          child: Container(

            margin:
            const EdgeInsets.only(
              bottom: 18,
            ),

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
                realmColor
                    .withValues(
                  alpha: 0.16,
                ),
              ),

              boxShadow: [

                BoxShadow(

                  color:
                  realmColor
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

              children: [

                // =====================
                // ICON ORB
                // =====================

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

                        realmColor
                            .withValues(
                          alpha: 0.28,
                        ),

                        Colors
                            .transparent,
                      ],
                    ),

                    boxShadow: [

                      BoxShadow(

                        color:
                        realmColor
                            .withValues(
                          alpha:
                          glow,
                        ),

                        blurRadius: 20,
                      ),
                    ],
                  ),

                  child: Icon(

                    realmIcon,

                    color:
                    realmColor,

                    size: 28,
                  ),
                ),

                const SizedBox(
                  width: 18,
                ),

                // =====================
                // CONTENT
                // =====================

                Expanded(

                  child: Column(

                    crossAxisAlignment:
                    CrossAxisAlignment
                        .start,

                    children: [

                      Text(

                        widget.title,

                        style:
                        GoogleFonts
                            .poppins(

                          color:
                          Colors.white,

                          fontSize: 15,

                          fontWeight:
                          FontWeight
                              .w600,
                        ),
                      ),

                      const SizedBox(
                        height: 8,
                      ),

                      Text(

                        widget.subtitle,

                        style:
                        GoogleFonts
                            .poppins(

                          color:
                          Colors.white60,

                          fontSize: 12,

                          height: 1.6,
                        ),
                      ),

                      const SizedBox(
                        height: 12,
                      ),

                      Text(

                        widget.timestamp,

                        style:
                        GoogleFonts
                            .cinzel(

                          color:
                          realmColor,

                          fontSize: 10,

                          letterSpacing:
                          1,
                        ),
                      ),
                    ],
                  ),
                ),

                // =====================
                // ARROW
                // =====================

                Icon(

                  Icons
                      .arrow_forward_ios_rounded,

                  color:
                  realmColor
                      .withValues(
                    alpha: 0.8,
                  ),

                  size: 16,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}