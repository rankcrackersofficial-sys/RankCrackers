const fs = require('fs');
const path = require('path');

const packFiles = [
  'pack_01_kinematics_1d.json',
  'pack_02_vectors_and_scalars.json',
  'pack_03_motion_in_2d_projectiles.json',
  'pack_04_relative_motion.json',
  'pack_05_calculus_graphs_kinematics.json'
];

const packDir = path.join(__dirname, '..', 'docs', 'academic_review', 's01_physics');

let totalQuestions = 0;
const seenIds = new Set();
const duplicateIds = [];
const difficultyCounts = { foundation: 0, standard: 0, high: 0 };
const typeCounts = { SINGLE_CHOICE_MCQ: 0, NUMERICAL: 0 };
const nodeIds = new Set();
const atomIds = new Set();
const auditRows = [];

packFiles.forEach(file => {
  const filePath = path.join(packDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING_FILE: ${file}`);
    return;
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Auditing ${file}: declared total = ${content.totalQuestions}, actual questions = ${content.questions.length}`);
  
  content.questions.forEach((q, idx) => {
    totalQuestions++;
    if (seenIds.has(q.questionId)) {
      duplicateIds.push(q.questionId);
    }
    seenIds.add(q.questionId);
    difficultyCounts[q.difficultyBand] = (difficultyCounts[q.difficultyBand] || 0) + 1;
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    nodeIds.add(q.structuralCoverageNodeId);
    atomIds.add(q.canonicalSyllabusAtomId);

    // Source Resolution Audit:
    // Check if sourceDocumentId is in approved registry.
    // NCERT is official educational baseline; HCV is standard reference.
    const isApprovedRegistry = q.sourceDocumentId.startsWith('NCERT_CLASS_11');
    const sourceStatus = isApprovedRegistry ? 'SOURCE_RESOLVED' : 'SOURCE_REFERENCE_ONLY';

    // AI Pre-Review QA check
    const hasStem = !!q.stem && q.stem.length > 10;
    const hasAnswer = !!q.correctAnswer && q.correctAnswer.length > 0;
    const hasSolution = !!q.solution && q.solution.length > 15;
    const hasSha = !!q.solutionSha256 && q.solutionSha256.length === 64;
    const hasOptionsIfMcq = q.type !== 'SINGLE_CHOICE_MCQ' || (q.options && q.options.length === 4);
    
    let qaStatus = 'PASS';
    if (!hasStem || !hasAnswer || !hasSolution || !hasSha || !hasOptionsIfMcq) {
      qaStatus = 'REPAIR_NEEDED';
    }

    auditRows.push({
      questionId: q.questionId,
      pack: file,
      type: q.type,
      difficultyBand: q.difficultyBand,
      structuralCoverageNodeId: q.structuralCoverageNodeId,
      canonicalSyllabusAtomId: q.canonicalSyllabusAtomId,
      sourceDocumentId: q.sourceDocumentId,
      sourceLocator: q.sourceLocator,
      sourceHash: q.sourceHash,
      sourceStatus: sourceStatus,
      qaStatus: qaStatus
    });
  });
});

const summary = {
  PACK_QUESTION_ROWS: totalQuestions,
  UNIQUE_QUESTION_IDS: seenIds.size,
  DUPLICATES: duplicateIds.length,
  difficultyCounts,
  typeCounts,
  uniqueStructuralNodes: nodeIds.size,
  uniqueCanonicalAtoms: atomIds.size,
  auditRowsCount: auditRows.length
};

console.log('AUDIT SUMMARY:', JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 's01_physics_audit_results.json'), JSON.stringify({ summary, auditRows }, null, 2));
