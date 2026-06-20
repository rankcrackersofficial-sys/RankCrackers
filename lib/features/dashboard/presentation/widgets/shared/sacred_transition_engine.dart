import 'package:flutter/material.dart';

class SacredTransitionEngine
    extends PageRouteBuilder {

  final Widget page;

  SacredTransitionEngine({

    required this.page,
  })

      : super(

    transitionDuration:
    const Duration(
      milliseconds: 900,
    ),

    reverseTransitionDuration:
    const Duration(
      milliseconds: 700,
    ),

    pageBuilder:

        (
        context,
        animation,
        secondaryAnimation,
        ) {

      return page;
    },

    transitionsBuilder:

        (
        context,
        animation,
        secondaryAnimation,
        child,
        ) {

      // =====================================
      // FADE
      // =====================================

      final fadeAnimation =
      Tween<double>(

        begin: 0.0,
        end: 1.0,

      ).animate(

        CurvedAnimation(

          parent: animation,

          curve:
          Curves.easeOutCubic,
        ),
      );

      // =====================================
      // SCALE
      // =====================================

      final scaleAnimation =
      Tween<double>(

        begin: 0.96,
        end: 1.0,

      ).animate(

        CurvedAnimation(

          parent: animation,

          curve:
          Curves.easeOutExpo,
        ),
      );

      // =====================================
      // SLIDE
      // =====================================

      final slideAnimation =
      Tween<Offset>(

        begin:
        const Offset(
          0.0,
          0.03,
        ),

        end: Offset.zero,

      ).animate(

        CurvedAnimation(

          parent: animation,

          curve:
          Curves.easeOutQuart,
        ),
      );

      // =====================================
      // SACRED TRANSITION
      // =====================================

      return FadeTransition(

        opacity: fadeAnimation,

        child: SlideTransition(

          position:
          slideAnimation,

          child: ScaleTransition(

            scale:
            scaleAnimation,

            child: child,
          ),
        ),
      );
    },
  );
}