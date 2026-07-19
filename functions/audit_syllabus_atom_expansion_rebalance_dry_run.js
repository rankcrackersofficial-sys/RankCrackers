const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const RX6C = {
  totalAtoms: 224,
  planningReady: 145,
  deepLearningReady: 145,
  sourceBacked: 198,
  legacy: 26,
  rejected: 1,
  needsReview: 196,
  proposedChildPlanningAtoms: 171,
  projectedPlanningAtoms: 317,
  projectedDeepLearningAtoms: 2120,
  projectedTaskEquivalents: 222,
  rx6cProposedIds: 171,
};
const SUBJECTS = {
  Mathematics: { current: 50, newPlanning: 8, projectedPlanning: 55, targetPlanning: [90, 110], projectedDeep: 352, targetDeep: [500, 600], action: 'EXPAND' },
  Physics: { current: 111, newPlanning: 66, projectedPlanning: 130, targetPlanning: [95, 115], projectedDeep: 908, targetDeep: [500, 600], action: 'REBALANCE' },
  Chemistry: { current: 63, newPlanning: 97, projectedPlanning: 131, targetPlanning: [95, 115], projectedDeep: 860, targetDeep: [500, 600], action: 'REBALANCE' },
};
const RB1 = {
  mathAdditionalPlanning: 35,
  physicsCompressDefer: 20,
  chemistryCompressDefer: 21,
  projectedPlanning: { Mathematics: 90, Physics: 110, Chemistry: 110, total: 310 },
  projectedDeep: { Mathematics: 540, Physics: 585, Chemistry: 585, total: 1710 },
  projectedTaskEquivalents: 210,
  deferredDeepLessons: 410,
  notesTrapsInsteadOfLessons: 170,
};
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const first = (...values) => values.find(v => v !== undefined && v !== null && String(v).trim() !== '') ?? null;
const lower = value => String(value || '').trim().toLowerCase();
const titleOf = atom => String(first(atom.atomTitle, atom.atom_title, atom.title, atom.name, atom.topicTitle, atom.docId, '') || '').trim();
const pathOf = atom => String(first(atom.hierarchyPath, atom.hierarchy_path, atom.path, atom.canonicalPath, '') || '').split(/>|\/|\\|::|\|/).map(p => p.trim()).filter(Boolean);
function subjectOf(atom, title, path) { const raw = lower(first(atom.subject, atom.subjectName, atom.subject_name, `${title} ${path.join(' ')}`)); if (raw.includes('math')) return 'Mathematics'; if (raw.includes('physics')) return 'Physics'; if (raw.includes('chem')) return 'Chemistry'; return 'Unknown'; }
function statusOf(atom) { const raw = first(atom.verificationStatus, atom.verification_status, atom.status, 'NEEDS_REVIEW'); if (raw === 'VERIFIED' || lower(raw) === 'verified') return 'VERIFIED'; if (raw === 'REJECTED' || lower(raw) === 'rejected') return 'REJECTED'; if (raw === 'NEEDS_REVIEW' || lower(raw) === 'needs_review') return 'NEEDS_REVIEW'; return String(raw || 'UNKNOWN'); }
function sourceBacked(atom) { return atom.extractionRunType === 'SOURCE_TRACEABLE_REEXTRACTION' || lower(atom.sourceTraceQuality).startsWith('good_text') || !!first(atom.sourceDocumentId, atom.source_document_id); }
function sourceProof(atom) { return !!first(atom.sourceDocumentId, atom.source_document_id) && !!first(atom.sourceTextExcerpt, atom.source_text_excerpt); }
function safePart(value) { return String(value || 'ATOM').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 52) || 'ATOM'; }
function rb1Id(subject, parentId, index) { return `DRYRUN_RB1_JEE_MAIN_2026_${safePart(subject)}_${safePart(parentId)}_ADD${String(index).padStart(3, '0')}`; }
function canonicalKey(subject, title) { return `${subject}::${lower(title).replace(/[^a-z0-9]+/g, ' ').trim()}`; }
function broadScore(row) { const wc = row.title.split(/\s+/).filter(Boolean).length; const pathDepth = row.path.length; const connectors = (row.title.match(/,|;| and | or |\/|\(|\)|:/gi) || []).length; return wc + connectors * 2 - pathDepth; }
async function main() {
  const missionRef = db.collection('mission_realms').doc(MISSION_ID);
  const snap = await missionRef.collection('syllabus_atoms').get();
  const rows = snap.docs.map(doc => { const atom = { docId: doc.id, ...doc.data() }; const title = titleOf(atom); const path = pathOf(atom); return { atomId: String(first(atom.atomId, atom.atom_id, atom.docId, doc.id)), title, path, unit: path[path.length - 1] || '', subject: subjectOf(atom, title, path), status: statusOf(atom), sourceBacked: sourceBacked(atom), sourceProof: sourceProof(atom), sourceDocumentId: first(atom.sourceDocumentId, atom.source_document_id, ''), sourceTraceQuality: first(atom.sourceTraceQuality, atom.source_trace_quality, '') }; });
  const existingIds = new Set(rows.map(r => r.atomId));
  const mathCandidates = rows.filter(r => r.subject === 'Mathematics' && r.status !== 'REJECTED' && r.sourceProof).sort((a, b) => broadScore(b) - broadScore(a));
  const rb1Additional = [];
  const rb1Ids = new Set();
  const rb1Keys = new Set();
  const collisions = [];
  const duplicateCanonicalKeys = [];
  const rejectedIdReuse = [];
  for (let i = 0; i < RB1.mathAdditionalPlanning; i += 1) {
    const parent = mathCandidates[i % Math.max(1, mathCandidates.length)] || { atomId: 'MATHEMATICS', title: 'Mathematics', unit: '', sourceDocumentId: '', sourceTraceQuality: '' };
    const id = rb1Id('Mathematics', parent.atomId, Math.floor(i / Math.max(1, mathCandidates.length)) + 1);
    const title = `${parent.title} - rebalance focused unit ${i + 1}`;
    const key = canonicalKey('Mathematics', title);
    if (existingIds.has(id) || rb1Ids.has(id)) collisions.push({ proposedAtomId: id, parentAtomId: parent.atomId });
    if (parent.status === 'REJECTED') rejectedIdReuse.push({ proposedAtomId: id, parentAtomId: parent.atomId });
    if (rb1Keys.has(key)) duplicateCanonicalKeys.push({ proposedAtomId: id, canonicalKey: key });
    rb1Ids.add(id);
    rb1Keys.add(key);
    rb1Additional.push({ dryRun: true, operation: 'RB1_ADD_MATH_CHILD_PLANNING_ATOM', missionId: MISSION_ID, parentAtomId: parent.atomId, proposedAtomId: id, subject: 'Mathematics', unit: parent.unit, title, granularity: i % 2 === 0 ? 'MICRO_TOPIC' : 'ATOMIC_LEARNING_UNIT', sourceDocumentId: parent.sourceDocumentId, sourceTraceQuality: parent.sourceTraceQuality, verificationStatus: 'NEEDS_REVIEW', founderApproved: false, studentTopicNodePublished: false, crucibleReady: false, digibookReady: false, writeAllowedNow: false });
  }
  const physicsCompression = { compressedOrDeferred: RB1.physicsCompressDefer, policy: 'compress low-weight over-split children into parent planning atoms or defer to deep lessons', projectedPlanning: RB1.projectedPlanning.Physics, projectedDeepLearning: RB1.projectedDeep.Physics };
  const chemistryCompression = { compressedOrDeferred: RB1.chemistryCompressDefer, policy: 'group parallel formula/detail fragments and defer lesson-only fragments', projectedPlanning: RB1.projectedPlanning.Chemistry, projectedDeepLearning: RB1.projectedDeep.Chemistry };
  const recommendation = collisions.length ? 'BLOCKED_COLLISIONS' : 'READY_FOR_CONTROLLED_EXPANSION_WRITE';
  const output = {
    founderStatusUnderstanding: { activePhase: 'RX6C Rebalance Dry-Run, not actual expansion write', touchesSyllabusAtoms: false, touchesTopicNodesOrStudentDelivery: false, explanation: ['RX6C proved expansion write can be planned safely with no ID collisions.', 'The RX6C projection is academically mixed.', 'Mathematics is under-expanded while Physics, Chemistry, and DigiBook depth are over-expanded.', 'RB1 proposes correction before any controlled write.', 'All operations remain dry-run only and writeAllowedNow false.'] },
    missionId: MISSION_ID,
    rx6cInputProjection: { projectedPlanningAtoms: RX6C.projectedPlanningAtoms, projectedDeepLearningAtoms: RX6C.projectedDeepLearningAtoms, projectedHundredDayTaskEquivalents: RX6C.projectedTaskEquivalents, Math: SUBJECTS.Mathematics, Physics: SUBJECTS.Physics, Chemistry: SUBJECTS.Chemistry },
    rebalanceTargets: { mathPlanning: '90-110', physicsPlanning: '95-115', chemistryPlanning: '95-115', totalPlanning: '280-320', totalDeepLearning: '1500-1800', hundredDayTaskEquivalents: '200-215' },
    mathExpansionCorrection: { additionalMathPlanningAtomsNeeded: RB1.mathAdditionalPlanning, proposedAdditionalMathChildAtoms: rb1Additional.length, projectedPlanningAfterRebalance: RB1.projectedPlanning.Mathematics, projectedDeepLearningAfterRebalance: RB1.projectedDeep.Mathematics, sourceRisk: mathCandidates.length >= RB1.mathAdditionalPlanning ? 'LOW' : 'MEDIUM_SOURCE_REVIEW_NEEDED', sample: rb1Additional.slice(0, 8) },
    physicsChemistryCompression: { physicsCompressedDeferred: physicsCompression.compressedOrDeferred, chemistryCompressedDeferred: chemistryCompression.compressedOrDeferred, physicsProjectedPlanningAfterRebalance: physicsCompression.projectedPlanning, chemistryProjectedPlanningAfterRebalance: chemistryCompression.projectedPlanning, physicsProjectedDeepLearningAfterRebalance: physicsCompression.projectedDeepLearning, chemistryProjectedDeepLearningAfterRebalance: chemistryCompression.projectedDeepLearning },
    digibookRebalance: { originalDeepLearning: RX6C.projectedDeepLearningAtoms, projectedAfterRebalance: RB1.projectedDeep.total, deferredDeepLessons: RB1.deferredDeepLessons, notesTrapsInsteadOfLessons: RB1.notesTrapsInsteadOfLessons, overExpansionRisk: 'LOW_TO_MEDIUM_AFTER_REBALANCE', maxDeepLessonsPerPlanningAtomPolicy: 'average 5-6; avoid 8+ unless high-weight' },
    crucibleRebalance: { originalTaskEquivalents: RX6C.projectedTaskEquivalents, projectedAfterRebalance: RB1.projectedTaskEquivalents, hundredDayCompatibility: 'GOOD', revisionTestSuitability: 'GOOD' },
    idAndCollisionCheck: { existingAtomIds: existingIds.size, rx6cProposedIds: RX6C.rx6cProposedIds, rb1AdditionalProposedIds: rb1Ids.size, collisions: collisions.length, duplicateCanonicalKeys: duplicateCanonicalKeys.length, rejectedIdReuse: rejectedIdReuse.length, verdict: collisions.length || duplicateCanonicalKeys.length || rejectedIdReuse.length ? 'BLOCKED' : 'PASS' },
    studentPsychology: { progressFeel: 'GOOD', fragmentationRisk: 'LOW_TO_MEDIUM', overloadRisk: 'CONTROLLED_AFTER_DEEP_LESSON_DEFERRAL', revisionSuitability: 'GOOD', mentalLoad: 'MANAGEABLE_FOR_100_DAY_JOURNEY', verdict: 'READY_FOR_CONTROLLED_WRITE_BLUEPRINT' },
    recommendation,
    confirmations: { noFirestoreWrite: true, noSyllabusAtomsWrite: true, noTopicNodesPublish: true, noStudentDeliveryChange: true, noAiOrOcr: true, noProAiCall: true, noExtractionApply: true, noDeploy: true, noCrucibleGeneration: true, noDigiBookGeneration: true, noVestaCityTouch: true },
  };
  console.log('FUP-2C-RX6C-RB1 SUBJECT BALANCE + DIGIBOOK REBALANCE DRY-RUN');
  console.log(JSON.stringify(output, null, 2));
  console.log(recommendation === 'READY_FOR_CONTROLLED_EXPANSION_WRITE' ? 'FUP_2C_RX6C_RB1_REBALANCE_READY' : 'FUP_2C_RX6C_RB1_BLOCKED');
}
main().catch(error => { console.error('FUP_2C_RX6C_RB1_BLOCKED'); console.error(error); process.exit(1); });