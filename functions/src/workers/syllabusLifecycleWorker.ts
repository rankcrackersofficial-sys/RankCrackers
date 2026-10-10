import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

const { registerCandidateSourceVersion, isJobCurrent } = require('../../services/canonical_source_authority');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export type SyllabusLifecycleState =
  | 'SOURCE_REGISTERED'
  | 'SOURCE_AUTHORIZED'
  | 'PAGE_COUNT_PLANNED'
  | 'PAGE_COUNT_COMPLETE'
  | 'PAGE_EXTRACTION_PLANNED'
  | 'PAGE_EXTRACTION_IN_PROGRESS'
  | 'PAGE_EXTRACTION_COMPLETE'
  | 'PAGE_AUTHORITY_COMPLETE'
  | 'ACADEMIC_CORPUS_VERIFICATION_PENDING'
  | 'ACADEMIC_CORPUS_VERIFIED'
  | 'SCOPE_AUTHORITY_PENDING'
  | 'B3_PLANNED'
  | 'B3_IN_PROGRESS'
  | 'B3_COMPLETE'
  | 'B4_PLANNED'
  | 'B4_IN_PROGRESS'
  | 'B4_COMPLETE'
  | 'GOVERNANCE_REVIEW'
  | 'PUBLICATION_READY'
  | 'HOLD_PENDING_FOUNDER'
  | 'FAILED_TERMINAL';

interface LifecycleEvent {
  missionId: string;
  documentId: string;
  sourceSha256: string;
  fromState: SyllabusLifecycleState | 'INITIAL';
  toState: SyllabusLifecycleState;
  taskId?: string;
  worker: string;
  runId: string;
  revision: string;
  timestamp: admin.firestore.FieldValue;
  reason: string;
  triggerEvent: string;
}

const REVISION = 'RC-SYLLABUS-ORCH-V1.0';

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.keys(record).sort().reduce<Record<string, unknown>>((result, key) => {
      if (record[key] !== undefined) result[key] = stableValue(record[key]);
      return result;
    }, {});
  }
  return value;
}

function deterministicHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function sameStringSet(left: unknown, right: unknown): boolean {
  return Array.isArray(left)
    && Array.isArray(right)
    && new Set(left).size === left.length
    && new Set(right).size === right.length
    && [...left].sort().join('|') === [...right].sort().join('|');
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function rejectLifecycle(reason: string): never {
  throw new Error(`B3_LIFECYCLE_AUTHORITY_REJECTED:${reason}`);
}

/**
 * Completes only an AAF-owned B3 job whose sealed revision and current
 * authority pointer still agree at commit time. This deliberately records
 * lifecycle state only; materialization and projection remain upstream.
 */
export async function completeGovernedB3Lifecycle(db: any, taskId: string): Promise<'COMPLETED' | 'IDEMPOTENT'> {
  const queueRef = db.collection('ai_queue').doc(taskId);
  return db.runTransaction(async (transaction: any) => {
    const queueSnap = await transaction.get(queueRef);
    if (!queueSnap.exists) rejectLifecycle('JOB_NOT_FOUND');
    const job = queueSnap.data() || {};
    if (job.queueContract !== 'academic_factory_v1') rejectLifecycle('WRONG_QUEUE_CONTRACT');
    if (job.type !== 'SYLLABUS_B3') rejectLifecycle('WRONG_JOB_TYPE');
    if (job.state !== 'reviewing') rejectLifecycle('WRONG_JOB_STATE');

    const input = job.b3ExecutorInput;
    if (!input || !input.revisionIdentity || !input.materializationInput) {
      rejectLifecycle('MISSING_EXECUTOR_INPUT');
    }
    const identity = input.revisionIdentity;
    const proof = job.b3CompletionProof;
    if (!proof) rejectLifecycle('MISSING_COMPLETION_PROOF');
    if (proof.proofType !== 'B3_EXECUTOR_COMPLETION_PROOF') rejectLifecycle('MALFORMED_COMPLETION_PROOF');
    if (job.missionId !== proof.missionId || identity.missionId !== proof.missionId) {
      rejectLifecycle('MISSION_BINDING_MISMATCH');
    }
    if (proof.revisionId !== identity.revisionId) rejectLifecycle('REVISION_BINDING_MISMATCH');
    if (proof.authoritativeSourceChainId !== identity.authoritativeSourceChainId) {
      rejectLifecycle('SOURCE_CHAIN_BINDING_MISMATCH');
    }
    if (proof.contractVersion !== identity.contractVersion
        || proof.contractVersion !== input.materializationInput.contractVersion) {
      rejectLifecycle('CONTRACT_VERSION_MISMATCH');
    }
    const sourceDocumentIds = identity.orderedSources.map((source: any) => source.documentId);
    if (!sameValue(job.sourceDocumentIds, sourceDocumentIds)) {
      rejectLifecycle('SOURCE_DOCUMENT_BINDING_MISMATCH');
    }
    if (!sameValue(proof.orderedSources, identity.orderedSources)) {
      rejectLifecycle('ORDERED_SOURCE_BINDING_MISMATCH');
    }
    if (!sameStringSet(proof.verifiedExtractionIds, identity.verifiedExtractionIds)) {
      rejectLifecycle('VERIFIED_EXTRACTION_BINDING_MISMATCH');
    }
    if (!sameValue(proof.declaredCompletenessScope, input.materializationInput.declaredCompletenessScope)) {
      rejectLifecycle('DECLARED_SCOPE_BINDING_MISMATCH');
    }
    if (job.b3CompletionProofHash !== deterministicHash(proof)) {
      rejectLifecycle('COMPLETION_PROOF_HASH_MISMATCH');
    }

    const revisionRef = db.collection('mission_realms').doc(identity.missionId)
      .collection('b3_materialization_revisions').doc(identity.revisionId);
    const pointerRef = db.collection('mission_realms').doc(identity.missionId)
      .collection('b3_materialization_authority').doc('current');
    const officialDocumentId = identity.orderedSources[0]?.documentId;
    if (!officialDocumentId) rejectLifecycle('MISSING_SOURCE_DOCUMENT');
    const officialRef = db.collection('mission_realms').doc(identity.missionId)
      .collection('official_documents').doc(officialDocumentId);

    const [revisionSnap, pointerSnap, officialSnap] = await Promise.all([
      transaction.get(revisionRef),
      transaction.get(pointerRef),
      transaction.get(officialRef),
    ]);
    if (!revisionSnap.exists) rejectLifecycle('REVISION_NOT_FOUND');
    if (!pointerSnap.exists) rejectLifecycle('CURRENT_POINTER_NOT_FOUND');
    if (!officialSnap.exists) rejectLifecycle('OFFICIAL_DOCUMENT_NOT_FOUND');
    const revision = revisionSnap.data() || {};
    const pointer = pointerSnap.data() || {};
    const official = officialSnap.data() || {};
    if (revision.state !== 'SEALED_AUTHORITATIVE') rejectLifecycle('REVISION_NOT_SEALED');
    if (revision.missionId !== identity.missionId || revision.revisionId !== identity.revisionId) {
      rejectLifecycle('REVISION_IDENTITY_MISMATCH');
    }
    if (!sameValue(identity, revision.revisionIdentity)
        || !sameValue(proof.orderedSources, revision.revisionIdentity?.orderedSources)) {
      rejectLifecycle('REVISION_SOURCE_AUTHORITY_MISMATCH');
    }
    if (pointer.revisionId !== identity.revisionId
        || pointer.revisionState !== 'SEALED_AUTHORITATIVE'
        || pointer.contentIntegrityHash !== revision.contentIntegrityHash
        || pointer.idempotencyIdentity !== revision.idempotencyIdentity) {
      rejectLifecycle('CURRENT_POINTER_MISMATCH');
    }
    if (proof.persistenceContentIntegrityHash !== revision.contentIntegrityHash
        || proof.persistenceIdempotencyIdentity !== revision.idempotencyIdentity) {
      rejectLifecycle('PERSISTENCE_PROOF_MISMATCH');
    }
    if (!revision.declaredCompletenessScope
        || !sameValue(proof.declaredCompletenessScope, revision.declaredCompletenessScope)) {
      rejectLifecycle('DECLARED_SCOPE_PERSISTENCE_MISMATCH');
    }
    if (!revision.completionEligibility?.eligible
        || (revision.completionEligibility.unresolvedRequiredEvidenceIds || []).length !== 0) {
      rejectLifecycle('REVISION_NOT_COMPLETION_ELIGIBLE');
    }
    if (!sameValue(proof.materializerCompletionEligibility, revision.completionEligibility)) {
      rejectLifecycle('COMPLETION_ELIGIBILITY_MISMATCH');
    }
    if (!sameValue(proof.unresolvedEvidenceIds, (revision.unresolvedEvidenceManifest || []).map((entry: any) => entry.id))) {
      rejectLifecycle('UNRESOLVED_EVIDENCE_BINDING_MISMATCH');
    }
    if (!sameValue(proof.canonicalNodeIds, (revision.canonicalNodeManifest || []).map((entry: any) => entry.id))) {
      rejectLifecycle('CANONICAL_NODE_BINDING_MISMATCH');
    }

    const canonicalNodes: any[] = [];
    for (const entry of revision.canonicalNodeManifest || []) {
      const nodeRef = revisionRef.collection('canonical_nodes').doc(entry.id);
      const nodeSnap = await transaction.get(nodeRef);
      if (!nodeSnap.exists || deterministicHash(nodeSnap.data()) !== entry.integrityHash) {
        rejectLifecycle(`CANONICAL_NODE_MANIFEST_MISMATCH:${entry.id}`);
      }
      canonicalNodes.push(nodeSnap.data());
    }
    const unresolvedEvidence: any[] = [];
    for (const entry of revision.unresolvedEvidenceManifest || []) {
      const evidenceRef = revisionRef.collection('unresolved_evidence').doc(entry.id);
      const evidenceSnap = await transaction.get(evidenceRef);
      if (!evidenceSnap.exists || deterministicHash(evidenceSnap.data()) !== entry.integrityHash) {
        rejectLifecycle(`UNRESOLVED_EVIDENCE_MANIFEST_MISMATCH:${entry.id}`);
      }
      unresolvedEvidence.push(evidenceSnap.data());
    }
    const manifest = {
      canonicalNodes: canonicalNodes.map(node => ({ nodeId: node.nodeId, integrityHash: deterministicHash(node) })),
      unresolvedEvidence: unresolvedEvidence.map(item => ({
        evidenceId: item.evidence.evidenceId,
        integrityHash: deterministicHash(item),
      })),
      completionEligibility: revision.completionEligibility,
    };
    if (proof.materializationManifestHash !== deterministicHash(manifest)) {
      rejectLifecycle('MATERIALIZATION_MANIFEST_MISMATCH');
    }
    const lineage = {
      canonicalOccurrences: canonicalNodes.map(node => ({ nodeId: node.nodeId, occurrences: node.supportingOccurrences })),
      unresolvedEvidence: unresolvedEvidence.map(item => ({ evidenceId: item.evidence.evidenceId, lineage: item.evidence.lineage })),
    };
    if (proof.lineageIntegrityHash !== deterministicHash(lineage)) {
      rejectLifecycle('LINEAGE_INTEGRITY_MISMATCH');
    }

    if (official.lifecycle_state === 'B3_COMPLETE') {
      const authority = official.b3CompletionAuthority;
      if (authority?.revisionId === identity.revisionId
          && authority?.contentIntegrityHash === revision.contentIntegrityHash) {
        return 'IDEMPOTENT';
      }
      rejectLifecycle('CONFLICTING_EXISTING_COMPLETION');
    }
    if (official.lifecycle_state !== 'B3_IN_PROGRESS') rejectLifecycle('OFFICIAL_DOCUMENT_STATE_MISMATCH');
    transaction.update(officialRef, {
      lifecycle_state: 'B3_COMPLETE',
      b3CompletionAuthority: {
        revisionId: identity.revisionId,
        contentIntegrityHash: revision.contentIntegrityHash,
        idempotencyIdentity: revision.idempotencyIdentity,
        proofHash: job.b3CompletionProofHash,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return 'COMPLETED';
  });
}

/**
 * 🔱 SYLLABUS LIFECYCLE WORKER
 * Orchestrates the transition between syllabus automation stages.
 */
export const syllabusLifecycleWorker = functions.firestore
  .document('ai_queue/{taskId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    if (!newData || !oldData) return;

    // React only to transitions to 'completed'
    if (newData.status !== 'completed' || oldData.status === 'completed') return;

    const taskId = context.params.taskId;
    const { mission_id: missionId, document_id: docId, task_type: taskType, type } = newData;
    const finalType = taskType || type;

    console.log(`🔱 ORCHESTRATOR: Task ${taskId} (${finalType}) completed for mission ${missionId}`);

    if (!missionId || !docId) return;

    if (newData.requiresCanonicalSource === true) {
      const slot = await db.collection('mission_realms').doc(missionId).collection('source_slots').doc(newData.sourceSlotId).get();
      if (!isJobCurrent(slot.data(), newData)) {
        await change.after.ref.set({ status: 'superseded', stoppedReason: 'STALE_CANONICAL_SOURCE', stoppedAt: FieldValue.serverTimestamp() }, { merge: true });
        return;
      }
    }

    await db.runTransaction(async (transaction) => {
        const docRef = db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId);
        const scopeRef = db.collection('mission_realms').doc(missionId).collection('variables').doc('scope_authority');

        const [docSnap, scopeSnap] = await Promise.all([
            transaction.get(docRef),
            transaction.get(scopeRef)
        ]);

        if (!docSnap.exists) {
            console.log(`🔱 ORCHESTRATOR: Target document ${docId} not found in mission_realms. Skipping.`);
            return;
        }

        const docData = docSnap.data() || {};
        const currentState = docData.lifecycle_state || 'SOURCE_REGISTERED';
        const sourceSha = docData.sourceSha256 || docData.fileHash || 'unknown';
    const sourceBinding = {
      sourceSlotId: docData.sourceSlotId || null,
      sourceSlotKey: docData.sourceSlotKey || null,
      sourceVersionId: docData.sourceVersionId || null,
      sourceSha256: sourceSha,
      activationEpoch: Number(docData.activationEpoch || 0),
      requiresCanonicalSource: false,
    };

        let nextState: SyllabusLifecycleState | null = null;
        let reason = '';

        if (finalType === 'page_count_detection') {
            nextState = 'PAGE_COUNT_COMPLETE';
            reason = 'Page count detected successfully.';
        } else if (finalType === 'pagewise_text_extraction_batch') {
            // Check if all batches are complete
            const expectedPages = docData.expected_physical_pages || docData.pageCount || 0;
            const extractionsSnap = await db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId).collection('page_extractions').get();
            const uniquePages = new Set(extractionsSnap.docs.map(d => d.data().page_number)).size;

            if (uniquePages >= expectedPages && expectedPages > 0) {
                nextState = 'PAGE_EXTRACTION_COMPLETE';
                reason = `All ${uniquePages}/${expectedPages} pages extracted.`;
            }
        } else if (finalType === 'CORPUS_VERIFICATION') {
            if (newData.result?.verified) {
                nextState = 'ACADEMIC_CORPUS_VERIFIED';
                reason = 'Academic corpus verified successfully.';
            } else {
                nextState = 'HOLD_PENDING_FOUNDER';
                reason = 'Corpus verification failed fidelity checks.';
            }
        } else if (finalType === 'SYLLABUS_B3') {
            nextState = 'B3_COMPLETE';
            reason = 'B3 structural materialization complete.';
        } else if (finalType === 'SYLLABUS_B4') {
            nextState = 'B4_COMPLETE';
            reason = 'B4 atomic decomposition complete.';
        }

        if (nextState && nextState !== currentState) {
            transaction.update(docRef, {
                lifecycle_state: nextState,
                updatedAt: FieldValue.serverTimestamp()
            });

            const event: LifecycleEvent = {
                missionId,
                documentId: docId,
                sourceSha256: sourceSha,
                fromState: currentState,
                toState: nextState,
                taskId,
                worker: 'SyllabusLifecycleWorker',
                runId: newData.runId || 'auto_run',
                revision: REVISION,
                timestamp: FieldValue.serverTimestamp(),
                reason,
                triggerEvent: 'TASK_COMPLETED'
            };

            const eventRef = db.collection('ai_audit_logs').doc(); // Or separate collection
            transaction.set(eventRef, { ...event, type: 'SYLLABUS_LIFECYCLE_TRANSITION' });

            // Trigger side effects (creating next task)
            await triggerNextStage(transaction, missionId, docId, nextState, docData, scopeSnap);
        }
    });
  });

/**
 * 🔱 INGESTION ORCHESTRATOR
 * Triggers initial PAGE_COUNT when a document is registered.
 */
export const syllabusIngestionOrchestrator = functions.firestore
  .document('mission_realms/{missionId}/official_documents/{docId}')
  .onCreate(async (snap, context) => {
    // 🛡️ TEST ISOLATION GATE: Avoid executing background triggers in the emulator process during Jest runs
    if (process.env.JEST_WORKER_ID) {
      console.log("syllabusIngestionOrchestrator: Bypassing background trigger execution in emulator process.");
      return;
    }
    const data = snap.data();
    if (!data) return;

    const { missionId, docId } = context.params;
    const sourceSha = data.sourceSha256 || data.fileHash || docId;

    const sourceAuthority = await registerCandidateSourceVersion(db, {
      ...data,
      missionId,
      documentId: docId,
      sourceSha256: sourceSha,
    });

    console.log(`🔱 ORCHESTRATOR: Candidate source registered: ${sourceAuthority.sourceVersionId} in ${missionId}`);

    const taskType = 'page_count_detection';
    const taskId = `plan_page_count_${missionId}_${sourceSha}`;

    console.log(`🔱 ORCHESTRATOR: Creating task ${taskId} for document ${docId}`);
    try {
        await db.collection('ai_queue').doc(taskId).set({
            id: taskId,
            task_type: taskType,
            mission_id: missionId,
            document_id: docId,
            source_document_id: docId,
            sourceSlotId: sourceAuthority.sourceSlotId,
            sourceSlotKey: sourceAuthority.sourceSlotKey,
            sourceVersionId: sourceAuthority.sourceVersionId,
            sourceSha256: sourceAuthority.sourceSha256,
            activationEpoch: 0,
            requiresCanonicalSource: false,
            source_path: data.source_path || data.storagePath || '',
            expected_output: 'page_count',
            status: 'queued',
            priority: 'normal',
            createdAt: FieldValue.serverTimestamp(),
            orchestratorVersion: REVISION,
            runId: `run_${Date.now()}`
        }, { merge: true });
        console.log(`🔱 ORCHESTRATOR: Successfully created task ${taskId}`);
    } catch (err: any) {
        console.error(`🔱 ORCHESTRATOR ERROR: Failed to create task ${taskId}: ${err.message}`);
    }

    await db.collection('ai_audit_logs').add({
        missionId,
        documentId: docId,
        sourceSha256: sourceSha,
        toState: 'PAGE_COUNT_PLANNED',
        worker: 'SyllabusIngestionOrchestrator',
        revision: REVISION,
        timestamp: FieldValue.serverTimestamp(),
        reason: 'Initial document registration trigger.',
        triggerEvent: 'DOC_CREATED',
        type: 'SYLLABUS_LIFECYCLE_TRANSITION'
    });
  });

/** Mirrors governed verification/delta state into the immutable source-version authority. */
export const canonicalSourceVerificationMirror = functions.firestore
  .document('mission_realms/{missionId}/official_documents/{docId}')
  .onUpdate(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    if (!after.sourceSlotId || !after.sourceVersionId) return;
    const verificationState = String(after.verificationState || after.reviewStatus || '').toUpperCase();
    const previousState = String(before.verificationState || before.reviewStatus || '').toUpperCase();
    if (verificationState === previousState && after.deltaSummary === before.deltaSummary) return;
    const versionRef = change.after.ref.parent.parent!
      .collection('source_slots').doc(after.sourceSlotId)
      .collection('source_versions').doc(after.sourceVersionId);
    await versionRef.set({
      verificationState: verificationState === 'VERIFIED' || verificationState === 'APPROVED' ? 'VERIFIED' : verificationState,
      deltaSummary: after.deltaSummary || null,
      deltaItems: Array.isArray(after.deltaItems) ? after.deltaItems : [],
      deltaState: after.deltaState || null,
      activationBlocked: after.activationBlocked === true || Number(after.deltaSummary?.AMBIGUOUS || 0) > 0,
      verifiedAt: after.verifiedAt || FieldValue.serverTimestamp(),
      verifiedBy: after.verifiedBy || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
async function triggerNextStage(transaction: admin.firestore.Transaction, missionId: string, docId: string, state: SyllabusLifecycleState, docData: any, scopeSnap: admin.firestore.DocumentSnapshot) {
    const sourceSha = docData.sourceSha256 || docData.fileHash || 'unknown';
    const sourceBinding = {
      sourceSlotId: docData.sourceSlotId || null,
      sourceSlotKey: docData.sourceSlotKey || null,
      sourceVersionId: docData.sourceVersionId || null,
      sourceSha256: sourceSha,
      activationEpoch: Number(docData.activationEpoch || 0),
      requiresCanonicalSource: false,
    };

    if (state === 'PAGE_COUNT_COMPLETE') {
        // Trigger B1 Planning (create batch tasks)
        // Note: For RPSC we might need to handle JSON vs PDF here
        if (docData.fileType === 'json') {
             // JSON route bypasses pagewise extraction
             // But for this orchestrator, we primarily target the PDF pipeline
             // We'll mark it as extraction complete if it's already structured JSON
        } else {
            const pageCount = docData.expected_physical_pages || docData.pageCount || 0;
            // Logic to create batches... (usually 3-5 pages per batch)
            // Simplified here:
            const batchSize = pageCount >= 51 ? 3 : 5;
            const totalBatches = Math.ceil(pageCount / batchSize);

            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize + 1;
                const end = Math.min((i + 1) * batchSize, pageCount);
                const taskId = `ext_${missionId}_${sourceSha}_p${start}_${end}`;

                const taskRef = db.collection('ai_queue').doc(taskId);
                transaction.set(taskRef, {
                    ...sourceBinding,
                    id: taskId,
                    task_type: 'pagewise_text_extraction_batch',
                    mission_id: missionId,
                    document_id: docId,
                    source_document_id: docId,
                    source_path: docData.source_path || docData.storagePath || '',
                    page_start: start,
                    page_end: end,
                    page_batch_index: i + 1,
                    total_batches: totalBatches,
                    expected_output: 'page_extractions',
                    status: 'queued',
                    priority: 'normal',
                    createdAt: FieldValue.serverTimestamp(),
                    orchestratorVersion: REVISION,
                    page_policy: { all_pages_required: true, fixed_page_limit_allowed: false, batch_size_is_not_page_limit: true },
                    runId: `run_${Date.now()}`
                }, { merge: true });
            }
        }
    } else if (state === 'PAGE_EXTRACTION_COMPLETE') {
        // Trigger Corpus Verification
        const taskId = `verify_corpus_${missionId}_${sourceSha}`;
        transaction.set(db.collection('ai_queue').doc(taskId), {
                    ...sourceBinding,
            id: taskId,
            task_type: 'CORPUS_VERIFICATION',
            mission_id: missionId,
            document_id: docId,
            source_document_id: docId,
            status: 'queued',
            createdAt: FieldValue.serverTimestamp(),
            orchestratorVersion: REVISION,
            runId: `run_${Date.now()}`
        }, { merge: true });
    } else if (state === 'ACADEMIC_CORPUS_VERIFIED') {
        // B3 launch is governed exclusively by the AAF completion proof path.
        // This legacy lifecycle trigger may record the verified corpus state,
        // but it must never enqueue a structural materialization task.
        if (!scopeSnap.exists || scopeSnap.data()?.status !== 'RESOLVED') {
            transaction.update(db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId), {
                lifecycle_state: 'SCOPE_AUTHORITY_PENDING'
            });
        }
    } else if (state === 'B3_COMPLETE') {
        const scopeRaw = scopeSnap.exists ? scopeSnap.data() : null;

        if (scopeRaw && scopeRaw.status === 'RESOLVED') {
            const normalizedScope = {
                ...scopeRaw,
                papersEnabled: true,
                allowedPaperIds: Object.keys(scopeRaw.papers || scopeRaw.paperDefinitions || {}),
                paperDefinitions: scopeRaw.papers || scopeRaw.paperDefinitions || {}
            };
            const taskId = `atomic_${missionId}_${sourceSha}`;
            transaction.set(db.collection('ai_queue').doc(taskId), {
                    ...sourceBinding,
                id: taskId,
                task_type: 'SYLLABUS_B4',
                mission_id: missionId,
                document_id: docId,
                source_document_id: docId,
                source_path: docData.source_path || docData.storagePath || '',
                run_id: docData.runId || `run_${Date.now()}`,
                status: 'queued',
                expected_output: 'atomic_syllabus_nodes',
                authorizedScope: normalizedScope,
                createdAt: FieldValue.serverTimestamp(),
                orchestratorVersion: REVISION
            }, { merge: true });

            transaction.update(db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId), {
                lifecycle_state: 'B4_PLANNED',
                updatedAt: FieldValue.serverTimestamp()
            });
        } else {
            transaction.update(db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId), {
                lifecycle_state: 'SCOPE_AUTHORITY_PENDING',
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }
}




