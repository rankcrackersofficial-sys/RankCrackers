'use strict';

// Execute before importing any Admin SDK consumer. Even integration suites
// with historical project IDs must route exclusively to local emulators.
for (const [name, fallback] of Object.entries({
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8188',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9299',
})) {
  const host = process.env[name] || fallback;
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
    throw new Error(`LOCAL_TEST_EMULATOR_ONLY: ${name}`);
  }
  process.env[name] = host;
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('LOCAL_TEST_CREDENTIALS_FORBIDDEN');
}
process.env.GCLOUD_PROJECT = 'demo-rankcrackers-tests';
process.env.GOOGLE_CLOUD_PROJECT = 'demo-rankcrackers-tests';
