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
