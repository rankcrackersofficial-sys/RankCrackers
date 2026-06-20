import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTextStyles {
  static final hero = GoogleFonts.sora(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    color: AppColors.primaryText,
    letterSpacing: -1.0,
  );

  static final section = GoogleFonts.sora(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.primaryText,
  );

  static final heading = GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.primaryText,
  );

  static final cardTitle = GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.primaryText,
    letterSpacing: 0.2,
  );

  static final body = GoogleFonts.inter(
    fontSize: 14,
    height: 1.6,
    color: AppColors.secondaryText,
  );

  static final label = GoogleFonts.poppins(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.tacticalGold,
    letterSpacing: 1.5,
  );

  static final metric = GoogleFonts.sora(
    fontSize: 36,
    fontWeight: FontWeight.w900,
    color: AppColors.primaryText,
  );

  static final subtitle = GoogleFonts.inter(
    fontSize: 14,
    color: AppColors.secondaryText,
    fontWeight: FontWeight.w500,
  );
}
