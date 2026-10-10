const fs = require('fs');
const path = require('path');

const majorFiles = [
  'major_01_physics.json',
  'major_01_chemistry.json',
  'major_01_mathematics.json'
];

const majorDir = path.join(__dirname, '..', 'docs', 'academic_review', 'test_arena_major_01');

let totalMajorQuestions = 0;
const seenIds = new Set();
const duplicateIds = [];
const subjectCounts = {};
const typeCounts = { SINGLE_CHOICE_MCQ: 0, NUMERICAL: 0 };
const difficultyCounts = { foundation: 0, standard: 0, high: 0 };
const nodeIds = new Set();
const atomIds = new Set();
const qaCounts = { PASS: 0, REPAIR_NEEDED: 0 };

majorFiles.forEach(file => {
  const filePath = path.join(majorDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING_FILE: ${file}`);
    return;
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Auditing ${file}: subject = ${content.subject}, declared total = ${content.totalQuestions}, actual questions = ${content.questions.length}`);
  
  content.questions.forEach((q, idx) => {
    totalMajorQuestions++;
    if (seenIds.has(q.questionId)) {
      duplicateIds.push(q.questionId);
    }
    seenIds.add(q.questionId);
    subjectCounts[content.subject] = (subjectCounts[content.subject] || 0) + 1;
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    difficultyCounts[q.intendedDifficulty] = (difficultyCounts[q.intendedDifficulty] || 0) + 1;
    nodeIds.add(q.structuralCoverageNodeId);
    atomIds.add(q.canonicalSyllabusAtomId);

    if (q.aiPreReviewQA && q.aiPreReviewQA.status === 'PASS') {
      qaCounts.PASS++;
    } else {
      qaCounts.REPAIR_NEEDED++;
    }
  });
});

const summary = {
  MAJOR_BLUEPRINT_SLOTS: 75,
  MAJOR_DRAFTED: totalMajorQuestions,
  UNIQUE_QUESTION_IDS: seenIds.size,
  DUPLICATES: duplicateIds.length,
  subjectCounts,
  typeCounts,
  difficultyCounts,
  uniqueStructuralNodes: nodeIds.size,
  uniqueCanonicalAtoms: atomIds.size,
  qaCounts
};

console.log('MAJOR AUDIT SUMMARY:', JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'major_01_audit_results.json'), JSON.stringify(summary, null, 2));
