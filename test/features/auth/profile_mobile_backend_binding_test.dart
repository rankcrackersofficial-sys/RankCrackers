import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/auth/domain/policies/canonical_phone_binding_policy.dart';

void main() {
  group('Canonical phone claim matching', () {
    test('accepts a ten-digit input matching the verified E.164 claim', () {
      expect(
        CanonicalPhoneBindingPolicy.inputMatchesVerifiedPhone(
          rawInput: '9876543210',
          verifiedPhone: '+919876543210',
        ),
        isTrue,
      );
    });

    test('accepts canonical E.164 input when it matches the verified claim', () {
      expect(
        CanonicalPhoneBindingPolicy.inputMatchesVerifiedPhone(
          rawInput: '+919876543210',
          verifiedPhone: '+919876543210',
        ),
        isTrue,
      );
    });

    test('rejects a different or absent verified phone claim', () {
      expect(
        CanonicalPhoneBindingPolicy.inputMatchesVerifiedPhone(
          rawInput: '9876543210',
          verifiedPhone: '+919876543211',
        ),
        isFalse,
      );
      expect(
        CanonicalPhoneBindingPolicy.inputMatchesVerifiedPhone(
          rawInput: '9876543210',
          verifiedPhone: null,
        ),
        isFalse,
      );
    });

    test('rejects invalid Indian mobile input', () {
      expect(
        CanonicalPhoneBindingPolicy.inputMatchesVerifiedPhone(
          rawInput: '5876543210',
          verifiedPhone: '+915876543210',
        ),
        isFalse,
      );
    });
  });
}
