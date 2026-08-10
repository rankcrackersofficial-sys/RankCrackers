import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class FirebaseEmulatorConfig {
  const FirebaseEmulatorConfig({
    required this.enabled,
    required this.host,
    required this.authPort,
    required this.firestorePort,
  });

  factory FirebaseEmulatorConfig.fromDartDefines() {
    const enabled = bool.fromEnvironment('RC_USE_FIREBASE_EMULATOR');
    const host = String.fromEnvironment('RC_FIREBASE_EMULATOR_HOST');
    const authPort = int.fromEnvironment(
      'RC_FIREBASE_AUTH_EMULATOR_PORT',
      defaultValue: 9099,
    );
    const firestorePort = int.fromEnvironment(
      'RC_FIRESTORE_EMULATOR_PORT',
      defaultValue: 8080,
    );

    return const FirebaseEmulatorConfig(
      enabled: enabled,
      host: host,
      authPort: authPort,
      firestorePort: firestorePort,
    );
  }

  final bool enabled;
  final String host;
  final int authPort;
  final int firestorePort;

  void validate() {
    if (!enabled) return;
    if (kReleaseMode) {
      throw StateError(
        'Firebase emulator mode is debug/test only and cannot run in release.',
      );
    }
    if (host.trim().isEmpty) {
      throw StateError(
        'RC_USE_FIREBASE_EMULATOR=true requires RC_FIREBASE_EMULATOR_HOST.',
      );
    }
    if (authPort <= 0 || firestorePort <= 0) {
      throw StateError('Firebase emulator ports must be positive integers.');
    }
  }
}

Future<FirebaseEmulatorConfig>
    configureFirebaseEmulatorsFromDartDefines() async {
  final config = FirebaseEmulatorConfig.fromDartDefines();
  config.validate();

  if (!config.enabled) {
    debugPrint('RC_FIREBASE_BACKEND=PRODUCTION_CONFIG_DEFAULT');
    return config;
  }

  final host = config.host.trim();
  await FirebaseAuth.instance.useAuthEmulator(host, config.authPort);
  FirebaseFirestore.instance.useFirestoreEmulator(host, config.firestorePort);

  debugPrint(
    'RC_FIREBASE_BACKEND=EMULATOR '
    'auth=$host:${config.authPort} '
    'firestore=$host:${config.firestorePort}',
  );
  return config;
}
