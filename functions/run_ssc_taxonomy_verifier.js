const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const taskId = 'taxonomy_verify_ssc_cgl_ssc_cgl_2026_v1_retry';
  const ref = db.collection('ai_queue').doc(taskId);
  await ref.set({
    id: taskId,
    task_type: 'SYLLABUS_TAXONOMY_VERIFY',
    mission_id: 'ssc_cgl',
    document_id: 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f',
    sourceDocumentId: 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f',
    sourceSha256: '3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f',
    status: 'queued',
    createdAt: new Date(),
    requestedBy: 'codex_independent_verifier',
    noNotificationFallback: true,
  }, { merge: false });
  console.log(JSON.stringify({ taskId, status: 'queued' }));
}
main().catch((e) => { console.error(e); process.exit(1); });
