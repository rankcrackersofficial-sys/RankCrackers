import 'package:flutter/material.dart';

class ResponsiveHelper {
  static double width(BuildContext context) => MediaQuery.sizeOf(context).width;
  static double height(BuildContext context) => MediaQuery.sizeOf(context).height;

  // BREAKPOINTS v4.2
  static bool isUltraCompact(BuildContext context) => height(context) < 600;
  static bool isSmallPhone(BuildContext context) => width(context) < 360;
  static bool isNormalPhone(BuildContext context) => width(context) >= 360 && width(context) < 430;
  static bool isLargePhone(BuildContext context) => width(context) >= 430 && width(context) < 600;
  static bool isTablet(BuildContext context) => width(context) >= 600 && width(context) < 1024;
  static bool isDesktop(BuildContext context) => width(context) >= 1024;
  
  static bool isLandscape(BuildContext context) => 
    MediaQuery.orientationOf(context) == Orientation.landscape;

  static bool isCompact(BuildContext context) => height(context) < 700 || isSmallPhone(context);

  static double wp(BuildContext context, double p) => width(context) * p;
  static double hp(BuildContext context, double p) => height(context) * p;

  /// Proportional Font Scaling v4.2
  static double sp(BuildContext context, double size) {
    final scale = width(context) / 375;
    double multiplier = isSmallPhone(context) ? 0.85 : 1.0;
    if (isTablet(context)) multiplier = 1.1;
    return (size * scale * multiplier).clamp(
      size * 0.8,
      size * 1.3,
    );
  }

  /// Component Metrics
  static double fieldHeight(BuildContext context) => isCompact(context) ? 46.0 : 56.0;
  static double buttonHeight(BuildContext context) => isSmallPhone(context) ? 52.0 : 60.0;
  static double headerHeight(BuildContext context) => isCompact(context) ? 56.0 : 72.0;
  static double bottomNavHeight(BuildContext context) => isCompact(context) ? 64.0 : 80.0;
  
  /// Spacing Metrics
  static double sectionSpacing(BuildContext context) {
    if (isUltraCompact(context)) return 12.0;
    if (isCompact(context)) return 24.0;
    return 40.0;
  }
  
  static double compactGap(BuildContext context) => isCompact(context) ? 8.0 : 16.0;

  /// Adaptive Graphics
  static double avatarSize(BuildContext context) {
    if (isUltraCompact(context)) return 56.0;
    if (isSmallPhone(context)) return 68.0;
    if (isTablet(context)) return 100.0;
    return 80.0;
  }
  
  static double iconSize(BuildContext context) => isCompact(context) ? 16.0 : 22.0;

  /// Grid Layout Rules
  static int crossAxisCount(BuildContext context) {
    if (isTablet(context)) return 4;
    if (isDesktop(context)) return 6;
    return 2;
  }

  static double gridAspectRatio(BuildContext context) {
    if (isLandscape(context)) return 2.5;
    if (isCompact(context)) return 1.1;
    return 0.92;
  }

  /// Card Metrics
  static double cardPadding(BuildContext context) {
    if (isSmallPhone(context)) return 12.0;
    if (isTablet(context)) return 20.0;
    return 16.0;
  }

  static double cardMinHeight(BuildContext context) {
    if (isUltraCompact(context)) return 50.0;
    if (isCompact(context)) return 64.0;
    return 80.0;
  }
}
