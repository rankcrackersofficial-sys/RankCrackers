const { extractScannedPage } = require('./services/scanned_extraction_service');
const cp = require('child_process');
const axios = require('axios');

const PROJECT_ID = 'rankcrackers-55';

function getAccessToken() {
  try { return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
  catch (error) {
    console.error('Authentication Error: Could not get gcloud access token.', error.message);
    process.exit(1);
  }
}

async function resolveSourceBytes(path, token) {
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
  const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` }, responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function main() {
  const token = getAccessToken();
  const sourcePath = 'mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925.pdf';
  const sourceSha256 = '2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';

  console.log('Resolving PDF bytes...');
  const bytes = await resolveSourceBytes(sourcePath, token);
  console.log(`PDF resolved: ${bytes.length} bytes.`);

  console.log('Extracting Page 67...');
  const result = await extractScannedPage({
    missionId: 'neet_(ug)-2027',
    documentId: 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
    sourceSha256,
    pdfBytes: bytes,
    pageNumber: 67
  });

  console.log('\n--- PAGE 67 RESULTS ---');
  console.log('Raw OCR Snippet:', result.rawText.substring(0, 500));
  console.log('\nCorrected Text Snippet:', result.text.substring(0, 500));
  console.log('\nCorrections:', JSON.stringify(result.corrections, null, 2));
}

main().catch(e => {
  console.error('Error:', e.message);
  if (e.stack) console.error(e.stack);
});
