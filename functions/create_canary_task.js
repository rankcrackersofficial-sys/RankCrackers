const admin = require("firebase-admin");

console.log("🔱 INITIALIZING PRODUCTION CANARY CREATOR...");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const canaryJob = {
  queueContract: 'academic_factory_v1',
  schemaVersion: 1,
  runId: 'RUN_CANARY_FF08',
  jobId: 'CANARY_FF08_TEST',
  missionId: 'neet_(ug)-2027',
  canonicalTargetId: 'CANARY_CELL_BIO_01',
  idempotencyKey: 'CANARY_FF08_TEST',
  state: 'ready',
  attempts: 0,
  maxAttempts: 3,
  leaseOwner: null,
  leaseExpiresAtUtc: null,
  nextRetryAtUtc: null,
  dependencyJobIds: [],
  inputHash: 'h_canary_01',
  outputHash: null,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  startedAt: null,
  finishedAt: null,
  lastError: null,
  type: 'digibookValidation',
  targetId: 'CANARY_CELL_BIO_01',
  sourceDocumentIds: ['DOC_CANARY_01'],
  testCanary: true
};

async function run() {
  console.log("Adding canary job to production ai_queue...");
  const docRef = db.collection('ai_queue').doc(canaryJob.idempotencyKey);
  await docRef.set(canaryJob);
  console.log(`Canary job ${canaryJob.idempotencyKey} written to Firestore successfully.`);
}

run().catch(console.error);
