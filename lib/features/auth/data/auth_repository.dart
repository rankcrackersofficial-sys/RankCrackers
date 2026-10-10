import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/knowledge/knowledge_engine.dart';
import '../../../shared/session/session_manager.dart';
import '../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: const ['email']);

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
      debugPrint('G00_PREVIOUS_GOOGLE_SESSION_CLEAR_STARTED');
      await _googleSignIn.signOut().timeout(
            const Duration(seconds: 8),
            onTimeout: () => throw const AuthFlowException(
              code: 'google-session-clear-timeout',
              stage: 'G_TIMEOUT',
              studentMessage:
                  'Google sign-in could not reset the previous account. Please try again.',
              rawMessage: 'GoogleSignIn.signOut timed out after 8 seconds.',
            ),
          );
      debugPrint('G00_PREVIOUS_GOOGLE_SESSION_CLEAR_COMPLETE');

      debugPrint('G02_ACCOUNT_PICKER_REQUESTED');
      final GoogleSignInAccount? googleUser = await _googleSignIn
          .signIn()
          .timeout(
            const Duration(seconds: 25),
            onTimeout: () => throw const AuthFlowException(
              code: 'google-picker-timeout',
              stage: 'G_TIMEOUT',
              studentMessage:
                  'Google sign-in did not open in time. Check your connection and try again.',
              rawMessage: 'Google account picker timed out after 25 seconds.',
            ),
          );

      debugPrint('G03_ACCOUNT_PICKER_RETURNED');
      if (googleUser == null) {
        debugPrint('G_CANCELLED');
        throw const AuthFlowException(
          code: 'google-cancelled',
          stage: 'G_CANCELLED',
          studentMessage: 'Google sign-in was cancelled. Try again when ready.',
          rawMessage: 'GoogleSignIn.signIn returned null.',
        );
      }

      debugPrint('G04_ACCOUNT_SELECTED');
      debugPrint('G05_GOOGLE_AUTH_REQUESTED');
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication.timeout(
        const Duration(seconds: 20),
        onTimeout: () => throw const AuthFlowException(
          code: 'google-token-timeout',
          stage: 'G_TIMEOUT',
          studentMessage:
              'Google sign-in could not complete. Check your connection and try again.',
          rawMessage: 'Google token acquisition timed out after 20 seconds.',
        ),
      );

      debugPrint('G06_GOOGLE_AUTH_RETURNED');
      final bool idTokenPresent = googleAuth.idToken?.isNotEmpty == true;
      final bool accessTokenPresent =
          googleAuth.accessToken?.isNotEmpty == true;
      debugPrint('G07_ID_TOKEN_PRESENT=$idTokenPresent');
      debugPrint('G08_ACCESS_TOKEN_PRESENT=$accessTokenPresent');

      if (!idTokenPresent && !accessTokenPresent) {
        throw const AuthFlowException(
          code: 'google-token-missing',
          stage: 'G_UNKNOWN_EXCEPTION',
          studentMessage:
              'Google sign-in returned without a usable credential. Please try again.',
          rawMessage: 'Both Google idToken and accessToken were absent.',
        );
      }

      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      debugPrint('G09_FIREBASE_CREDENTIAL_CREATED');

      debugPrint('G10_FIREBASE_SIGNIN_STARTED');
      final result = await _auth.signInWithCredential(credential).timeout(
            const Duration(seconds: 20),
            onTimeout: () => throw const AuthFlowException(
              code: 'firebase-credential-timeout',
              stage: 'G_TIMEOUT',
              studentMessage:
                  'Google sign-in reached RankCrackers but could not finish. Please try again.',
              rawMessage:
                  'FirebaseAuth.signInWithCredential timed out after 20 seconds.',
            ),
          );
      debugPrint('G11_FIREBASE_SIGNIN_RETURNED');
      return result;
    } on AuthFlowException catch (e) {
      debugPrint('GOOGLE_AUTH_TERMINAL=${e.stage}/${e.code}');
      rethrow;
    } on FirebaseAuthException catch (e) {
      debugPrint('G_FIREBASE_EXCEPTION=${e.code}');
      rethrow;
    } on PlatformException catch (e) {
      final String code = e.code == 'sign_in_canceled'
          ? 'google-cancelled'
          : 'google-platform-${e.code}';
      final String stage =
          e.code == 'sign_in_canceled' ? 'G_CANCELLED' : 'G_PLATFORM_EXCEPTION';
      debugPrint('$stage=${e.code}');
      throw AuthFlowException(
        code: code,
        stage: stage,
        studentMessage:
            'Google sign-in could not complete. Check your connection and try again.',
        rawMessage: '${e.code}: ${e.message ?? e.details ?? e.toString()}',
      );
    } on TimeoutException catch (e) {
      debugPrint('G_TIMEOUT=${e.message ?? e.toString()}');
      throw AuthFlowException(
        code: 'google-timeout',
        stage: 'G_TIMEOUT',
        studentMessage:
            'Google sign-in took too long. Check your connection and try again.',
        rawMessage: e.message ?? e.toString(),
      );
    } catch (e) {
      debugPrint('G_UNKNOWN_EXCEPTION=$e');
      throw AuthFlowException(
        code: 'google-unknown',
        stage: 'G_UNKNOWN_EXCEPTION',
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
    debugPrint('E03_FIREBASE_EMAIL_SIGNIN_STARTED');
    final credential = await _auth
        .signInWithEmailAndPassword(
          email: email.trim(),
          password: password.trim(),
        )
        .timeout(
          const Duration(seconds: 20),
          onTimeout: () => throw const AuthFlowException(
            code: 'email-signin-timeout',
            stage: 'E_TIMEOUT',
            studentMessage:
                'Email login took too long. Check your connection and try again.',
            rawMessage: 'Firebase email sign-in timed out after 20 seconds.',
          ),
        );
    debugPrint('E04_FIREBASE_EMAIL_SIGNIN_RETURNED');
    return credential;
  }

  @override
  Future<UserCredential> createAccount({
    required String email,
    required String password,
  }) async {
    debugPrint('E03_FIREBASE_EMAIL_CREATE_STARTED');
    final credential = await _auth
        .createUserWithEmailAndPassword(
          email: email.trim(),
          password: password.trim(),
        )
        .timeout(
          const Duration(seconds: 20),
          onTimeout: () => throw const AuthFlowException(
            code: 'email-create-timeout',
            stage: 'E_TIMEOUT',
            studentMessage:
                'Email account setup took too long. Check your connection and try again.',
            rawMessage:
                'Firebase email account create timed out after 20 seconds.',
          ),
        );
    debugPrint('E04_FIREBASE_EMAIL_CREATE_RETURNED');
    return credential;
  }

  @override
  Future<UserCredential?> authenticate({
    required String email,
    required String password,
  }) async {
    try {
      return await signInWithEmail(
        email: email,
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-not-found' || e.code == 'invalid-credential') {
        debugPrint('E_USER_NOT_FOUND_OR_INVALID_CREDENTIAL_CREATE_FALLBACK');
        return await createAccount(
          email: email,
          password: password,
        );
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
      await SessionManager.logout();
      await KnowledgeEngine.instance.clearSessionState();
      await _googleSignIn.disconnect();
      await _googleSignIn.signOut();
      await _auth.signOut();
    } catch (e) {
      await _auth.signOut();
    }
  }
}
