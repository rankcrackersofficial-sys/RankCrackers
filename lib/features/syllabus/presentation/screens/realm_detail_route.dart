import 'package:flutter/material.dart';

class RealmDetailRoute
    extends PageRouteBuilder {

  final Widget child;

  RealmDetailRoute({
    required this.child,
  }) : super(

    pageBuilder: (
        context,
        animation,
        secondaryAnimation,
        ) {

      return child;
    },

    transitionsBuilder: (

        context,

        animation,

        secondaryAnimation,

        child,
        ) {

      final fade =
      CurvedAnimation(

        parent: animation,

        curve: Curves.easeOut,
      );

      final scale =

      Tween<double>(
        begin: 0.96,
        end: 1.0,
      ).animate(

        CurvedAnimation(

          parent: animation,

          curve:
          Curves.easeOutCubic,
        ),
      );

      return FadeTransition(

        opacity: fade,

        child: ScaleTransition(

          scale: scale,

          child: child,
        ),
      );
    },
  );
}