const admin = require('firebase-admin');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'neet_(ug)-2027';
const DOC_HASH = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

function getAccessToken() {
  try {
    return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Could not get gcloud access token.');
    return null;
  }
}

async function main() {
  const token = getAccessToken();
  if (!token) {
    console.error('Token missing, cannot reach production.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
      credential: admin.credential.cert({
        // We don't have a service account file, but we can use the token.
        // Actually, firebase-admin doesn't easily support raw tokens in initializeApp
        // without a service account.
        // But we can use the REST API or @google-cloud/firestore.
      })
    });
  }
  // Wait, let's use a simpler approach.
  // I'll use axios to fetch from the REST API since it's easier with a raw token.
}

// Rewriting to use axios for REST API
const axios = require('axios');

async function verifyREST() {
  const token = getAccessToken();
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  const pages = Array.from({length: 14}, (_, i) => 67 + i);
  const checks = {
    71: ['Ψ', 'Ψ²'],
    72: ['ΔS', 'ΔG', 'ΔG°'],
    73: ['K₂Cr₂O₇'],
    75: ['>C=O'],
    76: ['Pb²⁺', 'Cu²⁺', 'Al³⁺', 'CO₃²⁻', 'SO₄²⁻', 'NO₂⁻', 'NO₃⁻', 'Cl⁻', 'Br⁻', 'I⁻'],
    78: ['C₃', 'C₄']
  };

  console.log(`Verifying pages 67-80 for mission ${MISSION_ID} in PRODUCTION\n`);

  for (const p of pages) {
    const docPath = `mission_realms/${MISSION_ID}/official_documents/${DOC_HASH}/page_extractions/${p}`;
    const url = `${baseUrl}/${docPath}`;

    try {
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = resp.data.fields;
      const text = data.extraction_text ? data.extraction_text.stringValue : '';
      const method = data.extraction_method ? data.extraction_method.stringValue : 'unknown';

      console.log(`Page ${p}: method=${method}, text_length=${text.length}`);

      if (checks[p]) {
        for (const notation of checks[p]) {
          const found = text.includes(notation);
          console.log(`  - [${found ? 'OK' : 'MISSING'}] notation: '${notation}'`);
        }
      }
    } catch (e) {
      if (e.response && e.response.status === 404) {
        console.log(`Page ${p}: NOT FOUND in Production`);
      } else {
        console.log(`Page ${p}: ERROR: ${e.message}`);
      }
    }
  }
}

verifyREST().catch(console.error);
