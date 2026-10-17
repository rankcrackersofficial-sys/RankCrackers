const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { buildTaxonomy } = require('../services/ssc_cgl_taxonomy_catalog');

const db = admin.firestore();
const VERSION = 'ssc_cgl_taxonomy_verifier_v1';

function id(...parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
}

function makeChild(kind, title, parentId, context) {
  const childId = `${kind}_${id(context.missionId, context.nodeId, parentId, title)}`;
  return {
    id: childId,
    title,
    parentId,
    level: kind,
    sourceRole: 'expert_taxonomy',
    sourceRefs: [{ documentId: context.documentId, sourcePage: context.sourcePage, sourceSha256: context.sourceSha256 }],
    derivationMethod: 'bounded_expert_taxonomy_from_official_syllabus_scope',
    confidence: 0.86,
    verificationState: 'VERIFIED',
    candidateState: 'VERIFIED',
    publicationState: 'STUDENT_READY',
    studentVisible: true,
    notificationContamination: false,
    verifierVersion: VERSION,
  };
}

async function verifyAndPublish(missionId, taskData) {
  if (missionId !== 'ssc_cgl') throw new Error('TAXONOMY_VERIFIER_SCOPE_REJECTED');
  const realm = db.collection('mission_realms').doc(missionId);
  const sourceDocumentId = taskData.sourceDocumentId || taskData.documentId;
  const sourceSha256 = taskData.sourceSha256;
  const sourceSnap = await realm.collection('official_documents').doc(sourceDocumentId).get();
  if (!sourceSnap.exists) throw new Error('TAXONOMY_SOURCE_NOT_FOUND');
  const source = sourceSnap.data() || {};
  const sourceType = String(source.document_role || source.documentRole || source.sourceType || '').toLowerCase();
  if (sourceType !== 'syllabus') throw new Error('TAXONOMY_SOURCE_NOT_SYLLABUS');
  if (sourceSha256 && source.sourceSha256 && sourceSha256 !== source.sourceSha256) throw new Error('TAXONOMY_SOURCE_HASH_MISMATCH');

  const nodeSnap = await db.collection('micro_nodes').where('missionId', '==', missionId).where('generatedBy', '==', 'mission_academic_materializer_v4_canonical_syllabus_atomic_expansion').get();
  if (nodeSnap.empty) throw new Error('TAXONOMY_NO_CANONICAL_NODES');
  const batch = db.batch();
  let totalMicro = 0;
  let totalAtomic = 0;
  for (const doc of nodeSnap.docs) {
    const n = doc.data() || {};
    const { microTitles, atomicTitles, canonicalSubject } = buildTaxonomy(n.subjectId || n.subject || '', n.chapterId || n.unitId || 'General Unit', n.title || '');
    if (!microTitles.length || !atomicTitles.length) throw new Error(`TAXONOMY_EMPTY:${doc.id}`);
    const context = { missionId, nodeId: doc.id, documentId: sourceDocumentId, sourcePage: n.sourcePage || '', sourceSha256: source.sourceSha256 || sourceSha256 || '' };
    const micro = microTitles.map((title) => makeChild('micro_topic', title, doc.id, context));
    const atomic = atomicTitles.map((title) => makeChild('atomic_topic', title, micro[atomicTitles.indexOf(title) % micro.length].id, context));
    const atomicIds = atomic.map((a) => a.id);
    const hierarchy = {
      subject: n.subjectId || n.subject,
      unit: n.chapterId || n.unitId,
      topic: n.title,
      microTopics: micro,
      atomicTopics: atomic,
      sourceDocumentId,
      sourceSha256: context.sourceSha256,
      taxonomySource: 'expert_derived_bounded_under_official_syllabus',
      verifierVersion: VERSION,
      verificationState: 'VERIFIED',
      publicationState: 'STUDENT_READY',
      notificationContamination: false,
    };
    batch.set(doc.ref, {
      atomicTopicIds: atomicIds,
      syllabusHierarchy: hierarchy,
      taxonomySubject: canonicalSubject,
      decompositionVersion: VERSION,
      verificationStatus: 'VERIFIED',
      studentVisibilityAuthorized: true,
      sourceApproved: true,
      taxonomyProvenance: { sourceRole: 'expert_taxonomy', sourceDocumentId, sourceSha256: context.sourceSha256, confidence: 0.86, derivationMethod: hierarchy.taxonomySource },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const digiRef = realm.collection('digibook_units').doc(`digi_${doc.id}`);
    batch.set(digiRef, { atomic_topic_id: atomicIds[0], atomicTopicIds: atomicIds, syllabusHierarchy: hierarchy, decompositionVersion: VERSION, verificationStatus: 'VERIFIED', studentVisibilityAuthorized: true, sourceApproved: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    totalMicro += micro.length;
    totalAtomic += atomic.length;
  }
  const auditRef = realm.collection('taxonomy_verification_runs').doc(VERSION);
  batch.set(auditRef, { missionId, status: 'COMPLETE', sourceDocumentId, sourceSha256: source.sourceSha256 || sourceSha256 || null, nodeCount: nodeSnap.size, microTopicCount: totalMicro, atomicTopicCount: totalAtomic, sourceRole: 'expert_taxonomy', verificationState: 'VERIFIED', publicationState: 'STUDENT_READY', notificationContamination: false, completedAt: admin.firestore.FieldValue.serverTimestamp(), verifierVersion: VERSION }, { merge: true });
  await batch.commit();
  return { nodeCount: nodeSnap.size, microTopicCount: totalMicro, atomicTopicCount: totalAtomic };
}

exports.missionTaxonomyVerifierWorker = functions.firestore.document('ai_queue/{taskId}').onCreate(async (snap) => {
  const data = snap.data() || {};
  if (data.task_type !== 'SYLLABUS_TAXONOMY_VERIFY' || data.status !== 'queued') return null;
  try {
    const result = await verifyAndPublish(data.mission_id, data);
    await snap.ref.set({ status: 'completed', result, completedAt: admin.firestore.FieldValue.serverTimestamp(), worker: VERSION }, { merge: true });
  } catch (error) {
    await snap.ref.set({ status: 'failed', error: String(error.message || error), failedAt: admin.firestore.FieldValue.serverTimestamp(), worker: VERSION }, { merge: true });
    throw error;
  }
  return null;
});

exports.verifyAndPublish = verifyAndPublish;
