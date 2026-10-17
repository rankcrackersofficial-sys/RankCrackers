const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

(async () => {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const realm = db.collection('mission_realms').doc('ssc_cgl');
  const [days, plan, tests, nodes] = await Promise.all([
    realm.collection('crucible_days').where('cadenceVersion', '==', 'ssc_cgl_crucible_endless_circle_v2').get(),
    realm.collection('crucible_schedule').doc('ssc_cgl_2026').get(),
    realm.collection('crucible_tests').where('cadenceVersion', '==', 'ssc_cgl_crucible_endless_circle_v2').get(),
    db.collection('micro_nodes').where('missionId', '==', 'ssc_cgl').where('decompositionVersion', '==', 'ssc_cgl_taxonomy_verifier_v1').get(),
  ]);
  const officialAtoms = new Set();
  for (const doc of nodes.docs) for (const atom of ((doc.data() || {}).syllabusHierarchy?.atomicTopics || [])) officialAtoms.add(atom.id);
  const expectedRebuild = new Set();
  const expectedJunction = new Set();
  for (let day = 1; day <= 420; day++) {
    const blockDay = ((day - 1) % 15) + 1;
    if (blockDay === 13 || blockDay === 14) expectedRebuild.add(day);
    if (blockDay === 15) expectedJunction.add(day);
  }
  const newCoverage = new Set();
  const invalid = [];
  for (const doc of days.docs) {
    const value = doc.data() || {};
    const day = Number(value.day);
    const kind = value.eventKind;
    const majorDays = new Set([105, 135, 195, 255, 315, 375]);
    const fullDays = new Set([165, 225, 285, 345, 405]);
    const expected = expectedRebuild.has(day) ? 'rebuild_revision' : expectedJunction.has(day) ? `${majorDays.has(day) ? 'major' : fullDays.has(day) ? 'full' : 'macro'}_test` : 'study';
    if (kind !== expected || value.status !== 'published' || value.cadenceVersion !== 'ssc_cgl_crucible_endless_circle_v2') invalid.push({ day, reason: 'event_or_status', kind, expected });
    const newIds = Array.isArray(value.newAtomIds) ? value.newAtomIds : [];
    if (kind !== 'study' && newIds.length) invalid.push({ day, reason: 'new_atoms_on_non_study', count: newIds.length });
    for (const id of newIds) newCoverage.add(id);
    if (kind === 'study' && (!value.subjectLanes || Object.keys(value.subjectLanes).length !== 4)) invalid.push({ day, reason: 'missing_subject_lanes' });
    if (kind === 'rebuild_revision' && Number(value.rebuildDurationHours) !== 48) invalid.push({ day, reason: 'rebuild_duration', value: value.rebuildDurationHours });
    if (expectedJunction.has(day) && Number(value.macroDurationHours) !== 2) invalid.push({ day, reason: 'assessment_duration', value: value.macroDurationHours });
  }
  const testTypes = tests.docs.reduce((acc, doc) => { const type = doc.data()?.testType || 'unknown'; acc[type] = (acc[type] || 0) + 1; return acc; }, {});
  const unreleasedCanonicalTests = tests.docs.filter((doc) => { const value = doc.data() || {}; return value.isReleased !== false || value.studentVisibilityAuthorized !== false || value.assessmentReady !== false || Number(value.questionCount || 0) !== 0; }).length;
  const missing = [...officialAtoms].filter((id) => !newCoverage.has(id));
  const extra = [...newCoverage].filter((id) => !officialAtoms.has(id));
  const result = {
    cadenceVersion: 'ssc_cgl_crucible_endless_circle_v2',
    publishedDays: days.size,
    studyDays: days.docs.filter((doc) => doc.data()?.eventKind === 'study').length,
    rebuildDays: days.docs.filter((doc) => doc.data()?.eventKind === 'rebuild_revision').length,
    junctionDays: days.docs.filter((doc) => ['macro_test', 'major_test', 'full_test'].includes(doc.data()?.eventKind)).length,
    tests: testTypes,
    officialAtomicTopics: officialAtoms.size,
    uniqueNewAtomsCovered: newCoverage.size,
    coveragePercent: officialAtoms.size ? Math.round(newCoverage.size * 10000 / officialAtoms.size) / 100 : 0,
    missingAtomCount: missing.length,
    extraAtomCount: extra.length,
    invalidRecordCount: invalid.length,
    unreleasedGateViolations: unreleasedCanonicalTests,
    plan: {
      status: plan.exists ? plan.data()?.status : null,
      planType: plan.data()?.planType,
      cadenceVersion: plan.data()?.cadenceVersion,
      cycleLengthDays: plan.data()?.cycleLengthDays,
      rebuildDurationHours: plan.data()?.rebuildDurationHours,
      macroDurationHours: plan.data()?.macroDurationHours,
    },
    invalidSample: invalid.slice(0, 10),
    missingSample: missing.slice(0, 10),
  };
  console.log(JSON.stringify(result, null, 2));
  if (days.size !== 420 || result.studyDays !== 336 || result.rebuildDays !== 56 || result.junctionDays !== 28 || testTypes.micro !== 168 || testTypes.macro !== 17 || testTypes.major !== 6 || testTypes.full !== 5 || missing.length || extra.length || invalid.length || unreleasedCanonicalTests) process.exitCode = 2;
})().catch((error) => { console.error(error); process.exit(1); });
