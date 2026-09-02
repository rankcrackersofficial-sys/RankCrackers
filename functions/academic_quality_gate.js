const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const atomsRef = db.collection('mission_realms').doc(missionId).collection('syllabus_atoms');

  const tests = [
    { id: 'ATOM_NEET_CHE_U02_at006', field: 'subtopic', expected: ['\u03a8', '\u03a8\u00b2'], desc: 'Atomic structure (Psi)' },
    { id: 'ATOM_NEET_CHE_U04_at004', field: 'subtopic', expected: ['\u0394S', '\u0394G', '\u0394G\u00b0'], desc: 'Thermodynamics (Delta)' },
    { id: 'ATOM_NEET_CHE_U20_at004', field: 'subtopic', expected: ['Pb\u00b2\u207a', 'CO\u2083\u00b2\u207b', 'SO\u2084\u00b2\u207b'], desc: 'Ionic charges' },
    { id: 'ATOM_NEET_BIO_U04_at001', field: 'subtopic', expected: ['C3', 'C4'], desc: 'Plant pathways' } // Wait, script used C3/C4?
  ];

  console.log('--- Academic Quality Gate (Sampling) ---');
  let failures = 0;

  for (const test of tests) {
    const doc = await atomsRef.doc(test.id).get();
    if (!doc.exists) {
        console.log(`❌ FAIL: ${test.id} NOT FOUND`);
        failures++;
        continue;
    }
    const val = doc.data()[test.field];
    const missing = test.expected.filter(e => !val.includes(e));
    if (missing.length > 0) {
        console.log(`❌ FAIL: ${test.desc} (${test.id}) - Missing: ${missing.join(', ')}`);
        console.log(`   Actual: "${val}"`);
        failures++;
    } else {
        console.log(`✅ PASS: ${test.desc}`);
    }
  }

  if (failures === 0) {
    console.log('\nVERDICT: ACADEMIC_GATE = PASS');
  } else {
    console.log(`\nVERDICT: ACADEMIC_GATE = FAIL (${failures} failures)`);
  }
}

main().catch(console.error);
