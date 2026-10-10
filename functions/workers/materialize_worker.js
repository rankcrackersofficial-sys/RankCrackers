const { classifyWorkerAuthority } = require("../services/canonical_source_authority");
const { questionFactoryEligibility } = require("../services/authority_intelligence/domain_c_taught_gate_r41");

/**
 * Server-Side Materializer
 * Pulls from private /question_bank and writes to student-safe /published_questions.
 * Enforces strict safe-field allowlist, central source authority guard, and publication gates.
 */
async function materializeQuestion(questionId, db, authorityContext) {
  const qDoc = await db.collection('question_bank').doc(questionId).get();
  if (!qDoc.exists) {
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  const qData = qDoc.data();
  const status = qData.status;

  // Read publication gate approval state
  const pubDoc = await db.collection('publication_registry').doc(questionId).get();
  const pubData = pubDoc.exists ? pubDoc.data() : null;
  const isStudentReady = pubData && pubData.studentReady === true;

  if (status !== 'published' || !isStudentReady) {
    // Delete projection if not eligible
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  // 🛡️ CENTRAL SOURCE GUARD ENFORCEMENT (STRICT FAIL-CLOSED)
  const authJob = authorityContext || {
    missionId: qData.missionId,
    sourceSlotId: qData.sourceSlotId,
    sourceVersionId: qData.sourceVersionId,
    sourceSha256: qData.sourceSha256,
    activationEpoch: qData.activationEpoch !== undefined ? qData.activationEpoch : qData.activationGeneration
  };

  // Check required authority fields: missionId, sourceSlotId, sourceVersionId, sourceSha256, activationEpoch
  const hasMissionId = Boolean(authJob && authJob.missionId && String(authJob.missionId).trim());
  const hasSlotId = Boolean(authJob && authJob.sourceSlotId && String(authJob.sourceSlotId).trim());
  const hasVersionId = Boolean(authJob && authJob.sourceVersionId && String(authJob.sourceVersionId).trim());
  const hasSha256 = Boolean(authJob && authJob.sourceSha256 && /^[a-f0-9]{64}$/i.test(String(authJob.sourceSha256).trim()));
  const hasActivationEpoch = Boolean(authJob && authJob.activationEpoch !== undefined && authJob.activationEpoch !== null && !isNaN(Number(authJob.activationEpoch)));

  if (!hasMissionId || !hasSlotId || !hasVersionId || !hasSha256 || !hasActivationEpoch) {
    console.warn(`MATERIALIZER_GUARD_BLOCKED: Question ${questionId} write blocked. Status = AUTHORITY_MISSING (missionId=${hasMissionId}, slotId=${hasSlotId}, versionId=${hasVersionId}, sha256=${hasSha256}, epoch=${hasActivationEpoch})`);
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  const slotSnap = await db.collection('mission_realms')
    .doc(authJob.missionId)
    .collection('source_slots')
    .doc(authJob.sourceSlotId)
    .get();

  const classification = classifyWorkerAuthority(slotSnap.data(), authJob);
  if (classification !== 'CURRENT') {
    console.warn(`MATERIALIZER_GUARD_BLOCKED: Question ${questionId} write blocked. Status = ${classification}`);
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  // Domain-C taught-content gate: publication/source authority alone is not
  // proof that the material was actually taught. Missing or legacy authority
  // is intentionally fail-closed; no migration or grandfathering occurs.
  const taughtRequest = {
    realmId: qData.realmId || authJob.missionId,
    missionId: qData.missionId || authJob.missionId,
    subject: qData.subjectId,
    atomId: qData.atomId || (Array.isArray(qData.atomicTopicIds) && qData.atomicTopicIds.length === 1 ? qData.atomicTopicIds[0] : undefined),
    materialHash: qData.materialHash || authJob.sourceSha256,
    executionId: qData.executionId,
    evidenceHash: qData.evidenceHash
  };
  const taughtAuthority = qData.taughtContentAuthority || null;
  const taughtEligibility = questionFactoryEligibility(taughtRequest, taughtAuthority);
  if (!taughtEligibility.ok) {
    console.warn(`MATERIALIZER_GUARD_BLOCKED: Question ${questionId} status=TAUGHT_AUTHORITY_${taughtEligibility.code}`);
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  // Construct safe projection (strict positive allowlist, no undefined values)
  const safeProjection = {
    id: qData.id,
    questionLineageId: qData.questionLineageId || qData.id,
    version: qData.version || 1,
    questionType: qData.questionType || null,
    question: qData.question || '',
    options: qData.questionType === 'mcq_single' ? (qData.options || []) : [],
    difficulty: qData.difficulty || null,
    examId: qData.examId || null,
    subjectId: qData.subjectId || null,
    nodeId: qData.nodeId || null,
    atomicTopicIds: qData.atomicTopicIds || [],
    status: 'published',
    isPYQ: qData.isPYQ || false,
    verifiedBy: qData.verifiedBy || null,
    verifiedAt: qData.verifiedAt || null
  };

  await db.collection('published_questions').doc(questionId).set(safeProjection);
  return safeProjection;
}

module.exports = { materializeQuestion };
