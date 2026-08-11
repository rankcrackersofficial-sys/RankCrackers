import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';

void main() {
  group('SecureAuthState auth cleanup semantics', () {
    test('clearError removes stale auth errors while keeping other state', () {
      const state = SecureAuthState(
        isLoading: true,
        errorMessage: 'Previous failure',
      );

      final next = state.copyWith(clearError: true);

      expect(next.isLoading, isTrue);
      expect(next.errorMessage, isNull);
    });

    test('copyWith without clearError preserves current error message', () {
      const state = SecureAuthState(errorMessage: 'Keep me');

      final next = state.copyWith(isLoading: true);

      expect(next.isLoading, isTrue);
      expect(next.errorMessage, 'Keep me');
    });

    test('clearUser is supported for sign-out state cleanup', () {
      const state = SecureAuthState(isLoading: false);

      final next = state.copyWith(clearUser: true);

      expect(next.user, isNull);
      expect(next.isLoading, isFalse);
    });
  });
}
