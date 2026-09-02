const admin = require('firebase-admin');
const PROJECT_ID = 'rankcrackers-55';

async function main() {
  if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();

  const missionId = 'neet_(ug)-2027';
  const docId = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
  const pageId = '72';

  console.log(`Fetching mission_realms/${missionId}/official_documents/${docId}/page_extractions/${pageId}`);

  const snap = await db.collection('mission_realms').doc(missionId)
    .collection('official_documents').doc(docId)
    .collection('page_extractions').doc(pageId).get();

  if (!snap.exists) {
    console.log('DOCUMENT_NOT_FOUND');
    return;
  }

  const text = snap.data().extraction_text || '';
  console.log('---START_TEXT---');
  console.log(text);
  console.log('---END_TEXT---');

  const targets = ['ΔG°', 'AG', 'AG"', 'Standard Gibbs energy'];
  targets.forEach(t => {
    // Case sensitive search first
    if (text.includes(t)) {
      console.log('MATCH_FOUND: ' + t);
      const index = text.indexOf(t);
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + t.length + 50);
      console.log('SNIPPET: ...' + text.substring(start, end).replace(/\n/g, ' ') + '...');
    }
  });

  // Also check for case-insensitive 'standard gibbs energy' if not found
  if (!text.includes('Standard Gibbs energy') && text.toLowerCase().includes('standard gibbs energy')) {
      const t = 'standard gibbs energy';
      console.log('MATCH_FOUND (lower): ' + t);
      const index = text.toLowerCase().indexOf(t);
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + t.length + 50);
      console.log('SNIPPET: ...' + text.substring(start, end).replace(/\n/g, ' ') + '...');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
