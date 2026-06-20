import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';

class GlowContainer extends StatelessWidget {
  final Widget child;
  final Color? color;
  final double blurRadius;
  final double spreadRadius;

  const GlowContainer({
    super.key,
    required this.child,
    this.color,
    this.blurRadius = 20,
    this.spreadRadius = 0,
  });

  @override
  Widget build(BuildContext context) {
    final glowColor = color ?? AppColors.gold;
    
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: glowColor.withValues(alpha: 0.1),
            blurRadius: blurRadius,
            spreadRadius: spreadRadius,
          ),
        ],
      ),
      child: child,
    );
  }
}
