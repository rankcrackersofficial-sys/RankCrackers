import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'firebase_options.dart';
import 'core/router/app_router.dart';
import 'core/ai/ai_queue_service.dart';
import 'core/theme/app_theme.dart';
import 'core/errors/global_error_handler.dart';
import 'shared/session/session_manager.dart';

Future<void> main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();

    // 🔱 PRODUCTION BOOTSTRAP
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // 🔱 SESSION BOOTSTRAP (Level-12.8 Hardening)
    await SessionManager.initialize();

    // 🔱 APP CHECK INITIALIZATION
    try {
      await FirebaseAppCheck.instance.activate(
        androidProvider: kDebugMode ? AndroidProvider.debug : AndroidProvider.playIntegrity,
        appleProvider: AppleProvider.deviceCheck,
      );
    } catch (e) {
      debugPrint('⚠️ App Check failed: $e');
    }
    
    runApp(
      const ProviderScope(
        child: RankCrackersApp(),
      ),
    );
    
  } catch (e, stack) {
    GlobalErrorHandler.handleFatal(e, stack);
  }
}

class RankCrackersApp extends StatelessWidget {
  const RankCrackersApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      scaffoldMessengerKey: aiQueueMessengerKey,
      debugShowCheckedModeBanner: false,
      title: 'RankCrackers',
      theme: AppTheme.darkTheme,
      routerConfig: appRouter,
    );
  }
}
