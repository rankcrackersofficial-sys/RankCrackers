import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../utils/responsive_helper.dart';

class DarkCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? height;
  final BorderRadius? borderRadius;
  final BoxBorder? border;
  final List<BoxShadow>? boxShadow;
  final Color? backgroundColor;
  final Gradient? gradient;
  final BoxDecoration? decoration;

  const DarkCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.height,
    this.borderRadius,
    this.border,
    this.boxShadow,
    this.backgroundColor,
    this.gradient,
    this.decoration,
  });

  @override
  Widget build(BuildContext context) {
    // PREMIUM MATTE DNA (Radius = 16.0)
    final effectiveRadius = borderRadius ?? 
        decoration?.borderRadius as BorderRadius? ?? 
        BorderRadius.circular(16);

    return Container(
      width: double.infinity,
      constraints: BoxConstraints(
        minHeight: ResponsiveHelper.cardMinHeight(context), // Adaptive minHeight v2.0
      ),
      height: height,
      margin: margin,
      decoration: decoration ?? BoxDecoration(
        color: backgroundColor ?? AppColors.surface,
        gradient: gradient, 
        borderRadius: effectiveRadius,
        border: border ?? Border.all(
          color: AppColors.borderSoft,
          width: 1.0,
        ),
        boxShadow: boxShadow,
      ),
      child: ClipRRect(
        borderRadius: effectiveRadius,
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: padding ?? EdgeInsets.all(ResponsiveHelper.cardPadding(context)), // Adaptive Padding v2.0
          child: child,
        ),
      ),
    );
  }
}
