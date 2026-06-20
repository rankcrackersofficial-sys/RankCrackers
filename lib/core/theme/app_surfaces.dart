import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppSurfaces {
  static const cardGradient = AppColors.madhavCardGradient;
  
  static final cardDecoration = BoxDecoration(
    color: AppColors.surface,
    gradient: cardGradient,
    borderRadius: BorderRadius.circular(6.0),
    border: Border.all(
      color: AppColors.gold.withValues(alpha: 0.08),
      width: 1.0,
    ),
    boxShadow: AppColors.premiumShadow,
  );

  static const bgGradient = RadialGradient(
    colors: [
      Color(0xFF111827),
      Color(0xFF070B11),
    ],
    radius: 1.5,
    center: Alignment.topCenter,
  );
}
