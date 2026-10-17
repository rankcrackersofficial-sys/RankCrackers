const cp = require('child_process');
const { OAuth2Client } = require('google-auth-library');
const { Firestore } = require('@google-cloud/firestore');

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const run = await db.collection('mission_realms').doc('ssc_cgl')
    .collection('digibook_queue_runs').doc('ssc_cgl_digibook_day_queue_ssc_cgl_day_001_v1').get();
  const queue = await db.collection('ai_queue').where('runId', '==', 'ssc_cgl_digibook_day_queue_ssc_cgl_day_001_v1').get();
  const jobs = queue.docs.map((d) => ({ id: d.id, ...d.data() }));
  const counts = {};
  for (const job of jobs) counts[job.state] = (counts[job.state] || 0) + 1;
  const invalid = jobs.filter((job) => job.scope !== 'ssc_cgl_day_1_atomic_digibook' || job.noSyntheticContent !== true || job.publicationGate !== 'VERIFIED_CONTENT_ONLY' || !Array.isArray(job.sourceDocumentIds) || !job.sourceDocumentIds.length);
  const result = {
    manifestPresent: run.exists,
    jobCount: jobs.length,
    expectedJobCount: 60,
    stateCounts: counts,
    invalidJobCount: invalid.length,
    invalidSample: invalid.slice(0, 5).map((x) => x.id),
    verifiedIncrementalContract: run.exists && jobs.length === 60 && invalid.length === 0,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.verifiedIncrementalContract) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
