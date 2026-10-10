const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getSha256(content) {
  return crypto.createHash('sha256').update(typeof content === 'string' ? content : JSON.stringify(content)).digest('hex');
}

const digibookWorktreePath = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base';
const lessonsDir = path.join(digibookWorktreePath, 'docs', 'patch_safety', 'rc_digibook_automated_private_scale_25_to_51_20260902', 'lessons');
const authorityCommit = '1b6f7adc20d8ebd5847f4a39106256c33a8a25e4';

const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
console.log(`Found ${files.length} lesson files in DigiBook worktree.`);

const bridgeManifest = [];
let totalFactsCount = 0;
const allFactIds = new Set();
const guSubjectCounts = { Physics: 0, Chemistry: 0, Mathematics: 0 };

files.forEach(fileName => {
  const filePath = path.join(lessonsDir, fileName);
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const fileSha256 = crypto.createHash('sha256').update(rawContent).digest('hex');
  const lessonData = JSON.parse(rawContent);

  const guId = lessonData.guId || lessonData.id || fileName.replace('.json', '');
  const subject = lessonData.subject || (fileName.includes('_PHY_') ? 'Physics' : fileName.includes('_CHE_') ? 'Chemistry' : 'Mathematics');
  guSubjectCounts[subject] = (guSubjectCounts[subject] || 0) + 1;

  const canonicalNodeId = lessonData.canonicalNodeId || lessonData.nodeId || lessonData.syllabusNodeId || '';
  const topic = lessonData.topic || lessonData.title || '';
  const lessonRevision = lessonData.revision || lessonData.version || 'v1.0.0';

  // Atomic facts
  const factIds = (lessonData.atomicFactIds || lessonData.facts || []).map(f => typeof f === 'string' ? f : (f.factId || f.id || ''));
  factIds.forEach(id => { if (id) allFactIds.add(id); });
  totalFactsCount += factIds.length;

  // Source authority refs
  const sourceRefs = (lessonData.sourceAuthorityRefs || lessonData.sources || []).map(s => typeof s === 'string' ? s : (s.documentId || s.sourceDocumentId || s.title || ''));

  // Formula refs
  const formulaRefs = (lessonData.formulaRefs || lessonData.formulas || []).map(f => typeof f === 'string' ? f : (f.formulaId || f.latex || f.name || ''));

  // Misconception refs
  const misconceptionRefs = (lessonData.misconceptionRefs || lessonData.misconceptions || []).map(m => typeof m === 'string' ? m : (m.misconceptionId || m.title || ''));

  // Worked examples
  const workedExampleRefs = (lessonData.workedExampleRefs || lessonData.workedExamples || lessonData.examples || []).map(w => typeof w === 'string' ? w : (w.exampleId || w.title || ''));

  // Self checks
  const selfCheckRefs = (lessonData.selfCheckRefs || lessonData.selfChecks || []).map(sc => typeof sc === 'string' ? sc : (sc.checkId || sc.questionId || ''));

  // Determine Source-Fact semantics:
  // Is this private lesson assembled, source fact complete, or partial?
  const isComplete = (sourceRefs.length > 0 && factIds.length >= 4 && formulaRefs.length >= 2 && workedExampleRefs.length >= 2);
  const factSemantics = isComplete ? 'SOURCE_FACT_COMPLETE' : (factIds.length > 0 ? 'SOURCE_FACT_PARTIAL' : 'SOURCE_BOUNDARY_UNPROVEN');

  bridgeManifest.push({
    guId,
    subject,
    canonicalNodeId,
    topic,
    lessonRevision,
    lessonSha256: fileSha256,
    atomicFactIds: factIds,
    sourceAuthorityRefs: sourceRefs,
    formulaRefs,
    misconceptionRefs,
    workedExampleRefs,
    selfCheckRefs,
    privateLessonAuthorityPath: filePath,
    DigiBookAuthorityCommit: authorityCommit,
    factSemantics: factSemantics,
    rawLessonData: lessonData
  });
});

console.log(`Discovered GUs: ${bridgeManifest.length}`);
console.log(`Subject Breakdown: Physics=${guSubjectCounts.Physics}, Chemistry=${guSubjectCounts.Chemistry}, Mathematics=${guSubjectCounts.Mathematics}`);
console.log(`Total Fact References: ${totalFactsCount}, Unique Verified Facts: ${allFactIds.size}`);

// Save bridge manifest
const outputManifest = {
  version: '1.0.0',
  manifestType: 'DIGIBOOK_CROSS_BRANCH_AUTHORITY_BRIDGE',
  createdAtUtc: new Date().toISOString(),
  authorityCommit: authorityCommit,
  worktreePath: digibookWorktreePath,
  summary: {
    DIGIBOOK_AUTHORITY_GUS_DISCOVERED: bridgeManifest.length,
    DIGIBOOK_AUTHORITY_FACTS_DISCOVERED: allFactIds.size,
    PHYSICS_GUS: guSubjectCounts.Physics,
    CHEMISTRY_GUS: guSubjectCounts.Chemistry,
    MATHEMATICS_GUS: guSubjectCounts.Mathematics,
    SOURCE_FACT_COMPLETE_GUS: bridgeManifest.filter(m => m.factSemantics === 'SOURCE_FACT_COMPLETE').length,
    SOURCE_FACT_PARTIAL_GUS: bridgeManifest.filter(m => m.factSemantics === 'SOURCE_FACT_PARTIAL').length,
    SOURCE_BOUNDARY_UNPROVEN_GUS: bridgeManifest.filter(m => m.factSemantics === 'SOURCE_BOUNDARY_UNPROVEN').length
  },
  lessons: bridgeManifest.map(({ rawLessonData, ...meta }) => meta)
};

fs.mkdirSync(path.join(__dirname, '..', 'docs', 'academic_review'), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, '..', 'docs', 'academic_review', 'digibook_authority_bridge_manifest.json'),
  JSON.stringify(outputManifest, null, 2)
);

console.log('Saved digibook_authority_bridge_manifest.json successfully.');
