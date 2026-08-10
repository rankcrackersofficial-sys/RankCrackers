import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/repositories/auth_repository.dart';
import '../../data/auth_repository.dart';

// =====================================================
// REPOSITORY PROVIDER
// =====================================================

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl();
});

// =====================================================
// AUTH STATE STREAM
// =====================================================

final authStateChangesProvider = StreamProvider<User?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

// =====================================================
// STATE
// =====================================================

class SecureAuthState {
  final bool isLoading;
  final String? errorMessage;
  final User? user;

  const SecureAuthState({
    this.isLoading = false,
    this.errorMessage,
    this.user,
  });

  SecureAuthState copyWith({
    bool? isLoading,
    String? errorMessage,
    User? user,
  }) {
    return SecureAuthState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      user: user ?? this.user,
    );
  }
}

// =====================================================
// NOTIFIER
// =====================================================

class AuthNotifier extends StateNotifier<SecureAuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository)
      : super(
          SecureAuthState(
            user: _repository.currentUser,
          ),
        );

  // =====================================================
  // EMAIL AUTH
  // =====================================================

  Future<bool> authenticate({
    required String email,
    required String password,
  }) async {
    try {
      state = state.copyWith(isLoading: true, errorMessage: null);

      final credential = await _repository.authenticate(
        email: email,
        password: password,
      );

      state = state.copyWith(
        isLoading: false,
        user: credential?.user,
      );

      return credential != null;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _getAuthErrorMessage(e),
      );
      return false;
    }
  }

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  Future<bool> forgotPassword(String email) async {
    try {
      state = state.copyWith(isLoading: true, errorMessage: null);

      await _repository.forgotPassword(email);

      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _getAuthErrorMessage(e),
      );
      return false;
    }
  }

  // =====================================================
  // GOOGLE AUTH
  // =====================================================

  Future<bool> signInWithGoogle() async {
    if (state.isLoading) return false;

    try {
      state = state.copyWith(isLoading: true, errorMessage: null);

      final credential = await _repository.signInWithGoogle();

      state = state.copyWith(
        isLoading: false,
        user: credential?.user,
      );

      return credential != null;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _getAuthErrorMessage(e),
      );
      return false;
    }
  }

  // =====================================================
  // SIGN OUT
  // =====================================================

  Future<void> signOut() async {
    await _repository.signOut();
    state = state.copyWith(user: null);
  }

  String _getAuthErrorMessage(dynamic e) {
    if (e is AuthFlowException) {
      return e.studentMessage;
    }

    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'user-not-found':
          return 'No user found with this email.';
        case 'wrong-password':
          return 'Wrong password provided.';
        case 'invalid-email':
          return 'The email address is badly formatted.';
        case 'user-disabled':
          return 'This user has been disabled.';
        case 'email-already-in-use':
          return 'An account already exists for this email.';
        case 'weak-password':
          return 'The password provided is too weak.';
        default:
          return e.message ?? 'Authentication failed.';
      }
    }
    return 'Authentication could not complete. Please try again.';
  }
}

// =====================================================
// PROVIDER
// =====================================================

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, SecureAuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});
