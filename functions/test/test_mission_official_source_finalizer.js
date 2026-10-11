'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeSha256, buildFinalizedOfficialSource, buildSourcePairTask } = require('../services/mission_official_source_finalizer');

const PDF = Buffer.from('%PDF-1.7\nRankCrackers official source fixture\n%%EOF');
const SHA = computeSha256(PDF);
const base = { missionId:'ssc_cgl', cycleKey:'2026', authorityKey:'auth_in_ssc', mimeType:'application/pdf' };
function source(type){ return buildFinalizedOfficialSource({...base, sourceType:type, sourceUrl:'https://ssc.gov.in/official.pdf', bytes:PDF, recordedAt:'2026-10-11T00:00:00Z'}); }
const preflight = ({source,expectation}) => source.missionId===expectation.missionId && source.actualSha256===expectation.expectedSha256 ? {status:'PASS'} : {status:'FAIL'};

test('server bytes determine immutable document id and provenance digest',()=>{ const s=source('notification'); assert.equal(s.documentId,SHA); assert.equal(s.sha256,SHA); assert.equal(s.isOfficial,true); assert.equal(s.verificationBasis,'SERVER_BYTES_SHA256_AND_AUTHORITY_DOMAIN'); });
test('non-authority host fails closed',()=> assert.throws(()=>buildFinalizedOfficialSource({...base,sourceType:'notification',sourceUrl:'https://example.com/a.pdf',bytes:PDF}),/DOMAIN_NOT_APPROVED/));
test('non-pdf bytes fail closed',()=> assert.throws(()=>buildFinalizedOfficialSource({...base,sourceType:'syllabus',sourceUrl:'https://ssc.gov.in/a.pdf',bytes:Buffer.from('html'),mimeType:'application/pdf'}),/PDF_SIGNATURE_INVALID/));
test('verified pair gets deterministic task identity',()=>{ const a=buildSourcePairTask({...base,notification:source('notification'),syllabus:source('syllabus'),preflight}); const b=buildSourcePairTask({...base,notification:source('notification'),syllabus:source('syllabus'),preflight}); assert.equal(a.taskId,b.taskId); assert.equal(a.job.payload.notificationSha256,SHA); });
