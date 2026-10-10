import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../../../core/utils/app_routes.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../core/constants/founder_identity.dart';
import '../../../../core/backend/recruitment_repository.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() =>
      _SplashScreenState();
}

class _SplashScreenState
    extends State<SplashScreen>
    with SingleTickerProviderStateMixin {

  late AnimationController _controller;

  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _logoGlowAnimation;

  static const Color goldAccent =
  Color(0xFFD4AF37);

  @override
  void initState() {
    super.initState();
    debugPrint("SPLASH START");
    _controller = AnimationController(

      vsync: this,

      duration:
      const Duration(
        milliseconds: 1800,
      ),
    );

    _fadeAnimation =
        Tween<double>(

          begin: 0.0,
          end: 1.0,

        ).animate(

          CurvedAnimation(
            parent: _controller,
            curve: Curves.easeIn,
          ),
        );

    _scaleAnimation =
        Tween<double>(

          begin: 0.82,
          end: 1.0,

        ).animate(

          CurvedAnimation(
            parent: _controller,
            curve: Curves.easeOutBack,
          ),
        );

    _logoGlowAnimation =
        Tween<double>(

          begin: 0.08,
          end: 0.20,

        ).animate(

          CurvedAnimation(
            parent: _controller,
            curve: Curves.easeInOut,
          ),
        );

    _controller.forward();

    _initialize();
  }

  Future<void> _initialize() async {
    debugPrint("STEP-1: Splash Initialization Started");

    String targetRoute = AppRoutes.login;

    try {
      if (!SessionManager.disableFirebaseForTest) {
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          debugPrint("AUTH_USER_PRESENT=true");
          final bool isPrivileged = FounderIdentity.isFounderUser(user);
          if (isPrivileged) {
            targetRoute = AppRoutes.dashboard;
          } else {
            // Rehydrate server-side profile if needed
            await SessionManager.syncProfileFromFirestore(user);
            final bool isComplete = SessionManager.profileCompletedSync();
            final bool consentAccepted = SessionManager.consentAcceptedSync();
            debugPrint("PROFILE_AUTHORITY_STATE=${isComplete ? 'COMPLETE' : 'INCOMPLETE'}");
            debugPrint("CONSENT_ACCEPTED=$consentAccepted");

            if (!isComplete) {
              targetRoute = AppRoutes.profileSetup;
            } else {
              final selectedExam = SessionManager.selectedExamSync();
              final hasSavedMission = selectedExam != null && selectedExam.isNotEmpty;
              debugPrint("MISSION_ID_PRESENT=$hasSavedMission");

              // Dynamic mission access snapshot resolution (Section 4 & 5)
              bool snapshotEstablished = false;
              try {
                final recruitments = await RecruitmentRepository.fetchPublished()
                    .timeout(const Duration(seconds: 3));
                final accessibleIds = recruitments.map((r) => r.examId).toList();
                SessionManager.registerAccessibleMissions(accessibleIds, source: 'SPLASH_CATALOG_HYDRATION');
                snapshotEstablished = true;
                debugPrint("MISSION_ACCESS_SNAPSHOT_READY=true");
              } catch (e) {
                debugPrint("MISSION_ACCESS_SNAPSHOT_READY=false (offline/timeout: $e)");
              }

              if (snapshotEstablished) {
                final isMissionValid = SessionManager.isMissionValid(selectedExam);
                debugPrint("MISSION_RESOLUTION_VALID=$isMissionValid");
                if (isMissionValid) {
                  targetRoute = AppRoutes.dashboard;
                } else {
                  targetRoute = AppRoutes.missionRealm;
                }
              } else {
                // Section 5: SNAPSHOT FAILURE MUST FAIL CLOSED
                // If authenticated complete-profile user has a saved mission but authoritative
                // MissionAccessSnapshot cannot be established:
                // DO NOT route to Dashboard merely from cached mission validity.
                // SNAPSHOT_FAILURE_TO_DASHBOARD_COUNT = 0
                debugPrint("SNAPSHOT_FAILURE: Failing closed to Mission Realm");
                targetRoute = AppRoutes.missionRealm;
              }
            }
          }
        } else {
          debugPrint("AUTH_USER_PRESENT=false");
          targetRoute = AppRoutes.login;
        }
      }
    } catch (e) {
      debugPrint("SPLASH_AUTH_CHECK_ERROR: $e");
      targetRoute = AppRoutes.login;
    }

    debugPrint("FINAL_ROUTE=$targetRoute");

    // Splash animation timing
    await Future.delayed(
      const Duration(milliseconds: 2000),
    );

    if (!mounted) return;

    try {
      debugPrint("STEP-2: Navigating to canonical target route: $targetRoute");
      context.go(targetRoute);
    } catch (e) {
      debugPrint("CRITICAL ERROR during Splash Sequence: $e");
    }
  }

  @override
  void dispose() {

    _controller.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor:
      const Color(0xFF070A12),

      body: Container(

        width: double.infinity,

        decoration:
        const BoxDecoration(

          gradient: RadialGradient(

            colors: [

              Color(0xFF111625),
              Color(0xFF070A12),

            ],

            radius: 1.3,

            center: Alignment.center,
          ),
        ),

        child: SafeArea(
          child: Stack(
            alignment: Alignment.center,
            children: [

            // ==========================================
            // GOLDEN DIVINE AURA
            // ==========================================

            Positioned(

              top: -120,
              left: -100,

              child: Container(

                width: 280,
                height: 280,

                decoration: BoxDecoration(

                  shape: BoxShape.circle,

                  gradient: RadialGradient(

                    colors: [

                      goldAccent.withValues(
                        alpha: 0.10,
                      ),

                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ==========================================
            // WHITE DIVINE GLOW
            // ==========================================

            Positioned(

              bottom: -140,
              right: -100,

              child: Container(

                width: 320,
                height: 320,

                decoration: BoxDecoration(

                  shape: BoxShape.circle,

                  gradient: RadialGradient(

                    colors: [

                      Colors.white.withValues(
                        alpha: 0.04,
                      ),

                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ==========================================
            // HIDDEN SUDARSHAN
            // ==========================================

            Positioned(
              child: Icon(

                Icons.auto_awesome_rounded,

                size: 420,

                color:
                Colors.white.withValues(
                  alpha: 0.018,
                ),
              ),
            ),

            // ==========================================
            // PEACOCK FEATHER PRESENCE
            // ==========================================

            Positioned(

              bottom: -30,
              left: -40,

              child: Icon(

                Icons.brush_rounded,

                size: 240,

                color:
                Colors.white.withValues(
                  alpha: 0.03,
                ),
              ),
            ),

            // ==========================================
            // HIDDEN GITA SHLOK
            // ==========================================

            Positioned(

              child: Opacity(

                opacity: 0.025,

                child: Text(

                  "कर्मण्येवाधिकारस्ते",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 42,

                    fontWeight:
                    FontWeight.w700,

                    color: Colors.white,

                    letterSpacing: 4,
                  ),
                ),
              ),
            ),

            // ==========================================
            // SACRED PARTICLES
            // ==========================================

            Positioned(

              top: 160,
              left: 70,

              child: Container(

                width: 8,
                height: 8,

                decoration: BoxDecoration(

                  shape: BoxShape.circle,

                  color:
                  goldAccent.withValues(
                    alpha: 0.22,
                  ),
                ),
              ),
            ),

            Positioned(

              top: 240,
              right: 90,

              child: Container(

                width: 5,
                height: 5,

                decoration: BoxDecoration(

                  shape: BoxShape.circle,

                  color:
                  Colors.white.withValues(
                    alpha: 0.12,
                  ),
                ),
              ),
            ),

            // ==========================================
            // MAIN CONTENT
            // ==========================================

            AnimatedBuilder(

              animation: _controller,

              builder:
                  (context, child) {

                return Opacity(

                  opacity:
                  _fadeAnimation.value,

                  child: Transform.scale(

                    scale:
                    _scaleAnimation.value,

                    child: Column(

                      mainAxisAlignment:
                      MainAxisAlignment
                          .center,

                      children: [

                        // ==========================================
                        // LOGO CONTAINER
                        // ==========================================

                        Container(
                          width: 90,
                          height: 90,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: const Color(0xFF070A12),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: goldAccent.withValues(alpha: 0.30),
                              width: 1.8,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: goldAccent.withValues(
                                  alpha: _logoGlowAnimation.value,
                                ),
                                blurRadius: 40,
                                spreadRadius: 3,
                              ),
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.5),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Image.asset(
                            "assets/images/logo.png",
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(
                                Icons.shield_rounded,
                                size: 40,
                                color: goldAccent,
                              );
                            },
                          ),
                        ),

                        const SizedBox(
                          height: 38,
                        ),

                        // ==========================================
                        // APP NAME
                        // ==========================================

                        Text(

                          "RankCrackers",

                          style:
                          GoogleFonts.sora(

                            fontSize: 36,

                            fontWeight:
                            FontWeight.w900,

                            color:
                            Colors.white,

                            letterSpacing:
                            1.3,
                          ),
                        ),

                        const SizedBox(height: 14),
                        Text(
                          "तेजस्वि नावधीतमस्तु।",
                          textAlign: TextAlign.center,
                          style: GoogleFonts.notoSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: goldAccent.withValues(alpha: 0.95),
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "May Our Learning Be Radiant.",
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            fontStyle: FontStyle.italic,
                            color: Colors.white.withValues(alpha: 0.78),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // ==========================================
            // BOTTOM LOADER
            // ==========================================

            Positioned(
              bottom: 60,
              child: Opacity(
                opacity: _fadeAnimation.value,
                child: Container(
                  width: 44,
                  height: 44,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: goldAccent.withValues(alpha: 0.15),
                    ),
                  ),
                  child: const CircularProgressIndicator(
                    color: goldAccent,
                    strokeWidth: 2.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
}
