import 'package:flutter/material.dart';

class AppRadius {
  static const double xs = 4.0;
  static const double sm = 6.0;
  static const double md = 10.0;
  static const double lg = 14.0;
  static const double xl = 22.0;

  static const double cardRadius = 6.0; // The requested sharp luxury curve
  static const double buttonRadius = 10.0;

  static BorderRadius get card => BorderRadius.circular(cardRadius);
  static BorderRadius get button => BorderRadius.circular(buttonRadius);
}
