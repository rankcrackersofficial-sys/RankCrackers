import * as testing from '@firebase/rules-unit-testing';
import * as fs from 'fs';

const PROJECT_ID = 'rankcrackers-55';
const RULES_PATH = '../firestore.rules'; // Path from functions/lib/test or where jest runs

describe('🔱 FIRESTORE SECURITY RULES (Tactical Protocol)', () => {
  let testEnv: testing.RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'), // Adjust path as needed
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  test('🛡️ Protocols: Student can read/write their own protocol state', async () => {
    const studentUid = 'student-123';
    const context = testEnv.authenticatedContext(studentUid);
    const db = context.firestore();
    const protocolRef = db.collection('users').doc(studentUid).collection('protocols').doc('jee_main_2027');

    await testing.assertSucceeds(protocolRef.set({
      recruitmentId: 'jee_main_2027',
      phaseIndex: 1
    }));

    await testing.assertSucceeds(protocolRef.get());
  });

  test('🛡️ Protocols: Student cannot read another students protocol', async () => {
    const studentA = 'student-A';
    const studentB = 'student-B';
    const contextA = testEnv.authenticatedContext(studentA);
    const dbA = contextA.firestore();
    const protocolBRef = dbA.collection('users').doc(studentB).collection('protocols').doc('jee_main_2027');

    await testing.assertFails(protocolBRef.get());
  });

  test('🛡️ Schedules: Authenticated user can read schedules', async () => {
    const context = testEnv.authenticatedContext('any-user');
    const db = context.firestore();
    const scheduleRef = db.collection('schedules').doc('s1');

    await testing.assertSucceeds(scheduleRef.get());
  });

  test('🛡️ Schedules: Anonymous user cannot read schedules', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const scheduleRef = db.collection('schedules').doc('s1');

    await testing.assertFails(scheduleRef.get());
  });

  test('🛡️ Content: Founder can write micro_nodes', async () => {
    const context = testEnv.authenticatedContext('founder-uid', { founder: true });
    const db = context.firestore();
    const nodeRef = db.collection('micro_nodes').doc('node-1');

    await testing.assertSucceeds(nodeRef.set({ title: 'New Node' }));
  });

  test('🛡️ Content: Student cannot write micro_nodes', async () => {
    const context = testEnv.authenticatedContext('student-123');
    const db = context.firestore();
    const nodeRef = db.collection('micro_nodes').doc('node-1');

    await testing.assertFails(nodeRef.set({ title: 'Hacked Node' }));
  });
});
