const cp = require('child_process');
const { OAuth2Client } = require('google-auth-library');
const { Firestore, FieldValue } = require('@google-cloud/firestore');

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const snap = await db.collection('ai_queue').where('runId', '==', 'ssc_cgl_digibook_day_queue_ssc_cgl_day_001_v1').get();
  const targets = snap.docs.filter((doc) => {
    const x = doc.data() || {};
    return x.type === 'digibookDraft' && x.state === 'reviewing' && !x.workerMetadata;
  });
  await Promise.all(targets.map((doc) => doc.ref.update({
    state: 'ready', leaseOwner: null, leaseExpiresAtUtc: null, outputHash: null,
    workerMetadata: null, lastError: null, requeuedAfterWorkerDeployment: true,
    updatedAt: FieldValue.serverTimestamp(),
  })));
  console.log(JSON.stringify({ requeued: targets.length, ids: targets.map((x) => x.id) }, null, 2));
  if (targets.length !== 12) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
