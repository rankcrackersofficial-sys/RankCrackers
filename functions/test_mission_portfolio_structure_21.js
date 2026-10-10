'use strict';
const assert = require('assert');
const {evaluateDeletePreflight} = require('./services/mission_lifecycle_governance');
const {detectCandidateStructure, structureDiff, assertStructureApproval} = require('./services/mission_structure_authority');

const identity = {missionId:'fixture_multi', sourceVersionId:'srcv_fixture_001', sourceSha256:'a'.repeat(64)};
const empty = detectCandidateStructure({...identity, missionId:'fixture_empty', sections:[]});
assert.equal(empty.state, 'NOT_DISCOVERED');
assert.equal(empty.canonicalMutationAllowed, false);

const multi = detectCandidateStructure({...identity, sections:[
  {dimensionType:'paper', value:'Paper 1', page:12, section:'Scheme', evidence:'Paper 1: General Studies', confidence:.98},
  {dimensionType:'paper', value:'Paper 2', page:13, section:'Scheme', evidence:'Paper 2: Subject Knowledge', confidence:.97},
]});
assert.equal(multi.items.length, 2);
assert(multi.items.every(x => x.sourcePage && x.sourceEvidence && x.canonicalPack === 'paper'));
assert.equal(multi.canonicalMutationAllowed, false);

const ambiguous = detectCandidateStructure({...identity, missionId:'fixture_ambiguous', sections:[
  {dimensionType:'specialisation', value:'Group A / B', page:9, section:'Annexure', evidence:'Candidate shall select the applicable group', confidence:.55},
]});
assert.equal(ambiguous.state, 'FOUNDER_REVIEW_REQUIRED');
assert.equal(ambiguous.items[0].mappingState, 'UNMAPPED_SOURCE_DIMENSION');

const next = multi.items.concat([{...multi.items[0], itemId:'new', candidateValue:'Paper 3', sourcePage:14, sourceEvidence:'Paper 3'}]);
const diff = structureDiff(multi.items, next);
assert.equal(diff.added.length, 1);
assert.equal(diff.removed.length, 0);

assert.throws(() => assertStructureApproval({founderAuthorized:true, verificationState:'PENDING', activationState:'CANDIDATE', items:multi.items}), /CANONICAL_VERIFIED_NOTIFICATION_REQUIRED/);
assert.throws(() => assertStructureApproval({founderAuthorized:true, verificationState:'VERIFIED', activationState:'CANONICAL', sourceVersionId:identity.sourceVersionId, sourceSha256:identity.sourceSha256, currentCanonicalVersionId:'newer', currentCanonicalSha256:identity.sourceSha256, items:multi.items}), /STALE_STRUCTURE_DISCOVERY/);
const reviewed = multi.items.map(item => ({...item, reviewState:'APPROVED'}));
const approval = assertStructureApproval({founderAuthorized:true, verificationState:'VERIFIED', activationState:'CANONICAL', sourceVersionId:identity.sourceVersionId, sourceSha256:identity.sourceSha256, currentCanonicalVersionId:identity.sourceVersionId, currentCanonicalSha256:identity.sourceSha256, items:reviewed});
assert.equal(approval.mutationAuthority, 'EXISTING_CANONICAL_MISSION_VARIABLES');
assert.equal(approval.approved.length, 2);

assert.deepEqual(evaluateDeletePreflight({realmExists:true,recruitmentExists:true,catalogExists:true}), {eligible:true, blockers:[]});
assert.equal(evaluateDeletePreflight({realmExists:true,recruitmentExists:true,catalogExists:true,catalogStudentVisible:true}).eligible, false);
assert(evaluateDeletePreflight({realmExists:true,recruitmentExists:true,catalogExists:true,documents:true}).blockers.includes('DELETE_BLOCKED_SOURCE_DOCUMENT'));
assert(evaluateDeletePreflight({realmExists:true,recruitmentExists:true,catalogExists:true,studentProgress:true}).blockers.includes('DELETE_BLOCKED_STUDENT_HISTORY'));
assert(evaluateDeletePreflight({realmExists:true,recruitmentExists:true,catalogExists:true,queueJobs:true}).blockers.includes('DELETE_BLOCKED_PIPELINE_JOB'));
console.log(JSON.stringify({portfolioContract:'PASS', deleteContract:'PASS', structureDiscovery:'PASS', fixtures:4}));