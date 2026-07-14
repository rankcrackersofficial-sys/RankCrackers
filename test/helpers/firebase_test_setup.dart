import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_core_platform_interface/test.dart';
import 'package:flutter_test/flutter_test.dart';

const _testFirebaseOptions = FirebaseOptions(
  apiKey: 'test-api-key',
  appId: '1:123456789:web:test',
  messagingSenderId: '123456789',
  projectId: 'rankcrackers-test',
  authDomain: 'rankcrackers-test.firebaseapp.com',
  storageBucket: 'rankcrackers-test.appspot.com',
);

Future<void> ensureFirebaseInitializedForTests() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  setupFirebaseCoreMocks();

  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(options: _testFirebaseOptions);
    }
  } on FirebaseException catch (error) {
    if (error.code != 'duplicate-app') {
      rethrow;
    }
  }
}