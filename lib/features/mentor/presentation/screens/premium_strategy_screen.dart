// FILE: lib/features/mentor/presentation/screens/premium_strategy_screen.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PremiumStrategyScreen extends StatelessWidget {
  const PremiumStrategyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070A12),
      body: Center(
        child: Text(
          "Strategic Ingestion Active",
          style: GoogleFonts.sora(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}