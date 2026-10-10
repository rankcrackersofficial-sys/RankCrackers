import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/constants/founder_identity.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../core/test_arena_fixture_harness.dart';
import 'test_arena_active_test_screen.dart';

/// TEST ARENA FOUNDER HARNESS SCREEN (Isolated Diagnostic Route)
/// Accessible strictly by Founders or in debug mode.
/// PRODUCTION_STUDENT_CAN_INVOKE_FIXTURE_HARNESS = NO
class TestArenaFounderHarnessScreen extends ConsumerWidget {
  const TestArenaFounderHarnessScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
    final isFounder = sessionUser != null &&
        (FounderIdentity.founderEmails.contains(sessionUser.email) ||
            sessionUser.uid == FounderIdentity.founderUid);

    // Fail closed: deny non-founders in non-debug mode
    if (!kDebugMode && !isFounder) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Text(
            'Access Restricted: Founder/Diagnostic Authority Required.',
            style: AppTypography.body.copyWith(color: Colors.red),
          ),
        ),
      );
    }

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
                        color: Colors.amber.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                      ),
                      child: const Text(
                        'FOUNDER STAGING HARNESS',
                        style: TextStyle(
                          color: Colors.amber,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'TEST ARENA DIAGNOSTIC HARNESS',
                  style: AppTypography.hero.copyWith(fontSize: 20, color: Colors.white),
                ),
                const SizedBox(height: 6),
                Text(
                  'Non-production test harness for verifying attempt lifecycle, timer reconciliation, answer persistence, and remediation routing on physical devices.',
                  style: AppTypography.subtitle.copyWith(color: AppColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 20),

                // Staging Assessment Launch Card
                DarkCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'STAGING 6-QUESTION FIXTURE',
                        style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Launches a 6-question non-production test paper (2 Physics, 2 Chemistry, 2 Mathematics) to validate runtime behavior.',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.play_arrow_rounded, size: 18),
                          label: const Text(
                            'LAUNCH STAGING ASSESSMENT',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          onPressed: () {
                            final stagingEvent = TestArenaFixtureHarness.createStagingEvent();
                            final stagingPaper = TestArenaFixtureHarness.createStagingPaper();
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => TestArenaActiveTestScreen(
                                  event: stagingEvent,
                                  paper: stagingPaper,
                                  uid: sessionUser?.uid ?? 'FOUNDER_STAGING_UID',
                                  isFixtureMode: true,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
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
}
