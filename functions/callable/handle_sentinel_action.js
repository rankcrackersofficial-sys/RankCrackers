const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require('firebase-admin/firestore');
const crypto = require("crypto");
const { logFounderActivity } = require("../services/audit_service");
const { executeUnifiedMissionCreation } = require("../services/mission_cycle_store");
const { executeMissionShellBootstrap } = require('../services/mission_shell_bootstrap');
const { executeCycleAwarePublication } = require("../services/mission_cycle_lifecycle");
const { runSeparateSourcePairPipeline } = require('../services/mission_separate_source_pair_entrypoint');
const { validateOrResolveId } = require("../canonical_mission_registry");
const {
  assertActiveFounder,
  evaluateDeletePreflight,
  lifecycleAuditId,
  lifecycleProjection,
  validateLifecycleRequest,
} = require('../services/mission_lifecycle_governance');
const {
  assertFounderVariableAuthority,
  assertMissionIdentity,
  assertPostPublicationSafety,
  assertSourceDocumentBinding,
  canonicalDigest,
  normalizeMissionVariables,
  referencedDocumentIds,
} = require("../services/mission_variable_authority");
const {
  buildCanonicalOfficialDocument,
} = require('../services/canonical_mission_realm_store');
const MISSION_VARIABLE_PACK_KEYS = [
  'vacancy_variables',
  'eligibility_variables',
  'paper_variables',
  'category_variables',
  'subject_variables',
  'department_variables',
  'fee_variables',
  'date_variables',
  'relaxation_variables',
  'link_variables',
  'amendment_variables',
];

function cloneJsonValue(value) {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return undefined;
  }
}

function mergeVariableMap(target, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined && entry !== null) target[key] = cloneJsonValue(entry);
  }
}

function collectMissionVariables(...sources) {
  const variables = {};
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    mergeVariableMap(variables, source.missionVariables);
    mergeVariableMap(variables, source.mission_variables);
    mergeVariableMap(variables, source.variablePacks);
    mergeVariableMap(variables, source.variable_packs);
    mergeVariableMap(variables, source.variables);
    for (const key of MISSION_VARIABLE_PACK_KEYS) {
      const value = source[key];
      if (Array.isArray(value) && value.length > 0) variables[key] = cloneJsonValue(value);
      else if (value && typeof value === 'object' && Object.keys(value).length > 0) variables[key] = cloneJsonValue(value);
    }
    for (const key of ['mediumPolicy', 'supportedMediums', 'defaultMedium']) {
      const value = source[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') variables[key] = cloneJsonValue(value);
    }
  }
  return variables;
}
async function updateMissionVariables({ db, auth, missionId, payload = {} }) {
  const reason = String(payload.reason || '').trim();
  const requestId = String(payload.requestId || '').trim();
  if (!missionId) throw new Error('MISSION_ID_REQUIRED');
  if (reason.length < 12) throw new Error('CHANGE_REASON_REQUIRED');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) throw new Error('INVALID_REQUEST_ID');
  if (!Number.isInteger(payload.expectedVersion) || payload.expectedVersion < 0) throw new Error('EXPECTED_VERSION_REQUIRED');

  const variables = normalizeMissionVariables(payload.missionVariables);
  const digest = canonicalDigest(variables);
  const realmRef = db.collection('mission_realms').doc(missionId);
  const userRef = db.collection('users').doc(auth.uid);
  const auditId = `mission_variable_${crypto.createHash('sha256').update(`${missionId}:${requestId}`).digest('hex')}`;
  const auditRef = db.collection('founder_activity_log').doc(auditId);

  return db.runTransaction(async transaction => {
    const [userSnap, realmSnap] = await Promise.all([
      transaction.get(userRef), transaction.get(realmRef),
    ]);
    assertFounderVariableAuthority(auth, userSnap.exists ? userSnap.data() : {});
    if (!realmSnap.exists) throw new Error('MISSION_CONTRACT_INCOMPLETE');

    const realm = realmSnap.data() || {};
    const currentVersion = Number(realm.missionVariableVersion || 0);
    const lastMutation = realm.missionVariableMutation || {};
    if (lastMutation.requestId === requestId) {
      if (lastMutation.digest !== digest) throw new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
      return { success: true, idempotent: true, version: currentVersion, digest };
    }
    if (currentVersion !== payload.expectedVersion) throw new Error('STALE_VARIABLE_VERSION');

    const identity = assertMissionIdentity({
      missionId, mission: realm, recruitment: realm,
      expectedExamYear: payload.expectedExamYear,
      expectedExamCategory: payload.expectedExamCategory,
    });
    assertPostPublicationSafety(realm, collectMissionVariables(realm), variables);

    const documentIds = referencedDocumentIds(variables);
    const documentSnaps = await Promise.all(documentIds.map(id => transaction.get(realmRef.collection('official_documents').doc(id))));
    const documentsById = {};
    for (let index = 0; index < documentIds.length; index += 1) {
      if (documentSnaps[index].exists) documentsById[documentIds[index]] = documentSnaps[index].data();
    }
    assertSourceDocumentBinding({ missionId, missionYear: identity.missionYear, variables, documentsById });

    const nextVersion = currentVersion + 1;
    const now = FieldValue.serverTimestamp();
    const compatibility = {
      missionVariables: variables,
      mediumPolicy: variables.mediumPolicy,
      supportedMediums: variables.supportedMediums,
      defaultMedium: variables.defaultMedium,
      missionVariableVersion: nextVersion,
      missionVariableUpdatedAt: now,
      missionVariableUpdatedBy: auth.uid,
      missionVariableMutation: { requestId, digest, reason },
    };
    transaction.update(realmRef, {
      ...compatibility,
      missionVariableValidation: { status: 'VALIDATED', sourceDocumentIds: documentIds, requiresContentRevalidation: true },
    });
    transaction.create(auditRef, {
      type: 'MISSION_VARIABLE_UPDATE', missionId, actorId: auth.uid,
      actorEmail: auth.token.email || null, requestId, reason,
      previousVersion: currentVersion, version: nextVersion, digest,
      sourceDocumentIds: documentIds, timestamp: now,
    });
    return { success: true, idempotent: false, version: nextVersion, digest };
  });
}
/**
 * SENTINEL ACTION CENTER (Hardened v6.0 - Fully Secure Command Connectivity)
 */
exports.handleSentinelAction = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
    secrets: ["GEMINI_API_KEY"]
  })
  .https.onCall(async (data, context) => {
  const { auth } = context;

  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }

  // 🔱 GOVERNANCE: Founders & Admins only
  const isFounder = auth.token.founder === true;
  const isAdmin = auth.token.admin === true;

  if (!isFounder && !isAdmin) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }

  const { draftId: reqDraftId, sourceId: reqSourceId, action, payload, recruitmentId: reqRecruitmentId } = data;
  const db = admin.firestore();

  assertMissionActionAuthorized(auth, action);

  try {
    console.log(`SENTINEL_ACTION: ${action} triggered by ${auth.uid} (${auth.token.email})`);

    // Governed separate notification + syllabus finalization. This is kept
    // outside the generic draft conveyor so AUTO_DETECT can never certify a
    // mission source.
    if (action === 'force_finalize_mission_source_pair') {
      return runSeparateSourcePairPipeline({
        db,
        storage: admin.storage(),
        auth,
        payload: payload || {},
        recordedAt: new Date().toISOString(),
      });
    }

    // ACTION: LOG FOUNDER ACTIVITY (Nerve Fix)
    if (action === 'log_founder_activity') {
        console.log("Logging activity...");
        await logFounderActivity({
            type: payload.type || 'UI_ACTION',
            message: payload.message || 'Founder performed an action.',
            metadata: payload.metadata || {}
        });
        return { success: true };
    }

    if (action === 'update_mission_variables') {
      return updateMissionVariables({ db, auth, missionId: reqRecruitmentId, payload: payload || {} });
    }

    // ACTION: PURGE HISTORICAL TEST DATA
    if (action === 'purge_historical_test_data') {
        const projectId = admin.app().options.projectId;
        const warriorsSnap = await db.collectionGroup('participants').get();
        const batch = db.batch();
        let count = 0;
        warriorsSnap.forEach(doc => {
            const data = doc.data();
            if (!data.environment || data.environment !== projectId || data.isMockData === true) {
                batch.delete(doc.ref);
                count++;
            }
        });
        if (count > 0) await batch.commit();
        return { success: true, purgedCount: count };
    }

    // Resolve IDs for Draft-based actions
    let finalDraftId = reqDraftId;
    if (!finalDraftId && reqSourceId) {
      const draftSnap = await db.collection('sentinel_drafts').where('sourceId', '==', reqSourceId).limit(1).get();
      if (!draftSnap.empty) finalDraftId = draftSnap.docs[0].id;
    }

    // ACTION: DRAFT GOVERNANCE (Publish, Verify, Reject, Reprocess)
    if (['publish', 'verify', 'reject', 'reprocess'].includes(action)) {
        if (!finalDraftId) throw new Error('DRAFT_ID_REQUIRED');
        const draftRef = db.collection('sentinel_drafts').doc(finalDraftId);
        const draftSnap = await draftRef.get();
        if (!draftSnap.exists) throw new Error('DRAFT_NOT_FOUND');

        const statusMap = {
            'publish': 'published',
            'verify': 'verified',
            'reject': 'rejected',
            'reprocess': 'under_review'
        };

        const targetStatus = statusMap[action];

        await draftRef.update({
            status: targetStatus,
            updatedAt: FieldValue.serverTimestamp(),
            lastActionBy: auth.uid
        });

        // If Publishing, trigger Refinery Pass 1 (Structural)
        if (action === 'publish') {
            const draftData = draftSnap.data();
            // A finalized notification is an official document under the
            // canonical mission realm. It must never be materialized into a
            // parallel recruitment or student-catalog document.
            if (draftData.linkedRealmId) {
                const realmRef = db.collection('mission_realms').doc(draftData.linkedRealmId);
                const realmSnap = await realmRef.get();
                if (!realmSnap.exists) throw new Error('CANONICAL_REALM_NOT_FOUND_FOR_NOTIFICATION');
                const documentId = String(draftData.sourceId || finalDraftId).trim();
                const officialDocument = buildCanonicalOfficialDocument({
                    id: documentId,
                    sourceId: documentId,
                    documentType: draftData.documentType || draftData.type || 'NOTIFICATION',
                    title: draftData.title || draftData.notificationTitle || draftData.sourceName || documentId,
                    sourceUrl: draftData.sourceUrl || draftData.url || null,
                    sourceHash: draftData.sourceHash || draftData.hash || null,
                    documentStatus: 'PUBLISHED',
                    verificationState: 'FOUNDER_PUBLISHED',
                    linkedDraftId: finalDraftId,
                    publishedBy: auth.uid,
                    publishedAt: FieldValue.serverTimestamp(),
                }, draftData.linkedRealmId);
                await realmRef.collection('official_documents').doc(documentId).set(officialDocument, { merge: true });
                await realmRef.set({
                    notification_ids: FieldValue.arrayUnion(documentId),
                    latestNotificationDocumentId: documentId,
                    updatedAt: FieldValue.serverTimestamp(),
                    updated_at: FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            const taskId = `struct_${finalDraftId}`;
            await db.collection('ai_queue').doc(taskId).set({
                type: 'STRUCTURAL',
                payload: {
                    id: draftData.sourceId || finalDraftId,
                    text: draftData.fullText || JSON.stringify(draftData.rawData),
                    draftId: finalDraftId
                },
                manualTrigger: true,
                createdAt: FieldValue.serverTimestamp(),
                triggeredBy: auth.uid
            });
        }

        await logFounderActivity({
            type: `DRAFT_${action.toUpperCase()}`,
            message: `Founder moved draft ${finalDraftId} to ${targetStatus}`,
            metadata: { draftId: finalDraftId, action }
        });

        return { success: true, status: targetStatus };
    }

    // 🔱 ACTION: PUSH TO AI QUEUE (Proxy - RC-A.1 Corrected)
    if (action === 'push_to_ai_queue') {
        const { taskId, type, provider, payload: taskPayload } = payload;
        console.log(`PUSHING TO AI QUEUE: taskId=${taskId}, type=${type}`);
        await db.collection('ai_queue').doc(taskId).set({
            type,
            provider: provider || 'gemini',
            payload: taskPayload,
            status: 'received', // 🔱 CRITICAL FINDING #3 FIX: Worker heartbeat restored
            manualTrigger: true,
            createdAt: FieldValue.serverTimestamp(),
            triggeredBy: auth.uid
        });
        console.log("Successfully pushed to queue with status: received");
        return { success: true };
    }

    // ACTION: MANIFEST LEARNING (Trigger Manifestation Worker)
    if (action === 'manifest_learning') {
        if (!finalDraftId) throw new Error('DRAFT_ID_REQUIRED');
        const draftSnap = await db.collection('sentinel_drafts').doc(finalDraftId).get();
        if (!draftSnap.exists) throw new Error('DRAFT_NOT_FOUND');
        const draftData = draftSnap.data();

        const taskId = `manifest_${finalDraftId}`;
        await db.collection('ai_queue').doc(taskId).set({
            type: 'MANIFEST_KNOWLEDGE',
            payload: {
                sourceDocumentId: draftData.sourceId || finalDraftId,
                atomicTopicId: draftData.atomicTopicId || 'unmapped',
                examId: draftData.recruitmentId || draftData.linkedRealmId || 'global', // 🔱 Fixed RC-17: Canon ID
                draftId: finalDraftId
            },
            manualTrigger: true,
            createdAt: FieldValue.serverTimestamp(),
            triggeredBy: auth.uid
        });

        await logFounderActivity({
            type: 'MANIFEST_TRIGGERED',
            message: `Founder triggered learning manifestation for ${finalDraftId}`,
            metadata: { draftId: finalDraftId }
        });
        return { success: true, taskId };
    }

    // ACTION: VERIFY KNOWLEDGE BLOCK
    if (action === 'verify_knowledge_block') {
        const { blockId, status } = payload;
        await db.collection('digibook_refinery').doc(blockId).update({
            status: status || 'verified',
            verifiedBy: auth.uid,
            verifiedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    }

    // ACTION: APPROVE STORAGE PURGE (Founder Authority Condition B)
    if (action === 'approve_storage_purge') {
        const { sourceId } = payload;
        await db.collection('ingestion_refinery').doc(sourceId).update({
            purgeApproved: true,
            purgeApprovedBy: auth.uid,
            purgeApprovedAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    }

    // ACTION: FOUNDER VERIFICATION (Participants)
    if (action === 'verify_participant_claim') {
        const { userId, status, reason, verifiedScore, verifiedRank } = payload;
        const realmRef = reqRecruitmentId ? db.collection('mission_realms').doc(reqRecruitmentId) : null;
        if (!realmRef) throw new Error('REALM_ID_REQUIRED');
        const pRef = realmRef.collection('participants').doc(userId);
        const pSnap = await pRef.get();
        if (!pSnap.exists) throw new Error('PARTICIPANT_NOT_FOUND');

        await pRef.update({
            'attempts.FINAL_RESULT.status': status === 'VERIFIED' ? 'CERTIFICATE_ELIGIBLE' : status,
            'attempts.FINAL_RESULT.verifiedScore': verifiedScore || null,
            'attempts.FINAL_RESULT.verifiedRank': verifiedRank || null,
            'attempts.FINAL_RESULT.verifiedBy': auth.uid,
            'attempts.FINAL_RESULT.verifiedAt': FieldValue.serverTimestamp()
        });
        return { success: true };
    }

    // TRANSACTIONAL OPS (Launch & Declare)
    let graduationNeeded = null;

    const result = await db.runTransaction(async (transaction) => {
      let recruitmentId = reqRecruitmentId || null;
      if (action !== 'launch_exam_mission' && action !== 'bootstrap_mission_shell') {
        recruitmentId = validateOrResolveId(action, payload, recruitmentId);
      }
      const realmRef = recruitmentId ? db.collection('mission_realms').doc(recruitmentId) : null;

      // ACTION: BOOTSTRAP HIDDEN MISSION SHELL BEFORE OFFICIAL SOURCE UPLOAD
      if (action === 'bootstrap_mission_shell') {
        return executeMissionShellBootstrap({
          transaction,
          db,
          payload: payload || {},
          auth,
          recordedAt: FieldValue.serverTimestamp(),
        });
      }

      // ACTION: LAUNCH EXAM MISSION
      // B5: UNIFIED MISSION CREATION - B1 identity -> B3 preflight -> B2 cycle -> draft pointer.
      // (Early return: the pre-existing shell-only branch below is retained untouched for the
      //  owning lane reconciliation and is superseded by this governed flow.)
      if (action === 'launch_exam_mission') {
        const unifiedCreation = await executeUnifiedMissionCreation({
          transaction: transaction,
          db: db,
          payload: payload || {},
          actorId: auth.uid,
          recordedAt: FieldValue.serverTimestamp(),
        });
        return {
          success: true,
          action,
          missionId: unifiedCreation.missionId,
          cycleKey: unifiedCreation.cycleKey,
          createdParent: unifiedCreation.createdParent,
          syllabusBindingMode: unifiedCreation.syllabusBindingMode,
          enrichmentStatus: unifiedCreation.summary.enrichmentStatus,
          enrichmentTaskKey: unifiedCreation.handoff.enrichmentTaskKey,
        };
      }
      // 🔱 ACTION: MANIFEST REALM (Candidate -> Staged)
      else if (action === 'manifest_realm') {
        if (!recruitmentId) throw new Error('RECRUITMENT_ID_REQUIRED');

        const realmSnap = await transaction.get(realmRef);
        if (!realmSnap.exists) throw new Error('CANONICAL_REALM_NOT_FOUND');
        const realmData = realmSnap.data() || {};
        transaction.update(realmRef, {
          status: 'STAGED',
          manifestedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        // 🔱 Ensure source drafts are published to trigger promotion (RC-19 Fix)
        // This closes the loop between verification and manifestation.
        const sourceDrafts = realmData.sourceDrafts || {};
        if (sourceDrafts) {
            if (sourceDrafts.notification) {
                transaction.update(db.collection('sentinel_drafts').doc(sourceDrafts.notification), {
                    linkedRealmId: recruitmentId,
                    status: 'published' // 🔱 Auto-Publish on Manifestation
                });
            }
            if (sourceDrafts.syllabus) {
                transaction.update(db.collection('sentinel_drafts').doc(sourceDrafts.syllabus), {
                    linkedRealmId: recruitmentId,
                    status: 'published' // 🔱 Auto-Publish on Manifestation
                });
            }
        }
      }

      // ACTION: MANAGE REALM LIFECYCLE (Hardened RC-14 Sync)
      else if (['launch_realm', 'pause_realm', 'archive_realm', 'restore_realm'].includes(action)) {
          if (!realmRef) throw new Error('REALM_ID_REQUIRED');
          const userRef = db.collection('users').doc(auth.uid);
          const { reason, requestId } = validateLifecycleRequest(action, payload || {});
          const auditRef = db.collection('founder_activity_log').doc(lifecycleAuditId(recruitmentId, action, requestId));
          const [userSnap, realmSnap, auditSnap] = await Promise.all([
            transaction.get(userRef), transaction.get(realmRef), transaction.get(auditRef),
          ]);
          assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});
          if (auditSnap.exists) {
            const prior = auditSnap.data() || {};
            if (prior.action !== action || prior.reason !== reason) throw new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
            return { success: true, idempotent: true, action, state: prior.nextState };
          }
          if (!realmSnap.exists) throw new Error('MISSION_CONTRACT_INCOMPLETE');
          const target = lifecycleProjection(action);
          const realmData = realmSnap.data() || {};
          const identityValues = [
            realmData.realm_id,
            realmData.id,
          ].filter(value => value !== undefined && value !== null && String(value).trim() !== '');
          if (identityValues.some(value => String(value) !== recruitmentId)) {
            throw new Error(`FAILED_PRECONDITION: Identity mismatch detected for existing mission ID '${recruitmentId}'.`);
          }
          const previousState = {
            realm: realmSnap.data()?.status || null,
          };
          const now = FieldValue.serverTimestamp();

          // B5: CYCLE-AWARE PUBLICATION - launch_realm requires an explicit cycleKey,
          // loads the selected authoritative cycle, and enforces B4 evidence-derived
          // publication eligibility. The selected cycle is never inferred.
          let cyclePublication = null;
          if (action === 'launch_realm') {
            cyclePublication = await executeCycleAwarePublication({
              transaction: transaction,
              db: db,
              missionId: recruitmentId,
              cycleKey: (payload || {}).cycleKey,
              reason,
              requestId,
              recordedAt: now,
            });
          }

          const isLaunch = action === 'launch_realm';
          // executeCycleAwarePublication already updates the realm atomically
          // for launch_realm. Other lifecycle actions update that same
          // canonical document here. No projection update is emitted.
          if (!cyclePublication) {
            transaction.update(realmRef, {
              status: target.realm,
              archived: target.realm === 'ARCHIVED',
              cardVisible: target.visible,
              userPanelVisible: target.visible,
              visibilityGate: {
                ...(realmData.visibilityGate || {}),
                studentVisible: target.visible,
                catalogVisible: target.visible,
                userPanelVisible: target.visible,
                cardVisible: target.visible,
                quickEntryEnabled: isLaunch,
                smartEntryEnabled: false,
                gateStatus: target.realm,
              },
              lifecycleMutation: { action, requestId, reason },
              updatedAt: now,
              updated_at: now,
            });
          }

          // executeCycleAwarePublication already updates the selected cycle
          // and canonical realm in this transaction.
          transaction.create(auditRef, {
            type: 'MISSION_LIFECYCLE', missionId: recruitmentId, actorId: auth.uid,
            action, requestId, reason, previousState,
            nextState: { realm: target.realm },
            dependencyPreflight: { eligible: true, blockers: [] }, timestamp: now,
          });
          return { success: true, idempotent: false, action, state: target.realm };
      }

      else if (action === 'delete_realm_permanently') {
          if (!realmRef) throw new Error('REALM_ID_REQUIRED');
          const userRef = db.collection('users').doc(auth.uid);
          const { reason, requestId } = validateLifecycleRequest(action, payload || {});
          const auditRef = db.collection('founder_activity_log').doc(lifecycleAuditId(recruitmentId, action, requestId));
          const participantQuery = realmRef.collection('participants').limit(1);
          const documentQuery = realmRef.collection('official_documents').limit(1);
          const queueQuery = db.collection('ai_queue').where('missionId', '==', recruitmentId).limit(1);
          const syllabusQuery = db.collection('syllabus_registry').where('missionId', '==', recruitmentId).limit(1);
          const sourceDocumentQuery = db.collection('source_documents').where('missionId', '==', recruitmentId).limit(1);
          const [userSnap, realmSnap, auditSnap, participantsSnap, documentsSnap, queueSnap, syllabusSnap, sourceDocumentsSnap] = await Promise.all([
            transaction.get(userRef), transaction.get(realmRef), transaction.get(auditRef),
            transaction.get(participantQuery), transaction.get(documentQuery),
            transaction.get(queueQuery), transaction.get(syllabusQuery), transaction.get(sourceDocumentQuery),
          ]);
          assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});
          if (auditSnap.exists) return { success: true, idempotent: true, deleted: true };
          const realm = realmSnap.exists ? realmSnap.data() || {} : {};
          const preflight = evaluateDeletePreflight({
            realmExists: realmSnap.exists,
            recruitmentExists: true,
            catalogStudentVisible: realm.cardVisible === true || realm.userPanelVisible === true || realm.visibilityGate?.studentVisible === true,
            activeRecruitment: ['published', 'active', 'live'].includes(String(realm.status || '').toLowerCase()),
            studentAssignments: !participantsSnap.empty,
            documents: !documentsSnap.empty || !sourceDocumentsSnap.empty,
            syllabus: !syllabusSnap.empty || realm.contentLocks?.syllabusPublished === true,
            digibook: realm.contentLocks?.digibookPublished === true,
            crucible: realm.contentLocks?.cruciblePublished === true,
            publicationHistory: realm.publishedAt != null || realm.publishStatus === 'published' || realm.status === 'ACTIVE',
            queueJobs: !queueSnap.empty,
            unresolvedProjection: false,
          });
          if (!preflight.eligible) {
            throw new functions.https.HttpsError('failed-precondition', `DELETE_BLOCKED:${preflight.blockers.join(',')}`);
          }
          const now = FieldValue.serverTimestamp();
          const sourceDraftIds = [...new Set([
            ...(Array.isArray(realm.notification_ids) ? realm.notification_ids : []),
            ...(Array.isArray(realm.syllabus_ids) ? realm.syllabus_ids : []),
          ].filter(Boolean))];
          const sourceDraftRefs = sourceDraftIds.map(id => db.collection('sentinel_drafts').doc(id));
          const sourceDraftSnaps = await Promise.all(sourceDraftRefs.map(ref => transaction.get(ref)));
          for (let index = 0; index < sourceDraftRefs.length; index += 1) {
            if (sourceDraftSnaps[index].exists && sourceDraftSnaps[index].data()?.linkedRealmId === recruitmentId) {
              transaction.update(sourceDraftRefs[index], {
                linkedRealmId: null,
                lifecycleUnlinkedAt: now,
                lifecycleUnlinkedBy: auth.uid,
              });
            }
          }
          transaction.delete(realmRef);
          transaction.create(auditRef, {
            type: 'MISSION_LIFECYCLE', missionId: recruitmentId, actorId: auth.uid,
            action, requestId, reason, previousState: { realm: realm.status || null },
            nextState: { realm: 'DELETED' },
            dependencyPreflight: preflight, deletedTargets: [realmRef.path],
            retainedUnlinkedSources: sourceDraftRefs.map(ref => ref.path), timestamp: now,
          });
          return { success: true, idempotent: false, deleted: true, deletedTargets: [realmRef.path] };
      }

      // ACTION: DECLARE RESULT
      else if (action === 'declare_result') {
          const { finalStatus, resultDeclarationId: reqDeclId, resultCycle } = payload || {};
          const resultDeclarationId = String(reqDeclId || resultCycle || 'cycle_1').trim();
          const completionStatus = finalStatus === 'WON' ? 'GRADUATED' : 'ARCHIVED';

          const realmSnap = await transaction.get(realmRef);
          if (!realmSnap.exists) throw new Error('CANONICAL_REALM_NOT_FOUND');

          const existingRealm = realmSnap.data() || {};
          const existingSideEffects = existingRealm.resultSideEffects || {};
          const existingDeclId = existingSideEffects.resultDeclarationId || '';

          const currentCycleNum = parseInt(existingDeclId.replace(/[^\d]/g, '') || '0', 10);
          const thisCycleNum = parseInt(resultDeclarationId.replace(/[^\d]/g, '') || '0', 10);

          if (thisCycleNum < currentCycleNum) {
            console.log(`STALE_TRANSACTION_PREVENTED: Decl cycle ${resultDeclarationId} is older than current ${existingDeclId}.`);
            return { success: true };
          }

          let nextSideEffects = {};
          if (existingSideEffects.resultDeclarationId === resultDeclarationId) {
            nextSideEffects = { ...existingSideEffects };
            const isCertInProgress = nextSideEffects.certificate && nextSideEffects.certificate.status === 'IN_PROGRESS';
            const isAnalInProgress = nextSideEffects.analytics && nextSideEffects.analytics.status === 'IN_PROGRESS';
            
            if (isCertInProgress || isAnalInProgress) {
              let lastUpdatedMs = 0;
              if (existingSideEffects.updatedAt) {
                if (typeof existingSideEffects.updatedAt.toDate === 'function') {
                  lastUpdatedMs = existingSideEffects.updatedAt.toDate().getTime();
                } else if (existingSideEffects.updatedAt instanceof Date) {
                  lastUpdatedMs = existingSideEffects.updatedAt.getTime();
                } else if (typeof existingSideEffects.updatedAt === 'number') {
                  lastUpdatedMs = existingSideEffects.updatedAt;
                } else if (typeof existingSideEffects.updatedAt === 'string') {
                  lastUpdatedMs = new Date(existingSideEffects.updatedAt).getTime();
                }
              }
              const LEASE_TIMEOUT_MS = 300000; // 5 minutes
              if (Date.now() - lastUpdatedMs < LEASE_TIMEOUT_MS) {
                throw new Error('CONCURRENT_EXECUTION_BLOCKED');
              }
            }

            if (nextSideEffects.certificate.status !== 'SUCCESS' && nextSideEffects.certificate.status !== 'FAILED_FINAL') {
              nextSideEffects.certificate.status = 'PENDING';
            }
            if (nextSideEffects.analytics.status !== 'SUCCESS' && nextSideEffects.analytics.status !== 'FAILED_FINAL') {
              nextSideEffects.analytics.status = 'PENDING';
            }
            nextSideEffects.retryRequired = (nextSideEffects.certificate.status !== 'SUCCESS' || nextSideEffects.analytics.status !== 'SUCCESS') &&
                                            nextSideEffects.certificate.status !== 'FAILED_FINAL' &&
                                            nextSideEffects.analytics.status !== 'FAILED_FINAL';
          } else {
            // Migrate legacy fields if present
            const legacyCert = existingRealm.certificateSideEffectStatus || 'PENDING';
            const legacyAnal = existingRealm.analyticsSideEffectStatus || 'PENDING';
            nextSideEffects = {
              resultDeclarationId,
              certificate: { status: legacyCert, attemptCount: 0 },
              analytics: { status: legacyAnal, attemptCount: 0 },
              retryRequired: (legacyCert !== 'SUCCESS' || legacyAnal !== 'SUCCESS')
            };
          }

          transaction.update(realmRef, {
            completion_status: completionStatus,
            closedAt: FieldValue.serverTimestamp(),
            certificateSideEffectStatus: nextSideEffects.certificate.status,
            analyticsSideEffectStatus: nextSideEffects.analytics.status,
            resultSideEffects: nextSideEffects
          });

          if (finalStatus === 'WON' && nextSideEffects.retryRequired) {
            graduationNeeded = {
              realmId: recruitmentId,
              resultDeclarationId,
              sideEffects: nextSideEffects
            };
          }

          // Result state is authoritative on the canonical mission realm.
      }

      // ACTION: DELETE (Hardened Cleanup with Physical Storage Purge)
      else if (action === 'delete') {
        const draftRef = finalDraftId ? db.collection('sentinel_drafts').doc(finalDraftId) : null;
        let resolvedSourceId = reqSourceId || null;

        // Identity Resolution: Find physical source from draft if missing
        if (!resolvedSourceId && draftRef) {
            const draftSnap = await transaction.get(draftRef);
            if (draftSnap.exists) {
                resolvedSourceId = draftSnap.data().sourceId || null;
            }
        }

        const refineryRef = resolvedSourceId ? db.collection('ingestion_refinery').doc(resolvedSourceId) : null;
        let storagePathToDelete = null;

        if (refineryRef) {
            const refinerySnap = await transaction.get(refineryRef);
            if (refinerySnap.exists) {
                storagePathToDelete = refinerySnap.data().storagePath || null;
            }
            transaction.delete(refineryRef);
        }
        if (draftRef) transaction.delete(draftRef);
        const cleanupId = resolvedSourceId || finalDraftId;
        if (cleanupId) {
          transaction.delete(db.collection('ai_queue').doc(cleanupId));
          transaction.delete(db.collection('ai_failed_tasks').doc(cleanupId));
        }

        return { success: true, storagePathToDelete };
      }

      return { success: true };
    });

    // POST-TRANSACTION: PHYSICAL STORAGE STRIKE
    if (result.storagePathToDelete) {
        try {
            console.log(`PHYSICAL STRIKE: Purging storage file: ${result.storagePathToDelete}`);
            const bucketName = 'rankcrackers-55.firebasestorage.app';
            const bucket = admin.storage().bucket(bucketName);
            await bucket.file(result.storagePathToDelete).delete();
            console.log(`PURGE SUCCESS: ${result.storagePathToDelete}`);
        } catch (e) {
            console.warn(`PURGE WARNING: Physical file not found or already deleted - ${e.message}`);
        }
    }

    // POST-TRANSACTION: GRADUATION BATCH
    if (graduationNeeded) {
        const { realmId, resultDeclarationId, sideEffects } = graduationNeeded;
        let cert = { ...sideEffects.certificate };
        let anal = { ...sideEffects.analytics };
        let lastError = null;
        const MAX_RETRIES = 5;

        try {
            // 1. If certificates side-effect is not yet SUCCESS, run it
            if (cert.status !== 'SUCCESS') {
                cert.status = 'IN_PROGRESS';
                cert.attemptCount++;
                await db.collection('mission_realms').doc(realmId).update({
                    resultSideEffects: {
                        resultDeclarationId,
                        certificate: cert,
                        analytics: anal,
                        updatedAt: FieldValue.serverTimestamp()
                    }
                });

                const isCertFailure = (typeof global !== 'undefined' && global.mockDatabaseState && global.mockDatabaseState.simulateCertificateBatchFailure) ||
                                      (typeof mockDatabaseState !== 'undefined' && mockDatabaseState.simulateCertificateBatchFailure);
                if (isCertFailure) {
                    throw new Error('BATCH_CERTIFICATE_WRITE_FAILED');
                }

                const participantsSnap = await db.collection('mission_realms').doc(realmId).collection('participants')
                    .where('attempts.FINAL_RESULT.status', '==', 'CERTIFICATE_ELIGIBLE').get();

                const batch = db.batch();
                let count = 0;
                participantsSnap.forEach(doc => {
                    const pData = doc.data();
                    if (pData.linkedCertificateId && pData.linkedCertificateId.includes(resultDeclarationId)) return;
                    count++;
                    const certId = `cert_${realmId}_${resultDeclarationId}_${doc.id}`;

                    batch.set(db.collection('certificates').doc(certId), {
                        certificateId: certId, userId: doc.id, realmId: realmId,
                        resultDeclarationId,
                        issueDate: FieldValue.serverTimestamp(),
                        status: 'GENERATING', isRegistryApproved: false,
                        metadata: {
                            examName: pData.attempts?.FINAL_RESULT?.examName || 'Mission Victory',
                            score: pData.attempts?.FINAL_RESULT?.verifiedScore || 0,
                            rank: pData.attempts?.FINAL_RESULT?.verifiedRank || null
                        }
                    });
                    batch.update(doc.ref, { 
                        'attempts.FINAL_RESULT.status': 'CERTIFICATE_ISSUED', 
                        'linkedCertificateId': certId 
                    });
                });

                if (count > 0) {
                    await batch.commit();
                }
                cert.status = 'SUCCESS';
                await db.collection('mission_realms').doc(realmId).update({
                    certificateSideEffectStatus: 'SUCCESS',
                    resultSideEffects: {
                        resultDeclarationId,
                        certificate: cert,
                        analytics: anal,
                        updatedAt: FieldValue.serverTimestamp()
                    }
                });
            }

            // 2. If analytics side-effect is not yet SUCCESS, run it
            if (anal.status !== 'SUCCESS') {
                anal.status = 'IN_PROGRESS';
                anal.attemptCount++;
                await db.collection('mission_realms').doc(realmId).update({
                    resultSideEffects: {
                        resultDeclarationId,
                        certificate: cert,
                        analytics: anal,
                        updatedAt: FieldValue.serverTimestamp()
                    }
                });

                const isAnalyticsFailure = (typeof global !== 'undefined' && global.mockDatabaseState && global.mockDatabaseState.simulateAnalyticsBatchFailure) ||
                                           (typeof mockDatabaseState !== 'undefined' && mockDatabaseState.simulateAnalyticsBatchFailure);
                if (isAnalyticsFailure) {
                    throw new Error('BATCH_ANALYTICS_WRITE_FAILED');
                }

                const issuedParticipantsSnap = await db.collection('mission_realms').doc(realmId).collection('participants')
                    .where('attempts.FINAL_RESULT.status', '==', 'CERTIFICATE_ISSUED').get();
                let count = 0;
                issuedParticipantsSnap.forEach(() => {
                    count++;
                });

                if (count > 0) {
                    const batch = db.batch();
                    const eventId = `analytics_${realmId}_${resultDeclarationId}`;
                    const eventRef = db.collection('mission_realms').doc(realmId).collection('analytics_events').doc(eventId);
                    batch.set(eventRef, {
                        eventId,
                        resultDeclarationId,
                        count,
                        processedAt: FieldValue.serverTimestamp()
                    });
                    await batch.commit();

                    // Concurrency protected Transaction-level summary counter updates
                    await db.runTransaction(async (tx) => {
                        const realmRef = db.collection('mission_realms').doc(realmId);
                        const realmSnap = await tx.get(realmRef);
                        const realmData = realmSnap.data() || {};
                        
                        const currentSideEffects = realmData.resultSideEffects || {};
                        const currentDeclId = currentSideEffects.resultDeclarationId || '';
                        
                        const currentCycleNum = parseInt(currentDeclId.replace(/[^\d]/g, '') || '0', 10);
                        const thisCycleNum = parseInt(resultDeclarationId.replace(/[^\d]/g, '') || '0', 10);
                        
                        if (thisCycleNum < currentCycleNum) {
                            console.log(`STALE_WRITE_PREVENTED: Decl cycle ${resultDeclarationId} is older than current ${currentDeclId}.`);
                            return;
                        }

                        const currentGraduated = (realmData.analytics && realmData.analytics.graduated) || 0;
                        if (count >= currentGraduated) {
                            tx.update(realmRef, { 
                                'analytics.graduated': count 
                            });
                        }
                    });
                }
                anal.status = 'SUCCESS';
                await db.collection('mission_realms').doc(realmId).update({
                    analyticsSideEffectStatus: 'SUCCESS',
                    resultSideEffects: {
                        resultDeclarationId,
                        certificate: cert,
                        analytics: anal,
                        updatedAt: FieldValue.serverTimestamp()
                    }
                });
            }
        } catch (err) {
            console.error(`GRADUATION_BATCH_FAILED: ${err.message}`);
            lastError = err.message;
            if (cert.status === 'IN_PROGRESS') {
                cert.status = cert.attemptCount >= MAX_RETRIES ? 'FAILED_FINAL' : 'FAILED_RETRYABLE';
            }
            if (anal.status === 'IN_PROGRESS') {
                anal.status = anal.attemptCount >= MAX_RETRIES ? 'FAILED_FINAL' : 'FAILED_RETRYABLE';
            }
            throw err;
        } finally {
            try {
                const retryRequired = (cert.status === 'FAILED_RETRYABLE' || anal.status === 'FAILED_RETRYABLE');
                await db.collection('mission_realms').doc(realmId).update({
                    certificateSideEffectStatus: cert.status,
                    analyticsSideEffectStatus: anal.status,
                    resultSideEffects: {
                        resultDeclarationId,
                        certificate: cert,
                        analytics: anal,
                        lastError,
                        retryRequired,
                        updatedAt: FieldValue.serverTimestamp()
                    }
                });
            } catch (updateErr) {
                console.error(`Failed to update outbox state: ${updateErr.message}`);
            }
        }
    }

    return result;
  } catch (error) {
    console.error(`SENTINEL_ACTION_ERROR: ${error.message}`);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Asserts whether the authenticated context is authorized to perform the action.
 * strictly implements the Founder-only governance lock for sensitive/irreversible actions.
 */
function assertMissionActionAuthorized(auth, action) {
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }

  const isFounder = auth.token.founder === true;
  const isAdmin = auth.token.admin === true;
  const adminLevel = auth.token.adminLevel || 0;
  const permissions = auth.token.permissions || [];

  const sensitiveActions = ['bootstrap_mission_shell', 'force_finalize_mission_source_pair', 'launch_exam_mission', 'launch_realm', 'pause_realm', 'archive_realm', 'restore_realm', 'delete_realm_permanently', 'declare_result', 'update_mission_variables'];
  const lifecycleActions = ['manifest_realm'];

  if (sensitiveActions.includes(action)) {
    if (!isFounder) {
      throw new functions.https.HttpsError('permission-denied', `🔱 ACCESS DENIED: Founder clearance required for sensitive action '${action}'.`);
    }
  } else if (lifecycleActions.includes(action)) {
    if (isFounder) {
      return;
    }
    if (isAdmin && adminLevel >= 5) {
      const requiredPermission = {
        'manifest_realm': 'mission.manifest',
        'launch_realm': 'mission.launch',
        'pause_realm': 'mission.pause'
      }[action];
      if (permissions.includes(requiredPermission)) {
        return;
      }
    }
    throw new functions.https.HttpsError('permission-denied', `🔱 ACCESS DENIED: Upper Admin permission required for action '${action}'.`);
  } else {
    if (!isFounder && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', `🔱 ACCESS DENIED: Founder or Admin status required for action '${action}'.`);
    }
  }
}
