'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const {buildPairCoordinatorPlan,assertStoredSource}=require('../services/mission_official_source_pair_coordinator');
const crypto=require('crypto');
function s(type,text){const h=crypto.createHash('sha256').update(text).digest('hex');return {documentId:h,sourceType:type,missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',storagePath:`mission_realms/ssc_cgl/official_documents/${h}/source.pdf`,expectedSha256:h,actualSha256:h,status:'VERIFIED',verificationState:'verified',governanceStatus:'ACTIVE',verifiedBy:'mission_source_pair_verifier_v1',isOfficial:true,officialDomain:'ssc.gov.in',language:'english'};}
const n=s('notification','n'), y=s('syllabus','s');
const preflight=()=>({status:'PASS'});
test('coordinator plan is deterministic and mission scoped',()=>{const a=buildPairCoordinatorPlan({missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',notification:n,syllabus:y,preflight});const b=buildPairCoordinatorPlan({missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',notification:n,syllabus:y,preflight});assert.equal(a.pair.taskId,b.pair.taskId);assert.match(a.queueRef,/^ai_queue\/mission_source_pair_/);});
test('stored source must preserve backend attestation',()=>assert.throws(()=>assertStoredSource({...n,verifiedBy:null},n,'notification'),/ATTESTATION_REQUIRED/));
test('stored source must preserve exact hash binding',()=>assert.throws(()=>assertStoredSource({...n,actualSha256:'0'.repeat(64)},n,'notification'),/SHA_MISMATCH/));

test('stored source requires canonical verified state',()=>assert.throws(()=>assertStoredSource({...n,verificationState:'pending'},n,'notification'),/STATE_INVALID/));
