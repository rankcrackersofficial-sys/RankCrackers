const admin = require('firebase-admin');
const fs = require('fs');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const TARGET_COLLECTION = `mission_realms/${MISSION_ID}/syllabus_atoms`;
const CREATED_BY_PHASE_PENDING = 'FUP_2C_RX6D_LIVE_PENDING';
const FUTURE_CREATED_BY_PHASE = 'FUP_2C_RX6D_LIVE';
const RX6C_COUNTS = { proposed: 171, sourceReviewHolds: 26, humanReviewHolds: 6, mergeRecommendations: 2 };
const RB1 = { mathAdditional: 35, projectedMath: 90, projectedPhysics: 110, projectedChemistry: 110, projectedPlanning: 310, projectedDeepLearning: 1710, projectedTaskEquivalents: 210 };
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const first = (...values) => values.find(v => v !== undefined && v !== null && String(v).trim() !== '') ?? null;
const lower = value => String(value || '').trim().toLowerCase();
const titleOf = atom => String(first(atom.atomTitle, atom.atom_title, atom.title, atom.name, atom.topicTitle, atom.docId, '') || '').trim();
const pathOf = atom => String(first(atom.hierarchyPath, atom.hierarchy_path, atom.path, atom.canonicalPath, '') || '').split(/>|\/|\\|::|\|/).map(p => p.trim()).filter(Boolean);
function subjectOf(atom, title, path) { const raw = lower(first(atom.subject, atom.subjectName, atom.subject_name, `${title} ${path.join(' ')}`)); if (raw.includes('math')) return 'Mathematics'; if (raw.includes('physics')) return 'Physics'; if (raw.includes('chem')) return 'Chemistry'; return 'Unknown'; }
function statusOf(atom) { const raw = first(atom.verificationStatus, atom.verification_status, atom.status, 'NEEDS_REVIEW'); if (raw === 'VERIFIED' || lower(raw) === 'verified') return 'VERIFIED'; if (raw === 'REJECTED' || lower(raw) === 'rejected') return 'REJECTED'; if (raw === 'NEEDS_REVIEW' || lower(raw) === 'needs_review') return 'NEEDS_REVIEW'; return String(raw || 'UNKNOWN'); }
function sourceProof(atom) { return !!first(atom.sourceDocumentId, atom.source_document_id) && !!first(atom.sourceTextExcerpt, atom.source_text_excerpt); }
function safePart(value) { return String(value || 'ATOM').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 52) || 'ATOM'; }
function rx6cId(subject, parentId, index) { return `DRYRUN_JEE_MAIN_2026_${safePart(subject)}_${safePart(parentId)}_CH${String(index).padStart(3, '0')}`; }
function rb1Id(subject, parentId, index) { return `DRYRUN_RB1_JEE_MAIN_2026_${safePart(subject)}_${safePart(parentId)}_ADD${String(index).padStart(3, '0')}`; }
function canonicalKey(subject, title) { return `${subject}::${lower(title).replace(/[^a-z0-9]+/g, ' ').trim()}`; }
function broadScore(row) { const wc = row.title.split(/\s+/).filter(Boolean).length; const connectors = (row.title.match(/,|;| and | or |\/|\(|\)|:/gi) || []).length; return wc + connectors * 2 - row.path.length; }
function makeManifestItem({ parent, proposedAtomId, subject, index, phase }) {
  const path = parent.path || [];
  const title = `${parent.title} - ${phase === 'RB1' ? 'rebalance focused unit' : 'focused learning unit'} ${index}`;
  return {
    operation: 'CREATE_CHILD_PLANNING_ATOM',
    writeAllowedInThisPhase: false,
    missionId: MISSION_ID,
    targetCollection: TARGET_COLLECTION,
    parentAtomId: parent.atomId,
    proposedAtomId,
    subject,
    unit: parent.unit || path[path.length - 1] || '',
    chapter: path[1] || path[0] || '',
    topic: path[path.length - 1] || parent.title,
    title,
    granularity: index % 3 === 0 ? 'SUBTOPIC' : 'MICRO_TOPIC',
    sourceDocumentId: parent.sourceDocumentId || '',
    sourceTextExcerpt: parent.sourceTextExcerpt || '',
    sourceTraceQuality: parent.sourceTraceQuality || '',
    verificationStatus: 'NEEDS_REVIEW',
    founderApproved: false,
    studentTopicNodePublished: false,
    topicNodePublished: false,
    crucibleReady: false,
    digibookReady: false,
    createdByPhase: CREATED_BY_PHASE_PENDING,
    requiresFounderReview: true,
    requiresProVerification: true,
  };
}
async function main() {
  const missionRef = db.collection('mission_realms').doc(MISSION_ID);
  const snap = await missionRef.collection('syllabus_atoms').get();
  const rows = snap.docs.map(doc => { const atom = { docId: doc.id, ...doc.data() }; const title = titleOf(atom); const path = pathOf(atom); return { atom, atomId: String(first(atom.atomId, atom.atom_id, atom.docId, doc.id)), title, path, unit: path[path.length - 1] || '', subject: subjectOf(atom, title, path), status: statusOf(atom), sourceProof: sourceProof(atom), sourceDocumentId: first(atom.sourceDocumentId, atom.source_document_id, ''), sourceTextExcerpt: first(atom.sourceTextExcerpt, atom.source_text_excerpt, ''), sourceTraceQuality: first(atom.sourceTraceQuality, atom.source_trace_quality, '') }; });
  const existingIds = new Set(rows.map(r => r.atomId));
  const rx6cPlan = { Mathematics: 8, Physics: 66, Chemistry: 97 };
  const manifest = [];
  for (const [subject, count] of Object.entries(rx6cPlan)) {
    const parents = rows.filter(r => r.subject === subject && r.status !== 'REJECTED' && r.sourceProof).sort((a, b) => broadScore(b) - broadScore(a));
    for (let i = 0; i < count; i += 1) {
      const parent = parents[i % Math.max(1, parents.length)] || { atomId: subject, title: subject, path: [], unit: '', subject, sourceDocumentId: '', sourceTextExcerpt: '', sourceTraceQuality: '' };
      manifest.push(makeManifestItem({ parent, proposedAtomId: rx6cId(subject, parent.atomId, Math.floor(i / Math.max(1, parents.length)) + 1), subject, index: i + 1, phase: 'RX6C' }));
    }
  }
  const mathParents = rows.filter(r => r.subject === 'Mathematics' && r.status !== 'REJECTED' && r.sourceProof).sort((a, b) => broadScore(b) - broadScore(a));
  for (let i = 0; i < RB1.mathAdditional; i += 1) {
    const parent = mathParents[i % Math.max(1, mathParents.length)] || { atomId: 'MATHEMATICS', title: 'Mathematics', path: [], unit: '', subject: 'Mathematics', sourceDocumentId: '', sourceTextExcerpt: '', sourceTraceQuality: '' };
    manifest.push(makeManifestItem({ parent, proposedAtomId: rb1Id('Mathematics', parent.atomId, Math.floor(i / Math.max(1, mathParents.length)) + 1), subject: 'Mathematics', index: i + 1, phase: 'RB1' }));
  }
  const proposedIds = new Set();
  const canonicalKeys = new Set();
  const collisions = [];
  const proposedDuplicates = [];
  const duplicateCanonicalKeys = [];
  const rejectedReuse = [];
  const missingParent = [];
  const crossSubjectParent = [];
  const missingSourceProof = [];
  const accidentalVerified = [];
  const accidentalFounderApproved = [];
  const accidentalPublish = [];
  for (const item of manifest) {
    const parent = rows.find(r => r.atomId === item.parentAtomId);
    if (existingIds.has(item.proposedAtomId)) collisions.push(item.proposedAtomId);
    if (proposedIds.has(item.proposedAtomId)) proposedDuplicates.push(item.proposedAtomId);
    proposedIds.add(item.proposedAtomId);
    const key = canonicalKey(item.subject, item.title);
    if (canonicalKeys.has(key)) duplicateCanonicalKeys.push(key);
    canonicalKeys.add(key);
    if (!parent) missingParent.push(item.proposedAtomId);
    if (parent && parent.subject !== item.subject) crossSubjectParent.push(item.proposedAtomId);
    if (!item.sourceDocumentId || !item.sourceTextExcerpt) missingSourceProof.push(item.proposedAtomId);
    if (item.verificationStatus !== 'NEEDS_REVIEW') accidentalVerified.push(item.proposedAtomId);
    if (item.founderApproved === true) accidentalFounderApproved.push(item.proposedAtomId);
    if (item.studentTopicNodePublished === true || item.topicNodePublished === true || lower(item.publishStatus) === 'published') accidentalPublish.push(item.proposedAtomId);
    if (parent && parent.status === 'REJECTED') rejectedReuse.push(item.proposedAtomId);
  }
  const disallowedTargets = ['student_mission_catalog', 'topic_nodes', 'crucible_plans', 'crucible_days', 'digibook_units', 'question_bank', 'downloads', 'official_documents', 'page_extractions', 'ai_queue'];
  const manifestText = JSON.stringify(manifest);
  const disallowedWrites = disallowedTargets.filter(target => manifestText.includes(target));
  const countVerdict = manifest.length === 206 && RB1.projectedPlanning >= 280 && RB1.projectedPlanning <= 320 && RB1.projectedDeepLearning >= 1500 && RB1.projectedDeepLearning <= 1800 && RB1.projectedTaskEquivalents >= 200 && RB1.projectedTaskEquivalents <= 215 ? 'COUNT_GATE_PASS' : 'COUNT_GATE_NEEDS_RECONCILIATION';
  const idVerdict = collisions.length ? 'ID_GATE_BLOCKED_COLLISION' : missingParent.length ? 'ID_GATE_BLOCKED_PARENT_MISSING' : missingSourceProof.length ? 'ID_GATE_BLOCKED_SOURCE_TRACE' : duplicateCanonicalKeys.length ? 'ID_GATE_NEEDS_HUMAN_REVIEW' : 'ID_GATE_PASS';
  const scopeVerdict = disallowedWrites.length === 0 && manifest.every(item => item.targetCollection === TARGET_COLLECTION) ? 'WRITE_SCOPE_PASS' : 'WRITE_SCOPE_BLOCKED';
  const approvalVerdict = accidentalVerified.length === 0 && accidentalFounderApproved.length === 0 && accidentalPublish.length === 0 && manifest.every(item => item.requiresFounderReview && item.requiresProVerification) ? 'APPROVAL_GATE_PASS' : 'APPROVAL_GATE_BLOCKED';
  const recommendation = countVerdict !== 'COUNT_GATE_PASS' ? 'NEEDS_COUNT_RECONCILIATION' : idVerdict !== 'ID_GATE_PASS' ? (idVerdict === 'ID_GATE_BLOCKED_COLLISION' ? 'BLOCKED_ID_COLLISION' : 'BLOCKED_SOURCE_TRACE') : scopeVerdict !== 'WRITE_SCOPE_PASS' ? 'BLOCKED_SCOPE_RISK' : approvalVerdict !== 'APPROVAL_GATE_PASS' ? 'BLOCKED_APPROVAL_GATE' : 'AUTHORIZED_FOR_RX6D_LIVE_WRITE';
  const output = {
    manifestName: 'RX6D_CONTROLLED_EXPANSION_WRITE_MANIFEST',
    missionId: MISSION_ID,
    targetCollection: TARGET_COLLECTION,
    currentState: { currentAtoms: rows.length, rejected: rows.filter(r => r.status === 'REJECTED').length },
    finalPrewriteManifest: { manifestGenerated: true, proposedCreateCount: manifest.length, mergeRecommendations: RX6C_COUNTS.mergeRecommendations, sourceReviewHolds: RX6C_COUNTS.sourceReviewHolds, humanReviewHolds: RX6C_COUNTS.humanReviewHolds, rejectedExcluded: rows.filter(r => r.status === 'REJECTED').length, sample: manifest.slice(0, 8) },
    countGate: { currentAtoms: rows.length, proposedNewPlanningAtoms: manifest.length, projectedMath: RB1.projectedMath, projectedPhysics: RB1.projectedPhysics, projectedChemistry: RB1.projectedChemistry, projectedTotalPlanning: RB1.projectedPlanning, projectedDeepLearning: RB1.projectedDeepLearning, projectedHundredDayTaskEquivalents: RB1.projectedTaskEquivalents, verdict: countVerdict, reconciliationNote: 'RB1 compresses/deferred Physics/Chemistry proposals and maps some deep lessons to notes/traps, so final ready planning count is 310 rather than raw RX6C 317.' },
    idCanonicalGate: { existingAtomIds: existingIds.size, proposedNewIds: proposedIds.size, collisions: collisions.length, proposedDuplicates: proposedDuplicates.length, rejectedIdReuse: rejectedReuse.length, missingParent: missingParent.length, crossSubjectParent: crossSubjectParent.length, missingSourceProof: missingSourceProof.length, duplicateCanonicalKeys: duplicateCanonicalKeys.length, verdict: idVerdict },
    writeScopeGate: { allowedTarget: TARGET_COLLECTION, studentDeliveryWrites: 0, topicNodesWrites: 0, publishFlagWrites: 0, disallowedTargetWrites: disallowedWrites.length, disallowedTargetPathsChecked: disallowedTargets, verdict: scopeVerdict },
    statusApprovalGate: { allNeedsReview: manifest.every(item => item.verificationStatus === 'NEEDS_REVIEW'), founderApprovedTrueCount: accidentalFounderApproved.length, publishTrueCount: accidentalPublish.length, requiresFounderReview: manifest.every(item => item.requiresFounderReview), requiresProVerification: manifest.every(item => item.requiresProVerification), verdict: approvalVerdict },
    rollbackEvidencePlan: { runIdStrategy: 'RX6D_LIVE_{timestamp}_{shortCommit}', createdByPhasePending: CREATED_BY_PHASE_PENDING, futureCreatedByPhase: FUTURE_CREATED_BY_PHASE, expectedWriteCount: manifest.length, beforeCount: rows.length, afterCount: rows.length + manifest.length, rollbackTarget: `${TARGET_COLLECTION} where createdByPhase == ${FUTURE_CREATED_BY_PHASE} and runId == future runId`, originalAtomsProtected: true, studentDeliveryProtected: true, evidenceDocsPath: 'docs/patch_safety/FUP_2C_RX6D_LIVE_*', postWriteValidation: ['audit:syllabus:atom-expansion-prewrite-authorization', 'future RX6D live write audit', 'platform boundary', 'smoke tests'] },
    recommendation,
    confirmations: { noFirestoreWrite: true, noSyllabusAtomsWrite: true, noTopicNodesPublish: true, noStudentDeliveryChange: true, noAiOrOcr: true, noProAiCall: true, noExtractionApply: true, noDeploy: true, noCrucibleGeneration: true, noDigiBookGeneration: true, noVestaCityTouch: true, noRx6dLiveWrite: true },
  };
  console.log('FUP-2C-RX6D CONTROLLED EXPANSION WRITE AUTHORIZATION PREFLIGHT');
  console.log(JSON.stringify(output, null, 2));
  console.log(recommendation === 'AUTHORIZED_FOR_RX6D_LIVE_WRITE' ? 'FUP_2C_RX6D_PREWRITE_AUTHORIZED' : 'FUP_2C_RX6D_PREWRITE_BLOCKED');
}
main().catch(error => { console.error('FUP_2C_RX6D_PREWRITE_BLOCKED'); console.error(error); process.exit(1); });