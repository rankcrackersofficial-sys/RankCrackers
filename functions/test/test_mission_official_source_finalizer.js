'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeSha256, buildFinalizedOfficialSource, buildSourcePairTask } = require('../services/mission_official_source_finalizer');

const PDF = Buffer.from('%PDF-1.7\nRankCrackers official source fixture\n%%EOF');
const SHA = computeSha256(PDF);
const base = { missionId:'ssc_cgl', cycleKey:'2026', authorityKey:'auth_in_ssc', mimeType:'application/pdf' };
function source(type){ return buildFinalizedOfficialSource({...base, sourceType:type, sourceUrl:'https://ssc.gov.in/official.pdf', bytes:PDF, recordedAt:'2026-10-11T00:00:00Z'}); }
const preflight = ({source,expectation}) => source.missionId===expectation.missionId && source.actualSha256===expectation.expectedSha256 ? {status:'PASS'} : {status:'FAIL'};

test('server bytes determine content digest while role identity stays distinct',()=>{ const n=source('notification'); const s=source('syllabus'); assert.equal(n.documentId,`notification_${SHA}`); assert.equal(s.documentId,`syllabus_${SHA}`); assert.notEqual(n.documentId,s.documentId); assert.equal(n.contentSha256,SHA); assert.equal(n.sha256,SHA); assert.equal(n.isOfficial,true); assert.equal(n.status,'PENDING_SOURCE_VERIFICATION'); assert.equal(n.verifiedBy,null); assert.equal(n.verificationBasis,'SERVER_BYTES_SHA256_AND_AUTHORITY_DOMAIN_PREFLIGHT_ONLY'); });
test('non-authority host fails closed',()=> assert.throws(()=>buildFinalizedOfficialSource({...base,sourceType:'notification',sourceUrl:'https://example.com/a.pdf',bytes:PDF}),/DOMAIN_NOT_APPROVED/));
test('non-pdf bytes fail closed',()=> assert.throws(()=>buildFinalizedOfficialSource({...base,sourceType:'syllabus',sourceUrl:'https://ssc.gov.in/a.pdf',bytes:Buffer.from('html'),mimeType:'application/pdf'}),/PDF_SIGNATURE_INVALID/));
test('unverified source pair fails closed',()=> assert.throws(()=>buildSourcePairTask({...base,notification:source('notification'),syllabus:source('syllabus'),preflight}),/GOVERNED_VERIFICATION_REQUIRED/));
