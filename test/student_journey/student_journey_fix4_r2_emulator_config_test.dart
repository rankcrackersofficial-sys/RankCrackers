import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/firebase/firebase_emulator_config.dart';

void main() {
  test('default Firebase emulator config remains production mode', () {
    const config = FirebaseEmulatorConfig(
      enabled: false,
      host: '',
      authPort: 9099,
      firestorePort: 8080,
    );

    expect(config.enabled, isFalse);
    expect(config.host, isEmpty);
    expect(() => config.validate(), returnsNormally);
  });

  test('emulator mode fails closed without explicit host', () {
    const config = FirebaseEmulatorConfig(
      enabled: true,
      host: '',
      authPort: 9099,
      firestorePort: 8080,
    );

    expect(
      config.validate,
      throwsA(isA<StateError>().having(
        (error) => error.message,
        'message',
        contains('RC_FIREBASE_EMULATOR_HOST'),
      )),
    );
  });

  test('emulator mode accepts explicit host and positive ports', () {
    const config = FirebaseEmulatorConfig(
      enabled: true,
      host: '10.0.2.2',
      authPort: 9099,
      firestorePort: 8080,
    );

    expect(() => config.validate(), returnsNormally);
  });

  test('emulator mode rejects invalid ports', () {
    const config = FirebaseEmulatorConfig(
      enabled: true,
      host: '10.0.2.2',
      authPort: 0,
      firestorePort: 8080,
    );

    expect(config.validate, throwsA(isA<StateError>()));
  });
}
