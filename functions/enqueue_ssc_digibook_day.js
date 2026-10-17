const crypto = require('crypto');
const cp = require('child_process');
const { OAuth2Client } = require('google-auth-library');
const { Firestore, Timestamp, FieldValue } = require('@google-cloud/firestore');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'ssc_cgl';
const DAY_ID = process.argv[2] || 'ssc_cgl_day_001';
const QUEUE_CONTRACT = 'academic_factory_v1';
const SCHEMA_VERSION = 1;
const RUN_ID = `ssc_cgl_digibook_day_queue_${DAY_ID}_v1`;
const STAGES = [
  ['digibookDraft', 'ready'],
  ['digibookValidation', 'waitingDependency'],
  ['digibookProReview', 'waitingDependency'],
  ['digibookAssembly', 'waitingDependency'],
  ['digibookMaterialization', 'waitingDependency'],
];

function sha(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function getDb() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });
  return new Firestore({ projectId: PROJECT_ID, authClient: auth });
}

function stageId(atomId, stage) {
  return `dbq_${MISSION_ID}_${DAY_ID}_${atomId}_${stage}`;
}

async function main() {
  const db = await getDb();
  const realm = db.collection('mission_realms').doc(MISSION_ID);
  const daySnap = await realm.collection('crucible_days').doc(DAY_ID).get();
  if (!daySnap.exists) throw new Error(`DAY_NOT_FOUND:${DAY_ID}`);
  const day = daySnap.data() || {};
  if (day.status !== 'published' || day.isStale === true || day.studentVisibilityAuthorized === false) {
    throw new Error(`DAY_NOT_ELIGIBLE:${DAY_ID}:${JSON.stringify({ status: day.status, isStale: day.isStale, studentVisibilityAuthorized: day.studentVisibilityAuthorized })}`);
  }
  const atomIds = Array.from(new Set(day.newAtomIds || day.studyAtomIds || day.coveredAtomIds || []));
  if (!atomIds.length) throw new Error(`DAY_HAS_NO_ATOMS:${DAY_ID}`);

  const nodesSnap = await db.collection('micro_nodes')
    .where('missionId', '==', MISSION_ID)
    .where('decompositionVersion', '==', day.taxonomyVersion)
    .get();
  const atomMap = new Map();
  for (const doc of nodesSnap.docs) {
    const node = doc.data() || {};
    for (const atom of node.syllabusHierarchy?.atomicTopics || []) {
      if (atom?.id) atomMap.set(atom.id, { nodeId: doc.id, node, atom });
    }
  }
  const missing = atomIds.filter((id) => !atomMap.has(id));
  if (missing.length) throw new Error(`DAY_ATOM_NOT_FOUND:${missing.join(',')}`);

  const batch = db.batch();
  const planned = [];
  for (const atomId of atomIds) {
    const match = atomMap.get(atomId);
    const sourceDocumentId = String(day.sourceDocumentId || match.node.sourceDocumentId || '');
    if (!sourceDocumentId) throw new Error(`MISSING_SOURCE_BINDING:${atomId}`);
    let previous = null;
    for (const [type, state] of STAGES) {
      const idempotencyKey = stageId(atomId, type);
      const dependencies = previous ? [previous] : [];
      const input = {
        missionId: MISSION_ID,
        dayId: DAY_ID,
        atomicTopicId: atomId,
        canonicalNodeId: match.nodeId,
        sourceDocumentId,
        taxonomyVersion: day.taxonomyVersion,
      };
      const job = {
        queueContract: QUEUE_CONTRACT,
        schemaVersion: SCHEMA_VERSION,
        runId: RUN_ID,
        jobId: idempotencyKey,
        missionId: MISSION_ID,
        canonicalTargetId: atomId,
        idempotencyKey,
        state,
        attempts: 0,
        maxAttempts: 3,
        leaseOwner: null,
        leaseExpiresAtUtc: null,
        nextRetryAtUtc: null,
        dependencyJobIds: dependencies,
        inputHash: sha(input),
        outputHash: null,
        startedAt: null,
        finishedAt: null,
        lastError: null,
        type,
        targetId: atomId,
        sourceDocumentIds: [sourceDocumentId],
        scope: 'ssc_cgl_day_1_atomic_digibook',
        dayId: DAY_ID,
        subject: match.atom.subject || match.node.syllabusHierarchy?.subject || null,
        officialHierarchy: {
          subject: match.atom.subject || match.node.syllabusHierarchy?.subject || null,
          unit: match.atom.unit || match.node.syllabusHierarchy?.unit || null,
          topic: match.atom.topic || match.node.syllabusHierarchy?.topic || null,
          atomicTitle: match.atom.title || null,
        },
        noSyntheticContent: true,
        publicationGate: 'VERIFIED_CONTENT_ONLY',
        createdBy: 'enqueue_ssc_digibook_day_v1',
      };
      batch.create(db.collection('ai_queue').doc(idempotencyKey), {
        ...job,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      planned.push({ idempotencyKey, type, state, atomicTopicId: atomId, dependencyJobIds: dependencies });
      previous = idempotencyKey;
    }
  }
  await batch.commit();

  const manifest = {
    missionId: MISSION_ID,
    dayId: DAY_ID,
    runId: RUN_ID,
    queueContract: QUEUE_CONTRACT,
    status: 'QUEUED_INCREMENTAL',
    atomicCount: atomIds.length,
    stageCount: planned.length,
    firstStage: 'digibookDraft',
    sourceDocumentId: day.sourceDocumentId,
    taxonomyVersion: day.taxonomyVersion,
    sourceBound: true,
    noSyntheticContent: true,
    nextDayUnlockedOnlyAfter: 'day_1_atomic_jobs_verified_and_published',
    plannedJobIds: planned.map((x) => x.idempotencyKey),
    updatedAt: Timestamp.now(),
  };
  await realm.collection('digibook_queue_runs').doc(RUN_ID).set(manifest, { merge: true });
  console.log(JSON.stringify({ ...manifest, planned: planned.slice(0, 10) }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
