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
exports.queueWorker = functions.firestore
    .document('ai_queue/{taskId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    const taskId = context.params.taskId;
    const { type, provider, payload } = data;
    try {
        const prompt = (0, promptFactory_1.buildPrompt)(type, payload);
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
                    workerVersion: "9.1.0-RECOVERY",
                    provider: provider,
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    verifiedBy: null,
                    verifiedAt: null,
                }
            });
            console.log(`🔱 SENTINEL: Task ${taskId} staged for verification. Direct production write ERADICATED.`);
        }
        else {
            console.error(`AI Provider returned an invalid response for task ${taskId}`);
        }
        // Cleanup queue
        await snap.ref.delete();
    }
    catch (error) {
        console.error(`Worker failed for task ${taskId}:`, error);
    }
});
//# sourceMappingURL=queueWorker.js.map