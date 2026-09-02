const { extractScannedPage } = require('./services/scanned_extraction_service');
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

  // We'll call extractScannedPage but catch the identity mismatch to see the raw text
  try {
    const result = await extractScannedPage({
        missionId: 'neet_(ug)-2027',
        documentId: 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
        sourceSha256: '2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925',
        pdfBytes: bytes,
        pageNumber: 124
    });
    console.log('Result:', result.text);
  } catch (e) {
    console.log('Error:', e.message);
    // If it's identity mismatch, it might still have the raw text in its internal logic.
    // I'll manually run OCR here to see it.
    const vision = require('@google-cloud/vision');
    const { PDFDocument } = require('pdf-lib');
    const srcDoc = await PDFDocument.load(bytes);
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [123]);
    newDoc.addPage(copiedPage);
    const pageBytes = await newDoc.save();

    const client = new vision.ImageAnnotatorClient();
    const [response] = await client.batchAnnotateFiles({
      requests: [{
        inputConfig: { content: Buffer.from(pageBytes), mimeType: 'application/pdf' },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        pages: [1]
      }]
    });
    const text = response.responses[0].responses[0].fullTextAnnotation?.text || '';
    console.log('Raw OCR for Page 124:', JSON.stringify(text));
  }
}

main().catch(console.error);
