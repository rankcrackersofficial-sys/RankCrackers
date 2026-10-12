'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { PDFDocument } = require('pdf-lib');
const { derivePhysicalPageAuthority } = require('../lib/services/physicalPageAuthority');

async function pdfFixture() {
  const pdf = await PDFDocument.create();
  pdf.addPage([320, 440]);
  pdf.addPage([320, 440]);
  return Buffer.from(await pdf.save());
}

function sourceSha(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

test('notification and embedded syllabus logical roles share exact physical page authority', async () => {
  const bytes = await pdfFixture();
  const sha = sourceSha(bytes);
  const base = { missionId: 'ssc_cgl', sourceSha256: sha, pdfBytes: bytes, pageNumber: 1 };
  const notification = await derivePhysicalPageAuthority({
    ...base, documentId: 'notification_' + sha, expectedDocumentId: 'notification_' + sha,
  });
  const syllabus = await derivePhysicalPageAuthority({
    ...base, documentId: 'syllabus_' + sha, expectedDocumentId: 'syllabus_' + sha,
  });
  assert.equal(notification.sourceSha256, sha);
  assert.equal(notification.pageCount, 2);
  assert.equal(syllabus.pageDigest, notification.pageDigest);
  assert.equal(syllabus.pageIdentityMethod, notification.pageIdentityMethod);
  assert.equal(syllabus.physicalPageNumber, notification.physicalPageNumber);
});

test('legacy SHA identity remains accepted without loosening mission/document bindings', async () => {
  const bytes = await pdfFixture();
  const sha = sourceSha(bytes);
  const input = { missionId: 'ssc_cgl', expectedMissionId: 'ssc_cgl', sourceSha256: sha, pdfBytes: bytes, pageNumber: 2 };
  const raw = await derivePhysicalPageAuthority({ ...input, documentId: sha });
  const hash = await derivePhysicalPageAuthority({ ...input, documentId: 'hash_' + sha });
  assert.equal(raw.pageDigest, hash.pageDigest);
});

test('wrong role-content SHA, unrelated prefixes and wrong expected role fail closed', async () => {
  const bytes = await pdfFixture();
  const sha = sourceSha(bytes);
  const base = { missionId: 'ssc_cgl', sourceSha256: sha, pdfBytes: bytes, pageNumber: 1 };
  await assert.rejects(() => derivePhysicalPageAuthority({
    ...base, documentId: 'notification_' + '0'.repeat(64),
  }), /PAGE_AUTHORITY_DOCUMENT_SHA_MISMATCH/);
  await assert.rejects(() => derivePhysicalPageAuthority({
    ...base, documentId: 'arbitrary_' + sha,
  }), /PAGE_AUTHORITY_SOURCE_SHA_INVALID/);
  await assert.rejects(() => derivePhysicalPageAuthority({
    ...base, documentId: 'syllabus_' + sha, expectedDocumentId: 'notification_' + sha,
  }), /PAGE_AUTHORITY_DOCUMENT_MISMATCH/);
  await assert.rejects(() => derivePhysicalPageAuthority({
    ...base, documentId: 'notification_' + sha, expectedMissionId: 'other_mission',
  }), /PAGE_AUTHORITY_MISSION_MISMATCH/);
});
