import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
  }
  const db = admin.firestore();

  const MISSION_ID = 'jee_main_2027';
  const SOURCE_MISSION_ID = 'jee_main_2026';

  console.log(`FINALIZING MATERIALIZATION FOR MISSION: ${MISSION_ID}`);

  // 1. Ensure Mission Realm exists
  const realmRef = db.collection('mission_realms').doc(MISSION_ID);
  await realmRef.set({
    id: MISSION_ID,
    displayName: 'JEE Main 2027 (Alpha)',
    sourceMissionId: SOURCE_MISSION_ID,
    sourceType: 'mission_realms',
    sourcePath: `mission_realms/${SOURCE_MISSION_ID}`,
    status: 'active',
    academicBaseline: '2026',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. Read factory state
  const factoryStatePath = path.resolve(__dirname, `../../../docs/patch_safety/${SOURCE_MISSION_ID}/factory_state.json`);
  const factoryState = JSON.parse(fs.readFileSync(factoryStatePath, 'utf8'));

  // 3. Materialize DigiBook Content & MCQ Pool
  const digibookJobs = factoryState.digibook.jobs;
  const promotedAtomIds = new Set<string>();
  let contentPromoted = 0;
  let mcqsPromoted = 0;

  for (const [jobId, job] of Object.entries(digibookJobs)) {
    if ((job as any).status === 'APPROVED') {
      const atomId = (job as any).atomId;
      const draftFile = (job as any).draftFile;
      if (!draftFile) continue;

      const draftPath = path.resolve(__dirname, `../../../docs/patch_safety/${SOURCE_MISSION_ID}/${draftFile}`);
      if (!fs.existsSync(draftPath)) continue;

      const draftData = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
      const draft = draftData.draft;
      const payloadId = `payload_${atomId}`;

      const conceptsText = (draft.concepts || []).map((c: any) => `### ${c.title}\n${c.explanation}`).join('\n\n');
      const academicContent = `${draft.overview || ''}\n\n${conceptsText}`;

      const easyMcqs = (draft.selfChecks || []).map((q: any, idx: number) => ({
        id: `q_${atomId}_${idx}`,
        nodeId: atomId,
        examId: MISSION_ID,
        subjectId: 'Physics', // Mock, should be extracted from atomId
        question: q.question,
        options: ['(A)', '(B)', '(C)', '(D)'], // Parsing options from text would be better
        answerIndex: 0, // Mock
        difficulty: 'easy',
        status: 'published',
        updatedAt: Date.now()
      }));

      const payload = {
        nodeId: atomId,
        learningOutcome: draft.overview || '',
        beginnerContent: draft.overview || '',
        intermediateContent: (draft.workedExamples || []).map((e: any) => `**Problem:** ${e.problem}\n**Solution:** ${e.answer}`).join('\n\n'),
        proContent: (draft.formulaRegister || []).map((f: any) => `**${f.label}**: ${f.formula}`).join('\n\n'),
        academicContent: academicContent,
        facts: (draft.formulaRegister || []).map((f: any, idx: number) => ({
          id: `fact_${atomId}_${idx}`,
          subject: f.label,
          predicate: 'formula is',
          object: f.formula,
          factType: 'formula',
          importance: 5,
          difficulty: 3,
          isCore: true,
          workerVersion: '1.0.0',
          promptVersion: '1.0.0',
          sourceHash: 'derived'
        })),
        oneLiners: (draft.concepts || []).map((c: any) => c.title),
        revisionPoints: (draft.commonMisconceptions || []).map((m: any) => `Avoid: ${m.misconception} -> Correct: ${m.correction}`),
        easyMcqs: easyMcqs,
        mediumMcqs: [],
        hardMcqs: [],
        pyqs: [],
        publicationAudit: {
          assembledAt: Date.now(),
          version: '1.0.0-FF01',
          status: 'published',
          sourceMissionId: SOURCE_MISSION_ID
        }
      };

      await db.collection('content_payloads').doc(payloadId).set(payload);

      // Also populate mcq_pool for Smart Start
      for (const mcq of easyMcqs) {
          await db.collection('mcq_pool').doc(mcq.id).set(mcq);
          mcqsPromoted++;
      }

      await db.collection('micro_nodes').doc(atomId).set({
        contentRegistryId: payloadId,
        status: 'published',
        examId: MISSION_ID,
        isDiagnosticEligible: easyMcqs.length > 0
      }, { merge: true });

      promotedAtomIds.add(atomId);
      contentPromoted++;
    }
  }

  // 4. Cleanup/Sync Status for remaining nodes
  const nodes = await db.collection('micro_nodes').where('examId', '==', MISSION_ID).get();
  let statusFixed = 0;
  for (const doc of nodes.docs) {
      if (!promotedAtomIds.has(doc.id)) {
          await doc.ref.update({
              status: 'preparing',
              contentRegistryId: admin.firestore.FieldValue.delete()
          });
          statusFixed++;
      }
  }

  console.log(`FINALIZATION COMPLETE: ${contentPromoted} DigiBook payloads materialized.`);
  console.log(`MCQ POOL: ${mcqsPromoted} diagnostic questions promoted to mcq_pool.`);
  console.log(`STATUS SYNC: ${statusFixed} nodes set to 'preparing'.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
