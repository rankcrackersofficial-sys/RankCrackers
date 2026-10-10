import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

import 'firebase_options.dart';
import 'main_web.dart' show RankCrackersWebApp;

const _host = '127.0.0.1';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (kReleaseMode)
    throw StateError('The Founder Web emulator harness is debug-only.');
  final web = DefaultFirebaseOptions.web;
  await Firebase.initializeApp(
    options: FirebaseOptions(
      apiKey: web.apiKey,
      appId: web.appId,
      messagingSenderId: web.messagingSenderId,
      projectId: 'demo-rankcrackers-55',
      authDomain: web.authDomain,
      storageBucket: web.storageBucket,
      measurementId: web.measurementId,
    ),
  );
  await FirebaseAuth.instance.useAuthEmulator(_host, 9199);
  FirebaseFirestore.instance.useFirestoreEmulator(_host, 8188);
  FirebaseFunctions.instanceFor(region: 'us-central1')
      .useFunctionsEmulator(_host, 5101);
  debugPrint(
      'RC_FOUNDER_WEB_TEST_BACKEND auth=$_host:9199 firestore=$_host:8188 functions=$_host:5101');
  await SessionManager.initialize();
  runApp(const ProviderScope(child: RankCrackersWebApp()));
}
