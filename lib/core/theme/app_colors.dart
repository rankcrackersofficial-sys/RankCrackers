import 'package:flutter/material.dart';

class AppColors {
  // =========================================
  // BASE - LUXURY TACTICAL NOIR 🔱
  // =========================================
  // Deep matte darks
  static const Color background = Color(0xFF0A0C10); 
  static const Color surface = Color(0xFF14181F);
  static const Color surface2 = Color(0xFF1B222C);
  static const Color elevatedSurface = Color(0xFF1C222B);
  
  // Graphite tones
  static const Color graphite = Color(0xFF232933);
  static const Color graphiteLight = Color(0xFF2D3540);

  // =========================================
  // ACCENTS - RESTRAINED & EXPENSIVE
  // =========================================
  // Muted gold (Rolex/Luxury style)
  static const Color gold = Color(0xFFB39B5D);
  static const Color tacticalGold = Color(0xFFB39B5D);
  
  // Platinum / Silver accents
  static const Color platinum = Color(0xFFD1D5DB);
  
  // Functional accents (Restrained)
  static const Color success = Color(0xFF4A8B6F);
  static const Color error = Color(0xFF9E4A4A);
  static const Color info = Color(0xFF4A6F8B);

  // =========================================
  // TEXT - WARM SOFT WHITE & PREMIUM CONTRAST
  // =========================================
  static const Color primaryText = Color(0xFFE2E8F0); // Warm soft white
  static const Color secondaryText = Color(0xFF94A3B8); // Muted gray-blue
  static const Color mutedText = Color(0xFF64748B);
  static const Color ivory = Color(0xFFF1F5F9);

  // =========================================
  // BORDERS & SHADOWS - SUBTLE LAYERED
  // =========================================
  static const Color border = Color(0xFF1E293B);
  static const Color borderSoft = Color(0xFF161F30);
  
  // Matte Noir Gradient for surfaces
  static const LinearGradient matteNoirGradient = LinearGradient(
    colors: [Color(0xFF1A202C), Color(0xFF12161E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final List<BoxShadow> premiumShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.4),
      blurRadius: 30,
      offset: const Offset(0, 10),
    )
  ];

  // =========================================
  // LEGACY COMPATIBILITY - FIXING ANALYZE 🔱
  // =========================================
  static const Color card = surface;
  static const Color tacticalSurface = surface;
  static const Color primary = gold;
  static const Color primaryBlue = info;
  static const Color textPrimary = primaryText;
  static const Color textSecondary = secondaryText;
  static const Color textMedium = mutedText;
  static const Color textWhite = ivory;
  static const Color danger = error;
  static const Color bgLight = elevatedSurface;
  
  static const LinearGradient madhavCardGradient = matteNoirGradient;
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [gold, Color(0xFF8C7B4D)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static final List<BoxShadow> goldGlowShadow = [
    BoxShadow(
      color: gold.withValues(alpha: 0.1),
      blurRadius: 20,
      spreadRadius: 2,
    )
  ];
}
