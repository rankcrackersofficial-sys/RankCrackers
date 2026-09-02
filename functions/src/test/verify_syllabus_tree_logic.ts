import * as admin from 'firebase-admin';

async function run() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
  }
  const db = admin.firestore();
  const mId = 'jee_main_2026';

  console.log('🔱 VERIFYING SYLLABUS TREE LOGIC...');

  // 1. Fetch structured nodes
  const structuredSnap = await db.collection('mission_realms').doc(mId).collection('structured_nodes').get();
  const structuredData = structuredSnap.docs.map(d => ({ nodeId: d.id, ...d.data() }));

  // 2. Fetch atoms
  const atomsSnap = await db.collection('micro_nodes').where('examId', '==', mId).get();
  const atoms = atomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 🛡️ REPLICATE PROVIDER LOGIC
  const filteredStructured = structuredData.filter((d: any) =>
      d.paperId === 'PAPER_1' &&
      d.runId === 'run_jee_full_materialization');

  console.log(`   - FILTERED_STRUCTURED: ${filteredStructured.length}`);

  const activeSubjectIds = ['Physics', 'Chemistry', 'Mathematics'];
  const subjects = filteredStructured.filter((d: any) => d.nodeType === 'subject');

  console.log(`   - SUBJECTS_IN_FILTERED: ${subjects.length}`);

  for (const sId of activeSubjectIds) {
    const sDoc = subjects.find((d: any) => d.subjectId === sId) || {};
    const sTitle = sDoc.canonicalTitle || sId;

    const units = filteredStructured.filter((d: any) => d.nodeType === 'unit' && d.subjectId === sId);
    console.log(`   - Subject: ${sId} (${sTitle}), UNITS: ${units.length}`);

    if (sId === 'Physics') if (units.length !== 20) console.error('PHYSICS_UNIT_MISMATCH');
    if (sId === 'Chemistry') if (units.length !== 20) console.error('CHEMISTRY_UNIT_MISMATCH');
    if (sId === 'Mathematics') if (units.length !== 14) console.error('MATHEMATICS_UNIT_MISMATCH');

    let totalTopics = 0;
    let totalAtoms = 0;

    for (const u of units) {
      const topics = filteredStructured.filter((d: any) => d.nodeType === 'topic' && d.parentId === u.nodeId);
      totalTopics += topics.length;

      for (const t of topics) {
         const tAtoms = atoms.filter((a: any) => a.topicId === t.nodeId);
         totalAtoms += tAtoms.length;
      }
    }
    console.log(`     - TOTAL_TOPICS: ${totalTopics}, TOTAL_ATOMS: ${totalAtoms}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
