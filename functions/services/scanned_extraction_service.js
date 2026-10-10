const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');
const vision = require('@google-cloud/vision');
const { correctScientificText } = require('./scientific_corrector');

/**
 * Governed Scanned-Page Extraction Service
 * Responsibility: SCANNED PDF PAGE -> VERIFIED OCR TEXT
 */
async function extractScannedPage({ missionId, documentId, sourceSha256, pdfBytes, pageNumber }) {
  if (!pdfBytes || !Buffer.isBuffer(pdfBytes)) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_INVALID_PDF_BYTES');
  }
  if (!sourceSha256) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_MISSING_AUTHORITY');
  }
  if (!pageNumber || typeof pageNumber !== 'number') {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_INVALID_PAGE_NUMBER');
  }

  // 1. Hash the actual PDF bytes
  const actualSha256 = crypto.createHash('sha256').update(pdfBytes).digest('hex');

  // 2. Compare actual SHA-256 to expected SHA-256 (handling hash_ prefix)
  const canonicalExpected = sourceSha256.startsWith('hash_') ? sourceSha256.substring(5) : sourceSha256;
  const canonicalActual = actualSha256.startsWith('hash_') ? actualSha256.substring(5) : actualSha256;

  if (canonicalActual !== canonicalExpected) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_SOURCE_SHA_MISMATCH');
  }

  // 3. Load PDF and check page boundaries
  let srcDoc;
  try {
    srcDoc = await PDFDocument.load(pdfBytes);
  } catch (e) {
    throw new Error(`RC_SYLLABUS_P1_BLOCKED_PDF_LOAD_FAILED: ${e.message}`);
  }

  const totalPages = srcDoc.getPageCount();
  if (pageNumber < 1 || pageNumber > totalPages) {
    throw new Error(`RC_SYLLABUS_P1_BLOCKED_PAGE_OUT_OF_RANGE: Requested ${pageNumber}, total ${totalPages}`);
  }

  // 4. Render/slice exactly that page
  let pageBytes;
  try {
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [pageNumber - 1]);
    newDoc.addPage(copiedPage);
    const savedBytes = await newDoc.save();
    pageBytes = Buffer.from(savedBytes);
  } catch (e) {
    throw new Error(`RC_SYLLABUS_P1_BLOCKED_PAGE_SLICE_FAILED: ${e.message}`);
  }

  // 5. Calculate digest over sliced page bytes
  const pageDigest = crypto.createHash('sha256').update(pageBytes).digest('hex');
  if (!pageDigest) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_PAGE_DIGEST_FAILED');
  }

  // 6. Execute governed OCR call via Google Cloud Vision API
  const client = new vision.ImageAnnotatorClient();
  const request = {
    requests: [
      {
        inputConfig: {
          content: pageBytes,
          mimeType: 'application/pdf',
        },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        pages: [1]
      }
    ]
  };

  let result;
  try {
    const [response] = await client.batchAnnotateFiles(request);
    result = response;
  } catch (e) {
    throw new Error(`RC_SYLLABUS_P1_BLOCKED_VISION_PROVIDER_ERROR: ${e.message}`);
  }

  // 7. Validate response and errors
  const fileResponse = result.responses ? result.responses[0] : null;
  if (!fileResponse) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_MALFORMED_VISION_RESPONSE');
  }
  if (fileResponse.error) {
    throw new Error(`RC_SYLLABUS_P1_BLOCKED_VISION_API_ERROR: ${fileResponse.error.message}`);
  }

  const pageResponse = fileResponse.responses ? fileResponse.responses[0] : null;
  if (!pageResponse) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_MALFORMED_VISION_RESPONSE');
  }
  if (pageResponse.error) {
    throw new Error(`RC_SYLLABUS_P1_BLOCKED_VISION_API_ERROR: ${pageResponse.error.message}`);
  }

  const rawText = pageResponse.fullTextAnnotation?.text || '';
  if (!rawText.trim()) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_EMPTY_OCR_RESPONSE');
  }

  // Post-OCR Content Sanity Gate (Simulated/Placeholder check)
  const lowerText = rawText.toLowerCase();
  if (lowerText.includes('simulated') || lowerText.includes('placeholder')) {
    throw new Error('RC_SYLLABUS_P1_BLOCKED_SIMULATED_CONTENT_DETECTED');
  }

  // 8. Bind Page Identity (Check printed page footer)
  // For NEET Bulletin, the printed page number is typically pageNumber - 5.
  const isNeet = (missionId && missionId.toLowerCase().includes('neet')) || 
                 (documentId && documentId.toLowerCase().includes('neet'));
  if (pageNumber >= 6 && pageNumber < totalPages) {
    const expectedPrintedNumber = isNeet ? (pageNumber - 5) : pageNumber;
    const lines = rawText.trim().split('\n');
    const lastThreeLines = lines.slice(-4).map(line => line.trim());

    const foundPrintedNumber = lastThreeLines.some(line => {
      const match = line.match(/^(\d+)\b/);
      return match && String(match[1]) === String(expectedPrintedNumber);
    });

    if (!foundPrintedNumber) {
      let detectedNumber = null;
      for (const line of lastThreeLines) {
        const match = line.match(/^(\d+)\b/);
        if (match) {
          detectedNumber = match[1];
          break;
        }
      }
      // If we are in the last page and it is blank, we might not find a number.
      // But for academic safety, we throw if mismatch in primary range.
      throw new Error(`RC_SYLLABUS_P1_BLOCKED_PAGE_IDENTITY_MISMATCH: Requested page ${pageNumber} (Expected printed footer ${expectedPrintedNumber}), but found printed footer ${detectedNumber || 'NONE'}`);
    }
  } else {
    console.log(`   - Skipping identity check for cover/TOC/back page ${pageNumber}`);
  }

  // 9. Call the Scientific Corrector to verify/fix notation (Second-pass transcription)
  const { correctedText, corrections } = await correctScientificText(rawText, pageNumber);

  // 10. Return structured response including raw OCR text, verified transcription, and audit trail
  return {
    pageNumber,
    rawText,
    text: correctedText,
    corrections,
    extractionMethod: 'VISION_OCR_PAGEWISE',
    sourceSha256: canonicalActual,
    pageDigest,
    provider: 'google-cloud-vision-api',
    validationState: 'draft_unverified'
  };
}

module.exports = {
  extractScannedPage
};
