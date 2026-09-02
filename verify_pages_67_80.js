const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'neet_(ug)-2027';
const DOC_HASH = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

async function verify() {
  const allPages = Array.from({length: 14}, (_, i) => 67 + i); // 67 to 80

  const checks = {
    71: ['Ψ', 'Ψ²'],
    72: ['ΔS', 'ΔG', 'ΔG°'],
    73: ['K₂Cr₂O₇'],
    75: ['>C=O'],
    76: ['Pb²⁺', 'Cu²⁺', 'Al³⁺', 'CO₃²⁻', 'SO₄²⁻', 'NO₂⁻', 'NO₃⁻', 'Cl⁻', 'Br⁻', 'I⁻'],
    78: ['C₃', 'C₄']
  };

  console.log(`Verifying pages 67-80 for mission ${MISSION_ID} and document ${DOC_HASH}\n`);

  for (const p of allPages) {
    const docRef = db.collection('mission_realms').doc(MISSION_ID)
      .collection('official_documents').doc(DOC_HASH)
      .collection('page_extractions').doc(String(p));

    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`Page ${p}: DOCUMENT MISSING`);
      continue;
    }

    const data = doc.data();
    const text = data.extraction_text || '';
    const method = data.extraction_method || 'unknown';

    console.log(`Page ${p}: method=${method}, text_length=${text.length}`);

    if (checks[p]) {
      for (const notation of checks[p]) {
        const found = text.includes(notation);
        console.log(`  - [${found ? 'OK' : 'MISSING'}] notation: '${notation}'`);
      }
    }
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
