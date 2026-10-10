import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class AuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  static User? get currentUser => _auth.currentUser;

  // ===================================================
  // SIGN IN ANONYMOUSLY (With Error Handling) 
  // ===================================================
  static Future<UserCredential?> signInAnonymously() async {
    try {
      return await _auth.signInAnonymously();
    } on FirebaseAuthException catch (e) {
      debugPrint("Firebase Auth Error: ${e.code} - ${e.message}");
      if (e.code == 'admin-restricted-operation') {
        throw "Auth restricted. Please enable Anonymous Auth in Firebase Console.";
      }
      if (e.code == 'configuration-not-found') {
        throw "Firebase Configuration Error: Enable Anonymous Auth in Firebase Console > Authentication.";
      }
      rethrow;
    } catch (e) {
      debugPrint("Unknown Auth Error: $e");
      rethrow;
    }
  }

  static Future<void> signOut() async {
    await _auth.signOut();
  }
}
