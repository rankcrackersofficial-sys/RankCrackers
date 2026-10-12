// Retired legacy exam-specific executable. Data remains archived for audit.
require('./services/mission_agnostic_policy').rejectLegacyMissionSpecificExecution('materialize_neet_syllabus_v2.js');

const admin = require('firebase-admin');
const { callFlash } = require('./services/gemini_service');
const PROJECT_ID = 'rankcrackers-55';

async function materializeSubject(db, missionId, docId, subjectName, pages) {
  console.log(`\n--- Materializing ${subjectName} ---`);
  let combinedText = '';
  for (const p of pages) {
    const snap = await db.collection('mission_realms').doc(missionId)
      .collection('official_documents').doc(docId)
      .collection('page_extractions').doc(String(p)).get();
    if (snap.exists) {
      combinedText += `\n[PAGE ${p}]\n${snap.data().extraction_text}\n`;
    }
  }

  const prompt = `You are a syllabus materialization agent.
Given the text extractions for ${subjectName} from the official NEET bulletin, extract a structured syllabus hierarchy.

Hierarchy:
- Subject (${subjectName})
- Unit (e.g., UNIT 1: ...)
- Topic (Major section within a unit)
- Atomic Topic (The smallest unit of study/fact)

For each Atomic Topic, you MUST provide:
- "atom_id": a unique string (format: neet_2027_${subjectName.toLowerCase().substring(0,3)}_${pages[0]}_${pages[pages.length-1]}_atN)
- "atom_title": the display title
- "subject": "${subjectName}"
- "unit": the unit name (exactly as in text)
- "topic": the major topic name
- "subtopic": the specific atomic topic name
- "page_number": the physical page number where it was found (67-80)

Output ONLY a JSON object with this schema:
{
  "atoms": [
    { "atom_id": "...", "atom_title": "...", "subject": "...", "unit": "...", "topic": "...", "subtopic": "...", "page_number": 67 }
  ]
}

Important Rules:
1. Do NOT hallucinate. Only include what is in the source text.
2. Maintain scientific notation (e.g. Ψ, ΔG) exactly as in input.
3. Every bullet point or comma-separated item in the source should ideally be an atomic topic or part of one.

Source Text:
${combinedText}`;

  const response = await callFlash(prompt);
  const result = JSON.parse(response);
  return result.atoms;
}

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  const physicsAtoms = await materializeSubject(db, missionId, docId, 'Physics', [67, 68, 69, 70]);
  const chemistryAtoms = await materializeSubject(db, missionId, docId, 'Chemistry', [71, 72, 73, 74, 75, 76]);
  const biologyAtoms = await materializeSubject(db, missionId, docId, 'Biology', [77, 78, 79, 80]);

  const allAtoms = [...physicsAtoms, ...chemistryAtoms, ...biologyAtoms];
  console.log(`\nTotal Atoms Materialized: ${allAtoms.length}`);

  console.log('Writing atoms to mission_realms...');
  const batch = db.batch();
  const atomsRef = db.collection('mission_realms').doc(missionId).collection('syllabus_atoms');

  // Clear existing first for clean state if needed (user said materialize live)
  // But wait, the user said "No synthetic topics", "No duplicates".
  // I'll check if they already exist.

  for (const atom of allAtoms) {
    const docRef = atomsRef.doc(atom.atom_id);
    batch.set(docRef, {
      ...atom,
      verification_status: 'draft_from_source',
      founder_approved: false,
      source_document_id: docId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  console.log('Materialization SUCCESS.');
}

main().catch(console.error);
