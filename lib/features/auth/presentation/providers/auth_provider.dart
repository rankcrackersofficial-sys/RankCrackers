import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
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
    bool clearError = false,
    bool clearUser = false,
  }) {
    return SecureAuthState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      user: clearUser ? null : user ?? this.user,
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
      debugPrint('E02_FORM_VALIDATION_PASS');
      state = state.copyWith(isLoading: true, clearError: true);

      final credential = await _repository
          .authenticate(
            email: email,
            password: password,
          )
          .timeout(
            const Duration(seconds: 35),
            onTimeout: () => throw const AuthFlowException(
              code: 'email-timeout',
              stage: 'E_TIMEOUT',
              studentMessage:
                  'Email login took too long. Check your connection and try again.',
              rawMessage: 'Email authenticate timed out after 35 seconds.',
            ),
          );

      state = state.copyWith(
        isLoading: false,
        user: credential?.user,
      );
      if (credential?.user != null) {
        debugPrint('E05_AUTH_STATE_USER_PRESENT');
      }

      return credential != null;
    } catch (e) {
      debugPrint('E_AUTH_TERMINAL: ${_terminalStageFor(e)}');
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
      state = state.copyWith(isLoading: true, clearError: true);

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
      state = state.copyWith(isLoading: true, clearError: true);

      final credential = await _repository.signInWithGoogle().timeout(
            const Duration(seconds: 75),
            onTimeout: () => throw const AuthFlowException(
              code: 'google-flow-timeout',
              stage: 'G_TIMEOUT',
              studentMessage:
                  'Google sign-in took too long. Check your connection and try again.',
              rawMessage: 'Google sign-in flow timed out after 75 seconds.',
            ),
          );

      state = state.copyWith(
        isLoading: false,
        user: credential?.user,
      );
      if (credential?.user != null) {
        debugPrint('G12_AUTH_STATE_USER_PRESENT');
      }

      return credential != null;
    } catch (e) {
      debugPrint('G_AUTH_TERMINAL: ${_terminalStageFor(e)}');
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
    state = state.copyWith(clearUser: true);
  }

  String _terminalStageFor(dynamic e) {
    if (e is AuthFlowException) return e.stage;
    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'user-not-found':
          return 'E_USER_NOT_FOUND';
        case 'wrong-password':
          return 'E_WRONG_PASSWORD';
        case 'invalid-credential':
          return 'E_INVALID_CREDENTIAL';
        default:
          return 'FIREBASE_EXCEPTION_${e.code}';
      }
    }
    if (e is TimeoutException) return 'TIMEOUT_EXCEPTION';
    return 'UNKNOWN_EXCEPTION';
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
