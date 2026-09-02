const { PDFParse } = require('pdf-parse');
const cp = require('child_process');
const axios = require('axios');

const PROJECT_ID = 'rankcrackers-55';

function getAccessToken() {
  try { return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim(); }
  catch (error) { process.exit(1); }
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
  const bytes = await resolveSourceBytes(sourcePath, token);
  const parser = new PDFParse({ data: bytes });

  const pages = [43, 61, 65, 101, 103, 106, 109, 112, 116, 124];
  const result = await parser.getText({ partial: pages });

  console.log('--- AMBIGUOUS PAGES NATIVE TEXT ---');
  result.pages.forEach(p => {
    console.log(`\n[PAGE ${p.num}]`);
    console.log('Length:', p.text.trim().length);
    console.log('Text:', p.text.trim());
  });
}

main().catch(console.error);
