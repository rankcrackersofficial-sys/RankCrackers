'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const { computeSha256, readPdfPageCount, buildFinalizedOfficialSource, finalizeOfficialSource, buildSourcePairTask } = require('../services/mission_official_source_finalizer');

const PDF = Buffer.from('%PDF-1.7\nRankCrackers official source fixture\n%%EOF');
const SHA = computeSha256(PDF);
const base = { missionId:'ssc_cgl', cycleKey:'2026', authorityKey:'auth_in_ssc', mimeType:'application/pdf' };
function source(type){ return buildFinalizedOfficialSource({...base, sourceType:type, sourceUrl:'https://ssc.gov.in/official.pdf', bytes:PDF, recordedAt:'2026-10-11T00:00:00Z'}); }
const preflight = ({source,expectation}) => source.missionId===expectation.missionId && source.actualSha256===expectation.expectedSha256 ? {status:'PASS'} : {status:'FAIL'};

test('server bytes determine content digest while role identity stays distinct',()=>{ const n=source('notification'); const s=source('syllabus'); assert.equal(n.documentId,`notification_${SHA}`); assert.equal(s.documentId,`syllabus_${SHA}`); assert.notEqual(n.documentId,s.documentId); assert.equal(n.contentSha256,SHA); assert.equal(n.sha256,SHA); assert.equal(n.isOfficial,true); assert.equal(n.status,'PENDING_SOURCE_VERIFICATION'); assert.equal(n.verifiedBy,null); assert.equal(n.verificationBasis,'SERVER_BYTES_SHA256_AND_AUTHORITY_DOMAIN_PREFLIGHT_ONLY'); });
test('non-authority host fails closed',()=> assert.throws(()=>buildFinalizedOfficialSource({...base,sourceType:'notification',sourceUrl:'https://example.com/a.pdf',bytes:PDF}),/DOMAIN_NOT_APPROVED/));
test('non-pdf bytes fail closed',()=> assert.throws(()=>buildFinalizedOfficialSource({...base,sourceType:'syllabus',sourceUrl:'https://ssc.gov.in/a.pdf',bytes:Buffer.from('html'),mimeType:'application/pdf'}),/PDF_SIGNATURE_INVALID/));
test('unverified source pair fails closed',()=> assert.throws(()=>buildSourcePairTask({...base,notification:source('notification'),syllabus:source('syllabus'),preflight}),/GOVERNED_VERIFICATION_REQUIRED/));

test('page count is derived from actual PDF bytes',async()=>{const pdf=await PDFDocument.create();pdf.addPage();pdf.addPage();assert.equal(await readPdfPageCount(Buffer.from(await pdf.save())),2);await assert.rejects(()=>readPdfPageCount(Buffer.from('%PDF-invalid')),/PAGE_COUNT_UNREADABLE/);});


function storageFor(bytes) {
  const objects = new Map([['mission_source_staging/test.pdf', Buffer.from(bytes)]]);
  let saved = 0;
  return {
    storage: { bucket: () => ({ file: path => ({
      getMetadata: async () => [{ contentType: 'application/pdf' }],
      download: async () => {
        if (!objects.has(path)) throw new Error('MISSING');
        return [Buffer.from(objects.get(path))];
      },
      exists: async () => [objects.has(path)],
      save: async contents => { saved++; objects.set(path, Buffer.from(contents)); },
    }) }) },
    get writes() { return saved; },
  };
}

test('real finalizer requires official URL bytes before writing any object', async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([330, 450]);
  const bytes = Buffer.from(await pdf.save());
  const sourceUrl = 'https://ssc.gov.in/official.pdf';
  const good = storageFor(bytes);
  const finalized = await finalizeOfficialSource({
    ...base, storage: good.storage, sourceType:'notification', sourceUrl,
    stagedStoragePath:'mission_source_staging/test.pdf',
    officialBytesFetcher: async () => bytes,
  });
  assert.equal(good.writes, 1);
  assert.equal(finalized.originProofState, 'OFFICIAL_URL_BYTES_MATCHED');
  assert.equal(finalized.originSha256, finalized.contentSha256);

  const mismatch = storageFor(bytes);
  await assert.rejects(() => finalizeOfficialSource({
    ...base, storage: mismatch.storage, sourceType:'notification', sourceUrl,
    stagedStoragePath:'mission_source_staging/test.pdf',
    officialBytesFetcher: async () => Buffer.from('%PDF-unrelated document'),
  }), /OFFICIAL_ORIGIN_BYTES_MISMATCH/);
  assert.equal(mismatch.writes, 0);
});

test('backend acquires official PDF from URL when no Founder staging path is supplied', async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([330, 450]);
  const bytes = Buffer.from(await pdf.save());
  const storage = storageFor(bytes);
  const finalized = await finalizeOfficialSource({
    ...base, storage: storage.storage, sourceType: 'syllabus',
    sourceUrl: 'https://ssc.gov.in/official-syllabus.pdf',
    officialBytesFetcher: async () => bytes,
  });
  assert.equal(finalized.acquisition, 'BACKEND_OFFICIAL_URL_FETCH');
  assert.equal(finalized.originProofState, 'OFFICIAL_URL_BYTES_MATCHED');
  assert.equal(storage.writes, 1);
});
