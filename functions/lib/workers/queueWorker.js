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
exports.queueWorker = exports.isLegacyGenericTask = exports.isSpecializedTask = exports.isAafTask = exports.SPECIALIZED_TASK_TYPES = exports.LEGACY_GENERIC_TYPES = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const providerExecutor_1 = require("../providers/providerExecutor");
const promptFactory_1 = require("../providers/promptFactory");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * 🔱 LEGACY QUEUE QUARANTINE (AAF-004A)
 */
exports.LEGACY_GENERIC_TYPES = ['mcq', 'digibook', 'revision'];
exports.SPECIALIZED_TASK_TYPES = [
    'MANIFEST_KNOWLEDGE',
    'STRUCTURAL',
    'SVO_EXTRACTION',
    'ENCODING_NORMALIZATION',
    'pdfParse',
    'docxParse',
    'xlsxParse',
    'recruitment',
    'syllabus',
    'canonicalRepair'
];
/**
 * 🛡️ OWNERSHIP CLASSIFIERS
 */
function isAafTask(data) {
    return data?.queueContract === 'academic_factory_v1';
}
exports.isAafTask = isAafTask;
function isSpecializedTask(data) {
    return data?.type && exports.SPECIALIZED_TASK_TYPES.includes(data.type);
}
exports.isSpecializedTask = isSpecializedTask;
function isLegacyGenericTask(data) {
    if (!data || !data.type)
        return false;
    if (isAafTask(data))
        return false;
    return exports.LEGACY_GENERIC_TYPES.includes(data.type);
}
exports.isLegacyGenericTask = isLegacyGenericTask;
exports.queueWorker = functions.firestore
    .document('ai_queue/{taskId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    const taskId = context.params.taskId;
    const taskRef = snap.ref;
    // 1. 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (isAafTask(data)) {
        console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
        return;
    }
    // 2. 🛡️ SPECIALIZATION GUARD: Ignore types handled by dedicated workers.
    if (isSpecializedTask(data)) {
        console.log(`🔱 QUEUE QUARANTINE: Task ${taskId} type '${data.type}' is specialized. Ignoring.`);
        return;
    }
    // 3. 🛡️ GENERIC VALIDATION
    const isGeneric = isLegacyGenericTask(data);
    try {
        // 🛡️ ATOMIC CLAIM: Claim the task before deciding to process or fail-closed.
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
        // 4. 🛡️ UNKNOWN TASK FAIL-CLOSED (P0 REQUIREMENT)
        // Must happen AFTER claim to ensure status is persisted, but BEFORE BuildPrompt/Provider.
        if (!isGeneric) {
            const unknownType = data.type || 'MISSING_TYPE';
            console.error(`🔱 QUEUE: Task ${taskId} has unknown type '${unknownType}'. Failing closed.`);
            await taskRef.update({
                status: 'failed',
                error: `Unknown or unauthorized task type: ${unknownType}`,
                failedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return;
        }
        const { type, provider, payload } = data;
        const prompt = (0, promptFactory_1.buildPrompt)(type, payload);
        // Final prompt safety check
        if (prompt === 'Unknown Task') {
            throw new Error(`Prompt factory rejected type: ${type}`);
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
                    workerVersion: "9.2.1-FIX2",
                    provider: provider,
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    verifiedBy: null,
                    verifiedAt: null,
                }
            });
            console.log(`🔱 SENTINEL: Task ${taskId} staged for verification.`);
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
