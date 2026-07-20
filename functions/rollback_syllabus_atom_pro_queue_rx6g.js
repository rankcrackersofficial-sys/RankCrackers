const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';
const PHRASE = 'AUTHORIZE_ROLLBACK_FUP_2C_RX6G_QUEUE_WRITE';
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const runId = process.argv[2] || '';
const phrase = process.argv[3] || '';
if (!runId || phrase !== PHRASE) { console.error('Rollback blocked: exact queueRunId and authorization phrase required.'); process.exit(1); }
(async () => { const snap = await db.collection('pro_verification_queue').where('queueRunId','==',runId).where('createdByPhase','==','FUP_2C_RX6G_QUEUE_WRITE').get(); const batch = db.batch(); snap.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); console.log(JSON.stringify({ rollbackRunId: runId, deleted: snap.size, target: 'pro_verification_queue' }, null, 2)); })().catch(e => { console.error(e); process.exit(1); });
