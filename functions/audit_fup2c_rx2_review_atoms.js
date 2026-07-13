const admin = require('firebase-admin');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const SOURCE_DOCUMENT_ID = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
const EXPECTED_RUN_ID = 'fup2c_rx2_jee_main_2026_1783945747437';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

function yesNo(value) {
  return value ? 'YES' : 'NO';
}

function countBy(items, picker) {
  const out = {};
  for (const item of items) {
    const key = picker(item) || 'MISSING';
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function all(items, predicate) {
  return items.length > 0 && items.every(predicate);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function countSubcollection(parentRef, name) {
  const snap = await parentRef.collection(name).limit(5).get();
  return { empty: snap.empty, sampleCount: snap.size };
}

async function main() {
  const blockers = [];
  const warnings = [];
  const missionRef = db.collection('mission_realms').doc(MISSION_ID);
  const catalogRef = db.collection('student_mission_catalog').doc(MISSION_ID);
  const atomsSnap = await missionRef.collection('syllabus_atoms').get();
  const atoms = atomsSnap.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
  const rx2Atoms = atoms.filter((atom) => atom.extractionRunType === 'SOURCE_TRACEABLE_REEXTRACTION');
  const oldAtoms = atoms.filter((atom) => atom.extractionRunType !== 'SOURCE_TRACEABLE_REEXTRACTION');
  const atomIdCounts = countBy(rx2Atoms, (atom) => atom.atom_id || atom.atomId || atom.docId);
  const duplicateAtomIds = Object.entries(atomIdCounts).filter(([, count]) => count > 1);
  const sourceQualityCounts = countBy(rx2Atoms, (atom) => atom.sourceTraceQuality);
  const runIdCounts = countBy(rx2Atoms, (atom) => atom.extractionRunId);

  const latestRunId = Object.keys(runIdCounts).find((id) => id === EXPECTED_RUN_ID) || Object.keys(runIdCounts)[0] || null;
  const runSnap = latestRunId ? await missionRef.collection('atom_extraction_runs').doc(latestRunId).get() : null;
  const runData = runSnap && runSnap.exists ? runSnap.data() || {} : {};
  const officialDocSnap = await missionRef.collection('official_documents').doc(SOURCE_DOCUMENT_ID).get();
  const officialDoc = officialDocSnap.exists ? officialDocSnap.data() || {} : {};
  const catalogSnap = await catalogRef.get();
  const catalogData = catalogSnap.exists ? catalogSnap.data() || {} : {};

  const studentCollections = {};
  for (const name of ['topic_nodes', 'digibook_units', 'crucible_schedule', 'question_pool', 'downloads', 'exam_rules']) {
    studentCollections[name] = await countSubcollection(catalogRef, name);
  }

  const schemaChecks = {
    atom_id: all(rx2Atoms, (a) => nonEmpty(a.atom_id) || nonEmpty(a.atomId)),
    missionId: all(rx2Atoms, (a) => a.missionId === MISSION_ID),
    mission_id_compat: all(rx2Atoms, (a) => a.mission_id == null || a.mission_id === MISSION_ID),
    subject: all(rx2Atoms, (a) => nonEmpty(a.subject)),
    hierarchyPath: all(rx2Atoms, (a) => nonEmpty(a.hierarchyPath)),
    hierarchy_path: all(rx2Atoms, (a) => nonEmpty(a.hierarchy_path)),
    sourceTextExcerpt: all(rx2Atoms, (a) => nonEmpty(a.sourceTextExcerpt)),
    source_text_excerpt: all(rx2Atoms, (a) => nonEmpty(a.source_text_excerpt)),
    sourceDocumentId: all(rx2Atoms, (a) => nonEmpty(a.sourceDocumentId)),
    source_document_id: all(rx2Atoms, (a) => nonEmpty(a.source_document_id)),
    verificationStatus: all(rx2Atoms, (a) => a.verificationStatus === 'NEEDS_REVIEW'),
    verification_status: all(rx2Atoms, (a) => a.verification_status === 'needs_review'),
    founderApproved: all(rx2Atoms, (a) => a.founderApproved === false),
    founder_approved: all(rx2Atoms, (a) => a.founder_approved === false),
    studentTopicNodePublished: all(rx2Atoms, (a) => a.studentTopicNodePublished === false),
    sourceTraceQuality: all(rx2Atoms, (a) => a.sourceTraceQuality === 'GOOD_TEXT_NO_PAGE'),
    extractionRunId: all(rx2Atoms, (a) => nonEmpty(a.extractionRunId)),
    extractionRunType: all(rx2Atoms, (a) => a.extractionRunType === 'SOURCE_TRACEABLE_REEXTRACTION'),
  };

  if (atoms.length !== 76 || oldAtoms.length !== 26 || rx2Atoms.length !== 50) blockers.push('FUP_2C_RX3_BLOCKED_ATOM_COUNT_MISMATCH');
  if (duplicateAtomIds.length > 0 || Number(runData.duplicateCount || 0) !== 0 || Number(runData.collisionCount || 0) !== 0 || Number(runData.blockedCount || 0) !== 0) blockers.push('FUP_2C_RX3_BLOCKED_ATOM_COUNT_MISMATCH');
  if (!schemaChecks.sourceTextExcerpt || !schemaChecks.source_text_excerpt || !schemaChecks.sourceDocumentId || !schemaChecks.source_document_id) blockers.push('FUP_2C_RX3_BLOCKED_SOURCE_TRACE_MISSING');
  if (!schemaChecks.founderApproved || !schemaChecks.founder_approved || !schemaChecks.studentTopicNodePublished) blockers.push('FUP_2C_RX3_BLOCKED_PREMATURE_APPROVAL_OR_PUBLICATION');
  if (!runSnap || !runSnap.exists || runData.writtenCount !== 50 || runData.status !== 'NEEDS_REVIEW' || runData.sourceTraceQuality !== 'GOOD_TEXT_NO_PAGE' || runData.pageMapping !== 'NOT_FOUND') blockers.push('FUP_2C_RX3_BLOCKED_RUN_LOG_MISMATCH');
  if (officialDoc.latestSourceTraceableAtomRunId !== latestRunId || officialDoc.latestSourceTraceableAtomRunStatus !== 'NEEDS_REVIEW' || officialDoc.latestSourceTraceableAtomCount !== 50) blockers.push('FUP_2C_RX3_BLOCKED_OFFICIAL_DOC_METADATA_MISMATCH');
  if (!studentCollections.topic_nodes.empty || (catalogData.counts?.topicNodes ?? 0) !== 0 || !studentCollections.digibook_units.empty || !studentCollections.crucible_schedule.empty || !studentCollections.question_pool.empty || !studentCollections.downloads.empty || !studentCollections.exam_rules.empty) blockers.push('FUP_2C_RX3_BLOCKED_STUDENT_DELIVERY_SIDE_EFFECT');

  if ((sourceQualityCounts.GOOD_TEXT_NO_PAGE || 0) === 50 && runData.pageMapping === 'NOT_FOUND') {
    warnings.push('FUP_2C_RX3_POLICY_WARNING_PAGE_MAPPING_NOT_FOUND');
  }

  console.log('==============================================');
  console.log('FUP-2C-RX3 REVIEW ATOMS AUDIT');
  console.log('==============================================');
  console.log(`missionId: ${MISSION_ID}`);
  console.log(`sourceDocumentId: ${SOURCE_DOCUMENT_ID}`);
  console.log('');
  console.log('ATOM COUNTS');
  console.log(`total atoms: ${atoms.length}`);
  console.log(`old atoms: ${oldAtoms.length}`);
  console.log(`new RX2 atoms: ${rx2Atoms.length}`);
  console.log(`duplicate atom_id collisions: ${duplicateAtomIds.length}`);
  console.log(`sample RX2 atom IDs: ${rx2Atoms.slice(0, 8).map((a) => a.docId).join(', ')}`);
  console.log('');
  console.log('RX2 ATOM SCHEMA');
  for (const [key, value] of Object.entries(schemaChecks)) console.log(`${key}: ${yesNo(value)}`);
  console.log('');
  console.log('SOURCE QUALITY');
  console.log(`GOOD_TEXT_NO_PAGE: ${sourceQualityCounts.GOOD_TEXT_NO_PAGE || 0}`);
  console.log(`GOOD_TEXT_WITH_PAGE: ${sourceQualityCounts.GOOD_TEXT_WITH_PAGE || 0}`);
  console.log(`MISSING_SOURCE: ${sourceQualityCounts.MISSING_SOURCE || 0}`);
  console.log(`pageMapping: ${runData.pageMapping || 'MISSING'}`);
  console.log('policy: Founder review allowed; student topic_node publish remains blocked until page proof or explicit GOOD_TEXT_NO_PAGE override policy.');
  console.log('');
  console.log('RUN LOG');
  console.log(`runId: ${latestRunId}`);
  console.log(`exists: ${yesNo(Boolean(runSnap && runSnap.exists))}`);
  console.log(`writtenCount: ${runData.writtenCount ?? 'MISSING'}`);
  console.log(`status: ${runData.status || 'MISSING'}`);
  console.log(`sourceTraceQuality: ${runData.sourceTraceQuality || 'MISSING'}`);
  console.log(`pageMapping: ${runData.pageMapping || 'MISSING'}`);
  console.log(`blockedCount: ${runData.blockedCount ?? 'MISSING'}`);
  console.log(`duplicateCount: ${runData.duplicateCount ?? 'MISSING'}`);
  console.log(`collisionCount: ${runData.collisionCount ?? 'MISSING'}`);
  console.log('');
  console.log('OFFICIAL DOCUMENT METADATA');
  console.log(`latestSourceTraceableAtomRunId: ${officialDoc.latestSourceTraceableAtomRunId || 'MISSING'}`);
  console.log(`latestSourceTraceableAtomRunStatus: ${officialDoc.latestSourceTraceableAtomRunStatus || 'MISSING'}`);
  console.log(`latestSourceTraceableAtomCount: ${officialDoc.latestSourceTraceableAtomCount ?? 'MISSING'}`);
  console.log('');
  console.log('STUDENT DELIVERY SAFETY');
  for (const [name, info] of Object.entries(studentCollections)) console.log(`${name} empty: ${yesNo(info.empty)}`);
  console.log(`counts.topicNodes: ${catalogData.counts?.topicNodes ?? 'MISSING'}`);
  console.log('academic content promoted: NO');
  console.log('');
  console.log('WARNINGS');
  if (warnings.length === 0) console.log('none');
  for (const warning of warnings) console.log(warning);
  console.log('');
  console.log('BLOCKERS');
  if (blockers.length === 0) console.log('none');
  for (const blocker of [...new Set(blockers)]) console.log(blocker);
  console.log('');
  console.log(`FINAL: ${blockers.length === 0 ? 'FUP_2C_RX3_REVIEW_ATOMS_AUDIT_READY' : 'FUP_2C_RX3_BLOCKED'}`);

  if (blockers.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('FUP_2C_RX3_AUDIT_FAILED');
  console.error(error);
  process.exit(1);
});