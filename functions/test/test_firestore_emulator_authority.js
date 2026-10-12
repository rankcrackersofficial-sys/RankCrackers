'use strict';

// Run ONLY under a localhost Firestore emulator with a demo-* project ID.
// Production service account credentials are neither read nor needed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } =
  require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

const projectId = 'demo-rankcrackers-rules';
const host = process.env.FIRESTORE_EMULATOR_HOST || '';
if (host !== '127.0.0.1:8188' && host !== 'localhost:8188') {
  throw new Error('RULES_RUNTIME_LOCAL_EMULATOR_ONLY');
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('RULES_RUNTIME_CREDENTIALS_NOT_ALLOWED');
}

let env;
test.before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8188,
      rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const [id, visible] of [['m_hidden', false], ['m_visible', true]]) {
      const realm = doc(db, 'mission_realms', id);
      await setDoc(realm, {
        missionId: id, archived: false, cardVisible: visible,
        userPanelVisible: false,
        visibilityGate: { studentVisible: visible, userPanelVisible: false },
      });
      for (const collectionName of ['structured_nodes', 'timeline', 'updates']) {
        await setDoc(doc(db, 'mission_realms', id, collectionName, 'one'),
          { missionId: id, status: 'draft', content: 'Founder review pending' });
      }
    }
    await setDoc(doc(db, 'mission_realms/m_hidden/official_documents/doc1'), {
      documentId: 'doc1', status: 'VERIFIED',
    });
    await setDoc(doc(db, 'mission_realms/m_hidden/source_pairs/pair1'), {
      taskId: 'pair1', status: 'READY_FOR_WORKER',
    });
  });
});
test.after(async () => { if (env) await env.cleanup(); });

test('Student cannot read hidden mission or its internal artifacts', async () => {
  const db = env.authenticatedContext('student1').firestore();
  for (const segments of [
    ['mission_realms','m_hidden'],
    ['mission_realms','m_hidden','structured_nodes','one'],
    ['mission_realms','m_hidden','timeline','one'],
    ['mission_realms','m_hidden','updates','one'],
    ['mission_realms','m_hidden','official_documents','doc1'],
    ['mission_realms','m_hidden','source_pairs','pair1'],
  ]) {
    await assertFails(getDoc(doc(db, ...segments)));
  }
});

test('same Student may read visible mission structures without special-exam privileges', async () => {
  const db = env.authenticatedContext('student1').firestore();
  for (const segments of [
    ['mission_realms','m_visible'],
    ['mission_realms','m_visible','structured_nodes','one'],
    ['mission_realms','m_visible','timeline','one'],
    ['mission_realms','m_visible','updates','one'],
  ]) await assertSucceeds(getDoc(doc(db, ...segments)));
});

test('Founder may review hidden mission but cannot falsify verified source evidence', async () => {
  const db = env.authenticatedContext('founder1', { founder: true }).firestore();
  await assertSucceeds(getDoc(doc(db,'mission_realms','m_hidden','structured_nodes','one')));
  await assertSucceeds(getDoc(doc(db,'mission_realms','m_hidden','official_documents','doc1')));
  await assertSucceeds(getDoc(doc(db,'mission_realms','m_hidden','source_pairs','pair1')));
  await assertFails(setDoc(doc(db,'mission_realms','m_hidden','source_pairs','pair2'), { status: 'VERIFIED' }));
  await assertFails(updateDoc(doc(db,'mission_realms','m_hidden','official_documents','doc1'),
    { status: 'VERIFIED_BY_CLIENT' }));
});

test('Student profile requires canonical verified phone and protects roles', async () => {
  const uid = 'student2';
  const unsigned = env.authenticatedContext(uid).firestore();
  const profile = doc(unsigned, 'users', uid);
  await assertFails(setDoc(profile, { mobile: '+919876543210', role: 'admin' }));
  await assertFails(setDoc(profile, { mobile: '+919876543210' }));
  const signed = env.authenticatedContext(uid, { phone_number: '+919876543210' }).firestore();
  const signedProfile = doc(signed, 'users', uid);
  await assertFails(setDoc(signedProfile, { mobile: '+919876543210', admin: true }));
  await assertSucceeds(setDoc(signedProfile, { mobile: '+919876543210', onboardingCompleted: false }));
  await assertFails(updateDoc(signedProfile, { role: 'founder' }));
  await assertFails(updateDoc(signedProfile, { onboardingCompleted: true, mobile: '+919999999999' }));
  await assertSucceeds(updateDoc(signedProfile, { onboardingCompleted: true }));
});


test('Test Arena owner and immutable paper/event/clock bindings survive student updates', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'test_arena_attempts', 'immutable_attempt'), {
      attemptId: 'immutable_attempt', uid: 'arena_owner', status: 'active',
      eventId: 'event_1', paperId: 'paper_1', paperVersionHash: 'hash_1',
      scoringPolicyVersion: 'policy_1', startedAt: 100, targetEndAt: 500,
      responses: {},
    });
  });
  const owner = env.authenticatedContext('arena_owner').firestore();
  const other = env.authenticatedContext('arena_other').firestore();
  const attempt = doc(owner, 'test_arena_attempts', 'immutable_attempt');
  for (const patch of [
    { uid: 'arena_other' }, { eventId: 'event_2' }, { paperId: 'paper_2' },
    { paperVersionHash: 'hash_2' }, { scoringPolicyVersion: 'policy_2' },
    { startedAt: 0 }, { targetEndAt: 999999 },
  ]) await assertFails(updateDoc(attempt, patch));
  await assertFails(updateDoc(doc(other, 'test_arena_attempts', 'immutable_attempt'),
    { status: 'submitted' }));
  await assertSucceeds(updateDoc(attempt, { responses: { q1: { selectedOptionIndex: 1 } } }));
  await assertSucceeds(updateDoc(attempt, { status: 'submitted' }));
});

test('opportunity match cannot be seized by replacing its owner uid', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'opportunity_matches', 'victim_match'),
      { uid: 'victim', score: 1 });
  });
  const attacker = env.authenticatedContext('attacker').firestore();
  const victim = env.authenticatedContext('victim').firestore();
  const founder = env.authenticatedContext('founder1', { founder: true }).firestore();
  const attackerTarget = doc(attacker, 'opportunity_matches', 'victim_match');
  await assertFails(getDoc(attackerTarget));
  await assertFails(updateDoc(attackerTarget, { uid: 'attacker', score: 99 }));
  await assertFails(setDoc(attackerTarget, { uid: 'attacker', score: 99 }));
  await assertSucceeds(updateDoc(doc(victim, 'opportunity_matches', 'victim_match'), { score: 2 }));
  await assertFails(updateDoc(doc(victim, 'opportunity_matches', 'victim_match'), { uid: 'attacker' }));
  await assertSucceeds(setDoc(doc(attacker, 'opportunity_matches', 'attacker_match'),
    { uid: 'attacker', score: 1 }));
  await assertSucceeds(updateDoc(doc(founder, 'opportunity_matches', 'victim_match'), { score: 3 }));
});

test('Warrior Profile path and embedded uid must agree for every writer', async () => {
  const owner = env.authenticatedContext('profile_owner').firestore();
  const attacker = env.authenticatedContext('profile_attacker').firestore();
  const founder = env.authenticatedContext('founder1', { founder: true }).firestore();
  const profile = doc(owner, 'warrior_profiles', 'profile_owner');
  await assertFails(setDoc(profile, { uid: 'profile_victim' }));
  await assertFails(setDoc(profile, { category: 'General' }));
  await assertSucceeds(setDoc(profile, { uid: 'profile_owner', category: 'General' }));
  await assertFails(updateDoc(profile, { uid: 'profile_victim' }));
  await assertFails(getDoc(doc(attacker, 'warrior_profiles', 'profile_owner')));
  await assertFails(setDoc(doc(attacker, 'warrior_profiles', 'profile_owner'), { uid: 'profile_attacker' }));
  await assertFails(updateDoc(doc(founder, 'warrior_profiles', 'profile_owner'), { uid: 'profile_victim' }));
  await assertSucceeds(updateDoc(profile, { category: 'OBC' }));
  await assertSucceeds(updateDoc(doc(founder, 'warrior_profiles', 'profile_owner'), { category: 'General' }));
});


test('Student-owned users profile cannot self-grant Admin permissions', async () => {
  const uid = 'no_privilege_escalation';
  const student = env.authenticatedContext(uid, { phone_number: '+919876543211' }).firestore();
  const userRef = doc(student, 'users', uid);
  await assertFails(setDoc(userRef, {
    mobile: '+919876543211', permissions: { 'mission.view': true },
  }));
  await assertSucceeds(setDoc(userRef, {
    mobile: '+919876543211', onboardingCompleted: false,
  }));
  for (const update of [
    { permissions: { 'mission.view': true } },
    { adminPermissions: { 'syllabus.review': true } },
    { permissionScopes: ['pyq.review'] },
    { adminLevel: 9 },
    { scopes: ['document.manage'] },
    { grants: ['mission.view'] },
  ]) {
    await assertFails(updateDoc(userRef, update));
  }
  await assertSucceeds(updateDoc(userRef, { displayName: 'Existing student' }));
  const founder = env.authenticatedContext('founder1', { founder: true }).firestore();
  await assertSucceeds(updateDoc(doc(founder, 'users', uid), {
    permissions: { 'mission.view': true },
  }));
});

test('admin_invitations collection fails closed for Students and is read-only for Founders', async () => {
  const inviteHash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'admin_invitations', inviteHash), {
      inviteHash,
      targetEmail: 'admin@test.com',
      role: 'admin',
      scopes: ['DOCUMENTS_VIEW'],
      redeemed: false,
    });
  });

  const unauth = env.unauthenticatedContext().firestore();
  const student = env.authenticatedContext('student_attacker', { phone_number: '+919876543212' }).firestore();
  const founder = env.authenticatedContext('founder_user', { founder: true }).firestore();

  // 1. Unauthenticated reading and writing denied
  await assertFails(getDoc(doc(unauth, 'admin_invitations', inviteHash)));
  await assertFails(setDoc(doc(unauth, 'admin_invitations', 'fake_hash'), { role: 'admin' }));

  // 2. Student reading and writing denied
  await assertFails(getDoc(doc(student, 'admin_invitations', inviteHash)));
  await assertFails(setDoc(doc(student, 'admin_invitations', 'fake_hash'), { role: 'admin' }));
  await assertFails(updateDoc(doc(student, 'admin_invitations', inviteHash), { redeemed: true }));

  // 3. Founder reading allowed, but direct client write denied (Admin SDK only)
  await assertSucceeds(getDoc(doc(founder, 'admin_invitations', inviteHash)));
  await assertFails(setDoc(doc(founder, 'admin_invitations', 'direct_hash'), { role: 'admin' }));
  await assertFails(updateDoc(doc(founder, 'admin_invitations', inviteHash), { redeemed: true }));
});
