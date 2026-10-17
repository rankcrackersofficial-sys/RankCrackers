import 'dart:async';
import 'package:flutter/foundation.dart';
import '../telemetry/student_route_telemetry.dart';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/app_routes.dart';
import '../theme/app_colors.dart';
import '../navigation/main_navigation_shell.dart';
import '../models/micro_topic_node.dart';

// SCREENS
import '../../features/onboarding/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/unified_identity_screen.dart';
import '../../features/auth/presentation/screens/mission_realm_screen.dart';
import '../../features/onboarding/presentation/screens/diagnostic_test_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/crucible/presentation/screens/crucible_screen.dart';
import '../../features/syllabus/presentation/screens/syllabus_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/home/presentation/screens/digi_book_screen.dart';
import '../../features/digibook/presentation/screens/digi_book_library_screen.dart';
import '../../features/digibook/domain/models/digibook_launch_args.dart';
import '../../features/assessment/presentation/screens/diagnostic_result_screen.dart';
import '../../features/deep_profile/screens/deep_profile_screen.dart';
import '../../features/opportunities/screens/opportunities_screen.dart';
import '../../features/opportunities/presentation/screens/sentinel_center_screen.dart';
import '../../features/opportunities/presentation/screens/notification_center_screen.dart';
import '../../features/progress_tracker/presentation/screens/progress_tracker_screen.dart';
import '../../features/pyq/presentation/screens/pyq_vault_screen.dart';
import '../../features/revision/presentation/screens/revision_desk_screen.dart';
import '../../features/test_arena/presentation/screens/test_arena_screen.dart';
import '../../features/test_arena/presentation/screens/test_arena_founder_harness_screen.dart';
import '../../features/preview/presentation/screens/nebula_founder_preview_screen.dart';
import '../theme/tactical_noir_background.dart';
import '../../features/crucible/presentation/widgets/sacred_micro_test_chamber.dart';
import '../../features/crucible/presentation/widgets/sacred_macro_test_citadel.dart';
import '../../features/crucible/presentation/widgets/sacred_rebuild_chamber.dart';
import '../../features/monetization/presentation/screens/elite_offer_screen.dart';
import '../../features/monetization/presentation/screens/upi_checkout_screen.dart';
import '../../features/monetization/domain/revenue_plan.dart';
import 'package:cloud_functions/cloud_functions.dart';

import 'package:firebase_auth/firebase_auth.dart';
import '../../shared/session/session_manager.dart';
import '../../shared/providers/session_provider.dart';
import '../constants/founder_identity.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorDashboardKey =
    GlobalKey<NavigatorState>(debugLabel: 'dashboard');
final GlobalKey<NavigatorState> _shellNavigatorSyllabusKey =
    GlobalKey<NavigatorState>(debugLabel: 'syllabus');
final GlobalKey<NavigatorState> _shellNavigatorDigiBookKey =
    GlobalKey<NavigatorState>(debugLabel: 'digibook');
final GlobalKey<NavigatorState> _shellNavigatorCrucibleKey =
    GlobalKey<NavigatorState>(debugLabel: 'crucible');
final GlobalKey<NavigatorState> _shellNavigatorOpportunitiesKey =
    GlobalKey<NavigatorState>(debugLabel: 'opportunities');

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: AppRoutes.splash,
  redirect: (context, state) {
    final user = FirebaseAuth.instance.currentUser;
    final matchedLocation = state.matchedLocation;
    if (user != null && !FounderIdentity.isFounderUser(user)) {
      unawaited(StudentRouteTelemetry.instance.report(matchedLocation));
    }

    debugPrint("🔱 ROUTER REDIRECT: $matchedLocation");

    // 🔱 Level-12.7 & 12.9 Protection: Never redirect from Splash internally.
    if (matchedLocation == AppRoutes.splash || state.uri.path == '/') {
      return null;
    }

    final bool onLoginFlow = matchedLocation == AppRoutes.login ||
        matchedLocation == AppRoutes.profileSetup;

    // 🔱 Authority 1: Auth Gate
    if (user == null) {
      debugPrint("🔱 ROUTER: User NULL, routing to Login");
      return onLoginFlow ? null : AppRoutes.login;
    }

    // 🔱 Authority 2: Privilege Gate (Bypass Onboarding for Founders/Admins)
    bool isPrivileged = FounderIdentity.isFounderUser(user);

    if (isPrivileged && onLoginFlow) {
      debugPrint(
          "🔱 ROUTER: Privileged User on Login flow, bypassing to Dashboard");
      return AppRoutes.dashboard;
    }

    // 🔱 Authority 3: Profile Gate (Must complete setup)
    // Level-12.8 Hardening: Full synchronous authority.
    final profileDone = SessionManager.profileCompletedSync();
    if (!profileDone && !isPrivileged) {
      debugPrint("🔱 ROUTER: Profile incomplete, routing to Identity");
      return (matchedLocation == AppRoutes.profileSetup)
          ? null
          : AppRoutes.profileSetup;
    }

    // 🔱 Authority 4: Mission Gate (Must select valid mission)
    final String? selectedExam = SessionManager.selectedExamSync();
    // A persisted canonical mission is enough to keep the user on the
    // authenticated shell while the authoritative catalog snapshot hydrates.
    // Once the snapshot arrives, the normal validity gate still applies.
    if (selectedExam != null &&
        selectedExam.trim().isNotEmpty &&
        !SessionManager.accessSnapshotReady) {
      debugPrint('🔱 ROUTER: Waiting for mission catalog hydration');
      return null;
    }
    final bool isMissionValid = SessionManager.isMissionValid(selectedExam);
    if (!isMissionValid && !isPrivileged) {
      debugPrint("🔱 ROUTER: Mission missing or invalid, routing to Realm");
      return (matchedLocation == AppRoutes.missionRealm)
          ? null
          : AppRoutes.missionRealm;
    }

    // 🔱 Authority 5: Authenticated users should not be on Login screens
    if (onLoginFlow) {
      debugPrint("🔱 ROUTER: Auth user on Login flow, routing to Dashboard");
      return AppRoutes.dashboard;
    }

    debugPrint("🔱 ROUTER PASSED");
    return null;
  },
  routes: [
    GoRoute(
      path: AppRoutes.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const UnifiedIdentityScreen(),
    ),
    GoRoute(
      path: AppRoutes.profileSetup,
      builder: (context, state) => const UnifiedIdentityScreen(),
    ),
    GoRoute(
      path: AppRoutes.missionRealm,
      builder: (context, state) => const MissionRealmScreen(),
    ),
    GoRoute(
      path: AppRoutes.diagnosticEntry,
      builder: (context, state) => const DiagnosticTestScreen(),
    ),
    GoRoute(
      path: AppRoutes.diagnosticTest,
      builder: (context, state) => const DiagnosticTestScreen(),
    ),
    GoRoute(
      path: AppRoutes.diagnosticResult,
      builder: (context, state) {
        final data = state.extra as Map<String, dynamic>? ?? {};
        return DiagnosticResultScreen(
          questions: data['questions'] ?? [],
          answers: data['answers'] ?? [],
          durations: data['durations'] ?? [],
        );
      },
    ),
    GoRoute(
      path: AppRoutes.nebulaFounderPreview,
      builder: (context, state) =>
          FounderIdentity.isFounderUser(FirebaseAuth.instance.currentUser)
              ? const NebulaFounderPreviewScreen()
              : const Scaffold(
                  backgroundColor: AppColors.background,
                  body: Center(
                    child: Text(
                      'Founder preview access denied.',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ),
    ),
    GoRoute(
      path: AppRoutes.admin,
      builder: (context, state) => const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Text(
            'Access Denied: Mobile Admin Console is disabled.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
    ),
    GoRoute(
      path: AppRoutes.eliteAccess,
      builder: (context, state) => const EliteOfferScreen(),
    ),
    GoRoute(
      path: AppRoutes.eliteCheckout,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        final kind = extra['planKind'] as RevenuePlanKind? ??
            RevenuePlanKind.missionPass;
        final plan =
            RevenuePlan.catalog.firstWhere((item) => item.kind == kind);
        return UpiCheckoutScreen(plan: plan);
      },
    ),
    GoRoute(
      path: AppRoutes.deepProfile,
      builder: (context, state) => const DeepProfileScreen(),
    ),
    GoRoute(
      path: AppRoutes.sentinelCenter,
      builder: (context, state) => const SentinelCenterScreen(),
    ),
    GoRoute(
      path: AppRoutes.notificationCenter,
      builder: (context, state) => const NotificationCenterScreen(),
    ),
    GoRoute(
      path: AppRoutes.profile,
      builder: (context, state) => ProfileScreen(),
    ),
    GoRoute(
      path: AppRoutes.pyqVault,
      builder: (context, state) => const PyqVaultScreen(),
    ),
    GoRoute(
      path: AppRoutes.progressTracker,
      builder: (context, state) => const ProgressTrackerScreen(),
    ),
    GoRoute(
      path: AppRoutes.revisionDesk,
      builder: (context, state) => const RevisionDeskScreen(),
    ),
    GoRoute(
      path: AppRoutes.testArena,
      builder: (context, state) => TestArenaScreen(),
    ),
    if (kDebugMode)
      GoRoute(
        path: AppRoutes.testArenaFounderHarness,
        builder: (context, state) => const TestArenaFounderHarnessScreen(),
      ),
    GoRoute(
      path: AppRoutes.sacredMicroChamber,
      builder: (context, state) {
        final args = state.extra as Map<String, dynamic>? ?? {};
        return Scaffold(
          backgroundColor: AppColors.background,
          body: TacticalNoirBackground(
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: SacredMicroTestChamber(
                        totalQuestions: args['totalQuestions'] as int? ?? 50,
                        completedQuestions:
                            args['completedQuestions'] as int? ?? 0,
                        remainingTime: args['remainingTime'] as Duration? ??
                            const Duration(hours: 1),
                        battleTitle: args['battleTitle'] as String? ??
                            'Ascension Micro Test',
                        readiness: args['readiness'] as double? ?? 1.0,
                        onSubmit: () async {
                          showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (context) => const Center(
                              child: CircularProgressIndicator(
                                  color: AppColors.gold),
                            ),
                          );

                          try {
                            final sessionUser = SessionUser.getSync();
                            final recruitmentId = sessionUser.recruitmentId;
                            if (recruitmentId.isEmpty ||
                                recruitmentId == 'unresolved') {
                              throw 'No active recruitment found.';
                            }
                            final scheduleId = args['scheduleId'] as String?;
                            final score = args['score'] as num?;
                            if (scheduleId == null ||
                                scheduleId.isEmpty ||
                                score == null) {
                              throw 'Verified attempt payload is incomplete.';
                            }

                            final callable = FirebaseFunctions.instance
                                .httpsCallable('handleMissionAction');
                            final result = await callable.call({
                              'action': 'submit_micro_attempt',
                              'realmId': recruitmentId,
                              'payload': {
                                'recruitmentId': recruitmentId,
                                'scheduleId': scheduleId,
                                'score': score,
                              },
                            });

                            if (!context.mounted) return;
                            Navigator.pop(context);

                            if (result.data != null &&
                                result.data['success'] == true) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Attempt submitted and evaluated successfully.')),
                              );
                              context.pop();
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                    content: Text(
                                        'Submission failed: ${result.data['message']}')),
                              );
                            }
                          } catch (e) {
                            if (!context.mounted) return;
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutes.sacredMacroCitadel,
      builder: (context, state) {
        final args = state.extra as Map<String, dynamic>? ?? {};
        return Scaffold(
          backgroundColor: AppColors.background,
          body: TacticalNoirBackground(
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: SacredMacroTestCitadel(
                        title:
                            args['title'] as String? ?? 'Ascension Macro Test',
                        totalQuestions: args['totalQuestions'] as int? ?? 100,
                        completedQuestions:
                            args['completedQuestions'] as int? ?? 0,
                        remainingTime: args['remainingTime'] as Duration? ??
                            const Duration(hours: 3),
                        readiness: args['readiness'] as double? ?? 1.0,
                        rebuildTargets: args['rebuildTargets'] as int? ?? 0,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutes.sacredRebuildChamber,
      builder: (context, state) {
        final args = state.extra as Map<String, dynamic>? ?? {};
        return Scaffold(
          backgroundColor: AppColors.background,
          body: TacticalNoirBackground(
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: SacredRebuildChamber(
                        rebuildNodes:
                            args['rebuildNodes'] as List<RebuildNode>? ??
                                const [],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutes.digibookReader,
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final extra = state.extra;
        if (extra is DigiBookLaunchArgs) {
          return DigiBookScreen(args: extra);
        }
        if (extra is MicroTopicNode) {
          return DigiBookScreen(node: extra);
        }
        return const DigiBookLibraryScreen();
      },
    ),
    // 🔱 Stateful Shell for Root Bottom Navigation
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainNavigationShell(navigationShell: navigationShell);
      },
      branches: [
        // Branch 0: Dashboard
        StatefulShellBranch(
          navigatorKey: _shellNavigatorDashboardKey,
          routes: [
            GoRoute(
              path: AppRoutes.dashboard,
              builder: (context, state) => const DashboardScreen(),
            ),
          ],
        ),
        // Branch 1: Crucible
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCrucibleKey,
          routes: [
            GoRoute(
              path: AppRoutes.crucible,
              builder: (context, state) => const CrucibleScreen(),
            ),
          ],
        ),
        // Branch 2: DigiBook
        StatefulShellBranch(
          navigatorKey: _shellNavigatorDigiBookKey,
          routes: [
            GoRoute(
              path: AppRoutes.digibook,
              builder: (context, state) => const DigiBookLibraryScreen(),
            ),
          ],
        ),
        // Branch 3: Syllabus
        StatefulShellBranch(
          navigatorKey: _shellNavigatorSyllabusKey,
          routes: [
            GoRoute(
              path: AppRoutes.syllabus,
              builder: (context, state) => const SyllabusScreen(),
            ),
          ],
        ),
        // Branch 4: Opportunities
        StatefulShellBranch(
          navigatorKey: _shellNavigatorOpportunitiesKey,
          routes: [
            GoRoute(
              path: AppRoutes.recruitment,
              builder: (context, state) => const OpportunitiesScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
