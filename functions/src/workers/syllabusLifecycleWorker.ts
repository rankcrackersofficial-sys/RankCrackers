import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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

    await db.runTransaction(async (transaction) => {
        const docRef = db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId);
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists) {
            console.log(`🔱 ORCHESTRATOR: Target document ${docId} not found in mission_realms. Skipping.`);
            return;
        }

        const docData = docSnap.data() || {};
        const currentState = docData.lifecycle_state || 'SOURCE_REGISTERED';
        const sourceSha = docData.sourceSha256 || docData.fileHash || 'unknown';

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
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                reason,
                triggerEvent: 'TASK_COMPLETED'
            };

            const eventRef = db.collection('ai_audit_logs').doc(); // Or separate collection
            transaction.set(eventRef, { ...event, type: 'SYLLABUS_LIFECYCLE_TRANSITION' });

            // Trigger side effects (creating next task)
            await triggerNextStage(transaction, missionId, docId, nextState, docData);
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
    const data = snap.data();
    if (!data) return;

    const { missionId, docId } = context.params;
    const sourceSha = data.sourceSha256 || data.fileHash || 'unknown';

    console.log(`🔱 ORCHESTRATOR: New document registered: ${docId} in ${missionId}`);

    const taskType = 'page_count_detection';
    const taskId = `plan_page_count_${missionId}_${sourceSha}`;

    await db.collection('ai_queue').doc(taskId).set({
        id: taskId,
        task_type: taskType,
        mission_id: missionId,
        document_id: docId,
        source_document_id: docId,
        source_path: data.source_path || data.storagePath,
        expected_output: 'page_count',
        status: 'queued',
        priority: 'normal',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        orchestratorVersion: REVISION,
        runId: `run_${Date.now()}`
    }, { merge: true });

    await db.collection('ai_audit_logs').add({
        missionId,
        documentId: docId,
        sourceSha256: sourceSha,
        toState: 'PAGE_COUNT_PLANNED',
        worker: 'SyllabusIngestionOrchestrator',
        revision: REVISION,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        reason: 'Initial document registration trigger.',
        triggerEvent: 'DOC_CREATED',
        type: 'SYLLABUS_LIFECYCLE_TRANSITION'
    });
  });

async function triggerNextStage(transaction: admin.firestore.Transaction, missionId: string, docId: string, state: SyllabusLifecycleState, docData: any) {
    const sourceSha = docData.sourceSha256 || docData.fileHash || 'unknown';

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
                    id: taskId,
                    task_type: 'pagewise_text_extraction_batch',
                    mission_id: missionId,
                    document_id: docId,
                    source_document_id: docId,
                    source_path: docData.source_path || docData.storagePath,
                    page_start: start,
                    page_end: end,
                    page_batch_index: i + 1,
                    total_batches: totalBatches,
                    expected_output: 'page_extractions',
                    status: 'queued',
                    priority: 'normal',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
            id: taskId,
            task_type: 'CORPUS_VERIFICATION',
            mission_id: missionId,
            document_id: docId,
            source_document_id: docId,
            status: 'queued',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            orchestratorVersion: REVISION,
            runId: `run_${Date.now()}`
        }, { merge: true });
    } else if (state === 'ACADEMIC_CORPUS_VERIFIED') {
        // Trigger B3 if Scope Authority exists
        const scopeRef = db.collection('mission_realms').doc(missionId).collection('variables').doc('scope_authority');
        const scopeSnap = await transaction.get(scopeRef); // Transactional check for safety

        if (scopeSnap.exists && scopeSnap.data()?.status === 'RESOLVED') {
            const taskId = `struct_${missionId}_${sourceSha}`;
            transaction.set(db.collection('ai_queue').doc(taskId), {
                id: taskId,
                task_type: 'SYLLABUS_B3',
                mission_id: missionId,
                document_id: docId,
                source_document_id: docId,
                payload: {
                    missionId,
                    documentId: docId,
                    sourceSha256: sourceSha,
                    authorizedScope: scopeSnap.data(),
                    documentType: 'syllabus',
                    runId: `run_${Date.now()}`
                },
                status: 'queued',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                orchestratorVersion: REVISION
            }, { merge: true });
        } else {
            transaction.update(db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId), {
                lifecycle_state: 'SCOPE_AUTHORITY_PENDING'
            });
        }
    } else if (state === 'B3_COMPLETE') {
        // Check if B4 Worker exists/available
        // For now, B4 is under implementation, so we HOLD
        transaction.update(db.collection('mission_realms').doc(missionId).collection('official_documents').doc(docId), {
            lifecycle_state: 'B4_PLANNED' // Or B4_IMPLEMENTATION_HOLD
        });
    }
}
