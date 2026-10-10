import 'package:flutter/material.dart';

class DashboardConstants {
  DashboardConstants._();

  // COLORS

  static const Color scaffoldBackground =
  Color(0xFF060B16);

  static const Color scaffoldDark =
  Color(0xFF0B111E);

  static const Color surfaceCard =
  Color(0xFF121A2B);

  static const Color goldAccent =
  Color(0xFFD4AF37);

  static const Color goldSoft =
  Color(0xFFFFE8A3);

  static const Color blueGlow =
  Color(0xFF4D7CFE);

  static const Color crimsonGlow =
  Color(0xFFB3261E);

  static const Color emberGlow =
  Color(0xFFE35D3F);

  static const Color royalBlack =
  Color(0xFF030711);

  static const Color deepNavyBlack =
  Color(0xFF080F1D);

  // RADIUS


  // RADIUS

  static const double cardRadius = 28;

  // PADDING

  static const double screenPadding = 20;

  static const Color softText =
  Color(0xFF9BA6C6);
  static const LinearGradient madhavCardGradient =
  LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF182133),
      Color(0xFF121A2B),
      Color(0xFF0E1524),
    ],
  );

  // ignore: constant_identifier_names
  static const bool DASHBOARD_START_SMART_START_VISIBLE = false;

}
