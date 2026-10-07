import 'package:flutter_test/flutter_test.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:rank_crackers/features/auth/domain/policies/canonical_phone_binding_policy.dart';

class FakeUserInfo implements UserInfo {
  @override
  final String providerId;

  @override
  final String? uid;

  @override
  final String? email;

  @override
  final String? displayName;

  @override
  final String? photoURL;

  @override
  final String? phoneNumber;

  FakeUserInfo({
    required this.providerId,
    this.uid,
    this.email,
    this.displayName,
    this.photoURL,
    this.phoneNumber,
  });

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeUser implements User {
  @override
  final String? phoneNumber;

  @override
  final List<UserInfo> providerData;

  @override
  final String uid;

  @override
  final String? email;

  FakeUser({
    this.phoneNumber,
    this.providerData = const [],
    this.uid = 'test_uid_123',
    this.email,
  });

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('CanonicalPhoneBindingPolicy - Unit Tests (18P-A1, 18P-B1, 18P-B2)', () {
    test('1. Null user evaluates to UNBOUND and null verified phone', () {
      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(null), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(null), isNull);
      expect(
        CanonicalPhoneBindingPolicy.evaluateIdentityState(user: null),
        equals(PhoneIdentityState.unbound),
      );
    });

    test('2. phoneNumber null + no phone provider -> UNBOUND', () {
      final user = FakeUser(
        phoneNumber: null,
        providerData: [FakeUserInfo(providerId: 'google.com')],
      );

      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(user), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(user), isNull);
      expect(
        CanonicalPhoneBindingPolicy.evaluateIdentityState(user: user),
        equals(PhoneIdentityState.unbound),
      );
    });

    test('3. phoneNumber non-null + phone provider present -> BOUND', () {
      final user = FakeUser(
        phoneNumber: '+919876543210',
        providerData: [
          FakeUserInfo(providerId: 'google.com'),
          FakeUserInfo(providerId: 'phone'),
        ],
      );

      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(user), isTrue);
      expect(
        CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(user),
        equals('+919876543210'),
      );
      expect(
        CanonicalPhoneBindingPolicy.evaluateIdentityState(user: user),
        equals(PhoneIdentityState.verifiedAndBound),
      );
    });

    test('4. phoneNumber non-null but phone provider missing -> UNBOUND (fail-closed)', () {
      final user = FakeUser(
        phoneNumber: '+919876543210',
        providerData: [FakeUserInfo(providerId: 'google.com')],
      );

      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(user), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(user), isNull);
    });

    test('5. Phone provider present but phoneNumber empty/whitespace -> UNBOUND', () {
      final userEmpty = FakeUser(
        phoneNumber: '',
        providerData: [FakeUserInfo(providerId: 'phone')],
      );
      final userWhitespace = FakeUser(
        phoneNumber: '   ',
        providerData: [FakeUserInfo(providerId: 'phone')],
      );

      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(userEmpty), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(userEmpty), isNull);
      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(userWhitespace), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(userWhitespace), isNull);
    });

    test('6. Legacy Firestore mobile metadata is NOT proof of Auth binding', () {
      final userWithoutPhoneAuth = FakeUser(
        phoneNumber: null,
        providerData: [FakeUserInfo(providerId: 'google.com')],
      );
      final firestoreData = {'mobile': '+919876543210', 'name': 'Student'};

      expect(
        CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(userWithoutPhoneAuth),
        isFalse,
      );
      expect(
        CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata(firestoreData),
        equals('+919876543210'),
      );
      expect(
        CanonicalPhoneBindingPolicy.isLegacyMetadataOnly(
          user: userWithoutPhoneAuth,
          profileData: firestoreData,
        ),
        isTrue,
      );
      expect(
        CanonicalPhoneBindingPolicy.evaluateIdentityState(
          user: userWithoutPhoneAuth,
          profileData: firestoreData,
        ),
        equals(PhoneIdentityState.legacyMetadataOnly),
      );
    });

    test('7. Legacy Firestore phone key fallback works for read compatibility only', () {
      final userWithoutPhoneAuth = FakeUser(
        phoneNumber: null,
        providerData: [FakeUserInfo(providerId: 'google.com')],
      );
      final firestoreData = {'phone': '9876543210', 'name': 'Legacy Student'};

      expect(
        CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(userWithoutPhoneAuth),
        isFalse,
      );
      expect(
        CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata(firestoreData),
        equals('9876543210'),
      );
      expect(
        CanonicalPhoneBindingPolicy.isLegacyMetadataOnly(
          user: userWithoutPhoneAuth,
          profileData: firestoreData,
        ),
        isTrue,
      );
    });

    test('8. Canonical mobile key takes precedence over legacy phone key in metadata', () {
      final firestoreData = {
        'mobile': '+919876543210',
        'phone': '0112345678',
      };

      expect(
        CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata(firestoreData),
        equals('+919876543210'),
      );
    });

    test('9. isNewUser == false (existing Google user) is NEVER treated as phone verified', () {
      final existingGoogleUser = FakeUser(
        phoneNumber: null,
        providerData: [FakeUserInfo(providerId: 'google.com')],
        email: 'student@gmail.com',
      );
      final legacyProfile = {
        'name': 'Existing Student',
        'mobile': '9876543210',
        'onboardingCompleted': true,
      };

      expect(
        CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(existingGoogleUser),
        isFalse,
      );
      expect(
        CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(existingGoogleUser),
        isNull,
      );
      expect(
        CanonicalPhoneBindingPolicy.evaluateIdentityState(
          user: existingGoogleUser,
          profileData: legacyProfile,
        ),
        equals(PhoneIdentityState.legacyMetadataOnly),
      );
    });

    group('Strict India Mobile Normalization (18P-B1 & 18P-B2 Requirement 10)', () {
      test('Accepts valid 10-digit raw input starting with 6, 7, 8, 9', () {
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('9876543210'), equals('+919876543210'));
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('8123456789'), equals('+918123456789'));
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('7012345678'), equals('+917012345678'));
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('6987654321'), equals('+916987654321'));
      });

      test('Rejects input starting with 0-5', () {
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('5876543210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('0876543210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('1234567890'), isNull);
      });

      test('Rejects leading and trailing whitespace directly (NO trim auto-repair)', () {
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile(' 9876543210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('9876543210 '), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile(' 9876543210 '), isNull);
      });

      test('Rejects input containing +91 prefix, spaces, dashes, symbols (NO auto-repair)', () {
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('+919876543210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765 43210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765-43210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765.43210'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765abcd0'), isNull);
      });

      test('Rejects non-10-digit lengths', () {
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('987654321'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765432100'), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile(''), isNull);
        expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile(null), isNull);
      });
    });
  });
}
