const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logFounderActivity } = require("../services/audit_service");

/**
 * RECRUITMENT CANDIDATE ENGINE (v2.6 Sovereign Hardened)
 * Physical manifestation of Rule 8 & Section 9:
 * Verified Notification + Verified Syllabus = Recruitment Candidate.
 *
 * CHANGE: Stop Auto-Creation of Mission Realms.
 * Realms must now be manually manifested by the Founder.
 */
exports.recruitmentAutoCreationEngine = functions.firestore
  .document("sentinel_drafts/{draftId}")
  .onWrite(async (change, context) => {
    const draftId = context.params.draftId;
    if (!change.after.exists) return;

    const draft = change.after.data();
    const { type, status, rawData } = draft;

    if (type !== 'recruitment_notification' && type !== 'syllabus') return;

    // 🔱 Hardened RC-19: Alignment with Promotion Lifecycle
    // Accepts verified drafts to form candidates, or published ones to update them.
    if (!['verified', 'published', 'ready_for_manifest'].includes(status)) return;

    console.log(`RECRUITMENT_ENGINE: Core Asset [${type}] in active lifecycle. Checking for candidate pairing.`);

    const db = admin.firestore();
    const org = rawData.org;
    const detectedYear = rawData.year || rawData.recruitmentYear || new Date().getFullYear();

    if (!org) return;

    try {
      const targetType = type === 'recruitment_notification' ? 'syllabus' : 'recruitment_notification';

      const counterparts = await db.collection('sentinel_drafts')
        .where('rawData.org', '==', org)
        .where('rawData.year', '==', detectedYear)
        .where('type', '==', targetType)
        .where('status', 'in', ['verified', 'published', 'ready_for_manifest'])
        .limit(1)
        .get();

      if (counterparts.empty) {
          console.log(`RECRUITMENT_ENGINE: Waiting for Verified ${targetType} for ${org} (${detectedYear}).`);
          return;
      }

      const counterpart = counterparts.docs[0].data();
      const notificationDraft = type === 'recruitment_notification' ? draft : counterpart;
      const syllabusDraft = type === 'syllabus' ? draft : counterpart;

      // 🔱 Forensic Fix: Unified ID Formula (RC-15/17 Alignment)
      const orgCode = org.toLowerCase().replace(/\s/g, '_');
      const examName = notificationDraft.rawData.exam_name || syllabusDraft.rawData.exam_name ||
                        notificationDraft.rawData.title || syllabusDraft.rawData.title || 'exam';
      const examCode = examName.toLowerCase().replace(/\s/g, '_');
      const recruitmentId = `rec_${orgCode}_${examCode}_${detectedYear}`.replace(/_+/g, '_').replace(/_$/, '');

      const recRef = db.collection('recruitments').doc(recruitmentId);

      await db.runTransaction(async (transaction) => {
        // A. Manifest Recruitment Candidate (Rule 9: READY_FOR_FOUNDER_APPROVAL)
        transaction.set(recRef, {
            id: recruitmentId,
            title: notificationDraft.rawData.title || syllabusDraft.rawData.title || `${org} Recruitment ${detectedYear}`,
            org: org,
            year: detectedYear,
            status: 'READY_FOR_FOUNDER_APPROVAL', // Sovereign state for review
            sourceDrafts: {
                notification: notificationDraft.id,
                syllabus: syllabusDraft.id
            },
            metadata: {
                ...notificationDraft.rawData,
                ...syllabusDraft.rawData
            },
            stats: {
                vacancies: notificationDraft.rawData.vacancy_matrix?.total_vacancies || 0,
                subjectsCount: (syllabusDraft.rawData.subjects || []).length
            },
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // PHYSICAL REMOVAL: No longer auto-creating mission_realms here.
        // Mission Realms are only created in handleSentinelAction via 'manifest_realm'.

        transaction.update(db.collection('sentinel_drafts').doc(notificationDraft.id), {
            recruitmentId: recruitmentId,
            status: 'ready_for_manifest'
        });
        transaction.update(db.collection('sentinel_drafts').doc(syllabusDraft.id), {
            recruitmentId: recruitmentId,
            status: 'ready_for_manifest'
        });
      });

      await logFounderActivity({
        type: 'RECRUITMENT_CANDIDATE_CREATED',
        message: `AUTO-ENGINE: Pair Verified for ${org} (${detectedYear}). Candidate created.`,
        metadata: { recruitmentId, org, year: detectedYear }
      });

    } catch (error) {
      console.error(`RECRUITMENT_ENGINE ERROR:`, error);
    }
  });
