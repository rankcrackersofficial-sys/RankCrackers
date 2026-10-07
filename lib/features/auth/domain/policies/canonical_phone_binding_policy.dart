import 'package:firebase_auth/firebase_auth.dart';

/// 🔱 RC_IDENTITY_COMPATIBILITY_FOUNDATION_18P_A1 & 18P_B1 & 18P_B2 & R3A2C
/// Canonical Phone Binding Policy.
///
/// Implements the Founder-locked Law:
/// ONE VERIFIED NORMALIZED MOBILE NUMBER <-> AT MOST ONE CANONICAL FIREBASE UID.
///
/// Cryptographic verified identity is anchored exclusively in Firebase Authentication
/// with an active `phone` provider and non-empty `phoneNumber`.
/// Firestore profile strings are treated strictly as metadata until verified.
class CanonicalPhoneBindingPolicy {
  // Field Constants
  static const String canonicalMobileField = 'mobile';
  static const String legacyPhoneField = 'phone';
  static const String phoneProviderId = 'phone';
  static const String googleProviderId = 'google.com';

  /// Evaluates whether the given [User] possesses an authoritative, cryptographically
  /// verified phone binding in Firebase Authentication.
  ///
  /// Returns `true` ONLY when BOTH:
  /// 1. `user.phoneNumber` is non-null and non-empty.
  /// 2. `user.providerData` contains an entry with `providerId == 'phone'`.
  ///
  /// Fails closed (returns `false`) if either condition is absent or inconsistent.
  static bool hasCanonicalPhoneBinding(User? user) {
    if (user == null) return false;
    final phone = user.phoneNumber?.trim() ?? '';
    if (phone.isEmpty) return false;

    final hasPhoneProvider = user.providerData.any(
      (info) => info.providerId == phoneProviderId,
    );
    return hasPhoneProvider;
  }

  /// Returns the canonical verified E.164 phone number from Firebase Authentication
  /// if and only if [hasCanonicalPhoneBinding] is `true`.
  ///
  /// Returns `null` if the user is null or lacks authoritative phone binding.
  static String? canonicalVerifiedPhone(User? user) {
    if (!hasCanonicalPhoneBinding(user)) return null;
    return user!.phoneNumber!.trim();
  }

  /// Strict India Mobile Normalization Contract:
  ///
  /// Rules:
  /// - Editable Student input MUST be EXACTLY 10 ASCII digits.
  /// - First digit MUST be 6, 7, 8, or 9 (`^[6-9]\d{9}$`).
  /// - Rejects input containing +91 prefix, spaces, dashes, letters, punctuation, or symbols.
  /// - Does NOT silently auto-repair invalid user input (`SYMBOL_INPUT_AUTO_REPAIR_COUNT = 0`).
  /// - Rejects leading/trailing whitespace directly without trimming (`LEADING_TRAILING_WHITESPACE_AUTO_REPAIR_COUNT = 0`).
  ///
  /// Returns canonical `+91XXXXXXXXXX` if valid, or `null` if invalid.
  static String? normalizeIndianMobile(String? rawInput) {
    if (rawInput == null) return null;
    final regex = RegExp(r'^[6-9]\d{9}$');
    if (!regex.hasMatch(rawInput)) {
      return null;
    }
    return '+91$rawInput';
  }

  /// Normalizes an E.164 or 10-digit Indian phone number to canonical E.164 form (`+91XXXXXXXXXX`).
  /// Returns `null` if invalid.
  static String? normalizeE164Phone(String? rawPhone) {
    if (rawPhone == null) return null;
    final trimmed = rawPhone.trim();
    if (RegExp(r'^\+91[6-9]\d{9}$').hasMatch(trimmed)) {
      return trimmed;
    }
    if (RegExp(r'^[6-9]\d{9}$').hasMatch(trimmed)) {
      return '+91$trimmed';
    }
    return null;
  }

  /// Single Phone Masking Law:
  /// Standard Student-safe display format: `+91 ******1234`
  static String maskPhone(String? phone) {
    if (phone == null || phone.trim().isEmpty) {
      return 'Not set';
    }
    final normalized = normalizeE164Phone(phone);
    if (normalized != null && normalized.length == 13) {
      final last4 = normalized.substring(9);
      return '+91 ******$last4';
    }
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length >= 4) {
      final last4 = digits.substring(digits.length - 4);
      return '+91 ******$last4';
    }
    return '+91 ******0000';
  }

  /// Resolves legacy or canonical phone metadata from a Firestore profile document map.
  ///
  /// Priority:
  /// 1. `data['mobile']` (Canonical profile field)
  /// 2. `data['phone']` (Legacy profile field fallback for read compatibility)
  ///
  /// IMPORTANT: This returns unverified profile metadata string only.
  /// It is NOT proof of cryptographic Firebase Auth phone binding.
  static String? resolveProfilePhoneMetadata(Map<String, dynamic>? data) {
    if (data == null) return null;
    final mobile = data[canonicalMobileField]?.toString().trim() ?? '';
    if (mobile.isNotEmpty) return mobile;

    final phone = data[legacyPhoneField]?.toString().trim() ?? '';
    if (phone.isNotEmpty) return phone;

    return null;
  }

  /// Determines if a profile document contains phone metadata while the
  /// underlying Firebase [User] lacks authoritative cryptographic phone binding.
  static bool isLegacyMetadataOnly({
    required User? user,
    required Map<String, dynamic>? profileData,
  }) {
    final hasMetadata = resolveProfilePhoneMetadata(profileData) != null;
    final hasBinding = hasCanonicalPhoneBinding(user);
    return hasMetadata && !hasBinding;
  }

  /// Evaluates the discrete identity state of a user given their Auth [user]
  /// and optional Firestore [profileData].
  static PhoneIdentityState evaluateIdentityState({
    required User? user,
    Map<String, dynamic>? profileData,
  }) {
    if (hasCanonicalPhoneBinding(user)) {
      return PhoneIdentityState.verifiedAndBound;
    }
    if (resolveProfilePhoneMetadata(profileData) != null) {
      return PhoneIdentityState.legacyMetadataOnly;
    }
    return PhoneIdentityState.unbound;
  }
}

/// Discrete Phone Identity States
enum PhoneIdentityState {
  /// No phone number in Auth and no phone metadata in Firestore.
  unbound,

  /// Phone string exists in Firestore metadata, but Firebase Auth has no linked phone provider.
  legacyMetadataOnly,

  /// Firebase Auth has verified phoneNumber + linked phone provider.
  verifiedAndBound,
}