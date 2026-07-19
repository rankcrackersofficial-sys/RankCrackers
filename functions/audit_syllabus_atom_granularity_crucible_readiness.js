const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const PLANNING_ATOM_TARGET = { min: 280, max: 320 };
const DEEP_LEARNING_ATOM_TARGET = { min: 1500, max: 1800 };
const DAILY_TASK_TARGET = { min: 200, max: 215 };

if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function first(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

function normalizeSubject(value, fallbackText = '') {
  const raw = String(first(value, fallbackText, 'Unknown') || 'Unknown').toLowerCase();
  if (raw.includes('math')) return 'Mathematics';
  if (raw.includes('physics')) return 'Physics';
  if (raw.includes('chem')) return 'Chemistry';
  return 'Unknown';
}

function splitPath(atom) {
  const raw = first(atom.hierarchyPath, atom.hierarchy_path, atom.path, atom.canonicalPath, '');
  if (!raw) return [];
  return String(raw).split(/>|\/|\\|::|\|/).map(part => part.trim()).filter(Boolean);
}

function titleOf(atom) {
  return String(first(atom.atomTitle, atom.atom_title, atom.title, atom.name, atom.topicTitle, atom.docId, '') || '').trim();
}

function statusOf(atom) {
  const canonical = first(atom.verificationStatus, atom.verification_status, atom.status, 'NEEDS_REVIEW');
  const normalized = String(canonical).trim();
  if (normalized === 'VERIFIED' || lower(normalized) === 'verified') return 'VERIFIED';
  if (normalized === 'REJECTED' || lower(normalized) === 'rejected') return 'REJECTED';
  if (normalized === 'NEEDS_REVIEW' || lower(normalized) === 'needs_review') return 'NEEDS_REVIEW';
  return normalized || 'UNKNOWN';
}

function isFounderApproved(atom) {
  return atom.founderApproved === true || atom.founder_approved === true;
}

function isSourceBacked(atom) {
  return atom.extractionRunType === 'SOURCE_TRACEABLE_REEXTRACTION' || lower(atom.sourceTraceQuality).startsWith('good_text') || !!first(atom.sourceDocumentId, atom.source_document_id);
}

function wordCount(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

function countConnectors(text) {
  return (String(text || '').match(/,|;| and | or |\/|\(|\)|:/gi) || []).length;
}

function classifyGranularity(atom) {
  const title = titleOf(atom);
  const path = splitPath(atom);
  const wc = wordCount(title);
  const connectors = countConnectors(title);
  const sourceExcerpt = String(first(atom.sourceTextExcerpt, atom.source_text_excerpt, '') || '');
  const lowerTitle = lower(title);
  const pathDepth = path.length;

  const broadWords = ['mechanics', 'algebra', 'calculus', 'organic chemistry', 'physical chemistry', 'inorganic chemistry', 'coordinate geometry', 'electrodynamics', 'thermodynamics', 'modern physics'];
  const fragmentWords = ['definition', 'formula', 'term', 'unit', 'symbol'];

  let granularity = 'UNKNOWN_NEEDS_REVIEW';
  const reasons = [];

  if (!title || title.length < 4) {
    granularity = 'UNKNOWN_NEEDS_REVIEW';
    reasons.push('missing or weak title');
  } else if (wc <= 2 && (fragmentWords.some(word => lowerTitle.includes(word)) || sourceExcerpt.length < 80)) {
    granularity = 'TOO_SMALL_FRAGMENT';
    reasons.push('single definition/formula style fragment');
  } else if (wc <= 3 && pathDepth >= 4 && connectors === 0) {
    granularity = 'ATOMIC_LEARNING_UNIT';
    reasons.push('short testable unit in deep hierarchy');
  } else if (wc <= 7 && pathDepth >= 4 && connectors <= 2) {
    granularity = 'ATOMIC_LEARNING_UNIT';
    reasons.push('focused testable unit');
  } else if (wc <= 12 && pathDepth >= 3 && connectors <= 3) {
    granularity = 'MICRO_TOPIC';
    reasons.push('good micro learning unit');
  } else if (wc <= 18 && pathDepth >= 2 && connectors <= 5) {
    granularity = 'SUBTOPIC';
    reasons.push('subtopic likely needs one or more learning units');
  } else if (broadWords.some(word => lowerTitle === word || lowerTitle.endsWith(word)) || pathDepth <= 2 && wc <= 6) {
    granularity = 'TOPIC';
    reasons.push('normal syllabus topic / parent topic');
  } else if (wc > 24 || connectors > 7) {
    granularity = 'TOO_LARGE_CLUSTER';
    reasons.push('title combines many concepts');
  } else {
    granularity = 'SUBTOPIC';
    reasons.push('moderate-sized concept needing review');
  }

  if (broadWords.some(word => lowerTitle === word) && pathDepth <= 2) {
    granularity = 'MACRO_TOPIC';
    reasons.push('broad subject area');
  }

  return { granularity, reasons, pathDepth, titleWords: wc, connectors };
}

function readinessFor(atom, classified) {
  const status = statusOf(atom);
  const sourceDoc = first(atom.sourceDocumentId, atom.source_document_id);
  const sourceExcerpt = first(atom.sourceTextExcerpt, atom.source_text_excerpt);
  const flags = [];

  if (status === 'REJECTED') {
    flags.push('NEEDS_HUMAN_REVIEW');
    return { flags, crucibleReady: false, digibookReady: false, recommendation: 'exclude rejected atom' };
  }
  if (!sourceDoc || !sourceExcerpt) flags.push('NEEDS_SOURCE_REVIEW');
  if (classified.granularity === 'TOO_LARGE_CLUSTER' || classified.granularity === 'MACRO_TOPIC' || classified.granularity === 'TOPIC') flags.push('NEEDS_SPLIT');
  if (classified.granularity === 'TOO_SMALL_FRAGMENT') flags.push('NEEDS_MERGE');
  if (classified.granularity === 'UNKNOWN_NEEDS_REVIEW') flags.push('NEEDS_HUMAN_REVIEW');

  const crucibleReady = ['ATOMIC_LEARNING_UNIT', 'MICRO_TOPIC', 'SUBTOPIC'].includes(classified.granularity) && status !== 'REJECTED' && flags.length === 0;
  const digibookReady = ['ATOMIC_LEARNING_UNIT', 'MICRO_TOPIC', 'SUBTOPIC'].includes(classified.granularity) && status !== 'REJECTED' && !flags.includes('NEEDS_SOURCE_REVIEW');
  if (crucibleReady) flags.push('READY_FOR_CRUCIBLE');
  if (digibookReady) flags.push('READY_FOR_DIGIBOOK');

  let recommendation = 'ready for review flow';
  if (flags.includes('NEEDS_SPLIT')) recommendation = 'split before Crucible/DigiBook planning';
  if (flags.includes('NEEDS_MERGE')) recommendation = 'merge with nearby concept before planning';
  if (flags.includes('NEEDS_SOURCE_REVIEW')) recommendation = 'source proof review needed';
  if (flags.includes('NEEDS_HUMAN_REVIEW')) recommendation = 'human review needed';

  return { flags, crucibleReady, digibookReady, recommendation };
}

function increment(map, key, by = 1) {
  map[key] = (map[key] || 0) + by;
}

function subjectRow(subject, rows) {
  return {
    subject,
    total: rows.length,
    sourceBacked: rows.filter(row => row.sourceBacked).length,
    legacy: rows.filter(row => !row.sourceBacked).length,
    verified: rows.filter(row => row.status === 'VERIFIED').length,
    rejected: rows.filter(row => row.status === 'REJECTED').length,
    needsReview: rows.filter(row => row.status === 'NEEDS_REVIEW').length
  };
}

function overallPsychology(summary) {
  const tooSmall = summary.classCounts.TOO_SMALL_FRAGMENT || 0;
  const tooLarge = (summary.classCounts.TOO_LARGE_CLUSTER || 0) + (summary.classCounts.MACRO_TOPIC || 0) + (summary.classCounts.TOPIC || 0);
  const ready = summary.crucibleReady;
  const total = summary.totalAtoms || 1;
  const readyRatio = ready / total;
  const smallRatio = tooSmall / total;
  const largeRatio = tooLarge / total;
  return {
    progressFeel: smallRatio > 0.25 ? 'TOO_FRAGMENTED' : readyRatio > 0.5 ? 'GOOD' : 'WEAK',
    topicSize: smallRatio > 0.25 ? 'TOO_SMALL' : largeRatio > 0.25 ? 'TOO_LARGE' : (smallRatio > 0.1 || largeRatio > 0.1) ? 'MIXED' : 'GOOD',
    revisionSuitability: readyRatio > 0.5 ? 'GOOD' : 'WEAK',
    hundredDayCompatibility: ready >= DAILY_TASK_TARGET.min ? 'GOOD' : ready >= 100 ? 'NEEDS_REBALANCE' : 'NOT_READY'
  };
}

async function countCollection(ref, name) {
  const snap = await ref.collection(name).get();
  return snap.size;
}

async function main() {
  const missionRef = db.collection('mission_realms').doc(MISSION_ID);
  const atomsSnap = await missionRef.collection('syllabus_atoms').get();
  const atoms = atomsSnap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));

  const officialDocs = await countCollection(missionRef, 'official_documents');
  const questionBank = await countCollection(missionRef, 'question_bank');
  const examRules = await countCollection(missionRef, 'exam_rules');
  const extractionRuns = await countCollection(missionRef, 'atom_extraction_runs');

  const analyzed = atoms.map(atom => {
    const title = titleOf(atom);
    const path = splitPath(atom);
    const subject = normalizeSubject(first(atom.subject, atom.subjectName, atom.subject_name), `${title} ${path.join(' ')}`);
    const classified = classifyGranularity(atom);
    const readiness = readinessFor(atom, classified);
    return { atom, atomId: first(atom.atom_id, atom.atomId, atom.docId), title, subject, path, status: statusOf(atom), sourceBacked: isSourceBacked(atom), founderApproved: isFounderApproved(atom), classified, readiness };
  });

  const summary = {
    mission: MISSION_ID,
    totalAtoms: analyzed.length,
    sourceBackedAtoms: analyzed.filter(row => row.sourceBacked).length,
    legacyAtoms: analyzed.filter(row => !row.sourceBacked).length,
    verified: analyzed.filter(row => row.status === 'VERIFIED').length,
    rejected: analyzed.filter(row => row.status === 'REJECTED').length,
    needsReview: analyzed.filter(row => row.status === 'NEEDS_REVIEW').length,
    officialDocuments: officialDocs,
    questionBank,
    examRules,
    extractionRuns,
    classCounts: {},
    actionCounts: {},
    crucibleReady: 0,
    digibookReady: 0
  };

  for (const row of analyzed) {
    increment(summary.classCounts, row.classified.granularity);
    for (const flag of row.readiness.flags) increment(summary.actionCounts, flag);
    if (row.readiness.crucibleReady) summary.crucibleReady += 1;
    if (row.readiness.digibookReady) summary.digibookReady += 1;
  }

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Unknown'];
  const subjectRows = subjects.map(subject => subjectRow(subject, analyzed.filter(row => row.subject === subject)));
  const tooBroad = analyzed.filter(row => ['MACRO_TOPIC', 'TOPIC', 'TOO_LARGE_CLUSTER'].includes(row.classified.granularity)).slice(0, 20);
  const tooSmall = analyzed.filter(row => row.classified.granularity === 'TOO_SMALL_FRAGMENT').slice(0, 20);
  const needsSplit = analyzed.filter(row => row.readiness.flags.includes('NEEDS_SPLIT')).length;
  const needsMerge = analyzed.filter(row => row.readiness.flags.includes('NEEDS_MERGE')).length;
  const needsSourceReview = analyzed.filter(row => row.readiness.flags.includes('NEEDS_SOURCE_REVIEW')).length;
  const needsHumanReview = analyzed.filter(row => row.readiness.flags.includes('NEEDS_HUMAN_REVIEW')).length;
  const rejectedReady = analyzed.filter(row => row.status === 'REJECTED' && (row.readiness.crucibleReady || row.readiness.digibookReady)).length;

  const duplicateTitles = Object.entries(analyzed.reduce((acc, row) => {
    const key = `${row.subject}::${lower(row.title)}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).filter(([, count]) => count > 1).length;

  const sourceOverlap = analyzed.filter(row => row.sourceBacked).filter(row => analyzed.some(other => !other.sourceBacked && lower(other.title) === lower(row.title))).length;
  const psychology = overallPsychology(summary);
  const planningVerdict = summary.crucibleReady < PLANNING_ATOM_TARGET.min ? 'TOO_LOW' : summary.crucibleReady > PLANNING_ATOM_TARGET.max ? 'TOO_HIGH' : 'BALANCED';
  const deepVerdict = summary.digibookReady < DEEP_LEARNING_ATOM_TARGET.min ? 'TOO_LOW' : summary.digibookReady > DEEP_LEARNING_ATOM_TARGET.max ? 'TOO_HIGH' : 'BALANCED';
  const recommendation = summary.totalAtoms === 0 ? 'BLOCKED_INSUFFICIENT_DATA' : (summary.crucibleReady < 100 || needsSplit + needsMerge + needsSourceReview > 0) ? 'EXPAND_BEFORE_TOPIC_NODES' : 'READY_FOR_TOPIC_NODES_DRY_RUN';

  console.log('==============================================');
  console.log('FUP-2C-RX6A SYLLABUS ATOM GRANULARITY + CRUCIBLE READINESS AUDIT');
  console.log('==============================================');
  console.log('Founder Status Understanding: Syllabus Atom Quality Audit, not student publish. Read-only only. No topic_nodes/student delivery writes.');
  console.log('Current data state:', JSON.stringify(summary, null, 2));
  console.log('Subject-wise counts:', JSON.stringify(subjectRows, null, 2));
  console.log('Student psychology:', JSON.stringify(psychology, null, 2));
  console.log('Crucible readiness:', JSON.stringify({ planningTarget: PLANNING_ATOM_TARGET, currentPlanningReady: summary.crucibleReady, dailyTaskTarget: DAILY_TASK_TARGET, verdict: planningVerdict }, null, 2));
  console.log('DigiBook readiness:', JSON.stringify({ deepLearningTarget: DEEP_LEARNING_ATOM_TARGET, currentDeepLearningReady: summary.digibookReady, verdict: deepVerdict }, null, 2));
  console.log('Needs action:', JSON.stringify({ needsSplit, needsMerge, needsSourceReview, needsHumanReview }, null, 2));
  console.log('Coverage risks:', JSON.stringify({ subjectMismatch: subjectRows.find(row => row.subject === 'Unknown')?.total || 0, missingSubject: analyzed.filter(row => row.subject === 'Unknown').length, duplicateCanonicalTopics: duplicateTitles, legacySourceOverlap: sourceOverlap, rejectedCountedAsReady: rejectedReady }, null, 2));
  console.log('Too broad sample:', JSON.stringify(tooBroad.map(row => ({ atomId: row.atomId, subject: row.subject, title: row.title, reason: row.classified.reasons.join('; '), recommendation: row.readiness.recommendation })), null, 2));
  console.log('Too small sample:', JSON.stringify(tooSmall.map(row => ({ atomId: row.atomId, subject: row.subject, title: row.title, reason: row.classified.reasons.join('; '), recommendation: row.readiness.recommendation })), null, 2));
  console.log('Recommendation:', recommendation);
  console.log('Confirmations: no Firestore write, no extraction apply, no AI/OCR, no Pro AI, no deploy, no topic_nodes publish.');
  console.log('FUP_2C_RX6A_GRANULARITY_AUDIT_READY');
}

main().catch(error => {
  console.error('FUP_2C_RX6A_BLOCKED');
  console.error(error);
  process.exit(1);
});
