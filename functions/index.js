/**
 * 🔱 SOVEREIGN COMMAND CENTER - MASTER INDEX (v8.2.2)
 * Modularized Architecture for Hyperscale Governance.
 */

const admin = require("firebase-admin");

admin.initializeApp();

// 🔱 CALLABLE EXPORTS (Founder Command Center)
const { manageUserAccess } = require("./callable/manage_access");
const { toggleAiSystem } = require("./callable/toggle_ai_system");
const { getSystemHealth } = require("./callable/system_health");
const { processAITask } = require("./callable/process_ai_task");
const { handleSentinelAction } = require("./callable/handle_sentinel_action");
const { handleMissionAction } = require("./callable/handle_mission_action");
const { getSecureAssetUrl } = require("./callable/secure_download");
const { setSovereignClaims } = require("./index_legacy"); // Keeping legacy for bootstrapping if needed

exports.manageUserAccess = manageUserAccess;
exports.toggleAiSystem = toggleAiSystem;
exports.getSystemHealth = getSystemHealth;
exports.processAITask = processAITask;
exports.handleSentinelAction = handleSentinelAction;
exports.handleMissionAction = handleMissionAction;
exports.getSecureAssetUrl = getSecureAssetUrl;
exports.setSovereignClaims = setSovereignClaims;

// 🔱 WORKER EXPORTS (Background Intelligence)
const { sentinelBackgroundWorker } = require("./workers/sentinel_worker");
const { structuralWorker } = require("./workers/structural_worker");
const { svoWorker } = require("./workers/svo_worker");
const { encodingWorker } = require("./workers/encoding_worker");
const { sentinelPromotionWorker } = require("./workers/promotion_worker");
const { recruitmentAutoCreationEngine } = require("./workers/recruitment_engine_worker");
const { sovereignWebsiteScout } = require("./workers/scout_worker");
const { queueCleanupWorker } = require("./workers/cleanup_worker");
const { physicalStorageCleanupWorker } = require("./workers/physical_storage_cleanup_worker");
const { certificateRegistryWorker } = require("./workers/certificate_worker");
const { certificateRenderWorker } = require("./workers/renderer_worker");
const { knowledgeManifestationWorker } = require("./workers/manifestation_worker");
const { queueWorker } = require("./lib/workers/queueWorker");

exports.sentinelBackgroundWorker = sentinelBackgroundWorker;
exports.structuralWorker = structuralWorker;
exports.svoWorker = svoWorker;
exports.encodingWorker = encodingWorker;
exports.sentinelPromotionWorker = sentinelPromotionWorker;
exports.recruitmentAutoCreationEngine = recruitmentAutoCreationEngine;
exports.sovereignWebsiteScout = sovereignWebsiteScout;
exports.queueCleanupWorker = queueCleanupWorker;
exports.physicalStorageCleanupWorker = physicalStorageCleanupWorker;
exports.certificateRegistryWorker = certificateRegistryWorker;
exports.certificateRenderWorker = certificateRenderWorker;
exports.knowledgeManifestationWorker = knowledgeManifestationWorker;
exports.queueWorker = queueWorker;

// 🔱 FOUNDER ALERT EXPORTS
const { founderCriticalAlert } = require("./workers/alert_worker");
exports.founderCriticalAlert = founderCriticalAlert;
