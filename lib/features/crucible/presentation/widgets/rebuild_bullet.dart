import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RebuildBullet extends StatelessWidget {
  final String text;

  const RebuildBullet({
    super.key,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        bottom: 8,
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Colors.redAccent,
              shape: BoxShape.circle,
            ),
          ),

          const SizedBox(width: 10),

          Expanded(
            child: Text(
              text,
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: Colors.white.withValues(
                  alpha: 0.82,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}