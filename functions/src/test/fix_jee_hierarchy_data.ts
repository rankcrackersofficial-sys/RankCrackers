import * as admin from 'firebase-admin';

/**
 * 🔱 FIX JEE HIERARCHY DATA
 * 1. Align examId in catalog.
 * 2. Delete mock nodes.
 * 3. Add explicit hierarchy fields to micro_nodes.
 */

async function run() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
  }
  const db = admin.firestore();

  console.log('🔱 1. ALIGNING CATALOG...');
  await db.collection('student_mission_catalog').doc('jee_main_2026').update({
    exam_id: 'jee_main_2026',
    examId: 'jee_main_2026'
  });

  console.log('🔱 2. DELETING MOCK NODES (jee_main_2027)...');
  const mockSnap = await db.collection('micro_nodes').where('examId', '==', 'jee_main_2027').get();
  const batch1 = db.batch();
  mockSnap.docs.forEach(d => batch1.delete(d.ref));
  await batch1.commit();
  console.log(`   - DELETED ${mockSnap.size} MOCK NODES`);

  console.log('🔱 3. ENRICHING MICRO_NODES HIERARCHY...');
  const atomsSnap = await db.collection('micro_nodes').where('examId', '==', 'jee_main_2026').get();
  console.log(`   - PROCESSING ${atomsSnap.size} ATOMS`);

  let count = 0;
  let batch = db.batch();
  for (const doc of atomsSnap.docs) {
    const data = doc.data();
    // Extract topicId from description if not present
    const topicId = data.topicId || data.description.replace('Atomized concept from topic ', '');

    batch.update(doc.ref, {
      topicId: topicId,
      // All 1125 current nodes are confirmed Paper 1
      paperId: 'PAPER_1',
      // Ensure unitId is synced with chapterId
      unitId: data.chapterId,
      // Tag with migration version
      hierarchyVersion: 'V1_NESTED'
    });

    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log('🔱 DATA FIX COMPLETE.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
