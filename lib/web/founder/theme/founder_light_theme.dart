import 'package:flutter/material.dart';

/// FOUNDER WEB LIGHT OPERATIONAL THEME PRIMITIVES
/// Light warm-white / slate-blue administrative SaaS feel.
/// Isolated strictly to Founder/Admin Web UI.
class FounderLightTheme {
  const FounderLightTheme._();

  // Backgrounds
  static const Color bg = Color(0xFFF8FAFC);          // Warm Slate 50
  static const Color surface = Color(0xFFFFFFFF);     // Pure White
  static const Color surfaceAlt = Color(0xFFF1F5F9);  // Slate 100
  static const Color surfaceHover = Color(0xFFE2E8F0);// Slate 200

  // Text
  static const Color textPrimary = Color(0xFF0F172A);   // Slate 900
  static const Color textSecondary = Color(0xFF334155); // Slate 700
  static const Color textMuted = Color(0xFF64748B);     // Slate 500
  static const Color textDisabled = Color(0xFF94A3B8);  // Slate 400

  // Borders
  static const Color border = Color(0xFFE2E8F0);        // Slate 200
  static const Color borderSubtle = Color(0xFFF1F5F9);  // Slate 100
  static const Color borderFocus = Color(0xFF3B82F6);   // Blue 500

  // Accent Colors
  static const Color gold = Color(0xFFD97706);          // Amber/Gold 600
  static const Color goldLight = Color(0xFFFEF3C7);     // Amber 100
  static const Color primaryDark = Color(0xFF0F172A);   // Slate 900 Navy
  static const Color primaryBlue = Color(0xFF2563EB);   // Blue 600
  static const Color primaryBlueLight = Color(0xFFEFF6FF); // Blue 50

  // Status Colors
  static const Color success = Color(0xFF16A34A);       // Green 600
  static const Color successBg = Color(0xFFDCFCE7);     // Green 100
  static const Color warning = Color(0xFFD97706);       // Amber 600
  static const Color warningBg = Color(0xFFFEF3C7);     // Amber 100
  static const Color danger = Color(0xFFDC2626);        // Red 600
  static const Color dangerBg = Color(0xFFFEE2E2);      // Red 100
  static const Color info = Color(0xFF0284C7);          // Sky 600
  static const Color infoBg = Color(0xFFE0F2FE);        // Sky 100
  static const Color neutralBg = Color(0xFFF1F5F9);     // Slate 100

  // Soft Card Shadows
  static List<BoxShadow> get softShadow => const [
    BoxShadow(
      color: Color(0x0A000000), // 4% opacity black
      blurRadius: 10,
      offset: Offset(0, 2),
    ),
    BoxShadow(
      color: Color(0x05000000), // 2% opacity black
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  static List<BoxShadow> get hoverShadow => const [
    BoxShadow(
      color: Color(0x12000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];
}
