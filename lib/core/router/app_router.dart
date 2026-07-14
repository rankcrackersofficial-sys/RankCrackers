import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/app_routes.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../navigation/main_navigation_shell.dart';
import '../models/micro_topic_node.dart';
import '../knowledge/knowledge_engine.dart';

// SCREENS
import '../../features/onboarding/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/unified_identity_screen.dart';
import '../../features/auth/presentation/screens/mission_realm_screen.dart';
import '../../features/diagnostic/presentation/screens/diagnostic_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/crucible/presentation/screens/crucible_screen.dart';
import '../../features/syllabus/presentation/screens/syllabus_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/home/presentation/screens/digi_book_screen.dart';
import '../../features/assessment/presentation/screens/diagnostic_result_screen.dart';
import '../../features/deep_profile/screens/deep_profile_screen.dart';
import '../../features/opportunities/screens/opportunities_screen.dart';
import '../../features/opportunities/presentation/screens/sentinel_center_screen.dart';
import '../../features/opportunities/presentation/screens/notification_center_screen.dart';

import 'package:firebase_auth/firebase_auth.dart';
import '../../shared/session/session_manager.dart';
import '../constants/founder_identity.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorDashboardKey = GlobalKey<NavigatorState>(debugLabel: 'dashboard');
final GlobalKey<NavigatorState> _shellNavigatorSyllabusKey = GlobalKey<NavigatorState>(debugLabel: 'syllabus');
final GlobalKey<NavigatorState> _shellNavigatorDigiBookKey = GlobalKey<NavigatorState>(debugLabel: 'digibook');
final GlobalKey<NavigatorState> _shellNavigatorCrucibleKey = GlobalKey<NavigatorState>(debugLabel: 'crucible');
final GlobalKey<NavigatorState> _shellNavigatorOpportunitiesKey = GlobalKey<NavigatorState>(debugLabel: 'opportunities');

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: AppRoutes.splash,
  redirect: (context, state) {
    final user = FirebaseAuth.instance.currentUser;
    final matchedLocation = state.matchedLocation;
    
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
      debugPrint("🔱 ROUTER: Privileged User on Login flow, bypassing to Dashboard");
      return AppRoutes.dashboard; 
    }

    // 🔱 Authority 3: Profile Gate (Must complete setup)
    // Level-12.8 Hardening: Full synchronous authority.
    final profileDone = SessionManager.profileCompletedSync();
    if (!profileDone && !isPrivileged) {
      debugPrint("🔱 ROUTER: Profile incomplete, routing to Identity");
      return (matchedLocation == AppRoutes.profileSetup) ? null : AppRoutes.profileSetup;
    }

    // 🔱 Authority 4: Mission Gate (Must select mission)
    final String? selectedExam = SessionManager.selectedExamSync();
    if (selectedExam == null && !isPrivileged) {
      debugPrint("🔱 ROUTER: Mission missing, routing to Realm");
      if (matchedLocation == AppRoutes.profileSetup) return null;
      return (matchedLocation == AppRoutes.missionRealm) ? null : AppRoutes.missionRealm;
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
      builder: (context, state) {
        final data = state.extra as Map?;
        return DiagnosticScreen(
          examName: data?['exam'] ?? 'Universal Diagnostic',
          variant: data?['variant'] ?? '',
          state: data?['state'] ?? 'Central',
        );
      },
    ),
    GoRoute(
      path: AppRoutes.diagnosticTest,
      builder: (context, state) {
        final data = state.extra as Map?;
        return DiagnosticScreen(
          examName: data?['exam'] ?? 'Universal Diagnostic',
          variant: data?['variant'] ?? '',
          state: data?['state'] ?? 'Central',
        );
      },
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
      builder: (context, state) => const ProfileScreen(),
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
              builder: (context, state) {
                final MicroTopicNode? extraNode = state.extra as MicroTopicNode?;
                
                // If node passed via extra, use it immediately 🔱
                if (extraNode != null) {
                  return DigiBookScreen(node: extraNode);
                }

                // Fallback to KnowledgeEngine nodes
                return ListenableBuilder(
                  listenable: KnowledgeEngine.instance,
                  builder: (context, _) {
                    final allNodes = KnowledgeEngine.instance.allNodes;

                    if (allNodes.isEmpty) {
                      return Scaffold(
                        backgroundColor: AppColors.background,
                        body: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.menu_book_outlined,
                                size: 48,
                                color: AppColors.gold,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                "NO KNOWLEDGE MATRIX FOUND",
                                style: AppTypography.label,
                              ),
                              const SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: () {
                                  if (!KnowledgeEngine.instance.isHydrating) {
                                    KnowledgeEngine.instance.initialize(force: true);
                                  }
                                },
                                child: const Text("RETRY SYNC"),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                    return DigiBookScreen(node: allNodes.first);
                  },
                );
              },
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
