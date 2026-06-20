import 'package:flutter/foundation.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

class GlobalErrorHandler {
  // ===================================================
  // HANDLE ERROR 🔱
  // ===================================================
  static void handle(dynamic error, [StackTrace? stack]) {
    debugPrint('🔱 TACTICAL ERROR CAPTURED: $error');
    
    // Push to Crashlytics in production
    if (!kDebugMode) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: false);
    }
  }

  // ===================================================
  // HANDLE FATAL ERROR 🔱
  // ===================================================
  static void handleFatal(dynamic error, [StackTrace? stack]) {
    debugPrint('🔥 CRITICAL SYSTEM FAILURE: $error');
    if (!kDebugMode) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    }
  }
}
