const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { logFounderActivity } = require("../services/audit_service");
const { getLifecycleBlueprint } = require("../helpers/blueprints");

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
      const recruitmentId = reqRecruitmentId || null;
      const realmRef = recruitmentId ? db.collection('mission_realms').doc(recruitmentId) : null;
      const recRef = recruitmentId ? db.collection('recruitments').doc(recruitmentId) : null;

      // ACTION: LAUNCH EXAM MISSION
      if (action === 'launch_exam_mission') {
        const { notificationId, syllabusId, examName, organization, year, examCategory, cycle, nature } = payload;
        const catCode = (examCategory || 'default').toLowerCase();
        const orgCode = (organization || 'central').toLowerCase().replace(/\s/g, '_');
        const examCode = (examName || 'exam').toLowerCase().replace(/\s/g, '_');
        const targetYear = year || 2026;

        // 🔱 Hardened Realm ID: rec_org_exam_year_cycle (RC-15 Fix)
        const realmId = `rec_${orgCode}_${examCode}_${targetYear}_${cycle || ''}`.replace(/_+/g, '_').replace(/_$/, '');

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

        // Mirror to student catalog
        mirrorMissionShellToStudentCatalog(transaction, db, realmId, { ...realmData, ...recruitmentData }, { status: realmData.status || 'DRAFT', isCreate: true, allowVisibility: false });

        blueprintToInject = getLifecycleBlueprint(catCode);
        createdRealmId = realmId;
      }

      // 🔱 ACTION: MANIFEST REALM (Candidate -> Staged)
      else if (action === 'manifest_realm') {
        if (!recruitmentId) throw new Error('RECRUITMENT_ID_REQUIRED');
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
        mirrorMissionShellToStudentCatalog(transaction, db, recruitmentId, { ...recData, ...realmData }, { status: realmData.status || 'STAGED', isCreate: true, allowVisibility: false });
      }

      // ACTION: MANAGE REALM LIFECYCLE (Hardened RC-14 Sync)
      else if (['launch_realm', 'pause_realm', 'archive_realm', 'restore_realm'].includes(action)) {
          if (!realmRef || !recRef) throw new Error('REALM_ID_REQUIRED');

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

          // Fetch fresh snapshots to build the mirror shell payload
          const realmSnap = await transaction.get(realmRef);
          const recSnap = await transaction.get(recRef);
          const realmData = { ...realmSnap.data(), status: target.realm };
          const recruitmentData = { ...recSnap.data(), status: target.rec };

          // Mirror to student catalog
          mirrorMissionShellToStudentCatalog(transaction, db, recruitmentId, { ...recruitmentData, ...realmData }, { status: realmData.status || 'DRAFT', allowVisibility: false });
      }

      // ACTION: DECLARE RESULT
      else if (action === 'declare_result') {
          const { finalStatus } = payload;
          const completionStatus = finalStatus === 'WON' ? 'GRADUATED' : 'ARCHIVED';
          transaction.update(realmRef, {
            completion_status: completionStatus,
            closedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          if (finalStatus === 'WON') graduationNeeded = recruitmentId;

          // Fetch fresh snapshots to build the mirror shell payload
          const realmSnap = await transaction.get(realmRef);
          const recSnap = await transaction.get(recRef);
          const realmData = { ...realmSnap.data(), completion_status: completionStatus };
          const recruitmentData = recSnap.data() || {};

          // Mirror to student catalog
          mirrorMissionShellToStudentCatalog(transaction, db, recruitmentId, { ...recruitmentData, ...realmData }, { status: realmData.status || 'DRAFT', allowVisibility: false });
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
        const participantsSnap = await db.collection('mission_realms').doc(graduationNeeded).collection('participants')
            .where('attempts.FINAL_RESULT.status', '==', 'CERTIFICATE_ELIGIBLE').get();

        const batch = db.batch();
        let count = 0;
        participantsSnap.forEach(doc => {
            const pData = doc.data();
            if (pData.linkedCertificateId) return;
            count++;
            const certId = `cert_${graduationNeeded}_${doc.id}`;
            const vHash = crypto.createHash('sha256').update(`${doc.id}_${graduationNeeded}_rankcrackers`).digest('hex');

            batch.set(db.collection('certificates').doc(certId), {
                certificateId: certId, userId: doc.id, realmId: graduationNeeded,
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
            batch.update(db.collection('mission_realms').doc(graduationNeeded), { 'analytics.graduated': admin.firestore.FieldValue.increment(count) });
            await batch.commit();
        }
    }

    return result;
  } catch (error) {
    console.error(`SENTINEL_ACTION_ERROR: ${error.message}`);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Pure safe-shell builder for student_mission_catalog mirror metadata.
 * This does not include academic content or private Founder workbench data.
 */
function buildStudentMissionCatalogShell(missionId, missionData = {}, options = {}) {
  if (!missionId) throw new Error('MISSION_ID_REQUIRED_FOR_STUDENT_CATALOG_MIRROR');
  const title = String(
    missionData.title ||
    missionData.displayTitle ||
    missionData.recruitment_name ||
    missionData.exam_name ||
    missionData.examName ||
    missionId
  ).trim();
  const supportedMediums = Array.isArray(missionData.supportedMediums) && missionData.supportedMediums.length
    ? missionData.supportedMediums.map((item) => String(item).trim().toUpperCase()).filter(Boolean)
    : ['ENGLISH'];
  const allowVisibility = options.allowVisibility === true;
  const shell = {
    missionId,
    title,
    displayTitle: String(missionData.displayTitle || missionData.displayName || title).trim(),
    examName: String(missionData.examName || missionData.exam_name || title).trim(),
    examYear: missionData.examYear || missionData.exam_year || missionData.year || null,
    missionType: String(missionData.missionType || missionData.exam_category || missionData.examCategory || '').trim(),
    missionStructureType: String(missionData.missionStructureType || missionData.structure || 'SHELL_ONLY').trim(),
    examScope: String(missionData.examScope || missionData.scope || '').trim(),
    mediumPolicy: String(missionData.mediumPolicy || 'ENGLISH_ONLY').trim(),
    supportedMediums,
    defaultMedium: String(missionData.defaultMedium || supportedMediums[0] || 'ENGLISH').trim(),
    status: String(options.status || missionData.status || 'DRAFT').trim().toUpperCase(),
    visibility: {
      studentVisible: allowVisibility && missionData.studentVisible === true,
      catalogVisible: allowVisibility && missionData.catalogVisible === true,
      quickEntryEnabled: allowVisibility && missionData.quickEntryEnabled === true,
      smartEntryEnabled: allowVisibility && missionData.smartEntryEnabled === true
    },
    source: {
      missionRealmPath: 'mission_realms/' + missionId,
      mirroredBy: 'handleSentinelAction',
      mirrorPhase: 'FUP_2C_MIRROR1_RETRY'
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
  if (options.isCreate === true) shell.createdAt = admin.firestore.FieldValue.serverTimestamp();
  return shell;
}

/**
 * Transactional safe-shell mirror. Validation must not execute this against production Firestore.
 */
function mirrorMissionShellToStudentCatalog(transaction, db, missionId, missionData = {}, options = {}) {
  const shell = buildStudentMissionCatalogShell(missionId, missionData, options);
  transaction.set(db.collection('student_mission_catalog').doc(missionId), shell, { merge: true });
  return shell;
}

exports.buildStudentMissionCatalogShell = buildStudentMissionCatalogShell;
exports.mirrorMissionShellToStudentCatalog = mirrorMissionShellToStudentCatalog;
