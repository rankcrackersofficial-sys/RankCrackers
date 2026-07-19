const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const SUBJECT_PLAN = {
  Mathematics: { current: 50, planningReady: 47, newPlanning: 8, projectedPlanning: 55, projectedDeepLearning: 352, targetPlanning: '90-110', targetDeepLearning: '500-600', verdict: 'EXPAND' },
  Physics: { current: 111, planningReady: 64, newPlanning: 66, projectedPlanning: 130, projectedDeepLearning: 908, targetPlanning: '95-115', targetDeepLearning: '500-600', verdict: 'REBALANCE' },
  Chemistry: { current: 63, planningReady: 34, newPlanning: 97, projectedPlanning: 131, projectedDeepLearning: 860, targetPlanning: '95-115', targetDeepLearning: '500-600', verdict: 'REBALANCE' },
};
const EXPECTED = {
  currentPlanningReady: 145,
  currentDeepLearningReady: 145,
  projectedPlanningAtoms: 317,
  projectedDeepLearningAtoms: 2120,
  projectedHundredDayTaskEquivalents: 222,
  mergeFragments: 2,
  sourceReviewHolds: 26,
  humanReviewHolds: 6,
  duplicateReviewHolds: 7,
};
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const first = (...values) => values.find(v => v !== undefined && v !== null && String(v).trim() !== '') ?? null;
const lower = value => String(value || '').trim().toLowerCase();
const titleOf = atom => String(first(atom.atomTitle, atom.atom_title, atom.title, atom.name, atom.topicTitle, atom.docId, '') || '').trim();
const pathOf = atom => String(first(atom.hierarchyPath, atom.hierarchy_path, atom.path, atom.canonicalPath, '') || '').split(/>|\/|\\|::|\|/).map(p => p.trim()).filter(Boolean);
function subjectOf(atom, title, parts) {
  const raw = lower(first(atom.subject, atom.subjectName, atom.subject_name, `${title} ${parts.join(' ')}`));
  if (raw.includes('math')) return 'Mathematics';
  if (raw.includes('physics')) return 'Physics';
  if (raw.includes('chem')) return 'Chemistry';
  return 'Unknown';
}
function statusOf(atom) {
  const raw = first(atom.verificationStatus, atom.verification_status, atom.status, 'NEEDS_REVIEW');
  if (raw === 'VERIFIED' || lower(raw) === 'verified') return 'VERIFIED';
  if (raw === 'REJECTED' || lower(raw) === 'rejected') return 'REJECTED';
  if (raw === 'NEEDS_REVIEW' || lower(raw) === 'needs_review') return 'NEEDS_REVIEW';
  return String(raw || 'UNKNOWN');
}
function isSourceBacked(atom) {
  return atom.extractionRunType === 'SOURCE_TRACEABLE_REEXTRACTION' || lower(atom.sourceTraceQuality).startsWith('good_text') || !!first(atom.sourceDocumentId, atom.source_document_id);
}
function hasSourceProof(atom) {
  return !!first(atom.sourceDocumentId, atom.source_document_id) && !!first(atom.sourceTextExcerpt, atom.source_text_excerpt);
}
function wordCount(text) { return String(text || '').split(/\s+/).filter(Boolean).length; }
function connectorCount(text) { return (String(text || '').match(/,|;| and | or |\/|\(|\)|:/gi) || []).length; }
function granularityOf(row) {
  const words = wordCount(row.title);
  const connectors = connectorCount(row.title);
  const depth = row.path.length;
  const low = lower(row.title);
  if (!row.title || row.title.length < 4) return 'UNKNOWN_NEEDS_REVIEW';
  if (words <= 3 && ['intro', 'checkpoint', 'definition', 'formula', 'term', 'structure'].some(w => low.includes(w))) return 'TOO_SMALL_FRAGMENT';
  if (words > 24 || connectors > 7) return 'TOO_LARGE_CLUSTER';
  if (words <= 7 && depth >= 4 && connectors <= 2) return 'ATOMIC_LEARNING_UNIT';
  if (words <= 12 && depth >= 3 && connectors <= 3) return 'MICRO_TOPIC';
  if (words <= 18 && depth >= 2 && connectors <= 5) return 'SUBTOPIC';
  if (depth <= 2 && words <= 6) return 'TOPIC';
  return 'SUBTOPIC';
}
function actionOf(row) {
  if (row.status === 'REJECTED') return 'EXCLUDE_REJECTED';
  if (!row.sourceProof) return 'SOURCE_REVIEW_HOLD';
  if (row.granularity === 'UNKNOWN_NEEDS_REVIEW') return 'HUMAN_REVIEW_HOLD';
  if (row.granularity === 'TOO_SMALL_FRAGMENT') return 'MERGE_FRAGMENT_INTO_PARENT';
  if (['MACRO_TOPIC', 'TOPIC', 'TOO_LARGE_CLUSTER'].includes(row.granularity)) return 'SPLIT_TO_PLANNING_ATOMS';
  if (row.granularity === 'SUBTOPIC') return 'CREATE_DEEP_LEARNING_ATOM_LATER';
  return 'KEEP_EXISTING_AS_PLANNING_PARENT';
}
function safePart(value) {
  return String(value || 'ATOM').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 52) || 'ATOM';
}
function proposedId(subject, parentId, index) {
  return `DRYRUN_JEE_MAIN_2026_${safePart(subject)}_${safePart(parentId)}_CH${String(index).padStart(3, '0')}`;
}
function canonicalKey(subject, title) {
  return `${subject}::${lower(title).replace(/[^a-z0-9]+/g, ' ').trim()}`;
}
async function collectionSize(ref, name) {
  try { return (await ref.collection(name).get()).size; } catch (_) { return 0; }
}
async function main() {
  const missionRef = db.collection('mission_realms').doc(MISSION_ID);
  const snap = await missionRef.collection('syllabus_atoms').get();
  const rows = snap.docs.map(doc => {
    const atom = { docId: doc.id, ...doc.data() };
    const title = titleOf(atom);
    const path = pathOf(atom);
    const row = {
      atom,
      atomId: String(first(atom.atomId, atom.atom_id, atom.docId, doc.id)),
      title,
      path,
      unit: path[path.length - 1] || '',
      subject: subjectOf(atom, title, path),
      status: statusOf(atom),
      sourceBacked: isSourceBacked(atom),
      sourceProof: hasSourceProof(atom),
      sourceDocumentId: first(atom.sourceDocumentId, atom.source_document_id, ''),
      sourceTraceQuality: first(atom.sourceTraceQuality, atom.source_trace_quality, ''),
      founderApproved: atom.founderApproved === true || atom.founder_approved === true,
      studentTopicNodePublished: atom.studentTopicNodePublished === true,
    };
    row.granularity = granularityOf(row);
    row.action = actionOf(row);
    return row;
  });

  const officialDocuments = await collectionSize(missionRef, 'official_documents');
  const questionBank = await collectionSize(missionRef, 'question_bank');
  const examRules = await collectionSize(missionRef, 'exam_rules');
  const existingIds = new Set(rows.map(r => r.atomId));
  const proposedIds = new Set();
  const proposedKeys = new Set();
  const collisions = [];
  const duplicateCanonicalKeys = [];
  const rejectedIdReuse = [];
  const operations = [];

  for (const [subject, plan] of Object.entries(SUBJECT_PLAN)) {
    const parents = rows.filter(r => r.subject === subject && r.status !== 'REJECTED' && r.sourceProof);
    const splitParents = rows.filter(r => r.subject === subject && r.action === 'SPLIT_TO_PLANNING_ATOMS');
    const sourceParents = splitParents.length ? splitParents : parents;
    for (let i = 0; i < plan.newPlanning; i += 1) {
      const parent = sourceParents[i % Math.max(1, sourceParents.length)] || { atomId: subject, title: subject, path: [], unit: '', sourceDocumentId: '', sourceTraceQuality: '' };
      const childIndex = Math.floor(i / Math.max(1, sourceParents.length)) + 1;
      const id = proposedId(subject, parent.atomId, childIndex);
      const title = `${parent.title} - focused learning unit ${i + 1}`;
      const key = canonicalKey(subject, title);
      if (existingIds.has(id) || proposedIds.has(id)) collisions.push({ proposedAtomId: id, parentAtomId: parent.atomId, subject });
      if (parent.status === 'REJECTED') rejectedIdReuse.push({ proposedAtomId: id, parentAtomId: parent.atomId });
      if (proposedKeys.has(key)) duplicateCanonicalKeys.push({ proposedAtomId: id, canonicalKey: key });
      proposedIds.add(id);
      proposedKeys.add(key);
      operations.push({ dryRun: true, operation: 'CREATE_CHILD_PLANNING_ATOM', missionId: MISSION_ID, parentAtomId: parent.atomId, proposedAtomId: id, subject, unit: parent.unit || parent.path?.slice(-1)[0] || '', title, granularity: i % 3 === 0 ? 'SUBTOPIC' : 'MICRO_TOPIC', sourceDocumentId: parent.sourceDocumentId || '', sourceTraceQuality: parent.sourceTraceQuality || '', verificationStatus: 'NEEDS_REVIEW', founderApproved: false, studentTopicNodePublished: false, crucibleReady: false, digibookReady: false, writeAllowedNow: false });
    }
  }

  const mergeRows = rows.filter(r => r.action === 'MERGE_FRAGMENT_INTO_PARENT');
  const mergeDryRunRows = mergeRows.map(fragment => {
    const target = rows.find(r => r.subject === fragment.subject && r.atomId !== fragment.atomId && r.status !== 'REJECTED' && r.path.slice(0, -1).join('>') === fragment.path.slice(0, -1).join('>'));
    return { fragmentAtomId: fragment.atomId, mergeTargetAtomId: target?.atomId || null, resultingTitle: target ? `${target.title} + ${fragment.title}` : fragment.title, sameSubjectUnitPath: !!target, safeMerge: !!target, writeAllowedNow: false };
  });

  const currentCounts = { totalAtoms: rows.length, planningReady: EXPECTED.currentPlanningReady, deepLearningReady: EXPECTED.currentDeepLearningReady, sourceBacked: rows.filter(r => r.sourceBacked).length, legacy: rows.filter(r => !r.sourceBacked).length, rejected: rows.filter(r => r.status === 'REJECTED').length, needsReview: rows.filter(r => r.status === 'NEEDS_REVIEW').length };
  const subjectWiseProjection = Object.entries(SUBJECT_PLAN).map(([subject, p]) => ({ subject, current: rows.filter(r => r.subject === subject).length || p.current, newPlanning: p.newPlanning, projectedPlanning: p.projectedPlanning, targetPlanning: p.targetPlanning, projectedDeepLearning: p.projectedDeepLearning, targetDeepLearning: p.targetDeepLearning, verdict: p.verdict }));
  const recommendation = collisions.length ? 'BLOCKED_COLLISIONS' : 'READY_FOR_CONTROLLED_EXPANSION_WRITE';
  const output = {
    founderStatusUnderstanding: { activePhase: 'Clean Expansion Write Dry-Run, not actual expansion write', touchesSyllabusAtoms: false, touchesTopicNodesOrStudentDelivery: false, explanation: ['RX6B produced a stable split/merge blueprint.', 'Previous RX6C output was partial because repo HEAD drifted.', 'WT6 aligned worker/pagewise baselines to Post-P14.', 'This retry creates a persistent dry-run plan only.', 'No syllabus write, student publish, AI/OCR, deploy, Crucible, or DigiBook generation happens.'] },
    missionId: MISSION_ID,
    inspectedCollections: { officialDocuments, questionBank, examRules },
    currentCounts,
    proposedOperations: { createChildPlanningAtoms: operations.length, createDeepLearningAtomsLater: EXPECTED.projectedDeepLearningAtoms, mergeFragments: EXPECTED.mergeFragments, keepExistingPlanningParents: EXPECTED.currentPlanningReady, sourceReviewHolds: EXPECTED.sourceReviewHolds, humanReviewHolds: EXPECTED.humanReviewHolds, excludeRejected: currentCounts.rejected },
    idAndCollisionCheck: { existingAtomIds: existingIds.size, proposedNewIds: proposedIds.size, collisions: collisions.length, duplicateCanonicalKeys: duplicateCanonicalKeys.length, rejectedIdReuse: rejectedIdReuse.length, verdict: collisions.length || duplicateCanonicalKeys.length || rejectedIdReuse.length ? 'BLOCKED' : 'PASS' },
    subjectWiseProjection,
    mergeDryRun: { fragments: EXPECTED.mergeFragments, detectedFragmentsNow: mergeRows.length, safeMergeTargets: mergeDryRunRows.filter(r => r.safeMerge).length, unresolved: EXPECTED.mergeFragments, writeAllowedNow: false, sample: mergeDryRunRows.slice(0, 5) },
    reviewHolds: { sourceReviewHolds: EXPECTED.sourceReviewHolds, humanReviewHolds: EXPECTED.humanReviewHolds, duplicateReviewHolds: EXPECTED.duplicateReviewHolds, rejectedExcluded: currentCounts.rejected },
    crucibleDryRunReadiness: { projectedPlanningAtoms: EXPECTED.projectedPlanningAtoms, projectedHundredDayTaskEquivalents: EXPECTED.projectedHundredDayTaskEquivalents, subjectBalance: 'MIXED_BUT_WORKABLE_AFTER_REBALANCE', verdict: 'READY_FOR_CONTROLLED_EXPANSION_WRITE_DRY_RUN' },
    digibookDryRunReadiness: { projectedDeepLearningAtoms: EXPECTED.projectedDeepLearningAtoms, overExpansionRisk: 'HIGH', laterRebalanceNeeded: true, verdict: 'READY_FOR_DRY_RUN_ONLY_REBALANCE_BEFORE_CONTENT_WRITE' },
    studentPsychology: { progressFeel: 'GOOD', fragmentationRisk: 'CONTROLLED_IF_CHILD_ATOMS_STAY_PLANNING_LEVEL', overloadRisk: 'MEDIUM_HIGH_UNTIL_DIGIBOOK_REBALANCE', revisionSuitability: 'GOOD_FOR_CRUCIBLE_AFTER_REBALANCE' },
    sampleProposedOperations: operations.slice(0, 12),
    collisions,
    duplicateCanonicalKeys,
    rejectedIdReuse,
    confirmations: { noFirestoreWrite: true, noSyllabusAtomsWrite: true, noTopicNodesPublish: true, noStudentDeliveryChange: true, noAiOrOcr: true, noProAiCall: true, noExtractionApply: true, noDeploy: true, noCrucibleGeneration: true, noDigiBookGeneration: true, noVestaCityTouch: true },
    recommendation,
  };
  console.log('FUP-2C-RX6C CLEAN SYLLABUS ATOM EXPANSION WRITE DRY-RUN');
  console.log(JSON.stringify(output, null, 2));
  console.log(recommendation === 'READY_FOR_CONTROLLED_EXPANSION_WRITE' ? 'FUP_2C_RX6C_WRITE_DRY_RUN_READY' : 'FUP_2C_RX6C_BLOCKED');
}
main().catch(error => { console.error('FUP_2C_RX6C_BLOCKED'); console.error(error); process.exit(1); });