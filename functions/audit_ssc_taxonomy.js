const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');
async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const realm = db.collection('mission_realms').doc('ssc_cgl');
  const task = (await db.collection('ai_queue').doc('taxonomy_verify_ssc_cgl_ssc_cgl_2026_v1_retry').get()).data() || {};
  const run = (await realm.collection('taxonomy_verification_runs').doc('ssc_cgl_taxonomy_verifier_v1').get()).data() || {};
  const nodes = await db.collection('micro_nodes').where('missionId', '==', 'ssc_cgl').where('generatedBy', '==', 'mission_academic_materializer_v4_canonical_syllabus_atomic_expansion').get();
  const digi = await realm.collection('digibook_units').get();
  let valid = 0, micro = 0, atoms = 0, bad = [];
  for (const d of nodes.docs) {
    const n = d.data() || {}; const h = n.syllabusHierarchy || {};
    const ms = Array.isArray(h.microTopics) ? h.microTopics : []; const as = Array.isArray(h.atomicTopics) ? h.atomicTopics : [];
    if (h.verificationState === 'VERIFIED' && h.publicationState === 'STUDENT_READY' && h.notificationContamination === false && ms.length > 0 && as.length > 0 && Array.isArray(n.atomicTopicIds) && n.atomicTopicIds.length === as.length && ms.every(x => x.sourceRole === 'expert_taxonomy') && as.every(x => x.sourceRole === 'expert_taxonomy')) { valid++; micro += ms.length; atoms += as.length; } else bad.push({id:d.id, micro:ms.length, atomic:as.length, state:h.verificationState, publication:h.publicationState});
  }
  const publishedDigi = digi.docs.filter(d => { const x=d.data()||{}; return x.syllabusHierarchy?.verifierVersion === 'ssc_cgl_taxonomy_verifier_v1' && Array.isArray(x.syllabusHierarchy?.atomicTopics) && x.syllabusHierarchy.atomicTopics.length > 0 && x.verificationStatus === 'VERIFIED' && x.studentVisibilityAuthorized === true; }).length;
  console.log(JSON.stringify({ taskStatus:task.status, taskError:task.error||null, run, canonicalNodes:nodes.size, validNodes:valid, invalidNodes:bad.length, invalidSample:bad.slice(0,3), microTopics:micro, atomicTopics:atoms, publishedDigiBookUnits:publishedDigi }, null, 2));
  if (task.status !== 'completed' || valid !== nodes.size || publishedDigi !== nodes.size) process.exitCode = 2;
}
main().catch(e=>{console.error(e);process.exit(1)});
