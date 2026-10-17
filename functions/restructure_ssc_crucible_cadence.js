const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT = 'rankcrackers-55';
const MISSION = 'ssc_cgl';
const CYCLE_KEY = 'ssc_cgl_2026';
const SOURCE = 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';
const SHA = '3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';
const TAXONOMY = 'ssc_cgl_taxonomy_verifier_v1';
const CADENCE = 'ssc_cgl_crucible_endless_circle_v2';
const DAYS = 420;
const CIRCLE_DAYS = 105;
const BLOCK_DAYS = 15;
const CIRCLES = 4;
const SUBJECT_ORDER = ['Quantitative Aptitude', 'Reasoning', 'General Awareness', 'English'];
const LANE_BUDGET_MINUTES = { 'Quantitative Aptitude': 34, Reasoning: 26, 'General Awareness': 22, English: 28 };

function atomMinutes(atom) {
  const title = String(atom.title || '');
  const base = atom.subject === 'Quantitative Aptitude' ? 10 : atom.subject === 'Reasoning' ? 8 : atom.subject === 'English' ? 7 : 6;
  return Math.min(18, base + Math.floor(title.length / 28));
}

function circleDayForDay(day) { return ((day - 1) % CIRCLE_DAYS) + 1; }
function circleForDay(day) { return Math.floor((day - 1) / CIRCLE_DAYS) + 1; }
function blockDayForDay(day) { return ((circleDayForDay(day) - 1) % BLOCK_DAYS) + 1; }
function blockForDay(day) { return Math.floor((circleDayForDay(day) - 1) / BLOCK_DAYS) + 1; }
function isRebuildDay(day) { return [13, 14].includes(blockDayForDay(day)); }
function isJunctionDay(day) { return blockDayForDay(day) === 15; }
function isStudyDay(day) { return day >= 1 && day <= DAYS && !isRebuildDay(day) && !isJunctionDay(day); }
function phaseForDay(day) { return blockForDay(day); }
function scheduleForDay(day) {
  if (!isStudyDay(day)) return null;
  const circle = circleForDay(day);
  const block = blockForDay(day);
  const offset = (blockDayForDay(day) - 1);
  return (circle - 1) * 42 + (block - 1) * 6 + Math.floor(offset / 2) + 1;
}

function nextStudyDay(day) {
  for (let candidate = day; candidate <= DAYS; candidate++) if (isStudyDay(candidate)) return candidate;
  return null;
}

function emptyLane() { return { newAtoms: [], revisionAtoms: [], plannedMinutes: 0 }; }
function uniqueById(items) { return [...new Map(items.map((item) => [item.id, item])).values()]; }

function promotionForDay(day) {
  const majors = new Set([105, 135, 195, 255, 315, 375]);
  const fulls = new Set([165, 225, 285, 345, 405]);
  return majors.has(day) ? 'major' : fulls.has(day) ? 'full' : (isJunctionDay(day) ? 'macro' : null);
}

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: PROJECT, authClient: auth });
  const realm = db.collection('mission_realms').doc(MISSION);
  const nodes = await db.collection('micro_nodes')
    .where('missionId', '==', MISSION)
    .where('decompositionVersion', '==', TAXONOMY)
    .get();

  const lanes = Object.fromEntries(SUBJECT_ORDER.map((subject) => [subject, []]));
  for (const doc of nodes.docs) {
    const hierarchy = (doc.data() || {}).syllabusHierarchy || {};
    if (hierarchy.verificationState !== 'VERIFIED' || hierarchy.publicationState !== 'STUDENT_READY' || hierarchy.notificationContamination !== false) continue;
    const subject = SUBJECT_ORDER.includes(hierarchy.subject) ? hierarchy.subject
      : (['General Intelligence', 'General Intelligence & Reasoning', 'Reasoning and General Intelligence'].includes(hierarchy.subject) ? 'Reasoning'
        : (hierarchy.subject === 'English Comprehension' ? 'English' : (hierarchy.subject === 'GA' ? 'General Awareness' : null)));
    if (!subject) continue;
    for (const atom of hierarchy.atomicTopics || []) {
      lanes[subject].push({
        id: atom.id, nodeId: doc.id, title: atom.title, subject,
        unit: hierarchy.unit, topic: hierarchy.topic,
        minutes: atomMinutes({ ...atom, subject }),
      });
    }
  }
  if (SUBJECT_ORDER.some((subject) => lanes[subject].length === 0)) throw new Error('CRUCIBLE_LANE_EMPTY');

  const studyDays = Array.from({ length: DAYS + 1 }, () => null);
  for (let day = 1; day <= DAYS; day++) {
    studyDays[day] = { day, lanes: Object.fromEntries(SUBJECT_ORDER.map((subject) => [subject, emptyLane()])), allNew: [], allRevision: [] };
  }

  // Allocate every verified atom once per circle, only to that circle's 42 normal study days.
  for (const subject of SUBJECT_ORDER) {
    const lane = lanes[subject];
    for (let circle = 1; circle <= CIRCLES; circle++) {
      const circleStart = (circle - 1) * CIRCLE_DAYS + 1;
      const circleEnd = circle * CIRCLE_DAYS;
      const studySlots = Array.from({ length: CIRCLE_DAYS }, (_, i) => circleStart + i).filter(isStudyDay);
      let cursor = 0;
      for (const day of studySlots) {
        const target = studyDays[day].lanes[subject];
        const budget = LANE_BUDGET_MINUTES[subject];
        let used = 0;
        while (cursor < lane.length) {
          const candidate = lane[cursor];
          if (target.newAtoms.length > 0 && used + candidate.minutes > budget) break;
          target.newAtoms.push(candidate); used += candidate.minutes; cursor++;
        }
        target.plannedMinutes = used;
      }
      if (cursor !== lane.length) throw new Error(`CRUCIBLE_ATOM_ALLOCATION_INCOMPLETE:C${circle}:${subject}:${cursor}/${lane.length}`);

      // Spaced retrieval is derived from the same source-bound atom; it never creates a new syllabus node.
      for (const day of studySlots) {
        for (const atom of studyDays[day].lanes[subject].newAtoms) {
          for (const offset of [1, 3, 7, 14, 30, 60]) {
            const rawTarget = day + offset;
            if (rawTarget > circleEnd) continue;
            const targetDay = isJunctionDay(rawTarget) ? nextStudyDay(rawTarget + 1) : rawTarget;
            if (targetDay == null || targetDay > circleEnd) continue;
            studyDays[targetDay].lanes[subject].revisionAtoms.push(atom);
          }
        }
      }
    }
  }

  const testDocs = [];
  for (let schedule = 1; schedule <= 168; schedule++) {
    const circle = Math.floor((schedule - 1) / 42) + 1;
    const phase = Math.floor(((schedule - 1) % 42) / 6) + 1;
    const slot = (schedule - 1) % 6;
    const startDay = (circle - 1) * CIRCLE_DAYS + (phase - 1) * BLOCK_DAYS + slot * 2 + 1;
    const endDay = startDay + 1;
    testDocs.push({
      id: `micro_${MISSION}_schedule_${String(schedule).padStart(2, '0')}`,
      testType: 'micro', eventKind: 'micro_test', circle, phase, scheduleNumber: schedule,
      startDay, endDay, scheduledDay: endDay, questionCount: 20, durationMinutes: 60,
    });
  }
  for (let junctionDay = 15; junctionDay <= DAYS; junctionDay += 15) {
    const promoted = promotionForDay(junctionDay);
    const circle = circleForDay(junctionDay);
    const phase = phaseForDay(junctionDay);
    testDocs.push({
      id: `${promoted}_${MISSION}_day_${String(junctionDay).padStart(3, '0')}`,
      testType: promoted, eventKind: `${promoted}_test`, circle, phase, scheduleNumber: null,
      startDay: junctionDay - 14, endDay: junctionDay, scheduledDay: junctionDay,
      questionCount: promoted === 'major' ? 100 : 100,
      durationMinutes: promoted === 'major' ? 120 : 60,
    });
  }

  const batches = [];
  let batch = db.batch();
  let batchWrites = 0;
  const addSet = (ref, data, options) => {
    // Keep payloads small because each day carries subject-lane metadata and
    // verified atom references.  This avoids gRPC deadline expiry while still
    // staying far below Firestore's 500-operation batch limit.
    if (batchWrites >= 50) {
      batches.push(batch);
      batch = db.batch();
      batchWrites = 0;
    }
    batch.set(ref, data, options);
    batchWrites += 1;
  };
  for (let day = 1; day <= DAYS; day++) {
    const entry = studyDays[day];
    const eventKind = isRebuildDay(day) ? 'rebuild_revision' : isJunctionDay(day) ? `${promotionForDay(day)}_test` : 'study';
    const phase = phaseForDay(day);
    const circle = circleForDay(day);
    const circleDay = circleDayForDay(day);
    const blockDay = blockDayForDay(day);
    const subjectLanes = {};
    if (eventKind === 'study') {
      for (const subject of SUBJECT_ORDER) {
        const lane = entry.lanes[subject];
        const revisions = uniqueById(lane.revisionAtoms);
        subjectLanes[subject] = {
          newAtomIds: lane.newAtoms.map((atom) => atom.id), revisionAtomIds: revisions.map((atom) => atom.id),
          newCount: lane.newAtoms.length, revisionCount: revisions.length, plannedMinutes: lane.plannedMinutes,
          newItems: lane.newAtoms.map(({ id, nodeId, title, subject: itemSubject, unit, topic }) => ({ id, nodeId, title, subject: itemSubject, unit, topic })),
          revisionItems: revisions.map(({ id, nodeId, title, subject: itemSubject, unit, topic }) => ({ id, nodeId, title, subject: itemSubject, unit, topic })),
        };
      }
    } else if (eventKind === 'rebuild_revision') {
      // Rebuild is revision-only: carry forward the phase's covered atoms,
      // but never expose it as a normal new-learning schedule.
      const phaseStart = day - blockDay + 1;
      for (const subject of SUBJECT_ORDER) {
        const items = [];
        for (let sourceDay = phaseStart; sourceDay < day; sourceDay++) {
          if (!studyDays[sourceDay]) continue;
          items.push(...studyDays[sourceDay].lanes[subject].newAtoms, ...studyDays[sourceDay].lanes[subject].revisionAtoms);
        }
        const revisions = uniqueById(items);
        subjectLanes[subject] = { newAtomIds: [], revisionAtomIds: revisions.map((atom) => atom.id), newCount: 0, revisionCount: revisions.length, plannedMinutes: 0, newItems: [], revisionItems: revisions.map(({ id, nodeId, title, subject: itemSubject, unit, topic }) => ({ id, nodeId, title, subject: itemSubject, unit, topic })) };
      }
    }
    const allNew = SUBJECT_ORDER.flatMap((subject) => subjectLanes[subject]?.newAtomIds || []);
    const allRevision = SUBJECT_ORDER.flatMap((subject) => subjectLanes[subject]?.revisionAtomIds || []);
    const assessment = testDocs.find((test) => test.scheduledDay === day && test.testType !== 'micro');
    const payload = {
      missionId: MISSION, cycleKey: CYCLE_KEY, cadenceVersion: CADENCE, day, globalDay: day, circle, circleDay, block: phase, blockDay,
      status: 'published', eventKind, normalStudySchedule: eventKind === 'study',
      scheduleNumber: eventKind === 'study' ? scheduleForDay(day) : null,
      scheduleId: eventKind === 'study' ? `ssc_cgl_schedule_${String(scheduleForDay(day)).padStart(2, '0')}` : null,
      subjects: eventKind === 'study' ? SUBJECT_ORDER : [], subjectLanes,
      newAtomIds: allNew, revisionAtomIds: [...new Set(allRevision)], coveredAtomIds: [...new Set([...allNew, ...allRevision])],
      atomCount: new Set([...allNew, ...allRevision]).size, newAtomCount: allNew.length, revisionAtomCount: new Set(allRevision).size,
      assessmentTestId: assessment?.id || null, assessmentKind: assessment?.testType || null,
      assessmentReady: false, questionCount: 0, studentVisibilityAuthorized: false,
      rebuildDurationHours: eventKind === 'rebuild_revision' ? 48 : null, macroDurationHours: isJunctionDay(day) ? 2 : null,
      sourceDocumentId: SOURCE, sourceSha256: SHA, taxonomyVersion: TAXONOMY,
      generatedBy: 'ssc_cgl_crucible_endless_circle_restructure_v1', generatedAt: new Date(),
      studentMessage: eventKind === 'study' ? 'Source-bound study day with four subject lanes and spaced retrieval.' : eventKind === 'rebuild_revision' ? '48-hour source-bound rebuild and revision window. No new schedule is introduced.' : `${eventKind === 'major_test' ? 'Major' : eventKind === 'full_test' ? 'Full' : 'Macro'} assessment junction. Release is gated by verified questions and eligibility.`,
    };
    addSet(realm.collection('crucible_days').doc(`ssc_cgl_day_${String(day).padStart(3, '0')}`), payload, { merge: true });
  }

  for (const test of testDocs) {
    addSet(realm.collection('crucible_tests').doc(test.id), {
      ...test, missionId: MISSION, cycleKey: CYCLE_KEY, cadenceVersion: CADENCE,
      status: 'preparing', assessmentReady: false, studentVisibilityAuthorized: false, isReleased: false,
      sourceDocumentId: SOURCE, sourceSha256: SHA, taxonomyVersion: TAXONOMY,
      coveredScheduleNumbers: test.testType === 'micro' ? [test.scheduleNumber] : Array.from({ length: 6 }, (_, i) => ((test.circle - 1) * 42) + (test.phase - 1) * 6 + i + 1),
      verifiedQuestionCount: 0, questionCount: 0, generatedBy: 'ssc_cgl_crucible_endless_circle_restructure_v1', generatedAt: new Date(),
    }, { merge: true });
  }

  addSet(realm.collection('crucible_schedule').doc(CYCLE_KEY), {
    missionId: MISSION, cycleKey: CYCLE_KEY, cadenceVersion: CADENCE, status: 'published',
    planType: 'source_bound_endless_circle', cycleLengthDays: 105, phaseCount: 7, daysPerPhase: 15,
    schedulesPerPhase: 6, totalSchedules: 42, hoursPerSchedule: 48, learningHoursPerSchedule: 47,
    totalGlobalDays: DAYS, circleCount: CIRCLES, totalGlobalSchedules: 168,
    microHoursPerSchedule: 1, rebuildDurationHours: 48, macroDurationHours: 2, recoveryBufferHours: 70,
    subjectOrder: SUBJECT_ORDER, laneBudgets: LANE_BUDGET_MINUTES, atomCount: Object.values(lanes).reduce((sum, lane) => sum + lane.length, 0),
    assessmentPolicy: {
      micro: { questionCount: 20, durationMinutes: 60, windowsPerCircle: 42 },
      macro: { questionCount: 50, durationMinutes: 60, junctionEveryDays: 15, windowsPerCircle: 12 },
      major: { questionCount: 100, durationMinutes: 120, afterVerifiedMacroCount: 6 },
      full: { questionCount: 100, durationMinutes: 60, afterVerifiedMacroCount: 8, afterVerifiedMajorCount: 2, firstCircleCoverageRequired: true, recentScheduleWeight: 0.40, previousScheduleWeight: 0.30, wholeSyllabusWeight: 0.30 },
    },
    promotionRules: {
      globalMacroDays: [15, 30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420],
      globalMajorDays: [105, 135, 195, 255, 315, 375],
      globalFullDays: [165, 225, 285, 345, 405],
      validJunctionRule: 'Only Day-15 junctions may be promoted; non-junction days are invalid.',
      sequenceRule: 'Macro → Major → Macro → Full after the first 105-day circle.',
      lateJoinerRule: 'Global calendar never shifts; eligibility gates are student-scoped.',
      firstFullRule: '8 verified Macro + 2 verified Major + first 105-day syllabus coverage.',
    },
    sourceDocumentId: SOURCE, sourceSha256: SHA, taxonomyVersion: TAXONOMY,
    assessmentReady: false, questionCount: 0, generatedBy: 'ssc_cgl_crucible_endless_circle_restructure_v1', updatedAt: new Date(),
  }, { merge: true });

  if (batchWrites > 0) batches.push(batch);
  for (const pendingBatch of batches) await pendingBatch.commit();
    console.log(JSON.stringify({ status: 'restructured', cadenceVersion: CADENCE, days: DAYS, circles: CIRCLES, studyDays: 336, rebuildDays: 56, junctionDays: 28, microTests: 168, macroJunctions: 17, promotedMajor: [105, 135, 195, 255, 315, 375], promotedFull: [165, 225, 285, 345, 405], atomicCounts: Object.fromEntries(SUBJECT_ORDER.map((subject) => [subject, lanes[subject].length])) }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
