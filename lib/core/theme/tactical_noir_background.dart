import 'package:flutter/material.dart';
import '../utils/responsive_helper.dart';
import 'app_colors.dart';

class TacticalNoirBackground extends StatelessWidget {
  final Widget child;

  const TacticalNoirBackground({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final double screenWidth = ResponsiveHelper.width(context);
    final double screenHeight = ResponsiveHelper.height(context);

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF0A0F17),
            Color(0xFF070B11),
            Color(0xFF05070D),
          ],
        ),
      ),
      child: Stack(
        children: [
          // TOP AMBIENT GLOW (Proportional)
          Positioned(
            top: -screenHeight * 0.12,
            right: -screenWidth * 0.2,
            child: Container(
              width: screenWidth * 0.7,
              height: screenWidth * 0.7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.035),
              ),
            ),
          ),

          // LEFT DEPTH LIGHT (Proportional)
          Positioned(
            left: -screenWidth * 0.25,
            top: screenHeight * 0.3,
            child: Container(
              width: screenWidth * 0.6,
              height: screenWidth * 0.6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.015),
              ),
            ),
          ),

          // BOTTOM MATTE DEPTH (Proportional)
          Positioned(
            bottom: -screenHeight * 0.15,
            right: -screenWidth * 0.25,
            child: Container(
              width: screenWidth * 0.75,
              height: screenWidth * 0.75,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.018),
              ),
            ),
          ),

          child,
        ],
      ),
    );
  }
}
