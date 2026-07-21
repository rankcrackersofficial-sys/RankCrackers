const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { logFounderActivity } = require("../services/audit_service");
const { getLifecycleBlueprint } = require("../helpers/blueprints");
const { validateOrResolveId } = require("../canonical_mission_registry");

/**
 * SENTINEL ACTION CENTER (Hardened v5.5 - Full Command Connectivity)
 * Supreme authority for Discovery, Launch, Verification, and Knowledge Lifecycle.
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
    // 🔱 Emergency Recovery: Grant claims to primary test account if missing
    if (auth.token.email === 'founder.rcofficial@gmail.com') {
        console.log(`🔱 EMERGENCY RECOVERY: Granting Founder status to ${auth.uid}`);
        await admin.auth().setCustomUserClaims(auth.uid, { admin: true, founder: true, accessLevel: 9 });
    } else {
        throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
    }
  }

  const { draftId: reqDraftId, sourceId: reqSourceId, action, payload, recruitmentId: reqRecruitmentId } = data;
  const db = admin.firestore();

  assertMissionActionAuthorized(auth, action);

  try {
    console.log(`SENTINEL_ACTION: ${action} triggered by ${auth.uid} (${auth.token.email})`);

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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastActionBy: auth.uid
        });

        // If Publishing, trigger Refinery Pass 1 (Structural)
        if (action === 'publish') {
            const draftData = draftSnap.data();
            const taskId = `struct_${finalDraftId}`;
            await db.collection('ai_queue').doc(taskId).set({
                type: 'STRUCTURAL',
                payload: {
                    id: draftData.sourceId || finalDraftId,
                    text: draftData.fullText || JSON.stringify(draftData.rawData),
                    draftId: finalDraftId
                },
                manualTrigger: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
            verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }

    // ACTION: APPROVE STORAGE PURGE (Founder Authority Condition B)
    if (action === 'approve_storage_purge') {
        const { sourceId } = payload;
        await db.collection('ingestion_refinery').doc(sourceId).update({
            purgeApproved: true,
            purgeApprovedBy: auth.uid,
            purgeApprovedAt: admin.firestore.FieldValue.serverTimestamp()
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
            'attempts.FINAL_RESULT.verifiedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }

    // TRANSACTIONAL OPS (Launch & Declare)
    let blueprintToInject = null;
    let createdRealmId = null;
    let graduationNeeded = null;

    const result = await db.runTransaction(async (transaction) => {
      let recruitmentId = reqRecruitmentId || null;
      if (action !== 'launch_exam_mission') {
        recruitmentId = validateOrResolveId(action, payload, recruitmentId);
      }
      const realmRef = recruitmentId ? db.collection('mission_realms').doc(recruitmentId) : null;
      const recRef = recruitmentId ? db.collection('recruitments').doc(recruitmentId) : null;

      // ACTION: LAUNCH EXAM MISSION
      if (action === 'launch_exam_mission') {
        const { notificationId, syllabusId, examName, organization, year, examCategory, cycle, nature } = payload;
        const catCode = (examCategory || 'default').toLowerCase();
        const targetYear = year || 2026;

        // Resolve canonical mission ID from shared registry
        const realmId = validateOrResolveId(action, payload);

        // Transactional lookup for existing records to enforce uniqueness & identity verification
        const existingRealmRef = db.collection('mission_realms').doc(realmId);
        const existingRealmSnap = await transaction.get(existingRealmRef);
        if (existingRealmSnap.exists) {
          const existingData = existingRealmSnap.data() || {};
          const matchName = String(existingData.exam_name || '').trim().toLowerCase() === String(examName || '').trim().toLowerCase();
          const matchOrg = String(existingData.organization || '').trim().toLowerCase() === String(organization || '').trim().toLowerCase();
          const matchYear = parseInt(existingData.exam_year || 0, 10) === parseInt(targetYear, 10);
          
          if (!matchName || !matchOrg || !matchYear) {
            throw new Error(`FAILED_PRECONDITION: Identity mismatch detected for existing mission ID '${realmId}'.`);
          }
        }

        // 1. READ catalog snapshot first (before any sets)
        const catalogRef = db.collection('student_mission_catalog').doc(realmId);
        const catalogSnap = await transaction.get(catalogRef);

        const now = admin.firestore.FieldValue.serverTimestamp();
        const realmData = {
          realm_id: realmId, exam_name: examName, exam_category: catCode, organization, exam_year: targetYear,
          status: nature || 'PASSIVE',
          notification_ids: notificationId ? [notificationId] : [],
          syllabus_ids: syllabusId ? [syllabusId] : [],
          analytics: { totalAttempts: 0, qualified: 0, graduated: 0, verified: 0 },
          launchedAt: now,
          created_at: now,
          updated_at: now,
          created_by: auth.uid
        };
        transaction.set(db.collection('mission_realms').doc(realmId), realmData, { merge: true });

        // Link Discovery Drafts to Realm
        if (notificationId) transaction.update(db.collection('sentinel_drafts').doc(notificationId), { linkedRealmId: realmId });
        if (syllabusId) transaction.update(db.collection('sentinel_drafts').doc(syllabusId), { linkedRealmId: realmId });

        // 🔱 Forensic Fix: Recruitment Manifestation (RC-07)
        const recruitmentData = {
          id: realmId,
          title: examName,
          org: organization,
          year: targetYear,
          examCategory: catCode,
          status: 'published',
          nature: nature || 'PASSIVE',
          createdAt: now,
          version: '1.0.0'
        };
        transaction.set(db.collection('recruitments').doc(realmId), recruitmentData, { merge: true });

        // Mirror to student catalog using the pre-read snapshot
        await mirrorMissionShellToStudentCatalog(transaction, db, realmId, realmData, recruitmentData, action, catalogSnap);

        blueprintToInject = getLifecycleBlueprint(catCode);
        createdRealmId = realmId;
      }

      // 🔱 ACTION: MANIFEST REALM (Candidate -> Staged)
      else if (action === 'manifest_realm') {
        if (!recruitmentId) throw new Error('RECRUITMENT_ID_REQUIRED');

        // 1. READ catalog snapshot first
        const catalogRef = db.collection('student_mission_catalog').doc(recruitmentId);
        const catalogSnap = await transaction.get(catalogRef);

        const recSnap = await transaction.get(recRef);
        if (!recSnap.exists) throw new Error('CANDIDATE_NOT_FOUND');
        const recData = recSnap.data();

        const realmData = {
          realm_id: recruitmentId,
          recruitment_name: recData.title,
          organization: recData.org,
          exam_year: recData.year,
          status: 'STAGED',
          manifestedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        transaction.set(realmRef, realmData, { merge: true });

        transaction.update(recRef, { status: 'MANIFESTED' });

        // 🔱 Ensure source drafts are published to trigger promotion (RC-19 Fix)
        // This closes the loop between verification and manifestation.
        if (recData.sourceDrafts) {
            if (recData.sourceDrafts.notification) {
                transaction.update(db.collection('sentinel_drafts').doc(recData.sourceDrafts.notification), {
                    linkedRealmId: recruitmentId,
                    status: 'published' // 🔱 Auto-Publish on Manifestation
                });
            }
            if (recData.sourceDrafts.syllabus) {
                transaction.update(db.collection('sentinel_drafts').doc(recData.sourceDrafts.syllabus), {
                    linkedRealmId: recruitmentId,
                    status: 'published' // 🔱 Auto-Publish on Manifestation
                });
            }
        }

        // Mirror to student catalog
        await mirrorMissionShellToStudentCatalog(transaction, db, recruitmentId, realmData, recData, action, catalogSnap);
      }

      // ACTION: MANAGE REALM LIFECYCLE (Hardened RC-14 Sync)
      else if (['launch_realm', 'pause_realm', 'archive_realm', 'restore_realm'].includes(action)) {
          if (!realmRef || !recRef) throw new Error('REALM_ID_REQUIRED');

          // 1. READ catalog snapshot first
          const catalogRef = db.collection('student_mission_catalog').doc(recruitmentId);
          const catalogSnap = await transaction.get(catalogRef);

          const realmSnap = await transaction.get(realmRef);
          const recSnap = await transaction.get(recRef);

          const statusMap = {
            'launch_realm': { realm: 'ACTIVE', rec: 'published' },
            'pause_realm': { realm: 'PASSIVE', rec: 'hidden' },
            'archive_realm': { realm: 'ARCHIVED', rec: 'archived' },
            'restore_realm': { realm: 'PASSIVE', rec: 'published' }
          };

          const target = statusMap[action];

          transaction.update(realmRef, {
            status: target.realm,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });

          transaction.update(recRef, {
            status: target.rec,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          const realmData = { ...realmSnap.data(), status: target.realm };
          const recruitmentData = { ...recSnap.data(), status: target.rec };

          // Mirror to student catalog
          await mirrorMissionShellToStudentCatalog(transaction, db, recruitmentId, realmData, recruitmentData, action, catalogSnap);
      }

      // ACTION: DECLARE RESULT
      else if (action === 'declare_result') {
          const { finalStatus } = payload;
          const completionStatus = finalStatus === 'WON' ? 'GRADUATED' : 'ARCHIVED';

          // 1. READ catalog snapshot first
          const catalogRef = db.collection('student_mission_catalog').doc(recruitmentId);
          const catalogSnap = await transaction.get(catalogRef);

          const realmSnap = await transaction.get(realmRef);
          const recSnap = await transaction.get(recRef);

          const existingRealm = realmSnap.data() || {};
          const currentCertStatus = existingRealm.certificateSideEffectStatus || 'PENDING';
          const currentAnalStatus = existingRealm.analyticsSideEffectStatus || 'PENDING';

          transaction.update(realmRef, {
            completion_status: completionStatus,
            closedAt: admin.firestore.FieldValue.serverTimestamp(),
            certificateSideEffectStatus: currentCertStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            analyticsSideEffectStatus: currentAnalStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            lastSideEffectError: null,
            sideEffectRetryRequired: false
          });

          if (finalStatus === 'WON') {
            graduationNeeded = {
              realmId: recruitmentId,
              certStatus: currentCertStatus,
              analStatus: currentAnalStatus
            };
          }

          const realmData = { ...realmSnap.data(), completion_status: completionStatus };
          const recruitmentData = recSnap.data() || {};

          // Mirror to student catalog
          await mirrorMissionShellToStudentCatalog(transaction, db, recruitmentId, realmData, recruitmentData, action, catalogSnap);
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
        const { realmId, certStatus, analStatus } = graduationNeeded;
        let finalCertStatus = certStatus;
        let finalAnalStatus = analStatus;
        let lastError = null;

        try {
            // 1. If certificates side-effect is not yet SUCCESS, run it
            if (certStatus !== 'SUCCESS') {
                const participantsSnap = await db.collection('mission_realms').doc(realmId).collection('participants')
                    .where('attempts.FINAL_RESULT.status', '==', 'CERTIFICATE_ELIGIBLE').get();

                const batch = db.batch();
                let count = 0;
                participantsSnap.forEach(doc => {
                    const pData = doc.data();
                    if (pData.linkedCertificateId) return;
                    count++;
                    const certId = `cert_${realmId}_${doc.id}`;

                    batch.set(db.collection('certificates').doc(certId), {
                        certificateId: certId, userId: doc.id, realmId: realmId,
                        issueDate: admin.firestore.FieldValue.serverTimestamp(),
                        status: 'GENERATING', isRegistryApproved: false,
                        metadata: {
                            examName: pData.attempts?.FINAL_RESULT?.examName || 'Mission Victory',
                            score: pData.attempts?.FINAL_RESULT?.verifiedScore || 0,
                            rank: pData.attempts?.FINAL_RESULT?.verifiedRank || null
                        }
                    });
                    batch.update(doc.ref, { 'attempts.FINAL_RESULT.status': 'CERTIFICATE_ISSUED', 'linkedCertificateId': certId });
                });

                if (count > 0) {
                    await batch.commit();
                }
                finalCertStatus = 'SUCCESS';
            }

            // 2. If analytics side-effect is not yet SUCCESS, run it
            if (analStatus !== 'SUCCESS') {
                const issuedParticipantsSnap = await db.collection('mission_realms').doc(realmId).collection('participants')
                    .where('attempts.FINAL_RESULT.status', '==', 'CERTIFICATE_ISSUED').get();
                let count = 0;
                issuedParticipantsSnap.forEach(() => {
                    count++;
                });

                if (count > 0) {
                    const batch = db.batch();
                    batch.update(db.collection('mission_realms').doc(realmId), { 
                        'analytics.graduated': count 
                    });
                    await batch.commit();
                }
                finalAnalStatus = 'SUCCESS';
            }
        } catch (err) {
            console.error(`GRADUATION_BATCH_FAILED: ${err.message}`);
            lastError = err.message;
        }

        // Update the realm document with final side-effect statuses
        try {
            await db.collection('mission_realms').doc(realmId).update({
                certificateSideEffectStatus: finalCertStatus,
                analyticsSideEffectStatus: finalAnalStatus,
                lastSideEffectError: lastError,
                sideEffectRetryRequired: (finalCertStatus !== 'SUCCESS' || finalAnalStatus !== 'SUCCESS')
            });
        } catch (updateErr) {
            console.error(`Failed to update recovery metadata: ${updateErr.message}`);
        }

        if (finalCertStatus !== 'SUCCESS') {
            throw new Error(`BATCH_CERTIFICATE_WRITE_FAILED: ${lastError}`);
        }
        if (finalAnalStatus !== 'SUCCESS') {
            throw new Error(`BATCH_ANALYTICS_WRITE_FAILED: ${lastError}`);
        }
    }

    return result;
  } catch (error) {
    console.error(`SENTINEL_ACTION_ERROR: ${error.message}`);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Deterministic builder for student mission catalog document payload.
 */
function buildStudentMissionCatalogShell(realmId, realmData = {}, recruitmentData = {}, action = '') {
  if (!realmId) throw new Error('CANONICAL_ID_REQUIRED');

  const name = realmData.exam_name || realmData.recruitment_name || recruitmentData.title || '';
  const year = parseInt(realmData.exam_year || recruitmentData.year || 2026, 10);
  const category = realmData.exam_category || recruitmentData.examCategory || 'competitive';
  const lifecycleStatus = realmData.status || recruitmentData.nature || 'PASSIVE';
  const status = lifecycleStatus === 'ARCHIVED' || realmData.completion_status === 'ARCHIVED'
    ? 'ARCHIVED'
    : 'PRIVATE_REVIEW_LOCKED';

  return {
    missionId: realmId,
    title: name,
    displayTitle: name,
    examName: name,
    examYear: year,
    missionType: category,
    missionStructureType: realmData.missionStructureType || recruitmentData.missionStructureType || 'SINGLE_TRACK',
    examScope: realmData.examScope || recruitmentData.examScope || 'PRIVATE_REVIEW',
    mediumPolicy: realmData.mediumPolicy || recruitmentData.mediumPolicy || 'ENGLISH_ONLY',
    supportedMediums: Array.isArray(realmData.supportedMediums) ? realmData.supportedMediums : ['ENGLISH'],
    defaultMedium: realmData.defaultMedium || recruitmentData.defaultMedium || 'ENGLISH',
    status,
    visibility: {
      studentVisible: false,
      catalogVisible: false,
      userPanelVisible: false,
      quickEntryEnabled: false,
      smartEntryEnabled: false
    },
    source: {
      missionRealmPath: `mission_realms/${realmId}`,
      mirroredBy: 'handleSentinelAction',
      mirrorPhase: 'FUP_2C_MIRROR2',
      action
    },
    contentLocks: {
      syllabusPublished: false,
      topicNodesPublished: false,
      digibookPublished: false,
      cruciblePublished: false,
      pyqPublished: false,
      questionCellsPublished: false
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}
/**
 * Transactional helper to mirror mission shell to student_mission_catalog.
 */
async function mirrorMissionShellToStudentCatalog(transaction, db, realmId, realmData = {}, recruitmentData = {}, action = '', preReadCatalogSnap = null) {
  if (!realmId) throw new Error('CANONICAL_ID_REQUIRED');
  
  const catalogRef = db.collection('student_mission_catalog').doc(realmId);
  const catalogSnap = preReadCatalogSnap || await transaction.get(catalogRef);
  
  if (catalogSnap.exists) {
    const existing = catalogSnap.data() || {};
    
    // Check that immutable identity fields match
    const checks = {
      id: existing.id || existing.mission_id || realmId,
      mission_id: existing.mission_id || existing.id || realmId,
      recruitment_id: existing.recruitment_id || existing.recruitmentGroupId || realmId,
      recruitmentGroupId: existing.recruitmentGroupId || existing.recruitment_id || realmId
    };

    if (checks.id !== realmId || 
        checks.mission_id !== realmId || 
        checks.recruitment_id !== realmId || 
        checks.recruitmentGroupId !== realmId) {
      throw new Error('FAILED_PRECONDITION: Identity mismatch detected for immutable fields.');
    }
  }

  const payload = buildStudentMissionCatalogShell(realmId, realmData, recruitmentData, action);
  
  if (!catalogSnap.exists) {
    // Initial creation: inject creation timestamps
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    transaction.set(catalogRef, payload);
  } else {
    // Update existing: preserve immutable creation fields by omitting them
    transaction.set(catalogRef, payload, { merge: true });
  }
  return payload;
}

// Export helpers for testing
exports.buildStudentMissionCatalogShell = buildStudentMissionCatalogShell;
exports.mirrorMissionShellToStudentCatalog = mirrorMissionShellToStudentCatalog;

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

  const sensitiveActions = ['launch_exam_mission', 'archive_realm', 'restore_realm', 'declare_result'];

  if (sensitiveActions.includes(action)) {
    if (!isFounder) {
      throw new functions.https.HttpsError('permission-denied', `🔱 ACCESS DENIED: Founder clearance required for sensitive action '${action}'.`);
    }
  } else {
    if (!isFounder && !isAdmin) {
      throw new functions.https.HttpsError('permission-denied', `🔱 ACCESS DENIED: Founder or Admin status required for action '${action}'.`);
    }
  }
}


