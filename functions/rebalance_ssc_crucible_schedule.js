const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const MISSION = 'ssc_cgl';
const SOURCE = 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';
const SHA = '3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';
const TAXONOMY = 'ssc_cgl_taxonomy_verifier_v1';
const DAYS = 98;
const SUBJECT_ORDER = ['Quantitative Aptitude', 'Reasoning', 'General Awareness', 'English'];
const LANE_BUDGET_MINUTES = { 'Quantitative Aptitude': 34, Reasoning: 26, 'General Awareness': 22, English: 28 };

function atomMinutes(atom) {
  const title = String(atom.title || '');
  const base = atom.subject === 'Quantitative Aptitude' ? 10 : atom.subject === 'Reasoning' ? 8 : atom.subject === 'English' ? 7 : 6;
  return Math.min(18, base + Math.floor(title.length / 28));
}

function spacedDays(day) { return [day + 1, day + 3, day + 7, day + 14, day + 30, day + 60].filter((d) => d <= DAYS); }

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const realm = db.collection('mission_realms').doc(MISSION);
  const nodes = await db.collection('micro_nodes').where('missionId', '==', MISSION).where('decompositionVersion', '==', TAXONOMY).get();
  const lanes = Object.fromEntries(SUBJECT_ORDER.map((s) => [s, []]));
  for (const doc of nodes.docs) {
    const n = doc.data() || {}; const h = n.syllabusHierarchy || {};
    if (h.verificationState !== 'VERIFIED' || h.publicationState !== 'STUDENT_READY' || h.notificationContamination !== false) continue;
    for (const a of (h.atomicTopics || [])) {
      const subject = SUBJECT_ORDER.includes(h.subject) ? h.subject :
        (h.subject === 'General Intelligence' || h.subject === 'General Intelligence & Reasoning' || h.subject === 'Reasoning and General Intelligence' ? 'Reasoning' :
        (h.subject === 'English Comprehension' ? 'English' :
        (h.subject === 'GA' ? 'General Awareness' : null)));
      if (!subject || !lanes[subject]) continue;
      lanes[subject].push({ id: a.id, title: a.title, subject, unit: h.unit, topic: h.topic, minutes: atomMinutes({ ...a, subject }) });
    }
  }
  if (SUBJECT_ORDER.some((s) => lanes[s].length === 0)) throw new Error('CRUCIBLE_LANE_EMPTY');

  const days = Array.from({ length: DAYS }, (_, i) => ({ day: i + 1, lanes: {}, allNew: [], allRevision: [] }));
  for (const subject of SUBJECT_ORDER) {
    const lane = lanes[subject];
    const cursor = { value: 0 };
    for (let day = 1; day <= DAYS && cursor.value < lane.length; day++) {
      const budget = LANE_BUDGET_MINUTES[subject];
      let used = 0; const fresh = [];
      while (cursor.value < lane.length) {
        const candidate = lane[cursor.value];
        if (fresh.length > 0 && used + candidate.minutes > budget) break;
        fresh.push(candidate); used += candidate.minutes; cursor.value++;
      }
      const existingLaneDay = days[day - 1].lanes[subject] || { newAtoms: [], revisionAtoms: [], plannedMinutes: 0 };
      days[day - 1].lanes[subject] = { ...existingLaneDay, newAtoms: fresh, plannedMinutes: used };
      for (const atom of fresh) {
        for (const reviewDay of spacedDays(day)) {
          if (!days[reviewDay - 1].lanes[subject]) days[reviewDay - 1].lanes[subject] = { newAtoms: [], revisionAtoms: [], plannedMinutes: 0 };
          days[reviewDay - 1].lanes[subject].revisionAtoms.push(atom);
        }
      }
    }
    for (let day = 1; day <= DAYS; day++) {
      if (!days[day - 1].lanes[subject]) days[day - 1].lanes[subject] = { newAtoms: [], revisionAtoms: [], plannedMinutes: 0 };
      const laneDay = days[day - 1].lanes[subject];
      if (laneDay.newAtoms.length === 0 && laneDay.revisionAtoms.length === 0) {
        const fallback = lane[Math.min(lane.length - 1, Math.floor((day - 1) * lane.length / DAYS))];
        laneDay.revisionAtoms.push(fallback);
      }
      days[day - 1].allNew.push(...laneDay.newAtoms);
      days[day - 1].allRevision.push(...laneDay.revisionAtoms);
    }
  }

  const batch = db.batch();
  for (const entry of days) {
    const subjects = SUBJECT_ORDER;
    const covered = [...new Set([...entry.allNew, ...entry.allRevision].map((a) => a.id))];
    const laneSummary = Object.fromEntries(SUBJECT_ORDER.map((s) => [s, {
      newAtomIds: entry.lanes[s].newAtoms.map((a) => a.id),
      revisionAtomIds: [...new Set(entry.lanes[s].revisionAtoms.map((a) => a.id))],
      newCount: entry.lanes[s].newAtoms.length,
      revisionCount: new Set(entry.lanes[s].revisionAtoms.map((a) => a.id)).size,
      plannedMinutes: entry.lanes[s].plannedMinutes,
    }]));
    batch.set(realm.collection('crucible_days').doc(`ssc_cgl_day_${String(entry.day).padStart(3, '0')}`), {
      missionId: MISSION, cycleKey: 'ssc_cgl_2026', day: entry.day, status: 'published', planType: 'pedagogical_interleaved_spaced_schedule',
      subjects, subjectLanes: laneSummary, newAtomIds: entry.allNew.map((a) => a.id), revisionAtomIds: [...new Set(entry.allRevision.map((a) => a.id))],
      coveredAtomIds: covered, atomCount: covered.length, newAtomCount: entry.allNew.length, revisionAtomCount: new Set(entry.allRevision.map((a) => a.id)).size,
      questionCount: 0, assessmentReady: false, sourceDocumentId: SOURCE, sourceSha256: SHA, taxonomyVersion: TAXONOMY,
      studentMessage: 'Interleaved source-bound study day. New learning and spaced retrieval are separated; assessments unlock only after question verification.',
      generatedBy: 'ssc_cgl_crucible_scheduler_v2_pedagogical', generatedAt: new Date(),
    }, { merge: true });
  }
  batch.set(realm.collection('crucible_schedule').doc('ssc_cgl_2026'), {
    missionId: MISSION, cycleKey: 'ssc_cgl_2026', status: 'published', planType: 'pedagogical_interleaved_spaced_schedule', dayCount: DAYS,
    atomCount: Object.values(lanes).reduce((n, lane) => n + lane.length, 0), subjectOrder: SUBJECT_ORDER, laneBudgets: LANE_BUDGET_MINUTES,
    spacingDays: [1, 3, 7, 14, 30, 60], sourceDocumentId: SOURCE, sourceSha256: SHA, taxonomyVersion: TAXONOMY,
    assessmentReady: false, questionCount: 0, generatedBy: 'ssc_cgl_crucible_scheduler_v2_pedagogical', updatedAt: new Date(),
  }, { merge: true });
  await batch.commit();
  const summary = Object.fromEntries(SUBJECT_ORDER.map((s) => [s, lanes[s].length]));
  console.log(JSON.stringify({ status: 'published', planType: 'pedagogical_interleaved_spaced_schedule', days: DAYS, subjectAtomCounts: summary, laneBudgetMinutes: LANE_BUDGET_MINUTES, spacingDays: [1,3,7,14,30,60] }));
}
main().catch((e) => { console.error(e); process.exit(1); });
