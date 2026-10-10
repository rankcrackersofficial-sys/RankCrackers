'use strict';
const admin = require('firebase-admin');
const {
  registerCandidateSourceVersion, activateCanonicalSource, rollbackCanonicalSource,
  classifySyllabusDelta, downstreamImpact, isJobCurrent,
} = require('../services/canonical_source_authority');
const projectId = 'demo-rankcrackers-55';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8188' || process.env.GCLOUD_PROJECT !== projectId) throw new Error('EMULATOR_ONLY_GUARD');
admin.initializeApp({projectId});
const db = admin.firestore();
const sha = c => c.repeat(64);
const missionId = `canonical-authority-${Date.now()}`;
const actor = 'founder-emulator';
const base = {missionId, documentType:'official_syllabus', documentFamily:'SYLLABUS', scope:'MISSION_COMMON', uploadedBy:actor, mimeType:'application/pdf', fileSize:100};
const currentUnits = [
 {id:'motion',semanticKey:'motion',title:'Motion',parentKey:'physics',contentDigest:'a'},
 {id:'removed',semanticKey:'removed',title:'Removed',parentKey:'physics',contentDigest:'b'},
 {id:'rename',semanticKey:'rename',title:'Old Name',parentKey:'physics',contentDigest:'c'},
 {id:'move',semanticKey:'move',title:'Move',parentKey:'old-parent',contentDigest:'d'},
 {id:'modify',semanticKey:'modify',title:'Modify',parentKey:'physics',contentDigest:'old'},
];
const candidateUnits = [
 {id:'motion',semanticKey:'motion',title:'Motion',parentKey:'physics',contentDigest:'a'},
 {id:'added',semanticKey:'added',title:'Added',parentKey:'physics',contentDigest:'e'},
 {id:'rename',semanticKey:'rename',title:'New Name',parentKey:'physics',contentDigest:'c'},
 {id:'move',semanticKey:'move',title:'Move',parentKey:'new-parent',contentDigest:'d'},
 {id:'modify',semanticKey:'modify',title:'Modify',parentKey:'physics',contentDigest:'new'},
];
(async()=>{
 const v1=await registerCandidateSourceVersion(db,{...base,documentId:`hash_${sha('a')}`,sourceSha256:sha('a'),originalFileName:'jee-2026.pdf'});
 const v2=await registerCandidateSourceVersion(db,{...base,documentId:`hash_${sha('b')}`,sourceSha256:sha('b'),originalFileName:'jee-2027.pdf'});
 const v3=await registerCandidateSourceVersion(db,{...base,documentId:`hash_${sha('c')}`,sourceSha256:sha('c'),originalFileName:'jee-2027-revision.pdf'});
 if(new Set([v1.sourceVersionId,v2.sourceVersionId,v3.sourceVersionId]).size!==3) throw new Error('VERSION_COLLISION');
 const slotRef=db.collection('mission_realms').doc(missionId).collection('source_slots').doc(v1.sourceSlotId);
 const delta1=classifySyllabusDelta([],currentUnits);
 const delta2=classifySyllabusDelta(currentUnits,candidateUnits);
 await slotRef.collection('source_versions').doc(v1.sourceVersionId).set({verificationState:'VERIFIED',deltaItems:delta1.items,deltaSummary:delta1.counts,activationBlocked:false},{merge:true});
 await slotRef.collection('source_versions').doc(v2.sourceVersionId).set({verificationState:'VERIFIED',deltaItems:delta2.items,deltaSummary:delta2.counts,activationBlocked:false},{merge:true});
 let slot=(await slotRef.get()).data();
 const a1=await activateCanonicalSource(db,{missionId,sourceSlotId:v1.sourceSlotId,sourceVersionId:v1.sourceVersionId,sourceSha256:v1.sourceSha256,expectedActivationEpoch:0,expectedCanonicalVersionId:null,founderActor:actor,reason:'Activate verified JEE 2026 baseline'});
 slot=(await slotRef.get()).data();
 const studentStillV1BeforeActivation=slot.canonicalVersionId===v1.sourceVersionId;
 let raceRejected=false;
 try { await activateCanonicalSource(db,{missionId,sourceSlotId:v2.sourceSlotId,sourceVersionId:v2.sourceVersionId,sourceSha256:v2.sourceSha256,expectedActivationEpoch:0,expectedCanonicalVersionId:null,founderActor:actor,reason:'Stale V2 activation should reject'}); } catch(e){ raceRejected=String(e.message).includes('STALE_'); }
 const a2=await activateCanonicalSource(db,{missionId,sourceSlotId:v2.sourceSlotId,sourceVersionId:v2.sourceVersionId,sourceSha256:v2.sourceSha256,expectedActivationEpoch:1,expectedCanonicalVersionId:v1.sourceVersionId,founderActor:actor,reason:'Activate verified JEE 2027 candidate'});
 slot=(await slotRef.get()).data();
 const v1After=(await slotRef.collection('source_versions').doc(v1.sourceVersionId).get()).data();
 const lateV1Blocked=!isJobCurrent(slot,{sourceVersionId:v1.sourceVersionId,sourceSha256:v1.sourceSha256,activationEpoch:1});
 const impact=downstreamImpact(delta2);
 const rollback=await rollbackCanonicalSource(db,{missionId,sourceSlotId:v1.sourceSlotId,targetVersionId:v1.sourceVersionId,targetSha256:v1.sourceSha256,expectedActivationEpoch:2,expectedCanonicalVersionId:v2.sourceVersionId,founderActor:actor,reason:'Rollback to verified JEE 2026 source'});
 const finalSlot=(await slotRef.get()).data();
 const result={missionId,versions:3,candidateUploadChangedTruth:false,studentStillV1BeforeActivation,raceRejected,a1,a2,v1Superseded:v1After.activationState==='SUPERSEDED'&&v1After.supersededBy===v2.sourceVersionId,lateV1Blocked,delta:delta2.counts,digibook:impact.digibook,crucible:impact.crucible,rollback,rollbackPointsV1:finalSlot.canonicalVersionId===v1.sourceVersionId,activationEpoch:finalSlot.activationEpoch};
 if(!Object.values({studentStillV1BeforeActivation,raceRejected,v1Superseded:result.v1Superseded,lateV1Blocked,rollbackPointsV1:result.rollbackPointsV1}).every(Boolean)) throw new Error(`ASSERTION_FAILED ${JSON.stringify(result)}`);
 console.log(JSON.stringify(result,null,2));
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

