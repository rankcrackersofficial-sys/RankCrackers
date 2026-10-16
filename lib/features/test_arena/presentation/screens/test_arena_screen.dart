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
  TestArenaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
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
                      icon: Icon(Icons.arrow_back_rounded, color: scheme.onSurface),
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
                    color: scheme.onSurface,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Standardized Benchmarking & Major Examination Surface',
                  style: AppTypography.subtitle.copyWith(
                    color: scheme.onSurfaceVariant,
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
                            padding: EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: scheme.surface,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.military_tech_outlined, color: AppColors.gold, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'No Test Arena event is ready yet.',
                                  style: TextStyle(
                                    color: scheme.onSurface,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Check back when a new event is available.',
                                  style: AppTypography.subtitle.copyWith(
                                    color: scheme.onSurfaceVariant,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 14),
                      Text(
                        'Standardized competitive assessments, official Major simulations (300 Marks), and All-India benchmarking papers will be scheduled and published here.',
                        style: AppTypography.body.copyWith(
                          color: scheme.onSurfaceVariant,
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
                      _buildSpecRow(context, 'Structure', '75 Questions (Physics: 25, Chemistry: 25, Math: 25)'),
                      _buildSpecRow(context, 'Duration', '180 Minutes (Full Standard Simulation)'),
                      _buildSpecRow(context, 'Scoring', '+4 for Correct, -1 for Incorrect, 0 for Unattempted (300 Marks)'),
                      _buildSpecRow(context, 'Form Law', 'Identical standardized question form for all cohort participants'),
                      _buildSpecRow(context, 'AIR Authority', 'Aggregated only over identical comparable live cohorts'),
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

  Widget _buildSpecRow(BuildContext context, String label, String value) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(color: scheme.onSurface, fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
