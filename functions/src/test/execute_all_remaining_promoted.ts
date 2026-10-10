import { MaterializationService } from '../academicFactory/services/materializationService';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
  }
  const db = admin.firestore();

  const MISSION_ID = 'jee_main_2027';

  // 1. Get already published atom IDs
  const publishedSnap = await db.collection('micro_nodes')
    .where('examId', '==', MISSION_ID)
    .where('status', '==', 'published')
    .get();
  
  const publishedAtomIds = new Set<string>();
  publishedSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.id) {
      publishedAtomIds.add(data.id);
    }
  });

  console.log(`JEE_PAYLOAD_BEFORE = ${publishedSnap.size}`);

  // 2. Load all APPROVED atoms from factory_state.json
  const factoryStatePath = path.resolve(__dirname, '../../../docs/patch_safety/jee_main_2026/factory_state.json');
  const factoryState = JSON.parse(fs.readFileSync(factoryStatePath, 'utf8'));

  const syllabusJobs = factoryState.syllabus.jobs;
  const eligibleAtomIds: string[] = [];

  for (const [key, job] of Object.entries(syllabusJobs)) {
    const jobData = job as any;
    if (jobData.status === 'APPROVED' && !publishedAtomIds.has(jobData.atomId)) {
      eligibleAtomIds.push(jobData.atomId);
    }
  }

  console.log(`TOTAL_ELIGIBLE_UNHYDRATED_APPROVED_ATOMS = ${eligibleAtomIds.length}`);

  const service = new MaterializationService();

  // Promoting all remaining in tranches of 50 to avoid transaction limits
  const trancheSize = 50;
  let totalPromoted = 0;

  for (let i = 0; i < eligibleAtomIds.length; i += trancheSize) {
    const tranche = eligibleAtomIds.slice(i, i + trancheSize);
    console.log(`PROMOTING TRANCHE OF ${tranche.length} ATOMS AUTONOMOUSLY...`);
    const count = await service.materializeTranche(MISSION_ID, tranche);
    totalPromoted += count;
  }

  // Verify final total
  const finalSnap = await db.collection('micro_nodes')
    .where('examId', '==', MISSION_ID)
    .where('status', '==', 'published')
    .get();

  console.log(`JEE_PAYLOAD_AFTER = ${finalSnap.size}`);
  console.log(`PROMOTION_DELTA = ${totalPromoted}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error running remaining promotions:', err);
  process.exit(1);
});
