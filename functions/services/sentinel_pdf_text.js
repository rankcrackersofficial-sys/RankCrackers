'use strict';

// Legacy Sentinel PDF compatibility boundary. This is not the governed
// mission-source verifier, nor does parsing publish a document or syllabus.
const { PDFParse } = require('pdf-parse');

async function extractSentinelPdfText(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    throw new Error('SENTINEL_PDF_BYTES_REQUIRED');
  }
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText();
    return String(result?.text || '');
  } finally {
    await parser.destroy();
  }
}

module.exports = { extractSentinelPdfText };
