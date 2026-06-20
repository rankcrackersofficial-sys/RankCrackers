import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PhaseTrackerWidget extends StatelessWidget {
  final int currentDay;

  const PhaseTrackerWidget({
    super.key,
    required this.currentDay,
  });

  static const Color surfaceCard = Color(0xFF111625);
  static const Color goldAccent = Color(0xFFD4AF37);

  @override
  Widget build(BuildContext context) {
    final double progress = currentDay / 99;

    String phase = "Foundation Phase";

    if (currentDay > 33 && currentDay <= 66) {
      phase = "Acceleration Phase";
    } else if (currentDay > 66) {
      phase = "Final Strike Phase";
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: surfaceCard,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.05),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Day $currentDay / 99",
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 6),

          Text(
            phase,
            style: GoogleFonts.poppins(
              color: goldAccent,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),

          const SizedBox(height: 18),

          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 10,
              backgroundColor: Colors.white.withValues(alpha: 0.05),
              valueColor: const AlwaysStoppedAnimation(goldAccent),
            ),
          ),
        ],
      ),
    );
  }
}