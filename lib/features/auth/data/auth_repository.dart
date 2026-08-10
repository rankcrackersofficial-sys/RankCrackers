import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
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
    const accountPickerStage = 'GOOGLE_ACCOUNT_PICKER';
    const credentialStage = 'GOOGLE_CREDENTIAL_TOKEN';
    const firebaseStage = 'FIREBASE_AUTH_CREDENTIAL';

    try {
      debugPrint('GOOGLE AUTH [$accountPickerStage]: Starting flow.');
      final GoogleSignInAccount? googleUser = await _googleSignIn
          .signIn()
          .timeout(
            const Duration(seconds: 25),
            onTimeout: () => throw const AuthFlowException(
              code: 'google-picker-timeout',
              stage: accountPickerStage,
              studentMessage:
                  'Google sign-in did not open in time. Check your connection and try again.',
              rawMessage: 'Google account picker timed out after 25 seconds.',
            ),
          );

      if (googleUser == null) {
        debugPrint('GOOGLE AUTH [$accountPickerStage]: User cancelled.');
        throw const AuthFlowException(
          code: 'google-cancelled',
          stage: accountPickerStage,
          studentMessage: 'Google sign-in was cancelled. Try again when ready.',
          rawMessage: 'GoogleSignIn.signIn returned null.',
        );
      }

      debugPrint('GOOGLE AUTH [$accountPickerStage]: Account selected.');
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication.timeout(
        const Duration(seconds: 20),
        onTimeout: () => throw const AuthFlowException(
          code: 'google-token-timeout',
          stage: credentialStage,
          studentMessage:
              'Google sign-in could not complete. Check your connection and try again.',
          rawMessage: 'Google token acquisition timed out after 20 seconds.',
        ),
      );

      debugPrint('GOOGLE AUTH [$credentialStage]: Token stage complete.');
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final result = await _auth.signInWithCredential(credential).timeout(
            const Duration(seconds: 20),
            onTimeout: () => throw const AuthFlowException(
              code: 'firebase-credential-timeout',
              stage: firebaseStage,
              studentMessage:
                  'Google sign-in reached RankCrackers but could not finish. Please try again.',
              rawMessage:
                  'FirebaseAuth.signInWithCredential timed out after 20 seconds.',
            ),
          );
      debugPrint('GOOGLE AUTH [$firebaseStage]: Sign-in successful.');
      return result;
    } on AuthFlowException catch (e) {
      debugPrint(
          'GOOGLE AUTH FLOW ERROR: ${e.stage}/${e.code} - ${e.rawMessage ?? e.studentMessage}');
      rethrow;
    } on FirebaseAuthException catch (e) {
      debugPrint('GOOGLE AUTH FIREBASE ERROR: ${e.code} - ${e.message}');
      rethrow;
    } on PlatformException catch (e) {
      debugPrint('GOOGLE AUTH PLATFORM ERROR: ${e.code} - ${e.message}');
      throw AuthFlowException(
        code: 'google-platform-${e.code}',
        stage: 'GOOGLE_PLATFORM_BRIDGE',
        studentMessage:
            'Google sign-in could not complete. Check your connection and try again.',
        rawMessage: '${e.code}: ${e.message ?? e.details ?? e.toString()}',
      );
    } on TimeoutException catch (e) {
      debugPrint('GOOGLE AUTH TIMEOUT ERROR: ${e.message ?? e.toString()}');
      throw AuthFlowException(
        code: 'google-timeout',
        stage: 'GOOGLE_AUTH_TIMEOUT',
        studentMessage:
            'Google sign-in took too long. Check your connection and try again.',
        rawMessage: e.message ?? e.toString(),
      );
    } catch (e) {
      debugPrint('GOOGLE AUTH UNKNOWN ERROR: $e');
      throw AuthFlowException(
        code: 'google-unknown',
        stage: 'GOOGLE_AUTH_UNKNOWN',
        studentMessage:
            'Google sign-in could not start. Check your connection and try again.',
        rawMessage: e.toString(),
      );
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
