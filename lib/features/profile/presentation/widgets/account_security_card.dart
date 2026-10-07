import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/domain/policies/canonical_phone_binding_policy.dart';

/// 🔱 RC_IDENTITY_R3A2C: Student Account Security Card
/// Provides student-safe, truthful presentation of active authentication factors.
/// Zero internal metadata, zero raw UIDs, zero provider IDs displayed.
class AccountSecurityCard extends ConsumerWidget {
  const AccountSecurityCard({
    super.key,
    this.user,
    this.onTapMobileVerification,
  });

  final User? user;
  final VoidCallback? onTapMobileVerification;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    User? currentUser = user;
    if (currentUser == null) {
      try {
        currentUser = FirebaseAuth.instance.currentUser;
      } catch (_) {}
    }

    final bool hasPassword = currentUser?.providerData
            .any((p) => p.providerId == 'password') ??
        false;
    final bool hasGoogle = currentUser?.providerData
            .any((p) => p.providerId == 'google.com') ??
        false;
    final bool hasPhone =
        CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(currentUser);
    final String? verifiedPhone =
        CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(currentUser);
    final String maskedPhone =
        hasPhone ? CanonicalPhoneBindingPolicy.maskPhone(verifiedPhone) : 'Not verified';
    final bool emailVerified = currentUser?.emailVerified ?? false;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSoft),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.security_rounded,
                color: AppColors.gold,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'ACCOUNT SECURITY',
                style: GoogleFonts.sora(
                  color: AppColors.gold,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 1. Email & Password Status
          _buildSecurityRow(
            icon: Icons.mail_outline_rounded,
            title: 'Email & Password',
            status: hasPassword
                ? 'Sign-in active'
                : (currentUser?.email != null ? 'Email linked' : 'Not set'),
            badge: emailVerified ? 'Verified' : 'Not verified',
            badgeColor: emailVerified ? AppColors.gold : Colors.white38,
          ),
          const Divider(color: AppColors.borderSoft, height: 20),

          // 2. Google Connection Status
          _buildSecurityRow(
            icon: Icons.g_mobiledata_rounded,
            title: 'Google Account',
            status: hasGoogle ? 'Connected' : 'Not connected',
            badge: hasGoogle ? 'Active' : 'Unlinked',
            badgeColor: hasGoogle ? Colors.tealAccent : Colors.white38,
          ),
          const Divider(color: AppColors.borderSoft, height: 20),

          // 3. Verified Mobile Status
          InkWell(
            onTap: onTapMobileVerification,
            borderRadius: BorderRadius.circular(8),
            child: _buildSecurityRow(
              icon: Icons.phone_android_rounded,
              title: 'Verified Mobile',
              status: maskedPhone,
              badge: hasPhone ? 'Bound' : 'Action Required',
              badgeColor: hasPhone ? AppColors.gold : Colors.orangeAccent,
              trailingIcon: onTapMobileVerification != null
                  ? const Icon(Icons.chevron_right_rounded,
                      color: Colors.white38, size: 18)
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityRow({
    required IconData icon,
    required String title,
    required String status,
    required String badge,
    required Color badgeColor,
    Widget? trailingIcon,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.borderSoft),
          ),
          child: Icon(icon, color: Colors.white70, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.sora(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                status,
                style: GoogleFonts.sora(
                  color: Colors.white60,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: badgeColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
          ),
          child: Text(
            badge,
            style: TextStyle(
              color: badgeColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        if (trailingIcon != null) ...[
          const SizedBox(width: 4),
          trailingIcon,
        ],
      ],
    );
  }
}
