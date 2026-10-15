'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { PDFDocument } = require('pdf-lib');
const { buildFinalizedOfficialSource } = require('../services/mission_official_source_finalizer');

const root = path.resolve(__dirname, '..', '..');
const notificationPath = path.join(root, 'docs', 'academic_review', '48cs6', 'source_bytes', 'ssc', 'ssc_cgl_2026_base_notice_exact_url.pdf');
const expectedSha = '54a01dda220cb8836f19983908e1f3fd14ddba8286781765a02765728a89e070';
const officialUrl = 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf';

test('SSC CGL pilot notification is exact, canonical and PDF-readable', async () => {
  const bytes = fs.readFileSync(notificationPath);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedSha);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 1);
  const source = buildFinalizedOfficialSource({
    missionId: 'ssc_cgl', cycleKey: '2026', authorityKey: 'auth_in_ssc',
    sourceType: 'notification', sourceUrl: officialUrl, bytes,
  });
  assert.equal(source.contentSha256, expectedSha);
  assert.equal(source.storagePath, `mission_realms/ssc_cgl/official_documents/notification_${expectedSha}/source.pdf`);
});
