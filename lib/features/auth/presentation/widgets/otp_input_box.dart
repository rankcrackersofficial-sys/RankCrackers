import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';

class OtpInputBox extends StatelessWidget {
  final TextEditingController controller;
  final bool autoFocus;

  const OtpInputBox({
    super.key,
    required this.controller,
    this.autoFocus = false,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return SizedBox(
      width: 62,

      child: TextFormField(
        controller: controller,

        autofocus: autoFocus,

        keyboardType: TextInputType.number,

        textAlign: TextAlign.center,

        maxLength: 1,

        style: GoogleFonts.sora(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),

        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
        ],

        decoration: InputDecoration(
          counterText: "",

          filled: true,

          fillColor: scheme.surfaceContainerHighest,

          contentPadding:
          const EdgeInsets.symmetric(
            vertical: 18,
          ),

          border: OutlineInputBorder(
            borderRadius:
            BorderRadius.circular(18),

            borderSide: BorderSide(
              color: scheme.outline,
            ),
          ),

          enabledBorder: OutlineInputBorder(
            borderRadius:
            BorderRadius.circular(18),

            borderSide: BorderSide(
              color: scheme.outline,
            ),
          ),

          focusedBorder: OutlineInputBorder(
            borderRadius:
            BorderRadius.circular(18),

            borderSide: BorderSide(
              color: AppColors.gold,
              width: 1.6,
            ),
          ),
        ),

        onChanged: (value) {

          // NEXT BOX
          if (value.length == 1) {
            FocusScope.of(context)
                .nextFocus();
          }

          // PREVIOUS BOX
          if (value.isEmpty) {
            FocusScope.of(context)
                .previousFocus();
          }
        },
      ),
    );
  }
}
