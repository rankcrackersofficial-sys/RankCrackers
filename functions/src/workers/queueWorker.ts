import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';
import { executeProvider } from '../providers/providerExecutor';
import { buildPrompt } from '../providers/promptFactory';
import { derivePhysicalPageAuthority, assertPersistablePageAuthority } from '../services/physicalPageAuthority';


// Require helper modules from services
const { classifyRouting } = require('../../services/routing_classifier');
const { extractScannedPage } = require('../../services/scanned_extraction_service');
const { PDFParse } = require('pdf-parse');
const {
  shouldBypassQueueForTest,
  shouldQuarantineLegacyQueueInProduction,
} = require('./queueExecutionPolicy');
const { resolveExpectedSourceSha } = require('../syllabus/sourceShaAuthority');
const { executeMissionSourcePair } = require('../../services/mission_official_source_pair_consumer');
const { assertGovernedPagewiseTask } = require('../../services/mission_pagewise_job_authority');
const { preflightSourceBinding } = require('../../services/mission_source_preflight');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * LEGACY QUEUE QUARANTINE (AAF-004A)
 */
export const LEGACY_GENERIC_TYPES = ['mcq', 'digibook', 'revision'];

export const SPECIALIZED_TASK_TYPES = [
  'MANIFEST_KNOWLEDGE',
  'STRUCTURAL',
  'SVO_EXTRACTION',
  'ENCODING_NORMALIZATION',
  'pdfParse',
  'docxParse',
  'xlsxParse',
  'recruitment',
  'syllabus',
  'canonicalRepair',
  'pagewise_text_extraction_batch',
  'SYLLABUS_B3',
  'SYLLABUS_B4'
];

/**
 * 🛡️ OWNERSHIP CLASSIFIERS
 */
export function isAafTask(data: any): boolean {
  return data?.queueContract === 'academic_factory_v1';
}

export function isSpecializedTask(data: any): boolean {
  const type = data?.type || data?.task_type;
  return !!(type && SPECIALIZED_TASK_TYPES.includes(type));
}

export function isLegacyGenericTask(data: any): boolean {
  if (!data || !data.type) return false;
  if (isAafTask(data)) return false;
  return LEGACY_GENERIC_TYPES.includes(data.type);
}

export async function routeAafTask(
  data: any,
  taskId: string,
  workerId: string,
  dispatcher?: any
): Promise<boolean> {
  if (!isAafTask(data)) return false;
  const disp = dispatcher || new (require('../academicFactory/core/aafDispatcher').AafDispatcher)();
  await disp.dispatch(taskId, workerId);
  return true;
}

/**
 * Helper to download PDF bytes from Firebase Storage or an external URL.
 */
async function downloadBytes(path: string): Promise<Buffer> {
  if (!path) throw new Error('EMPTY_SOURCE_PATH');
  if (path.startsWith('gs://')) {
    const bucketName = path.split('/')[2];
    const objectPath = path.split('/').slice(3).join('/');
    const [buffer] = await admin.storage().bucket(bucketName).file(objectPath).download();
    return buffer;
  }
  if (path.startsWith('https://') || path.startsWith('http://')) {
    const response = await axios.get(path, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
  // Default bucket relative path
  const [buffer] = await admin.storage().bucket().file(path).download();
  return buffer;
}

/**
 * Helper to extract pages natively from PDF bytes using pdf-parse.
 */
async function extractPagesNatively(bytes: Buffer, start: number, end: number) {
  const parser = new PDFParse({ data: bytes });
  try {
    const pages = [];
    for (let p = start; p <= end; p++) pages.push(p);

    const result = await parser.getText({ partial: pages });
    const totalPagesInDoc = result.total;

    if (end > totalPagesInDoc) {
      throw new Error(`TASK_PAGE_END_OUT_OF_RANGE: ${end} > ${totalPagesInDoc}`);
    }

    const pageMap: {[key: number]: string} = {};
    if (result.pages && result.pages.length > 0) {
      result.pages.forEach((pData: any) => {
        const pageNum = Number(pData.num);
        if (Number.isFinite(pageNum) && pageNum >= start && pageNum <= end) {
           pageMap[pageNum] = String(pData.text || '').trim();
        }
      });
    } else if (pages.length === 1 && result.text) {
      pageMap[start] = String(result.text).trim();
    }

    return { result: pageMap, totalPagesInDoc };
  } finally {
    await parser.destroy();
  }
}

/**
 * Generic handler for pagewise text extraction batch tasks (B1 Consumer)
 */
async function handlePagewiseTextExtraction(taskId: string, taskRef: admin.firestore.DocumentReference, data: any) {
  console.log(`🔱 B1 WORKER: Starting pagewise extraction task ${taskId} (Mission: ${data.mission_id})`);
  const firestore = (taskRef as any).firestore || admin.firestore();

  try {
    // 1. 🛡️ ATOMIC CLAIM: Claim the task from status queued/pending
    let claimed = false;
    if (process.env.JEST_WORKER_ID && data.bypassClaimCheck) {
      claimed = true;
      await taskRef.update({
        status: 'processing',
        claimedBy: 'pagewise_extraction_worker',
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      claimed = await firestore.runTransaction(async (transaction: admin.firestore.Transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) return false;
        const currentStatus = doc.data()?.status;

        if (currentStatus !== 'queued' && currentStatus !== 'pending') return false;

        transaction.update(taskRef, {
          status: 'processing',
          claimedBy: 'pagewise_extraction_worker',
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      });
    }

    if (!claimed) {
      const snap = await taskRef.get();
      console.log(`QUEUE: Pagewise task ${taskId} already claimed or invalid status. Current status in DB: "${snap.data()?.status}"`);
      return;
    }

    // 2. 🛡️ SHAPE VALIDATION
    const required = [
      'task_type', 'mission_id', 'document_id', 'source_document_id', 'document_type',
      'source_path', 'page_start', 'page_end', 'page_batch_index', 'total_batches',
      'status', 'expected_output'
    ];
    const missing = required.filter(k => data[k] === undefined || data[k] === null || data[k] === '');
    if (missing.length > 0) {
      throw new Error(`INVALID_TASK_SHAPE: Missing required fields: ${missing.join(', ')}`);
    }
    if (data.expected_output !== 'page_extractions') {
      throw new Error('INVALID_TASK_SHAPE: expected_output must be page_extractions');
    }

    // 3. 🛡️ P06 BYTE SHA-256 BINDING (ORDERING PROTECTION: Must occur before any parser call or Firestore write)
    // Document identity and byte digest are separate authority values.
    const expectedSha = resolveExpectedSourceSha(data);

    // Fetch PDF Bytes
    let bytes: Buffer;
    try {
      bytes = await downloadBytes(data.source_path);
    } catch (e: any) {
      throw new Error(`RC_SYLLABUS_P06_BLOCKED_SOURCE_BYTES_UNAVAILABLE: ${e.message}`);
    }

    // Calculate Hash
    let actualSha: string;
    try {
      actualSha = crypto.createHash('sha256').update(bytes).digest('hex');
    } catch (err: any) {
      throw new Error(`RC_SYLLABUS_P06_BLOCKED_SHA_COMPUTATION_FAILED: ${err.message}`);
    }

    // Assert Hash Match
    if (actualSha !== expectedSha) {
      throw new Error('RC_SYLLABUS_P06_BLOCKED_SOURCE_SHA_MISMATCH: Computed SHA does not match expected SHA');
    }
    console.log(`   - P06 validation passed. SHA256: ${actualSha}`);

    // 4. Validate page range
    const pageStart = Number(data.page_start);
    const pageEnd = Number(data.page_end);
    if (!Number.isInteger(pageStart) || !Number.isInteger(pageEnd) || pageStart < 1 || pageEnd < pageStart) {
      throw new Error('INVALID_PAGE_RANGE: page_start and page_end are invalid');
    }

    // 5. Native Extraction Probe & Routing (P09 Routing)
    const { result: nativeResults, totalPagesInDoc } = await extractPagesNatively(bytes, pageStart, pageEnd);

    const pageData: {[key: number]: {text: string, method: string, ocrAudit?: any}} = {};
    for (let p = pageStart; p <= pageEnd; p++) {
      const nativeText = nativeResults[p] || '';
      const routing = classifyRouting(p, nativeText, totalPagesInDoc);

      if (routing === 'NATIVE') {
        pageData[p] = { text: nativeText, method: 'native_pdf_text' };
      } else if (routing === 'SCANNED') {
        console.log(`   - Page ${p}: SCANNED detected. Calling Vision OCR...`);
        const ocrResult = await extractScannedPage({
          missionId: data.mission_id,
          documentId: data.document_id,
          sourceSha256: actualSha,
          pdfBytes: bytes,
          pageNumber: p
        });
        pageData[p] = { text: ocrResult.text, method: 'VISION_OCR_PAGEWISE', ocrAudit: ocrResult };
      } else {
        throw new Error(`RC_SYLLABUS_P1_BLOCKED_ROUTING_${routing}: Page ${p}`);
      }
    }

    // 6. 🛡️ Empty/Simulated Placeholder Check (P04 & P05)
    const emptyPages = [];
    for (let p = pageStart; p <= pageEnd; p++) {
      const text = pageData[p].text || '';
      if (text.trim().length === 0 || text.includes('Simulated text') || text.includes('placeholder')) {
        emptyPages.push(p);
      }
    }
    if (emptyPages.length > 0) {
      throw new Error(`NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED: Empty or simulated text on pages: ${emptyPages.join(', ')}`);
    }

    // 7. Duplicate Check with Page Authority Idempotency
    const docRef = firestore.collection('mission_realms').doc(data.mission_id)
      .collection('official_documents').doc(data.document_id);

    const duplicatePages: number[] = [];
    const idempotentPages = new Set<number>();
    for (let p = pageStart; p <= pageEnd; p++) {
      const existing = await docRef.collection('page_extractions').doc(String(p)).get();
      if (existing.exists) {
        try {
          const auth = await derivePhysicalPageAuthority({
            missionId: data.mission_id,
            documentId: data.document_id,
            sourceSha256: actualSha,
            pdfBytes: bytes,
            pageNumber: p
          });
          const existingData = existing.data();
          const existingAuth = {
            sourceSha256: existingData?.sourceSha256,
            physicalPageNumber: existingData?.physicalPageNumber,
            pageDigest: existingData?.pageAuthorityDigest,
            pageDigestAlgorithm: existingData?.pageAuthorityAlgorithm,
            pageDigestVersion: existingData?.pageAuthorityVersion,
            pageIdentityMethod: existingData?.pageAuthorityMethod
          };
          const mode = assertPersistablePageAuthority(existingAuth, auth);
          if (mode === 'idempotent') {
            // Preserve existing extracted content and Founder review decisions.
            idempotentPages.add(p);
          } else {
            duplicatePages.push(p);
          }
        } catch (authErr) {
          duplicatePages.push(p);
        }
      }
    }
    if (duplicatePages.length > 0) {
      throw new Error(`PAGE_EXTRACTION_ALREADY_EXISTS: Duplicate page records: ${duplicatePages.join(', ')}`);
    }

    // 8. Write Page Extractions
    const batch = firestore.batch();
    let pagesInBatch = 0;
    for (let p = pageStart; p <= pageEnd; p++) {
      if (idempotentPages.has(p)) continue;
      const { text, method, ocrAudit } = pageData[p];
      const extractionRef = docRef.collection('page_extractions').doc(String(p));

      const auth = await derivePhysicalPageAuthority({
        missionId: data.mission_id,
        documentId: data.document_id,
        sourceSha256: actualSha,
        pdfBytes: bytes,
        pageNumber: p
      });

      const payload: any = {
        mission_id: data.mission_id,
        document_id: data.document_id,
        source_document_id: data.source_document_id,
        source_path: data.source_path,
        document_type: data.document_type,
        language: data.language || 'unknown',
        page_number: p,
        page_start: pageStart,
        page_end: pageEnd,
        page_batch_index: data.page_batch_index,
        total_batches: data.total_batches,
        extraction_text: text,
        extraction_status: 'extracted_draft',
        review_status: 'pending_founder_verification',
        extracted_by_task_id: taskId,
        extraction_method: method,
        source_proof: {
          source_path: data.source_path,
          page_number: p,
          task_id: taskId
        },
        page_policy: {
          all_pages_required: true,
          fixed_page_limit_allowed: false,
          batch_size_is_not_page_limit: true
        },
        sourceSha256: auth.sourceSha256,
        physicalPageNumber: auth.physicalPageNumber,
        documentPageCount: auth.pageCount,
        pageAuthorityDigest: auth.pageDigest,
        pageAuthorityAlgorithm: auth.pageDigestAlgorithm,
        pageAuthorityVersion: auth.pageDigestVersion,
        pageAuthorityMethod: auth.pageIdentityMethod,
        parentSourceVerified: auth.parentDocumentDigestVerified,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        created_by_patch: 'RC-AUTO-B1-GENERIC'
      };

      if (ocrAudit) {
        // Persist provenance of the unmodified, review-pending OCR text.
        // Printed folios are advisory unless a verified mapping was supplied.
        payload.ocr_audit = {
          provider: ocrAudit.provider,
          pageDigest: ocrAudit.pageDigest,
          correctionsCount: ocrAudit.corrections.length,
          validationState: ocrAudit.validationState,
          correctionState: ocrAudit.correctionState,
          printedPageEvidence: ocrAudit.printedPageEvidence,
          rawTextSha256: crypto.createHash('sha256').update(String(ocrAudit.rawText || '')).digest('hex')
        };
      }

      if (data.mission_id === 'AUTO_DETECT') {
        payload.requires_founder_mission_assignment_before_publish = true;
        payload.auto_detect_routing_only = true;
        payload.publish_blocked_until_founder_mission_assignment = true;
      }

      // create() fails atomically if another task wrote this page concurrently.
      // Never overwrite previously reviewed/verified extraction records.
      batch.create(extractionRef, payload);
      pagesInBatch++;
    }

    // 9. Update task to completed
    batch.update(taskRef, {
      status: 'completed',
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      extraction_method: 'hybrid_routing_v1',
      page_extractions_created: pagesInBatch,
      page_extractions_reused: idempotentPages.size,
      page_range_processed: {
        page_start: pageStart,
        page_end: pageEnd
      },
      created_by_patch_completed: 'RC-AUTO-B1-GENERIC'
    });

    await batch.commit();

    // 10. 🔱 Observability Log Attribution (Rule 8)
    const runId = `run_${Date.now()}`;
    console.log(`🔱 [ATTRIBUTION] Pagewise extraction complete:
      task_id: ${taskId}
      mission_id: ${data.mission_id}
      document_id: ${data.document_id}
      runtime/service: queueWorker
      revision: AUTO-B1-FIX2
      invocation/run_id: ${runId}
      claim/lease_id: ${taskId}
      started_at: ${new Date().toISOString()}
      completed_at: ${new Date().toISOString()}
      source_sha: ${actualSha}
      output_count: ${pagesInBatch}`);

    await firestore.collection('ai_audit_logs').add({
      taskId: taskId,
      missionId: data.mission_id,
      documentId: data.document_id,
      runtimeService: 'queueWorker',
      revision: 'AUTO-B1-FIX2',
      invocationRunId: runId,
      claimLeaseId: taskId,
      startedAt: data.processingStartedAt || admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      sourceSha: actualSha,
      outputCount: pagesInBatch,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error: any) {
    console.error(`Pagewise extraction failed for task ${taskId}:`, error);
    try {
      let failureReason = 'EXTRACTION_ERROR';
      let errorMsg = error.message || 'Unknown error';

      if (errorMsg.includes('RC_SYLLABUS_P06_')) {
        failureReason = errorMsg.split(':')[0].trim();
        errorMsg = errorMsg.substring(failureReason.length + 1).trim() || errorMsg;
      } else if (errorMsg.includes('NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED')) {
        failureReason = 'NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED';
      } else if (errorMsg.includes('PAGE_EXTRACTION_ALREADY_EXISTS')) {
        failureReason = 'PAGE_EXTRACTION_ALREADY_EXISTS';
      } else if (errorMsg.includes('RC_SYLLABUS_P1_BLOCKED_ROUTING_')) {
        failureReason = errorMsg.split(':')[0].trim();
      }

      await taskRef.update({
        status: 'failed',
        failure_reason: failureReason,
        error_message: errorMsg,
        error: errorMsg,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateErr) {
      console.error(`Failed to update error status for task ${taskId}:`, updateErr);
    }
  }
}

export const queueWorker = functions.firestore
  .document('ai_queue/{taskId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return;

    const taskId = context.params.taskId;
    const taskRef = snap.ref;
    const taskType = data.task_type || data.type;

    if (taskType === 'MISSION_SOURCE_PAIR') {
      try {
        await admin.firestore().runTransaction(async (transaction) => {
          await executeMissionSourcePair({ transaction, db: admin.firestore(), taskId, preflight: preflightSourceBinding, recordedAt: new Date().toISOString() });
        });
      } catch (error: any) {
        console.error(`MISSION_SOURCE_PAIR failed closed for ${taskId}:`, error);
        await taskRef.update({ status: 'failed', error: error.message || 'PAIR_CONSUMER_FAILED' });
      }
      return;
    }

    // Allow only the verified page-extraction route outside Jest. Do not
    // unquarantine the legacy generic queue as a side effect of this repair.
    if (taskType === 'pagewise_text_extraction_batch') {
      // Domain-M children must be traceable to the coordinator's persisted,
      // dispatched pair and VERIFIED mission-scoped official source.
      const governedSourceJob = data.type === 'OFFICIAL_NOTIFICATION'
        || data.type === 'OFFICIAL_SYLLABUS'
        || String(data.parentTaskId || '').startsWith('mission_source_pair_');
      if (governedSourceJob) {
        try {
          await assertGovernedPagewiseTask({ firestore: admin.firestore(), taskId, task: data });
        } catch (error: any) {
          console.error('Governed official page task failed authority check:', taskId, error);
          await taskRef.update({
            status: 'failed',
            failure_reason: 'PAGEWISE_GOVERNED_AUTHORITY_REJECTED',
            error: error.message || 'PAGEWISE_GOVERNED_AUTHORITY_REJECTED',
            failedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          return;
        }
      }
      if (shouldBypassQueueForTest(process.env.JEST_WORKER_ID)) {
        console.log("QUEUE: Bypassing page extraction during Jest.");
        return;
      }
      await handlePagewiseTextExtraction(taskId, taskRef, data);
      return;
    }
    if (shouldQuarantineLegacyQueueInProduction(taskType, process.env.JEST_WORKER_ID)) {
      console.log(`QUEUE QUARANTINE: Legacy task ${taskId} remains disabled outside Jest.`);
      return;
    }

    // 1. 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (isAafTask(data)) {
      console.log(`QUEUE QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
      return;
    }

    // 2. 🛡️ SPECIALIZATION GUARD: Ignore types handled by dedicated workers.
    if (isSpecializedTask(data)) {
      console.log(`QUEUE QUARANTINE: Task ${taskId} type '${taskType}' is specialized. Ignoring.`);
      return;
    }

    // 3. 🛡️ GENERIC VALIDATION
    const isGeneric = isLegacyGenericTask(data);

    try {
      // 🛡️ ATOMIC CLAIM: Claim the task before deciding to process or fail-closed.
      const claimed = await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) return false;
        const currentStatus = doc.data()?.status;

        // Only process if status is 'received' (initial) and not already processing.
        const allowedStatus = (process.env.JEST_WORKER_ID && data.bypassClaimCheck) ? 'completed' : 'received';
        if (currentStatus !== allowedStatus) return false;

        transaction.update(taskRef, {
          status: 'processing',
          claimedBy: 'legacy_generic_worker',
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      });

      if (!claimed) {
        console.log(`QUEUE: Task ${taskId} already claimed or status changed. Skipping.`);
        return;
      }

      // 4. 🛡️ UNKNOWN TASK FAIL-CLOSED (P0 REQUIREMENT)
      // Must happen AFTER claim to ensure status is persisted, but BEFORE BuildPrompt/Provider.
      if (!isGeneric) {
        const unknownType = data.type || 'MISSING_TYPE';
        console.error(`QUEUE: Task ${taskId} has unknown type '${unknownType}'. Failing closed.`);
        await taskRef.update({
          status: 'failed',
          error: `Unknown or unauthorized task type: ${unknownType}`,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      const { type, provider, payload } = data;
      const prompt = buildPrompt(type, payload);

      // Final prompt safety check
      if (prompt === 'Unknown Task') {
        throw new Error(`Prompt factory rejected type: ${type}`);
      }

      const response = await executeProvider(provider, prompt);

      // AUDIT-01-F001 REMEDIATION: Redirect all output to Sentinel Isolation Zone
      if (response && 'text' in response) {
        await admin.firestore().collection('sentinel_drafts').doc(taskId).set({
          id: taskId,
          sourceId: payload.id || 'system_generated',
          type: type,
          status: 'under_review',
          rawData: response.text,
          metadata: {
            topic: payload.topic,
            originalPayload: payload,
          },
          audit: {
            workerVersion: "9.2.1-FIX2",
            provider: provider,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedBy: null,
            verifiedAt: null,
          }
        });

        console.log(`SENTINEL: Task ${taskId} staged for verification.`);

        await taskRef.update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const errorMsg = response?.message || 'AI Provider returned an invalid response';
        console.error(`AI Provider returned an invalid response for task ${taskId}: ${errorMsg}`);

        await taskRef.update({
          status: 'failed',
          error: errorMsg,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

    } catch (error) {
      console.error(`Worker failed for task ${taskId}:`, error);
      try {
        await taskRef.update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown internal error',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (updateErr) {
        console.error(`Failed to update error status for task ${taskId}:`, updateErr);
      }
    }
  });
