import 'package:firebase_auth/firebase_auth.dart';

class AuthFlowException implements Exception {
  const AuthFlowException({
    required this.code,
    required this.stage,
    required this.studentMessage,
    this.rawMessage,
  });

  final String code;
  final String stage;
  final String studentMessage;
  final String? rawMessage;

  @override
  String toString() {
    return 'AuthFlowException($stage/$code): ${rawMessage ?? studentMessage}';
  }
}

abstract class AuthRepository {
  Stream<User?> get authStateChanges;

  User? get currentUser;

// =====================================================
// GOOGLE AUTH
// =====================================================

  Future<UserCredential?> signInWithGoogle();

// =====================================================
// EMAIL AUTH
// =====================================================

  Future<UserCredential> signInWithEmail({
    required String email,
    required String password,
  });

  Future<UserCredential> createAccount({
    required String email,
    required String password,
  });

  Future<UserCredential?> authenticate({
    required String email,
    required String password,
  });

  Future<void> forgotPassword(
    String email,
  );

// =====================================================
// SESSION
// =====================================================

  Future<void> signOut();
}
