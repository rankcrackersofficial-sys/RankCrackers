'use strict';
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-rankcrackers-55',
    firestore: { host: '127.0.0.1', port: 8188, rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
  const id = `realm_missing_rule_${Date.now()}`;
  const docPath = `mission_realms/${id}/official_documents/hash_${'a'.repeat(64)}`;
  const founder = env.authenticatedContext('founder-document-test', { founder: true }).firestore();
  const student = env.authenticatedContext('student-document-test', { student: true }).firestore();
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(founder.doc(docPath).set({ missionId: id, sourceSha256: 'a'.repeat(64) }));
  await assertFails(student.doc(docPath).set({ missionId: id }));
  await assertFails(anon.doc(docPath).get());
  console.log('DOCUMENT_RULES_TESTS=3/3 PASS; REALM_PARENT_REQUIRED=NO; FOUNDER_ONLY=YES');
  await env.cleanup();
})().catch((error) => { console.error(error); process.exitCode = 1; });
