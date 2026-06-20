import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  @override
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  @override
  User? get currentUser => _auth.currentUser;

  // =====================================================
  // GOOGLE AUTH
  // =====================================================

  @override
  Future<UserCredential?> signInWithGoogle() async {
    try {
      debugPrint("🔱 GOOGLE AUTH: Starting flow...");
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        debugPrint("🔱 GOOGLE AUTH: User cancelled flow.");
        return null;
      }

      debugPrint("🔱 GOOGLE AUTH: Account selected: ${googleUser.email}");
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      debugPrint("🔱 GOOGLE AUTH: Fetching credentials...");
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final result = await _auth.signInWithCredential(credential);
      debugPrint("🔱 GOOGLE AUTH: SignIn successful for UID: ${result.user?.uid}");
      return result;
    } on FirebaseAuthException catch (e) {
      debugPrint("🔱 GOOGLE AUTH FIREBASE ERROR: ${e.code} - ${e.message}");
      rethrow;
    } catch (e) {
      debugPrint("🔱 GOOGLE AUTH UNKNOWN ERROR: $e");
      rethrow;
    }
  }

  // =====================================================
  // EMAIL AUTH
  // =====================================================

  @override
  Future<UserCredential> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password.trim(),
    );
  }

  @override
  Future<UserCredential> createAccount({
    required String email,
    required String password,
  }) async {
    return await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password.trim(),
    );
  }

  @override
  Future<UserCredential?> authenticate({
    required String email,
    required String password,
  }) async {
    try {
      // 🔱 Attempt Login
      return await signInWithEmail(
        email: email,
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      // 🔱 If user doesn't exist, create account
      if (e.code == 'user-not-found' || e.code == 'invalid-credential') {
        try {
          return await createAccount(
            email: email,
            password: password,
          );
        } catch (error) {
          rethrow;
        }
      }
      rethrow;
    }
  }

  @override
  Future<void> forgotPassword(String email) async {
    await _auth.sendPasswordResetEmail(
      email: email.trim(),
    );
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  @override
  Future<void> signOut() async {
    try {
      await _googleSignIn.disconnect();
      await _googleSignIn.signOut();
      await _auth.signOut();
    } catch (e) {
      await _auth.signOut();
    }
  }
}
