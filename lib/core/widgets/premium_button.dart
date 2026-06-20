import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../utils/responsive_helper.dart';

class PremiumButton extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final bool isLoading;

  const PremiumButton({
    super.key,
    required this.text,
    required this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: ResponsiveHelper.buttonHeight(context), // 🔱 Adaptive Height v2.0
      child: ElevatedButton(
        onPressed: isLoading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.tacticalGold,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: ResponsiveHelper.sp(context, 22),
                height: ResponsiveHelper.sp(context, 22),
                child: const CircularProgressIndicator(
                  strokeWidth: 2.4,
                  color: Colors.black,
                ),
              )
            : Text(
                text,
                style: GoogleFonts.poppins(
                  fontSize: ResponsiveHelper.sp(context, 15), // 🔱 Refined Font v2.0
                  fontWeight: FontWeight.w700,
                  color: Colors.black,
                ),
              ),
      ),
    );
  }
}
