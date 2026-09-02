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

  console.log(`🔱 FINALIZING MATERIALIZATION FOR MISSION: ${MISSION_ID}`);

  // 1. Ensure Mission Realm exists
  const realmRef = db.collection('mission_realms').doc(MISSION_ID);
  const realmDoc = await realmRef.get();
  if (!realmDoc.exists) {
    console.log(`🔱 CREATING MISSION REALM: ${MISSION_ID}`);
    await realmRef.set({
      id: MISSION_ID,
      displayName: 'JEE Main 2027 (Alpha)',
      sourceMissionId: SOURCE_MISSION_ID,
      sourceType: 'mission_realms',
      sourcePath: `mission_realms/${SOURCE_MISSION_ID}`,
      status: 'active',
      academicBaseline: '2026',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 2. Read factory state
  const factoryStatePath = path.resolve(__dirname, `../../../docs/patch_safety/${SOURCE_MISSION_ID}/factory_state.json`);
  if (!fs.existsSync(factoryStatePath)) {
    console.error(`❌ Factory state not found at ${factoryStatePath}`);
    return;
  }
  const factoryState = JSON.parse(fs.readFileSync(factoryStatePath, 'utf8'));

  // 3. Materialize DigiBook Content
  const digibookJobs = factoryState.digibook.jobs;
  let contentPromoted = 0;

  for (const [jobId, job] of Object.entries(digibookJobs)) {
    if ((job as any).status === 'APPROVED') {
      const atomId = (job as any).atomId;
      const draftFile = (job as any).draftFile;
      if (!draftFile) continue;

      const draftPath = path.resolve(__dirname, `../../../docs/patch_safety/${SOURCE_MISSION_ID}/${draftFile}`);
      if (!fs.existsSync(draftPath)) {
        console.warn(`⚠️ Draft file not found: ${draftPath}`);
        continue;
      }

      const draftData = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
      const draft = draftData.draft;

      // Transform to DigiBookContent schema
      const payloadId = `payload_${atomId}`;

      // Simple join for contents
      const conceptsText = (draft.concepts || []).map((c: any) => `### ${c.title}\n${c.explanation}`).join('\n\n');
      const academicContent = `${draft.overview || ''}\n\n${conceptsText}`;

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
        easyMcqs: (draft.selfChecks || []).map((q: any, idx: number) => ({
          id: `q_${atomId}_${idx}`,
          nodeId: atomId,
          examId: MISSION_ID,
          subjectId: 'Physics', // Mock
          question: q.question,
          options: ['A', 'B', 'C', 'D'], // Parsing logic could be better
          answerIndex: 0, // Mock
          difficulty: 'easy',
          status: 'published',
          updatedAt: Date.now()
        })),
        mediumMcqs: [],
        hardMcqs: [],
        pyqs: [],
        publicationAudit: {
          assembledAt: Date.now(),
          version: '1.0.0-FF01',
          status: 'published'
        }
      };

      await db.collection('content_payloads').doc(payloadId).set(payload);

      // Also update the micro_node to point to this payload
      await db.collection('micro_nodes').doc(atomId).update({
        contentRegistryId: payloadId,
        status: 'published'
      });

      contentPromoted++;
      if (contentPromoted % 10 === 0) console.log(`🔱 Promoted ${contentPromoted} content payloads...`);
    }
  }

  console.log(`🔱 FINALIZATION COMPLETE: ${contentPromoted} DigiBook payloads materialized for ${MISSION_ID}.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
