import * as testing from '@firebase/rules-unit-testing';
import * as fs from 'fs';

const PROJECT_ID = 'rankcrackers-55';

describe('FIRESTORE SECURITY RULES (Tactical Protocol)', () => {
  jest.setTimeout(30000);
  let testEnv: testing.RulesTestEnvironment;

  beforeAll(async () => {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8188';
    }
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const [host, portStr] = emulatorHost.split(':');
    const port = parseInt(portStr || '8188', 10);

    testEnv = await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync('../firestore.rules', 'utf8'),
        host,
        port,
      },
    });
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
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

  // ===================================================
  // DIGIBOOK GOVERNED PUBLICATION CONTRACT TESTS
  // ===================================================

  test('🛡️ DigiBook Rules: Synthetic FF01 node is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('synth_ff01').set({
        id: 'synth_ff01',
        status: 'published',
        studentVisibilityAuthorized: true,
        isSynthetic: true,
        description: 'Materialized via RELIABILITY FF01 progressive publication.',
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('synth_ff01').get());
  });

  test('🛡️ DigiBook Rules: Structural HOLD node is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('struct_hold').set({
        id: 'struct_hold',
        status: 'published',
        studentVisibilityAuthorized: true,
        isStructuralHold: true,
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('struct_hold').get());
  });

  test('🛡️ DigiBook Rules: Unverified node is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('unverified_1').set({
        id: 'unverified_1',
        status: 'published',
        studentVisibilityAuthorized: true,
        verificationStatus: 'UNVERIFIED',
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('unverified_1').get());
  });

  test('🛡️ DigiBook Rules: Unapproved source node is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('unapproved_src').set({
        id: 'unapproved_src',
        status: 'published',
        studentVisibilityAuthorized: true,
        sourceApproved: false,
        verificationStatus: 'VERIFIED',
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('unapproved_src').get());
  });

  test('🛡️ DigiBook Rules: Unpublished node is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('draft_node').set({
        id: 'draft_node',
        status: 'draft',
        studentVisibilityAuthorized: true,
        sourceApproved: true,
        verificationStatus: 'VERIFIED',
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('draft_node').get());
  });

  test('🛡️ DigiBook Rules: Stale node is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('stale_node').set({
        id: 'stale_node',
        status: 'published',
        studentVisibilityAuthorized: true,
        isStale: true,
        sourceApproved: true,
        verificationStatus: 'VERIFIED',
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('stale_node').get());
  });

  test('🛡️ DigiBook Rules: Malformed governance metadata is DENIED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('malformed_node').set({
        id: 'malformed_node',
        status: 'published',
        studentVisibilityAuthorized: true,
        sourceApproved: true,
        verificationStatus: 'VERIFIED',
        // Missing canonicalAtomId, canonicalMissionId, etc.
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertFails(studentDb.collection('micro_nodes').doc('malformed_node').get());
  });

  test('🛡️ DigiBook Rules: Proper governed test fixture is ALLOWED to student', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('governed_node_1').set({
        id: 'governed_node_1',
        status: 'published',
        studentVisibilityAuthorized: true,
        isSynthetic: false,
        isStructuralHold: false,
        isStale: false,
        sourceApproved: true,
        verificationStatus: 'VERIFIED',
        canonicalAtomId: 'atom_jee_2027_phy_001',
        canonicalMissionId: 'jee_main_2027',
        approvedSourceId: 'src_ncert_phy_11_ch1',
        verificationId: 'ver_record_9988',
        contentRegistryId: 'payload_jee_2027_phy_001',
      });
    });

    const studentDb = testEnv.authenticatedContext('student-123').firestore();
    await testing.assertSucceeds(studentDb.collection('micro_nodes').doc('governed_node_1').get());
  });

  test('🛡️ DigiBook Rules: Founder can read any node including synthetic/structural', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('micro_nodes').doc('synth_ff01_founder').set({
        id: 'synth_ff01_founder',
        description: 'Materialized via RELIABILITY FF01 progressive publication.',
      });
    });

    const founderDb = testEnv.authenticatedContext('founder-123', { founder: true }).firestore();
    await testing.assertSucceeds(founderDb.collection('micro_nodes').doc('synth_ff01_founder').get());
  });
});
