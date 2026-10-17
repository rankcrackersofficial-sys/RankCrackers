const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const realm = db.collection('mission_realms').doc('ssc_cgl');
  const nodes = await db.collection('micro_nodes')
    .where('missionId', '==', 'ssc_cgl')
    .where('decompositionVersion', '==', 'ssc_cgl_taxonomy_verifier_v1')
    .get();
  const atoms = [];
  for (const doc of nodes.docs) {
    const n = doc.data() || {};
    const h = n.syllabusHierarchy || {};
    if (h.verificationState !== 'VERIFIED' || h.publicationState !== 'STUDENT_READY' || h.notificationContamination !== false) continue;
    for (const atom of (h.atomicTopics || [])) atoms.push({ id: atom.id, title: atom.title, subject: h.subject, unit: h.unit, topic: h.topic, sourcePage: n.sourcePage || '' });
  }
  if (atoms.length === 0) throw new Error('NO_VERIFIED_ATOMS_FOR_CRUCIBLE');
  const batch = db.batch();
  const days = 98;
  for (let day = 1; day <= days; day++) {
    const selected = [];
    const start = Math.floor((day - 1) * atoms.length / days);
    const end = Math.max(start + 1, Math.floor(day * atoms.length / days));
    for (let i = start; i < end; i++) selected.push(atoms[i % atoms.length]);
    const subjects = [...new Set(selected.map((a) => a.subject))];
    batch.set(realm.collection('crucible_days').doc(`ssc_cgl_day_${String(day).padStart(3, '0')}`), {
      missionId: 'ssc_cgl', cycleKey: 'ssc_cgl_2026', day, status: 'published',
      planType: 'source_bound_study_schedule', assessmentReady: false, questionCount: 0,
      title: `SSC CGL Study Day ${day}`, subjects, studyAtomIds: selected.map((a) => a.id),
      coveredAtomIds: selected.map((a) => a.id), atomCount: selected.length,
      sourceDocumentId: 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f',
      sourceSha256: '3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f',
      taxonomyVersion: 'ssc_cgl_taxonomy_verifier_v1',
      studentMessage: 'Source-bound study plan. Assessment questions unlock only after independent question verification.',
      generatedBy: 'ssc_cgl_crucible_scheduler_v1', generatedAt: new Date(),
    }, { merge: true });
  }
  batch.set(realm.collection('crucible_schedule').doc('ssc_cgl_2026'), {
    missionId: 'ssc_cgl', cycleKey: 'ssc_cgl_2026', status: 'published', planType: 'source_bound_study_schedule',
    dayCount: days, atomCount: atoms.length, sourceDocumentId: 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f',
    taxonomyVersion: 'ssc_cgl_taxonomy_verifier_v1', assessmentReady: false, questionCount: 0,
    generatedBy: 'ssc_cgl_crucible_scheduler_v1', updatedAt: new Date(),
  }, { merge: true });
  await batch.commit();
  console.log(JSON.stringify({ missionId: 'ssc_cgl', days, atoms: atoms.length, status: 'published', assessmentReady: false }));
}
main().catch((e) => { console.error(e); process.exit(1); });
