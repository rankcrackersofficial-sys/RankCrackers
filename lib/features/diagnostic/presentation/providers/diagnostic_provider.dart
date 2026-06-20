import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../../../shared/session/session_manager.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() =>
      _LoginScreenState();
}

class _LoginScreenState
    extends State<LoginScreen> {

  final TextEditingController
  mobileController =
  TextEditingController();

  final TextEditingController
  otpController =
  TextEditingController();

  bool isOtpSent = false;

  bool isLoading = false;

  // =========================
  // SEND OTP
  // =========================

  Future<void> sendOtp() async {

    if (mobileController.text.length < 10) {
      return;
    }

    setState(() {
      isLoading = true;
    });

    await Future.delayed(
      const Duration(seconds: 1),
    );

    setState(() {

      isLoading = false;

      isOtpSent = true;
    });
  }

  // =========================
  // VERIFY OTP
  // =========================

  Future<void> verifyOtp() async {

    if (otpController.text.length < 4) {
      return;
    }

    setState(() {
      isLoading = true;
    });

    await Future.delayed(
      const Duration(seconds: 1),
    );

    // =========================
    // SAVE LOGIN SESSION
    // =========================

    await SessionManager.saveLoginSession(
      token: "JWT_TOKEN_821",
    );

    if (!mounted) return;

    setState(() {
      isLoading = false;
    });

    // =========================
    // GO TO PROFILE SETUP
    // =========================

    context.go('/profile-setup');
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor:
      AppColors.bgLight,

      body: SafeArea(

        child: Padding(

          padding: const EdgeInsets.all(24),

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment.start,

            children: [

              const Spacer(),

              Text(
                "Welcome to\nRankCrackers",

                style: GoogleFonts.sora(
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primaryBlue,
                  height: 1.2,
                ),
              ),

              const SizedBox(height: 14),

              Text(
                "India's intelligent preparation ecosystem.",

                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: AppColors.textMedium,
                  fontWeight: FontWeight.w500,
                ),
              ),

              const SizedBox(height: 45),

              // =========================
              // MOBILE INPUT
              // =========================

              TextField(

                controller: mobileController,

                keyboardType:
                TextInputType.phone,

                enabled: !isOtpSent,

                decoration: InputDecoration(

                  hintText:
                  "Enter Mobile Number",

                  prefixIcon:
                  const Icon(Icons.phone),

                  filled: true,

                  fillColor: Colors.white,

                  border:
                  OutlineInputBorder(

                    borderRadius:
                    BorderRadius.circular(18),

                    borderSide:
                    BorderSide.none,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // =========================
              // OTP FIELD
              // =========================

              if (isOtpSent)

                TextField(

                  controller:
                  otpController,

                  keyboardType:
                  TextInputType.number,

                  decoration:
                  InputDecoration(

                    hintText:
                    "Enter OTP",

                    prefixIcon:
                    const Icon(Icons.lock),

                    filled: true,

                    fillColor:
                    Colors.white,

                    border:
                    OutlineInputBorder(

                      borderRadius:
                      BorderRadius.circular(18),

                      borderSide:
                      BorderSide.none,
                    ),
                  ),
                ),

              const SizedBox(height: 35),

              // =========================
              // BUTTON
              // =========================

              if (isLoading)

                const Center(
                  child:
                  CircularProgressIndicator(),
                )

              else

                PremiumButton(

                  text: isOtpSent
                      ? "Verify OTP"
                      : "Send OTP",

                  onTap: () {

                    if (isOtpSent) {

                      verifyOtp();

                    } else {

                      sendOtp();
                    }
                  },
                ),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}