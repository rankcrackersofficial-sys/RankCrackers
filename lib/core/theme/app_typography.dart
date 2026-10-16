import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  // ===============================================
  // LUXURY EDITORIAL HIERARCHY
  // ===============================================
  
  // Hero: Calm, large, generous spacing
  static final hero = GoogleFonts.sora(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    height: 1.2,
  );

  // Section: Clear, intentional
  static final section = GoogleFonts.sora(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
  );

  // Heading: Professional, bold but restrained
  static final heading = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
  );

  // Card Title: Compact and clean
  static final cardTitle = GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
  );

  // Body: Optimized for long-form deep reading (DigiBook)
  static final body = GoogleFonts.inter(
    fontSize: 15,
    height: 1.7, // Generous line height for reading
    fontWeight: FontWeight.w400,
  );

  // Subtitle / Metadata
  static final subtitle = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  // Labels: Small caps / Wide tracking for tactical feel
  static final label = GoogleFonts.inter(
    fontSize: 10,
    fontWeight: FontWeight.w800,
    color: AppColors.gold,
    letterSpacing: 1.8,
  );

  // Metrics: Large, quiet confidence
  static final metric = GoogleFonts.sora(
    fontSize: 34,
    fontWeight: FontWeight.w800,
    letterSpacing: -1.0,
  );

  // Reading: Optimized for long-form deep Hindi reading
  static final readingContent = GoogleFonts.notoSans(
    fontSize: 17,
    height: 2.0,
    letterSpacing: 0.2,
    fontWeight: FontWeight.w400,
  );
  
  static final button = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: Colors.black,
    letterSpacing: 0.5,
  );
}
