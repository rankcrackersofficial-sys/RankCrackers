import 'package:flutter_test/flutter_test.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:rank_crackers/features/auth/domain/policies/canonical_phone_binding_policy.dart';

class FakeTestUser implements User {
  FakeTestUser({
    required this.uid,
    this.phoneNumber,
    this.email = 'student@rankcrackers.com',
    this.emailVerified = true,
    List<UserInfo>? providerData,
  }) : providerData = providerData ?? [];

  @override
  final String uid;

  @override
  final String? phoneNumber;

  @override
  final String? email;

  @override
  final bool emailVerified;

  @override
  final List<UserInfo> providerData;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeTestUserInfo implements UserInfo {
  FakeTestUserInfo({required this.providerId, this.phoneNumber});

  @override
  final String providerId;

  @override
  final String? phoneNumber;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('CanonicalPhoneBindingPolicy Tests', () {
    test('1. Normalization: valid 10-digit Indian numbers starting with 6,7,8,9 normalize to +91', () {
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('9876543210'), equals('+919876543210'));
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('8123456789'), equals('+918123456789'));
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('7000000000'), equals('+917000000000'));
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('6999999999'), equals('+916999999999'));
    });

    test('2. Normalization: rejects numbers starting with 0-5, letters, symbols, spaces, or +91 prefix in raw input', () {
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('5876543210'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('1234567890'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('+919876543210'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765 43210'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile(' 9876543210 '), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('987654321'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765432100'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile('98765abcd0'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeIndianMobile(null), isNull);
    });

    test('3. E.164 Normalization: accepts valid +91XXXXXXXXXX and 10 digits', () {
      expect(CanonicalPhoneBindingPolicy.normalizeE164Phone('+919876543210'), equals('+919876543210'));
      expect(CanonicalPhoneBindingPolicy.normalizeE164Phone('9876543210'), equals('+919876543210'));
      expect(CanonicalPhoneBindingPolicy.normalizeE164Phone('+1234567890'), isNull);
      expect(CanonicalPhoneBindingPolicy.normalizeE164Phone(null), isNull);
    });

    test('4. Single Phone Masking Law: exact standard format +91 ******1234', () {
      expect(CanonicalPhoneBindingPolicy.maskPhone('+919876543210'), equals('+91 ******3210'));
      expect(CanonicalPhoneBindingPolicy.maskPhone('9876543210'), equals('+91 ******3210'));
      expect(CanonicalPhoneBindingPolicy.maskPhone('8123456789'), equals('+91 ******6789'));
      expect(CanonicalPhoneBindingPolicy.maskPhone(null), equals('Not set'));
      expect(CanonicalPhoneBindingPolicy.maskPhone(''), equals('Not set'));
    });

    test('5. Phone Binding Check: null user fails closed, bound user passes', () {
      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(null), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(null), isNull);

      final boundUser = FakeTestUser(
        uid: 'UID_123',
        phoneNumber: '+919876543210',
        providerData: [FakeTestUserInfo(providerId: 'phone')],
      );
      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(boundUser), isTrue);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(boundUser), equals('+919876543210'));

      final unboundUser = FakeTestUser(
        uid: 'UID_456',
        phoneNumber: null,
        providerData: [FakeTestUserInfo(providerId: 'google.com')],
      );
      expect(CanonicalPhoneBindingPolicy.hasCanonicalPhoneBinding(unboundUser), isFalse);
      expect(CanonicalPhoneBindingPolicy.canonicalVerifiedPhone(unboundUser), isNull);
    });

    test('6. Profile metadata resolution: canonical mobile takes precedence over legacy phone', () {
      final dataWithBoth = {'mobile': '+919876543210', 'phone': '0112345678'};
      expect(CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata(dataWithBoth), equals('+919876543210'));

      final dataWithLegacyOnly = {'phone': '+919876543210'};
      expect(CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata(dataWithLegacyOnly), equals('+919876543210'));

      expect(CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata(null), isNull);
      expect(CanonicalPhoneBindingPolicy.resolveProfilePhoneMetadata({}), isNull);
    });
  });
}
