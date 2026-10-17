/**
 * 🔱 SOVEREIGN COMMAND CENTER - MASTER INDEX (v8.2.2)
 * Modularized Architecture for Hyperscale Governance.
 */

const admin = require("firebase-admin");

admin.initializeApp();

const { manageUserAccess, manageAdminScopes } = require("./callable/manage_access");
const { issueAdminInvite, acceptAdminInvite, validateAdminInvite } = require("./callable/admin_invitations");
const { bootstrapFounderSession } = require("./callable/bootstrap_founder_session");
const { transitionAdminTask, createAdminTask } = require("./callable/admin_tasks");
const { toggleAiSystem } = require("./callable/toggle_ai_system");
const { getSystemHealth } = require("./callable/system_health");
const { processAITask } = require("./callable/process_ai_task");
const { handleSentinelAction } = require("./callable/handle_sentinel_action");
const { handleMissionAction } = require("./callable/handle_mission_action");
const { forceMissionPipeline } = require("./callable/force_mission_pipeline");
const { getSecureAssetUrl } = require("./callable/secure_download");
const { getFounderOfficialUpdatesProjectionV1 } = require("./callable/get_founder_official_updates_projection_v1");
const { scanAuthorityNow } = require("./callable/scan_authority_now");

exports.manageUserAccess = manageUserAccess;
exports.manageAdminScopes = manageAdminScopes;
exports.issueAdminInvite = issueAdminInvite;
exports.acceptAdminInvite = acceptAdminInvite;
exports.validateAdminInvite = validateAdminInvite;
exports.bootstrapFounderSession = bootstrapFounderSession;
exports.transitionAdminTask = transitionAdminTask;
exports.createAdminTask = createAdminTask;
exports.toggleAiSystem = toggleAiSystem;
exports.getSystemHealth = getSystemHealth;
exports.processAITask = processAITask;
exports.handleSentinelAction = handleSentinelAction;
exports.handleMissionAction = handleMissionAction;
exports.forceMissionPipeline = forceMissionPipeline;
exports.getSecureAssetUrl = getSecureAssetUrl;
exports.getFounderOfficialUpdatesProjectionV1 = getFounderOfficialUpdatesProjectionV1;
exports.scanAuthorityNow = scanAuthorityNow;

// 🔱 WORKER EXPORTS (Background Intelligence)
const { sentinelBackgroundWorker } = require("./workers/sentinel_worker");
const { structuralWorker } = require("./workers/structural_worker");
const { svoWorker } = require("./workers/svo_worker");
const { encodingWorker } = require("./workers/encoding_worker");
const { sentinelPromotionWorker } = require("./workers/promotion_worker");
const { sovereignWebsiteScout } = require("./workers/scout_worker");
const { queueCleanupWorker } = require("./workers/cleanup_worker");
const { physicalStorageCleanupWorker } = require("./workers/physical_storage_cleanup_worker");
const { certificateRegistryWorker } = require("./workers/certificate_worker");
const { certificateRenderWorker } = require("./workers/renderer_worker");
const { knowledgeManifestationWorker } = require("./workers/manifestation_worker");
const { queueWorker } = require("./lib/workers/queueWorker");
// 🔱 UNIFIED MISSION ENRICHMENT WORKER (W1 live integration — B2/B3 contracts inside)
const { missionEnrichmentWorker } = require("./workers/mission_enrichment_worker");
const { pilotPublicationWorker } = require("./workers/pilot_publication_worker");
const { authorityWatchWorker } = require("./workers/authority_watch_worker");
const { automationPipelineWorker } = require("./workers/automation_pipeline_worker");
const { pilotMissionAutomationWorker } = require("./workers/pilot_mission_automation_worker");
const { missionAcademicMaterializerWorker } = require("./workers/mission_academic_materializer_worker");
const { missionTaxonomyVerifierWorker } = require("./workers/mission_taxonomy_verifier_worker");

exports.sentinelBackgroundWorker = sentinelBackgroundWorker;
exports.structuralWorker = structuralWorker;
exports.svoWorker = svoWorker;
exports.encodingWorker = encodingWorker;
exports.sentinelPromotionWorker = sentinelPromotionWorker;
exports.sovereignWebsiteScout = sovereignWebsiteScout;
exports.queueCleanupWorker = queueCleanupWorker;
exports.physicalStorageCleanupWorker = physicalStorageCleanupWorker;
exports.certificateRegistryWorker = certificateRegistryWorker;
exports.certificateRenderWorker = certificateRenderWorker;
exports.knowledgeManifestationWorker = knowledgeManifestationWorker;
exports.queueWorker = queueWorker;
exports.missionEnrichmentWorker = missionEnrichmentWorker;
exports.pilotPublicationWorker = pilotPublicationWorker;
exports.authorityWatchWorker = authorityWatchWorker;
exports.automationPipelineWorker = automationPipelineWorker;
exports.pilotMissionAutomationWorker = pilotMissionAutomationWorker;
exports.missionAcademicMaterializerWorker = missionAcademicMaterializerWorker;
exports.missionTaxonomyVerifierWorker = missionTaxonomyVerifierWorker;

// 🔱 GOVERNED ACADEMIC FACTORY QUEUE (source-bound DigiBook/Crucible stages)
// The runtime entrypoint is this JavaScript index; exporting only from the
// compiled TypeScript index would leave the deployed queue worker unreachable.
const { aafQueueWorker, aafQueueScheduler } = require("./lib/workers/aafQueueWorker");
exports.aafQueueWorker = aafQueueWorker;
exports.aafQueueScheduler = aafQueueScheduler;

// 🔱 FOUNDER ALERT EXPORTS
const { founderCriticalAlert } = require("./workers/alert_worker");
exports.founderCriticalAlert = founderCriticalAlert;
