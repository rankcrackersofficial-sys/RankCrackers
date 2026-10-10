import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';

/// TEST ARENA SCREEN (Student Root Surface)
/// Sovereign benchmarking root adhering strictly to academic truth.
/// Displays truthful "No Test Arena event is ready yet." in production.
/// NORMAL_STUDENT_VISIBLE_FOUNDER_STAGING_CONTROL_COUNT = 0
/// PRODUCTION_STUDENT_CAN_INVOKE_FIXTURE_HARNESS = NO
/// STUDENT_VISIBLE_INTERNAL_ELIGIBILITY_PROCESS_TERM_COUNT = 0
/// STUDENT_VISIBLE_INTERNAL_MAJOR_READINESS_COUNTER_COUNT = 0
/// UNGOVERNED_RANK_PLACEHOLDER_COUNT = 0
class TestArenaScreen extends ConsumerWidget {
  const TestArenaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Navigation Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                      ),
                      child: const Text(
                        'JEE MAIN 2027',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 🔱 1. ROOT TITLE BLOCK
                Text(
                  'TEST ARENA',
                  style: AppTypography.hero.copyWith(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Standardized Benchmarking & Major Examination Surface',
                  style: AppTypography.subtitle.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 20),

                // 🔱 2. TRUTHFUL PRODUCTION STATE (Clean Student Copy)
                DarkCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.military_tech_outlined, color: AppColors.gold, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'No Test Arena event is ready yet.',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Check back when a new event is available.',
                                  style: AppTypography.subtitle.copyWith(
                                    color: AppColors.textSecondary,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Standardized competitive assessments, official Major simulations (300 Marks), and All-India benchmarking papers will be scheduled and published here.',
                        style: AppTypography.body.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 🔱 3. GOVERNED SPECIFICATIONS CARD
                DarkCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'STANDARDIZED MAJOR SPECIFICATION',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildSpecRow('Structure', '75 Questions (Physics: 25, Chemistry: 25, Math: 25)'),
                      _buildSpecRow('Duration', '180 Minutes (Full Standard Simulation)'),
                      _buildSpecRow('Scoring', '+4 for Correct, -1 for Incorrect, 0 for Unattempted (300 Marks)'),
                      _buildSpecRow('Form Law', 'Identical standardized question form for all cohort participants'),
                      _buildSpecRow('AIR Authority', 'Aggregated only over identical comparable live cohorts'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpecRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
