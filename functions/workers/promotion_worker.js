const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logFounderActivity } = require("../services/audit_service");
const { isWorkerEnabled, getWorkerMode, updateHeartbeat } = require("../services/worker_service");

/**
 * SENTINEL PROMOTION WORKER (v8.2.6 - Hardened Imports)
 * Bridges the gap between Sentinel Drafts and Production-Ready Databases.
 */
exports.sentinelPromotionWorker = functions.firestore
  .document("sentinel_drafts/{draftId}")
  .onWrite(async (change, context) => {
    const draftId = context.params.draftId;
    if (!change.after.exists) return;

    // 🛡️ GOVERNANCE LAYER ENFORCEMENT
    if (!(await isWorkerEnabled('promotion_worker'))) {
        console.log("PROMOTION: Worker disabled or budget exceeded.");
        return;
    }

    const mode = await getWorkerMode('promotion_worker');
    if (mode === 'manualOnly') {
        console.log("PROMOTION: Manual mode active. Skipping auto-promotion.");
        return;
    }

    // Update Heartbeat for Dashboard
    await updateHeartbeat('promotion_worker', { activeDraft: draftId, status: 'ONLINE' });

    const draft = change.after.data();
    const beforeDraft = change.before.exists ? change.before.data() : null;
    const { type, status, rawData } = draft;

    // Promotion Gate: Trigger on 'verified' or 'published' status
    const validStatuses = ["verified", "published"];
    if (!validStatuses.includes(status) || (beforeDraft && beforeDraft.status === status)) return;

    console.log(`SENTINEL PROMOTION: Manifesting ${type} draft ${draftId} (Status: ${status})`);

    try {
      const batch = admin.firestore().batch();

      // ===================================================
      // TYPE: RECRUITMENT NOTIFICATION (Auto-Launch)
      // ===================================================
      if (type === "recruitment_notification" || type === "recruitment") {
        const { title, org, year, lastDate, vacancies } = rawData;

        // 🔱 RC-IDENTITY FIX: Canonical ID Alignment
        // Format: rec_org_exam_year
        const cleanOrg = (org || 'unknown').toLowerCase().replace(/\s/g, '_');
        const cleanTitle = (title || 'mission').toLowerCase().replace(/\s/g, '_');
        const targetYear = year || new Date().getFullYear();
        const recruitmentId = `rec_${cleanOrg}_${cleanTitle}_${targetYear}`;

        const recruitmentRef = admin.firestore().collection("recruitments").doc(recruitmentId);

        batch.set(recruitmentRef, {
            id: recruitmentId,
            title: title,
            titleHindi: title,
            boardId: org,
            org: org, // Alignment Fix
            state: 'Detected',
            year: targetYear,
            examCategory: rawData.examCategory || 'competitive',
            lastDate: lastDate || '',
            vacancies: vacancies || 0,
            status: 'review',
            version: 1,
            sourceDrafts: {
                notification: draftId
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Update draft with linked ID for traceability
        batch.update(change.after.ref, {
            recruitmentId: recruitmentId,
            promotedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await logFounderActivity({
          type: 'MISSION_AUTO_LAUNCH',
          message: `Mission Realm "${title}" initialized from discovery. ID: ${recruitmentId}`,
          metadata: { org, vacancies, recruitmentId }
        });
      }

      // ===================================================
      // TYPE: RECRUITMENT ALERT (DELIVERY)
      // ===================================================
      else if (type === "recruitment_alert") {
        const { uid, opportunityId, relevanceScore, title, isUrgent } = rawData;
        const notificationId = `evt_${uid}_${opportunityId}`;
        const notificationRef = admin.firestore().collection("users").doc(uid).collection("notifications").doc(notificationId);

        batch.set(notificationRef, {
            id: notificationId,
            missionId: opportunityId,
            type: "recruitment",
            priorityState: isUrgent ? "critical" : (relevanceScore > 0.85 ? "high" : "medium"),
            title: title,
            message: `Match Found: ${Math.round(relevanceScore * 100)}% alignment.`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
            source: "Sentinel"
        }, { merge: true });

        await logFounderActivity({
          type: 'SENTINEL_PROMOTION',
          message: `Recruitment Alert "${title}" published for warrior.`,
          metadata: { opportunityId, uid }
        });
      }

      // ===================================================
      // TYPE: DIGIBOOK KNOWLEDGE
      // ===================================================
      else if (type === "digibook") {
        const facts = rawData.facts || [];

        facts.forEach((fact, index) => {
          const blockId = `fact_${draftId}_${index}`;
          const blockRef = admin.firestore().collection("digibook_refinery").doc(blockId);

          batch.set(blockRef, {
            id: blockId,
            atomicTopicId: draft.sourceId || 'unmapped',
            type: fact.isCore ? 'concept_note' : 'brief_note',
            content: fact.content,
            title: fact.title,
            importance: fact.importance || 5,
            status: 'review', // Moves to Review Queue
            version: 1,
            lastAdminId: 'sentinel',
            lastAction: 'extracted',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });

        await logFounderActivity({
          type: 'SENTINEL_PROMOTION',
          message: `DigiBook Draft ${draftId} promoted: ${facts.length} blocks injected to Review Queue.`,
          metadata: { draftId, blockCount: facts.length }
        });
      }

      // ===================================================
      // TYPE: SYLLABUS ATOMIZATION
      // ===================================================
      else if (type === "syllabus") {
        const segments = rawData.segments || [];
        const examId = draft.linkedRealmId || draft.recruitmentId || null;

        segments.forEach((seg, sIdx) => {
          seg.chapters.forEach((chap, cIdx) => {
            const nodeId = `node_${draftId}_${sIdx}_${cIdx}`;
            const nodeRef = admin.firestore().collection("micro_nodes").doc(nodeId);

            batch.set(nodeRef, {
              id: nodeId,
              examId: examId || 'unmapped', // 🔱 RC-10 Alignment
              subjectId: seg.subject,
              chapterId: chap,
              title: chap,
              status: 'draft',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          });
        });

        await logFounderActivity({
          type: 'SENTINEL_PROMOTION',
          message: `Syllabus Draft ${draftId} promoted: Hierarchy mapping initialized.`,
        });

        // 🔱 RC-20 Hardening: Skip auto-manifestation if identity is unknown
        // This prevents 'unmapped' or 'global' leakage into digibook_refinery.
        if (examId) {
            const manifestTaskId = `manifest_auto_${draftId}`;
            batch.set(admin.firestore().collection('ai_queue').doc(manifestTaskId), {
                type: 'MANIFEST_KNOWLEDGE',
                payload: {
                    sourceDocumentId: draft.sourceId || draftId,
                    examId: examId,
                    draftId: draftId
                },
                autoTriggered: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`PROMOTION: Auto-manifestation queued for ${draftId} (Exam: ${examId})`);
        } else {
            console.warn(`PROMOTION WARNING: Skipping auto-manifestation for ${draftId}. Identity unmapped.`);
        }
      }

      // PHYSICAL PROPAGATION TO INGESTION REFINERY
      if (draft.sourceId) {
        const ingestRef = admin.firestore().collection("ingestion_refinery").doc(draft.sourceId);
        batch.update(ingestRef, {
            status: 'published', // 🔱 Governance Enforcement: Strict Published State
            publishedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`PROMOTION SUCCESS: Draft ${draftId} physical manifestation complete.`);

    } catch (error) {
      console.error(`SENTINEL PROMOTION ERROR:`, error);
      await logFounderActivity({
        type: 'SENTINEL_FAILURE',
        message: `Promotion failed for draft ${draftId}: ${error.message}`,
        severity: 'HIGH'
      });
    }
  });
