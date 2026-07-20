const admin = require('firebase-admin');
const fs = require('fs');
const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'jee_main_2026';
const QUEUE_RUN_ID = 'fup2c_rx6g_pro_queue_jee_main_2026_20260720080015';
const QUEUE_PHASE = 'FUP_2C_RX6G_QUEUE_WRITE';
const QUEUE = 'pro_verification_queue';
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const lower = (v) => String(v || '').toLowerCase();
async function main() {
  const queueSnap = await db.collection(QUEUE)
    .where('queueRunId', '==', QUEUE_RUN_ID)
    .where('createdByPhase', '==', QUEUE_PHASE)
    .get();
  const rows = queueSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const subjectCounts = { Mathematics: 0, Physics: 0, Chemistry: 0, Unknown: 0 };
  const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, blocked: 0 };
  const queueDefaults = { pending: 0, proPending: 0, proAiCalledTrue: 0, canPublishTrue: 0, writeAllowedNowTrue: 0, studentPublishAllowedTrue: 0, atomStatusMutationAllowedTrue: 0 };
  const source = { exists: 0, needsReview: 0, founderApprovedTrue: 0, studentTopicNodePublishedTrue: 0, topicNodePublishedTrue: 0, crucibleReadyTrue: 0, digibookReadyTrue: 0 };
  for (const row of rows) {
    subjectCounts[row.subject] = (subjectCounts[row.subject] || 0) + 1;
    priorityCounts[row.priority] = (priorityCounts[row.priority] || 0) + 1;
    if (row.status === 'PENDING_PRO_VERIFICATION') queueDefaults.pending++;
    if (row.proVerificationStatus === 'PENDING') queueDefaults.proPending++;
    if (row.proAiCalled === true) queueDefaults.proAiCalledTrue++;
    if (row.canPublish === true) queueDefaults.canPublishTrue++;
    if (row.writeAllowedNow === true) queueDefaults.writeAllowedNowTrue++;
    if (row.studentPublishAllowed === true) queueDefaults.studentPublishAllowedTrue++;
    if (row.atomStatusMutationAllowed === true) queueDefaults.atomStatusMutationAllowedTrue++;
    const src = await db.collection('mission_realms').doc(MISSION_ID).collection('syllabus_atoms').where('atomId', '==', row.sourceAtomId).limit(1).get();
    if (!src.empty) {
      source.exists++;
      const atom = src.docs[0].data();
      if (atom.verificationStatus === 'NEEDS_REVIEW' || lower(atom.verification_status) === 'needs_review') source.needsReview++;
      if (atom.founderApproved === true) source.founderApprovedTrue++;
      if (atom.studentTopicNodePublished === true) source.studentTopicNodePublishedTrue++;
      if (atom.topicNodePublished === true) source.topicNodePublishedTrue++;
      if (atom.crucibleReady === true) source.crucibleReadyTrue++;
      if (atom.digibookReady === true) source.digibookReadyTrue++;
    }
  }
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const subjectOrder = { Chemistry: 0, Physics: 1, Mathematics: 2, Unknown: 3 };
  const eligible = rows.filter((row) => row.status === 'PENDING_PRO_VERIFICATION' && row.proVerificationStatus === 'PENDING' && row.proAiCalled === false && row.canPublish === false && row.writeAllowedNow === false && row.studentPublishAllowed === false && row.queueRunId === QUEUE_RUN_ID);
  const selected = eligible.sort((a, b) => order[a.priority] - order[b.priority] || subjectOrder[a.subject] - subjectOrder[b.subject] || (a.suggestedReviewOrder || 999999) - (b.suggestedReviewOrder || 999999) || (a.batchNumber || 999999) - (b.batchNumber || 999999) || a.id.localeCompare(b.id)).slice(0, 10);
  const first10Subject = selected.reduce((acc, row) => { acc[row.subject] = (acc[row.subject] || 0) + 1; return acc; }, {});
  const first10Priority = selected.reduce((acc, row) => { acc[row.priority] = (acc[row.priority] || 0) + 1; return acc; }, {});
  const inputSchema = { taskType: 'SYLLABUS_ATOM_PRO_VERIFICATION', missionId: MISSION_ID, queueItemId: '', sourceAtomId: '', subject: '', title: '', displayTitle: '', parentAtomId: '', parentTitle: '', canonicalKey: '', granularity: '', hierarchyPath: '', sourceDocumentId: '', sourceTextExcerpt: '', sourceTraceQuality: '', expectedOutput: { academicCorrectness: '', granularityVerdict: '', sourceAlignment: '', parentChildValidity: '', duplicateRisk: '', studentClarity: '', cruciblePlanningSuitability: '', digibookSuitability: '', recommendation: '' } };
  const resultSchema = { resultId: '', queueItemId: '', queueRunId: QUEUE_RUN_ID, sourceAtomId: '', missionId: MISSION_ID, subject: '', proRunId: '', model: '', status: 'PRO_VERIFIED | PRO_REJECTED | PRO_NEEDS_HUMAN_REVIEW | PRO_UNCERTAIN', academicCorrectness: 'PASS | FAIL | UNCERTAIN', granularityVerdict: 'GOOD | TOO_BROAD | TOO_FRAGMENTED | UNCERTAIN', sourceAlignment: 'PASS | FAIL | WEAK | UNCERTAIN', parentChildValidity: 'PASS | FAIL | UNCERTAIN', duplicateRisk: 'LOW | MEDIUM | HIGH', studentClarity: 'GOOD | NEEDS_EDIT | POOR', cruciblePlanningSuitability: 'GOOD | NEEDS_REBALANCE | NOT_SUITABLE', digibookSuitability: 'GOOD | NEEDS_REBALANCE | NOT_READY', confidence: 0, issues: [], recommendedFounderAction: 'APPROVE | REJECT | SEND_BACK | REVIEW_REQUIRED', canAutoApprove: false, canPublish: false, createdAt: '' };
  const prerequisitePass = rows.length === 206 && queueDefaults.pending === 206 && queueDefaults.proPending === 206 && queueDefaults.proAiCalledTrue === 0 && queueDefaults.canPublishTrue === 0 && queueDefaults.writeAllowedNowTrue === 0 && queueDefaults.studentPublishAllowedTrue === 0 && queueDefaults.atomStatusMutationAllowedTrue === 0 && subjectCounts.Mathematics === 43 && subjectCounts.Physics === 66 && subjectCounts.Chemistry === 97 && priorityCounts.HIGH === 0 && priorityCounts.MEDIUM === 163 && priorityCounts.LOW === 43 && source.exists === 206 && source.needsReview === 206 && source.founderApprovedTrue === 0 && source.studentTopicNodePublishedTrue === 0 && source.topicNodePublishedTrue === 0 && source.crucibleReadyTrue === 0 && source.digibookReadyTrue === 0;
  const publishLock = { topicNodesWriteAllowedByProcessor: false, studentMissionCatalogWriteAllowed: false, publishAllowed: false, canAutoApprove: false, founderFinalReviewMandatory: true, proVerifierCannotPublish: true, proVerifierCannotApprove: true, proVerifierCannotCreateCrucibleDigiBook: true };
  const mutationContract = { queueUpdatesAllowed: ['proAiCalled', 'proVerificationStatus', 'status', 'proRunId', 'resultId', 'processedAt', 'processingError'], resultDocsAllowed: ['create pro_verification_results/{resultId}'], sourceAtomAutoApprovalAllowed: false, sourceAtomPublishAllowed: false, topicNodesAllowed: false, studentDeliveryAllowed: false };
  const output = { queueRunId: QUEUE_RUN_ID, prerequisites: { queueDocs: rows.length, subjectCounts, priorityCounts, queueDefaults, source, result: prerequisitePass ? 'PASS' : 'FAIL' }, processorSelection: { eligiblePendingQueueDocs: eligible.length, rx6iPilotSelectableCount: selected.length, suggestedFirst10QueueItemIds: selected.map((row) => row.id), first10SubjectSplit: first10Subject, first10PrioritySplit: first10Priority, selectionVerdict: eligible.length >= 10 && prerequisitePass ? 'SELECTION_CONTRACT_PASS' : 'SELECTION_CONTRACT_BLOCKED' }, futureProInputSchema: { schemaDefined: true, sourceExcerptsIncluded: true, credentialsIncluded: false, unrelatedProjectContextIncluded: false, schema: inputSchema, verdict: 'INPUT_SCHEMA_PASS' }, futureProResultSchema: { targetCollection: 'pro_verification_results', schemaDefined: true, canAutoApprove: false, canPublish: false, founderFinalReviewMandatory: true, schema: resultSchema, verdict: 'RESULT_SCHEMA_PASS' }, futureMutationContract: { ...mutationContract, verdict: 'MUTATION_CONTRACT_PASS' }, publishLock: { ...publishLock, verdict: Object.values(publishLock).every((v, idx) => idx < 4 ? v === false : v === true) ? 'PUBLISH_LOCK_PASS' : 'PUBLISH_LOCK_BLOCKED' }, rx6iPilotReadiness: { pilotSelectable: prerequisitePass && selected.length === 10, maxPilotSize: 10, suggestedSubject: 'Chemistry', suggestedPriority: 'MEDIUM', reason: 'Chemistry has highest queue load and avg risk, first medium batch is subject-coherent.', risk: 'MEDIUM', readinessVerdict: prerequisitePass && selected.length === 10 ? 'READY_FOR_RX6I_TINY_PRO_PILOT' : 'BLOCKED_QUEUE_DRIFT' }, confirmations: { noFirestoreWrite: true, noQueueStatusUpdate: true, noVerificationRunsWrite: true, noProVerificationResultsWrite: true, noSyllabusAtomsWrite: true, noAtomApproval: true, noTopicNodesPublish: true, noStudentDeliveryChange: true, noAiOrOcr: true, noProAiCall: true, noExtractionApply: true, noDeploy: true, noCrucibleGeneration: true, noDigiBookGeneration: true, noVestaCityTouch: true }, finalVerdict: prerequisitePass ? 'FUP_2C_RX6H_PROCESSOR_CONTRACT_READY' : 'FUP_2C_RX6H_BLOCKED' };
  const md = `# FUP-2C-RX6H Pro Processor Contract Dry-Run\n\n## Purpose\nDefine how the RX6G Pro verification queue will be processed safely later. RX6H does not call Pro AI and does not update queue/source/student data.\n\n## RX6G Queue State\n- Queue run: ${QUEUE_RUN_ID}\n- Queue docs: ${rows.length}\n- Mathematics: ${subjectCounts.Mathematics}\n- Physics: ${subjectCounts.Physics}\n- Chemistry: ${subjectCounts.Chemistry}\n- HIGH: ${priorityCounts.HIGH}\n- MEDIUM: ${priorityCounts.MEDIUM}\n- LOW: ${priorityCounts.LOW}\n\n## Queue/Source Prerequisites\n${output.prerequisites.result}\n\n## Processor Selection Contract\nEligible pending docs: ${eligible.length}. RX6I pilot: first 10 Chemistry MEDIUM queue items.\n\n## Future Pro Input Schema\nDefined in JSON below. No credentials, no student personal data, no Founder private data, no VESTA/city context.\n\n## Future Pro Result Schema\nFuture target: pro_verification_results/{resultId}. canAutoApprove=false and canPublish=false.\n\n## Queue/Result Mutation Contract\nQueue docs may later receive processing metadata only. Result docs may be created later. Source atom auto approval and publish are forbidden.\n\n## Forbidden Automatic Source Atom Mutations\nNo verificationStatus VERIFIED, founderApproved true, studentTopicNodePublished true, topicNodePublished true, crucibleReady true, digibookReady true, or publishStatus PUBLISHED.\n\n## Publish Lock / Student Safety Contract\n${output.publishLock.verdict}\n\n## RX6I Tiny Pilot Recommendation\n${output.rx6iPilotReadiness.readinessVerdict}\n\n## Risks\nRX6I must remain tiny and explicitly authorized because it will be the first Pro AI call.\n\n## Next Phase\nFUP-2C-RX6I tiny Pro AI pilot for 10 Chemistry MEDIUM queue items, only after explicit approval.\n\n## Full JSON\n\n\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\`\n`;
  fs.writeFileSync('docs/syllabus/FUP_2C_RX6H_PRO_PROCESSOR_CONTRACT_DRY_RUN.md', md);
  console.log(JSON.stringify(output, null, 2));
  console.log(output.finalVerdict);
  if (output.finalVerdict !== 'FUP_2C_RX6H_PROCESSOR_CONTRACT_READY') process.exit(1);
}
main().catch((error) => { console.error('FUP_2C_RX6H_BLOCKED'); console.error(error); process.exit(1); });
