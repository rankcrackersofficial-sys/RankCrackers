import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../../../shared/session/session_manager.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LoginBodyEngine();
  }
}

class _LoginBodyEngine extends StatefulWidget {
  const _LoginBodyEngine();

  @override
  State<_LoginBodyEngine> createState() =>
      _LoginBodyEngineState();
}

class _LoginBodyEngineState
    extends State<_LoginBodyEngine>
    with SingleTickerProviderStateMixin {

  final TextEditingController mobileController =
  TextEditingController();

  final TextEditingController otpController =
  TextEditingController();

  bool isOtpSent = false;
  bool isLoading = false;

  late AnimationController _animationController;

  late Animation<double> glowAnimation;

  static const Color surfaceCard =
  Color(0xFF111625);

  static const Color goldAccent =
  Color(0xFFD4AF37);

  static const Color royalBlack =
  Color(0xFF070A12);

  static const Color textWhite =
      Colors.white;

  @override
  void initState() {

    super.initState();

    _animationController =
    AnimationController(

      vsync: this,

      duration:
      const Duration(
        seconds: 3,
      ),
    )..repeat(reverse: true);

    glowAnimation =
        Tween<double>(
          begin: 0.06,
          end: 0.14,
        ).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.easeInOut,
          ),
        );
  }

  @override
  void dispose() {

    mobileController.dispose();
    otpController.dispose();

    _animationController.dispose();

    super.dispose();
  }

  Future<void> sendOtp() async {

    final mobile =
    mobileController.text.trim();

    if (!RegExp(r'^[6-9]\d{9}$')
        .hasMatch(mobile)) {

      ScaffoldMessenger.of(context)
          .showSnackBar(

        SnackBar(

          backgroundColor:
          surfaceCard,

          content: Text(

            "Enter valid mobile number",

            style:
            GoogleFonts.poppins(
              color: textWhite,
            ),
          ),
        ),
      );

      return;
    }

    setState(() {
      isLoading = true;
    });

    await Future.delayed(
      const Duration(milliseconds: 900),
    );

    if (!mounted) return;

    setState(() {

      isLoading = false;

      isOtpSent = true;
    });
  }

  Future<void> verifyOtp() async {

    final otp =
    otpController.text.trim();

    if (otp.length != 4) {

      ScaffoldMessenger.of(context)
          .showSnackBar(

        SnackBar(

          backgroundColor:
          surfaceCard,

          content: Text(

            "Invalid OTP",

            style:
            GoogleFonts.poppins(
              color: textWhite,
            ),
          ),
        ),
      );

      return;
    }

    setState(() {
      isLoading = true;
    });

    await Future.delayed(
      const Duration(milliseconds: 900),
    );

    await SessionManager
        .saveStudentMobile(
      mobileController.text.trim(),
    );

    await SessionManager
        .completeLogin();

    if (!mounted) return;

    setState(() {
      isLoading = false;
    });

    context.go('/profile-setup');
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor:
      royalBlack,

      resizeToAvoidBottomInset: true,

      body: Stack(

        children: [

          // =========================================
          // COSMIC DEPTH
          // =========================================

          Positioned(

            top: -120,
            left: -90,

            child: AnimatedBuilder(

              animation:
              _animationController,

              builder:
                  (context, child) {

                return Container(

                  width: 300,
                  height: 300,

                  decoration:
                  BoxDecoration(

                    shape:
                    BoxShape.circle,

                    gradient:
                    RadialGradient(

                      colors: [

                        goldAccent
                            .withValues(
                          alpha:
                          glowAnimation
                              .value,
                        ),

                        Colors.transparent,
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          Positioned(

            bottom: -140,
            right: -120,

            child: Container(

              width: 340,
              height: 340,

              decoration:
              BoxDecoration(

                shape:
                BoxShape.circle,

                gradient:
                RadialGradient(

                  colors: [

                    Colors.white
                        .withValues(
                      alpha: 0.04,
                    ),

                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // =========================================
          // HIDDEN GITA PRESENCE
          // =========================================

          Positioned(

            top: 180,
            left: -30,

            child: Opacity(

              opacity: 0.025,

              child: RotatedBox(

                quarterTurns: 3,

                child: Text(

                  "योगः कर्मसु कौशलम्",

                  style:
                  GoogleFonts.poppins(

                    fontSize: 34,

                    fontWeight:
                    FontWeight.w700,

                    letterSpacing: 3,

                    color:
                    Colors.white,
                  ),
                ),
              ),
            ),
          ),

          // =========================================
          // SUDARSHAN AURA
          // =========================================

          Positioned(

            top: 90,
            right: -50,

            child: Icon(

              Icons.auto_awesome_rounded,

              size: 280,

              color:
              Colors.white.withValues(
                alpha: 0.022,
              ),
            ),
          ),

          // =========================================
          // PEACOCK FEATHER ENERGY
          // =========================================

          Positioned(

            bottom: -30,
            left: -40,

            child: Icon(

              Icons.blur_on_rounded,

              size: 240,

              color:
              Colors.white.withValues(
                alpha: 0.025,
              ),
            ),
          ),

          // =========================================
          // SACRED PARTICLES
          // =========================================

          Positioned(
            top: 220,
            right: 70,
            child: _particle(8),
          ),

          Positioned(
            top: 320,
            left: 50,
            child: _particle(5),
          ),

          Positioned(
            bottom: 180,
            right: 100,
            child: _particle(6),
          ),

          SafeArea(

            child: Center(

              child: SingleChildScrollView(

                physics:
                const BouncingScrollPhysics(),

                padding:
                const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 20,
                ),

                child: Column(

                  children: [

                    // =========================================
                    // LOGO
                    // =========================================

                    AnimatedBuilder(

                      animation:
                      _animationController,

                      builder:
                          (context, child) {

                        return Container(

                          width: 135,
                          height: 135,

                          padding:
                          const EdgeInsets
                              .all(
                            18,
                          ),

                          decoration:
                          BoxDecoration(

                            color:
                            royalBlack,

                            borderRadius:
                            BorderRadius
                                .circular(
                              38,
                            ),

                            border: Border.all(

                              color:
                              goldAccent
                                  .withValues(
                                alpha:
                                0.24,
                              ),

                              width: 1.6,
                            ),

                            boxShadow: [

                              BoxShadow(

                                color:
                                goldAccent
                                    .withValues(
                                  alpha:
                                  glowAnimation
                                      .value,
                                ),

                                blurRadius:
                                45,

                                spreadRadius:
                                3,
                              ),

                              BoxShadow(

                                color:
                                Colors.black
                                    .withValues(
                                  alpha:
                                  0.40,
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
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 36),

                    // =========================================
                    // TITLE
                    // =========================================

                    Text(

                      "Welcome to\nRankCrackers",

                      textAlign:
                      TextAlign.center,

                      style:
                      GoogleFonts.sora(

                        fontSize: 36,

                        fontWeight:
                        FontWeight.w900,

                        height: 1.12,

                        color:
                        Colors.white,
                      ),
                    ),

                    const SizedBox(height: 14),

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
                            alpha: 0.10,
                          ),
                        ),
                      ),

                      child: Text(

                        "The Self Study Coach",

                        style:
                        GoogleFonts
                            .poppins(

                          fontSize: 12,

                          fontWeight:
                          FontWeight
                              .w500,

                          fontStyle:
                          FontStyle
                              .italic,

                          letterSpacing:
                          1,

                          color:
                          goldAccent,
                        ),
                      ),
                    ),

                    const SizedBox(height: 42),

                    // =========================================
                    // LOGIN CARD
                    // =========================================

                    Container(

                      width: double.infinity,

                      padding:
                      const EdgeInsets.all(
                        24,
                      ),

                      decoration:
                      BoxDecoration(

                        gradient:
                        AppColors
                            .madhavCardGradient,

                        borderRadius:
                        BorderRadius
                            .circular(
                          30,
                        ),

                        border: Border.all(

                          color:
                          goldAccent
                              .withValues(
                            alpha: 0.14,
                          ),
                        ),

                        boxShadow:
                        AppColors
                            .goldGlowShadow,
                      ),

                      child: Column(

                        children: [

                          TextField(

                            controller:
                            mobileController,

                            enabled:
                            !isOtpSent,

                            keyboardType:
                            TextInputType
                                .phone,

                            onChanged:
                                (value) {

                              final mobile =
                              value
                                  .trim();

                              if (mobile
                                  .length ==
                                  10 &&
                                  RegExp(
                                    r'^[6-9]\d{9}$',
                                  ).hasMatch(
                                    mobile,
                                  ) &&
                                  !isOtpSent &&
                                  !isLoading) {

                                sendOtp();
                              }
                            },

                            style:
                            GoogleFonts
                                .poppins(

                              color:
                              textWhite,

                              fontWeight:
                              FontWeight
                                  .w600,
                            ),

                            decoration:
                            _inputDecoration(

                              "Enter Mobile Number",

                              Icons
                                  .phone_rounded,
                            ),
                          ),

                          AnimatedSwitcher(

                            duration:
                            const Duration(
                              milliseconds:
                              350,
                            ),

                            child: isOtpSent

                                ? Padding(

                              padding:
                              const EdgeInsets
                                  .only(
                                top: 22,
                              ),

                              child:
                              TextField(

                                controller:
                                otpController,

                                keyboardType:
                                TextInputType
                                    .number,

                                onChanged:
                                    (
                                    value,
                                    ) {

                                  if (value
                                      .trim()
                                      .length ==
                                      4 &&
                                      !isLoading) {

                                    verifyOtp();
                                  }
                                },

                                style:
                                GoogleFonts
                                    .poppins(

                                  color:
                                  textWhite,

                                  fontWeight:
                                  FontWeight
                                      .w600,
                                ),

                                decoration:
                                _inputDecoration(

                                  "Enter OTP",

                                  Icons
                                      .lock_rounded,
                                ),
                              ),
                            )

                                : const SizedBox
                                .shrink(),
                          ),

                          const SizedBox(
                            height: 30,
                          ),

                          if (isLoading)

                            const CircularProgressIndicator(
                              color:
                              goldAccent,
                            )

                          else

                            PremiumButton(

                              text: isOtpSent
                                  ? "Verify OTP"
                                  : "Send OTP",

                              onTap: () {

                                isOtpSent

                                    ? verifyOtp()

                                    : sendOtp();
                              },
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 30),

                    // =========================================
                    // DIVIDER
                    // =========================================

                    Row(

                      children: [

                        Expanded(
                          child: Divider(
                            color: Colors.white
                                .withValues(
                              alpha: 0.08,
                            ),
                          ),
                        ),

                        Padding(

                          padding:
                          const EdgeInsets
                              .symmetric(
                            horizontal: 14,
                          ),

                          child: Text(

                            "OR",

                            style:
                            GoogleFonts
                                .poppins(

                              fontSize: 12,

                              fontWeight:
                              FontWeight
                                  .w700,

                              color:
                              Colors.white
                                  .withValues(
                                alpha: 0.38,
                              ),
                            ),
                          ),
                        ),

                        Expanded(
                          child: Divider(
                            color: Colors.white
                                .withValues(
                              alpha: 0.08,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 30),

                    // =========================================
                    // GOOGLE LOGIN
                    // =========================================

                    InkWell(

                      borderRadius:
                      BorderRadius.circular(
                        24,
                      ),

                      onTap: () {},

                      child: Container(

                        width: double.infinity,

                        padding:
                        const EdgeInsets
                            .symmetric(
                          horizontal: 18,
                          vertical: 18,
                        ),

                        decoration:
                        BoxDecoration(

                          gradient:
                          AppColors
                              .madhavCardGradient,

                          borderRadius:
                          BorderRadius
                              .circular(
                            24,
                          ),

                          border: Border.all(

                            color:
                            goldAccent
                                .withValues(
                              alpha: 0.12,
                            ),
                          ),

                          boxShadow:
                          AppColors
                              .goldGlowShadow,
                        ),

                        child: Row(

                          mainAxisAlignment:
                          MainAxisAlignment
                              .center,

                          children: [

                            Image.asset(

                              "assets/images/google.png",

                              width: 24,
                              height: 24,

                              errorBuilder:
                                  (
                                  context,
                                  error,
                                  stackTrace,
                                  ) {

                                return const Icon(

                                  Icons
                                      .g_mobiledata_rounded,

                                  color:
                                  Colors
                                      .white,

                                  size: 34,
                                );
                              },
                            ),

                            const SizedBox(
                              width: 14,
                            ),

                            Text(

                              "Continue with Google",

                              style:
                              GoogleFonts
                                  .poppins(

                                fontSize: 14,

                                fontWeight:
                                FontWeight
                                    .w600,

                                color:
                                textWhite,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // =========================================
                    // DIVINE QUOTE
                    // =========================================

                    Container(

                      padding:
                      const EdgeInsets
                          .symmetric(
                        horizontal: 20,
                        vertical: 12,
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
                            alpha: 0.08,
                          ),
                        ),
                      ),

                      child: Text(

                        "Discipline and patience forge the warrior before victory crowns him.",

                        textAlign:
                        TextAlign.center,

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
                            alpha: 0.90,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _particle(double size) {

    return Container(

      width: size,
      height: size,

      decoration: BoxDecoration(

        shape: BoxShape.circle,

        color:
        goldAccent.withValues(
          alpha: 0.18,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(
      String hint,
      IconData icon,
      ) {

    return InputDecoration(

      hintText: hint,

      hintStyle:
      GoogleFonts.poppins(

        color:
        textWhite.withValues(
          alpha: 0.35,
        ),
      ),

      prefixIcon: Icon(
        icon,
        color: goldAccent,
      ),

      filled: true,

      fillColor:
      Colors.white.withValues(
        alpha: 0.03,
      ),

      border: OutlineInputBorder(

        borderRadius:
        BorderRadius.circular(
          18,
        ),

        borderSide: BorderSide.none,
      ),

      focusedBorder:
      OutlineInputBorder(

        borderRadius:
        BorderRadius.circular(
          18,
        ),

        borderSide:
        const BorderSide(
          color: goldAccent,
          width: 1.2,
        ),
      ),
    );
  }
}