const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

(async () => {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client(); auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: 'rankcrackers-55', authClient: auth });
  const realm = db.collection('mission_realms').doc('ssc_cgl');
  const [days, plan, nodes] = await Promise.all([
    realm.collection('crucible_days').where('status', '==', 'published').get(),
    realm.collection('crucible_schedule').doc('ssc_cgl_2026').get(),
    db.collection('micro_nodes').where('missionId', '==', 'ssc_cgl').where('decompositionVersion', '==', 'ssc_cgl_taxonomy_verifier_v1').get(),
  ]);
  const atoms = new Set();
  for (const d of nodes.docs) for (const a of ((d.data() || {}).syllabusHierarchy?.atomicTopics || [])) atoms.add(a.id);
  const budgets = { 'Quantitative Aptitude': 34, Reasoning: 26, 'General Awareness': 22, English: 28 };
  const newCoverage = new Set(); const invalid = [];
  for (const d of days.docs) {
    const x = d.data() || {}; const lanes = x.subjectLanes || {};
    for (const subject of Object.keys(budgets)) {
      const lane = lanes[subject]; const newIds = lane?.newAtomIds || [];
      const ids = [...newIds, ...(lane?.revisionAtomIds || [])]; newIds.forEach((id) => newCoverage.add(id));
      if (!lane || ids.length === 0 || Number(lane.plannedMinutes || 0) > budgets[subject] || ids.some((id) => !atoms.has(id))) invalid.push({ day: x.day, subject });
    }
  }
  const missing = [...atoms].filter((id) => !newCoverage.has(id));
  const extra = [...newCoverage].filter((id) => !atoms.has(id));
  const result = { publishedDays: days.size, plan: plan.data() || null, verifiedAtoms: atoms.size, uniqueNewAtomsCovered: newCoverage.size, coveragePercent: atoms.size ? Math.round(newCoverage.size * 10000 / atoms.size) / 100 : 0, missingAtomCount: missing.length, extraAtomCount: extra.length, daysWithAllSubjectLanes: days.size - invalid.length, invalidLanes: invalid.length, missingSample: missing.slice(0, 5) };
  console.log(JSON.stringify(result, null, 2));
  if (days.size !== 98 || invalid.length || missing.length || extra.length || result.plan.planType !== 'pedagogical_interleaved_spaced_schedule') process.exitCode = 2;
})().catch((e) => { console.error(e); process.exit(1); });
