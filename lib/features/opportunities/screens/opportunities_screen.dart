import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/tactical_noir_background.dart';
import '../../../core/widgets/dark_card.dart';

class OpportunitiesScreen extends StatelessWidget {
  const OpportunitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Career Signals',
          style: AppTypography.cardTitle.copyWith(color: Colors.white, fontSize: 16),
        ),
      ),
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480),
                child: DarkCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.gold.withValues(alpha: 0.35),
                            width: 1.2,
                          ),
                        ),
                        child: const Icon(
                          Icons.work_outline_rounded,
                          color: AppColors.gold,
                          size: 36,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Career Signals are not ready yet',
                        textAlign: TextAlign.center,
                        style: AppTypography.hero.copyWith(
                          fontSize: 18,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Career guidance will appear here when enough verified profile and eligibility information is available.',
                        textAlign: TextAlign.center,
                        style: AppTypography.body.copyWith(
                          fontSize: 13,
                          color: Colors.white70,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white10,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          'Student Opportunity Hub',
                          style: AppTypography.label.copyWith(
                            color: AppColors.gold,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
