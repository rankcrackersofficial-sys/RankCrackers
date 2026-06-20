import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/app_routes.dart';

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
    debugPrint("🔱 SPLASH START");
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
    print("🔱 STEP-1: Splash Initialization Started");

    await Future.delayed(
      const Duration(seconds: 3),
    );

    if (!mounted) return;

    try {
      // 🔱 Authority Handover: 
      // We navigate to Login. The GoRouter 'redirect' logic will verify Authority
      // and determine if the user should go to Dashboard, Identity, or stay at Login.
      debugPrint("🔱 STEP-2: Handing over authority to Sovereign Router.");
      context.go(AppRoutes.login);
    } catch (e) {
      debugPrint("🔱 CRITICAL ERROR during Splash Sequence: $e");
      context.go(AppRoutes.login);
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

                          width: 150,
                          height: 150,

                          padding:
                          const EdgeInsets
                              .all(
                            20,
                          ),

                          decoration:
                          BoxDecoration(

                            color:
                            const Color(
                              0xFF070A12,
                            ),

                            borderRadius:
                            BorderRadius
                                .circular(
                              42,
                            ),

                            border: Border.all(

                              color:
                              goldAccent
                                  .withValues(
                                alpha:
                                0.30,
                              ),

                              width: 1.8,
                            ),

                            boxShadow: [

                              BoxShadow(

                                color:
                                goldAccent
                                    .withValues(
                                  alpha:
                                  _logoGlowAnimation
                                      .value,
                                ),

                                blurRadius:
                                55,

                                spreadRadius:
                                4,
                              ),

                              BoxShadow(

                                color:
                                Colors.black
                                    .withValues(
                                  alpha:
                                  0.5,
                                ),

                                blurRadius:
                                25,

                                offset:
                                const Offset(
                                  0,
                                  12,
                                ),
                              ),
                            ],
                          ),

                          child: Image.asset(

                            "assets/images/logo.png",

                            fit: BoxFit.contain,

                            errorBuilder:
                                (
                                context,
                                error,
                                stackTrace,
                                ) {

                              return const Icon(

                                Icons
                                    .shield_rounded,

                                size: 65,

                                color:
                                goldAccent,
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

                        const SizedBox(
                          height: 10,
                        ),

                        // ==========================================
                        // TAGLINE
                        // ==========================================

                        Container(

                          padding:
                          const EdgeInsets
                              .symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),

                          decoration:
                          BoxDecoration(

                            color:
                            Colors.white
                                .withValues(
                              alpha: 0.03,
                            ),

                            borderRadius:
                            BorderRadius
                                .circular(
                              30,
                            ),

                            border: Border.all(

                              color:
                              goldAccent
                                  .withValues(
                                alpha:
                                0.10,
                              ),
                            ),
                          ),

                          child: Text(

                            "The Self Study Coach",

                            style:
                            GoogleFonts
                                .poppins(

                              fontSize: 12,

                              fontStyle:
                              FontStyle
                                  .italic,

                              fontWeight:
                              FontWeight
                                  .w500,

                              color:
                              goldAccent
                                  .withValues(
                                alpha:
                                0.88,
                              ),

                              letterSpacing:
                              0.8,
                            ),
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

                opacity:
                _fadeAnimation.value,

                child: Column(

                  children: [

                    Container(

                      width: 52,
                      height: 52,

                      padding:
                      const EdgeInsets
                          .all(
                        10,
                      ),

                      decoration:
                      BoxDecoration(

                        shape:
                        BoxShape.circle,

                        border: Border.all(

                          color:
                          goldAccent
                              .withValues(
                            alpha:
                            0.15,
                          ),
                        ),
                      ),

                      child:
                      const CircularProgressIndicator(

                        color:
                        goldAccent,

                        strokeWidth: 2.8,
                      ),
                    ),

                    const SizedBox(
                      height: 18,
                    ),

                    Text(

                      "Preparing The Battlefield...",

                      style:
                      GoogleFonts.poppins(

                        fontSize: 11,

                        fontWeight:
                        FontWeight.w600,

                        color:
                        Colors.white
                            .withValues(
                          alpha: 0.42,
                        ),

                        letterSpacing:
                        1,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
