'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { verifyOfficialSource, VERIFIER_ID } = require('../services/mission_official_source_verifier');

const BYTES = Buffer.from('%PDF-1.7\nRankCrackers verifier fixture\n%%EOF');
const SHA = crypto.createHash('sha256').update(BYTES).digest('hex');
const source = {
  documentId: `notification_${SHA}`,
  sourceType: 'notification',
  missionId: 'ssc_cgl',
  cycleKey: '2026',
  authorityKey: 'auth_in_ssc',
  sourceUrl: 'https://ssc.gov.in/official.pdf',
  officialDomain: 'ssc.gov.in',
  storagePath: `mission_realms/ssc_cgl/official_documents/notification_${SHA}/source.pdf`,
  actualSha256: SHA,
  contentSha256: SHA,
  pageCount: 1,
  language: 'english',
  isOfficial: true,
  status: 'PENDING_SOURCE_VERIFICATION',
  verifiedBy: null,
};
function storage(bytes=BYTES, fail=false) {
  return { bucket:()=>({file:()=>({download:async()=>{if(fail) throw new Error('missing'); return [bytes];}})}) };
}
test('canonical verifier alone promotes persisted official bytes', async()=>{
  const v=await verifyOfficialSource({storage:storage(),source});
  assert.equal(v.status,'VERIFIED');
  assert.equal(v.verifiedBy,VERIFIER_ID);
  assert.equal(v.contentSha256,SHA);
});
test('caller-declared verified state cannot bypass verifier', async()=>{
  await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:{...source,status:'VERIFIED'}}),/STATE_INVALID/);
  await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:{...source,verifiedBy:VERIFIER_ID}}),/STATE_INVALID/);
});
test('missing or corrupted persisted bytes fail closed', async()=>{
  await assert.rejects(()=>verifyOfficialSource({storage:storage(BYTES,true),source}),/PERSISTED_BYTES_MISSING/);
  await assert.rejects(()=>verifyOfficialSource({storage:storage(Buffer.from('%PDF-corrupt')),source}),/PERSISTED_BYTES_MISMATCH/);
});
test('binding, storage and domain mismatches fail closed', async()=>{
  await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:{...source,missionId:'other'}}),/STORAGE_PATH_MISMATCH|VERIFICATION_FAILED/);
  await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:{...source,storagePath:'mission_realms/ssc_cgl/official_documents/wrong/source.pdf'}}),/STORAGE_PATH_MISMATCH/);
  await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:{...source,sourceUrl:'https://example.com/a.pdf'}}),/DOMAIN_NOT_APPROVED/);
});

test('verifier refuses manufactured or missing language evidence',async()=>{const withoutLanguage={...source};delete withoutLanguage.language;await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:withoutLanguage,preflight:()=>({status:'PASS'})}),/LANGUAGE_EVIDENCE_REQUIRED/);});

test('verifier refuses missing page-count authority',async()=>{const bad={...source};delete bad.pageCount;await assert.rejects(()=>verifyOfficialSource({storage:storage(),source:bad,preflight:()=>({status:'PASS'})}),/PAGE_COUNT_INVALID/);});
