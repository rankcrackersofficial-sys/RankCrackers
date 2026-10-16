import 'package:flutter/material.dart';

/// FOUNDER WEB LIGHT OPERATIONAL THEME PRIMITIVES
/// Light warm-white / slate-blue administrative SaaS feel.
/// Isolated strictly to Founder/Admin Web UI.
class FounderLightTheme {
  const FounderLightTheme._();

  // Backgrounds (Executive Command Slate)
  static const Color bg = Color(0xFFF8F9FC); // Executive Slate Canvas (#F8F9FC)
  static const Color canvas = Color(0xFFF8F9FC);
  static const Color surface = Color(0xFFFFFFFF); // Pure White Cards (#FFFFFF)
  static const Color surfaceCard = Color(0xFFFFFFFF);
  static const Color surfaceAlt = Color(0xFFF1F5F9); // Slate 100 (#F1F5F9)
  static const Color surfaceSubtle = Color(0xFFF1F5F9);
  static const Color surfaceHover = Color(0xFFE2E8F0); // Slate 200

  // Text
  static const Color textPrimary =
      Color(0xFF0F172A); // Slate 900 Navy (#0F172A)
  static const Color textSecondary = Color(0xFF475569); // Slate 700 (#475569)
  static const Color textMuted = Color(0xFF64748B); // Slate 500 (#64748B)
  static const Color textDisabled = Color(0xFF94A3B8); // Slate 400 (#94A3B8)

  // Borders & Hairlines
  static const Color border = Color(0xFFE2E8F0); // Hairline (#E2E8F0)
  static const Color borderSecondary =
      Color(0xFFCBD5E1); // Mid Border (#CBD5E1)
  static const Color borderSubtle = Color(0xFFF1F5F9); // Slate 100
  static const Color borderFocus = Color(0xFF3B82F6); // Blue 500

  // Brand Accent (Executive Gold)
  static const Color gold = Color(0xFF9A7B38); // Canonical Gold (#9A7B38)
  static const Color brandGold = Color(0xFF9A7B38);
  static const Color brandGoldHover = Color(0xFF84692E);
  static const Color goldLight =
      Color(0xFFFEF9C3); // Brand Gold Light (#FEF9C3)
  static const Color brandGoldLight = Color(0xFFFEF9C3);
  static const Color brandGoldSubtle = Color(0xFFFEF08A);
  static const Color brandGoldText = Color(0xFF854D0E);
  static const Color primaryDark = Color(0xFF0F172A); // Slate 900 Navy
  static const Color logoBlack =
      Color(0xFF000000); // 40x40 Logo Badge Container (#000000)

  // Status Colors (Executive Command Slate)
  static const Color emerald = Color(0xFF15803D); // Green 700 (#15803D)
  static const Color success = Color(0xFF15803D);
  static const Color successBg = Color(0xFFDCFCE7); // Green 100 (#DCFCE7)
  static const Color emeraldBorder = Color(0xFF86EFAC);

  static const Color amber = Color(0xFFD97706); // Amber 600 (#D97706)
  static const Color warning = Color(0xFFD97706);
  static const Color warningBg = Color(0xFFFEF3C7); // Amber 100 (#FEF3C7)
  static const Color amberBorder = Color(0xFFFDE68A);

  static const Color crimson = Color(0xFFDC2626); // Red 600 (#DC2626)
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerBg = Color(0xFFFEE2E2); // Red 100 (#FEE2E2)
  static const Color crimsonBorder = Color(0xFFFECACA);

  static const Color primaryBlue = Color(0xFF2563EB); // Blue 600 (#2563EB)
  static const Color primaryBlueLight = Color(0xFFEFF6FF); // Blue 50 (#EFF6FF)
  static const Color blueBorder = Color(0xFFBFDBFE);
  static const Color info = Color(0xFF2563EB);
  static const Color infoBg = Color(0xFFEFF6FF);
  static const Color neutralBg = Color(0xFFF1F5F9);

  // Soft Card Shadows
  static List<BoxShadow> get softShadow => const [
        BoxShadow(
          color: Color(0x080F172A), // 3% opacity slate
          blurRadius: 4,
          offset: Offset(0, 1),
        ),
        BoxShadow(
          color: Color(0x050F172A),
          blurRadius: 1,
          offset: Offset(0, 1),
        ),
      ];

  static List<BoxShadow> get cardShadow => const [
        BoxShadow(
          color: Color(0x0A0F172A),
          blurRadius: 6,
          offset: Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get hoverShadow => const [
        BoxShadow(
          color: Color(0x120F172A),
          blurRadius: 16,
          offset: Offset(0, 4),
        ),
      ];
}
