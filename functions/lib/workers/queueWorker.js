"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueWorker = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const providerExecutor_1 = require("../providers/providerExecutor");
const promptFactory_1 = require("../providers/promptFactory");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * 🔱 LEGACY QUEUE QUARANTINE (AAF-004A)
 * Tasks handled by specialized workers or the new AAF system must be ignored by this worker.
 */
const SPECIALIZED_TASK_TYPES = [
    'MANIFEST_KNOWLEDGE',
    'STRUCTURAL',
    'SVO_EXTRACTION',
    'ENCODING_NORMALIZATION',
    'pdfParse',
    'docxParse',
    'xlsxParse'
];
exports.queueWorker = functions.firestore
    .document('ai_queue/{taskId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    const taskId = context.params.taskId;
    const { type, provider, payload } = data;
    // 🛡️ AAF GUARD: If task has AAF identifiers, it belongs to the Autonomous Factory system.
    if (data.runId || data.jobId || data.idempotencyKey) {
        console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} is an AAF job. Ignoring in legacy worker.`);
        return;
    }
    // 🛡️ SPECIALIZATION GUARD: Ignore types handled by dedicated workers.
    if (SPECIALIZED_TASK_TYPES.includes(type)) {
        console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} type '${type}' is specialized. Ignoring in legacy worker.`);
        return;
    }
    // 🛡️ UNKNOWN TASK FAIL-CLOSED: If type is missing or not in prompt factory, ignore or fail.
    if (!type) {
        console.warn(`🔱 QUEUE QUARANTINE: Task ${taskId} has no type. Ignoring.`);
        return;
    }
    const taskRef = snap.ref;
    try {
        // 🛡️ ATOMIC CLAIM: Ensure this generic worker claims the task before processing.
        const claimed = await admin.firestore().runTransaction(async (transaction) => {
            const doc = await transaction.get(taskRef);
            if (!doc.exists)
                return false;
            const currentStatus = doc.data()?.status;
            // Only process if status is 'received' (initial) and not already processing.
            if (currentStatus !== 'received')
                return false;
            transaction.update(taskRef, {
                status: 'processing',
                claimedBy: 'legacy_generic_worker',
                processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return true;
        });
        if (!claimed) {
            console.log(`🔱 QUEUE: Task ${taskId} already claimed or status changed. Skipping.`);
            return;
        }
        const prompt = (0, promptFactory_1.buildPrompt)(type, payload);
        // 🛡️ SAFETY: Unknown prompts (default 'Unknown Task') must not be executed.
        if (prompt === 'Unknown Task') {
            console.error(`🔱 QUEUE: Task ${taskId} has unknown type contract '${type}'. Failing closed.`);
            await taskRef.update({
                status: 'failed',
                error: `Unknown task type contract: ${type}`,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return;
        }
        const response = await (0, providerExecutor_1.executeProvider)(provider, prompt);
        // 🔱 AUDIT-01-F001 REMEDIATION: Redirect all output to Sentinel Isolation Zone
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
                    workerVersion: "9.2.0-QUARANTINE",
                    provider: provider,
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    verifiedBy: null,
                    verifiedAt: null,
                }
            });
            console.log(`🔱 SENTINEL: Task ${taskId} staged for verification.`);
            // 🔱 P0 FIX: Update status instead of deleting.
            await taskRef.update({
                status: 'completed',
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            const errorMsg = response?.message || 'AI Provider returned an invalid response';
            console.error(`AI Provider returned an invalid response for task ${taskId}: ${errorMsg}`);
            await taskRef.update({
                status: 'failed',
                error: errorMsg,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }
    catch (error) {
        console.error(`Worker failed for task ${taskId}:`, error);
        try {
            await taskRef.update({
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown internal error',
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        catch (updateErr) {
            console.error(`Failed to update error status for task ${taskId}:`, updateErr);
        }
    }
});
//# sourceMappingURL=queueWorker.js.map