import 'package:firebase_auth/firebase_auth.dart';

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
