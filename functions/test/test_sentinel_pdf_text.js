'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const { extractSentinelPdfText } = require('../services/sentinel_pdf_text');

test('legacy Sentinel extracts text using installed pdf-parse v2 API', async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([500, 300]);
  page.drawText('Generic portable PDF parsing regression', { x: 24, y: 220 });
  const bytes = Buffer.from(await pdf.save());
  const text = await extractSentinelPdfText(bytes);
  assert.match(text, /Generic portable PDF parsing regression/);
});

test('legacy Sentinel fails closed on missing PDF bytes', async () => {
  await assert.rejects(extractSentinelPdfText(Buffer.alloc(0)), /SENTINEL_PDF_BYTES_REQUIRED/);
  await assert.rejects(extractSentinelPdfText(null), /SENTINEL_PDF_BYTES_REQUIRED/);
});
