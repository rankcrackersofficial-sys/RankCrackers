// File regenerated for build stability during Stabilization Mission.
// ignore_for_file: type=lint
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCVcd4Am6ug5j92T6HmGiEXFbmlsKhTmnA',
    appId: '1:667342482948:web:df50cd79950c77c5cecf51',
    messagingSenderId: '667342482948',
    projectId: 'rankcrackers-55',
    authDomain: 'rankcrackers-55.firebaseapp.com',
    storageBucket: 'rankcrackers-55.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCVcd4Am6ug5j92T6HmGiEXFbmlsKhTmnA',
    appId: '1:667342482948:android:9f9baa91a9ec3164cecf51',
    messagingSenderId: '667342482948',
    projectId: 'rankcrackers-55',
    storageBucket: 'rankcrackers-55.firebasestorage.app',
  );
}
