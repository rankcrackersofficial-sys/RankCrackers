const fs = require('fs');
const path = require('path');

const audit675 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'canonical_675_question_authority_audit.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'digibook_authority_bridge_manifest.json'), 'utf8'));
const candidateGUs = manifest.lessons.filter(l => l.subject === 'Physics');

const s01Q = audit675.allDrafts.find(q => q.scheduleOrEventId === 'sch_jee_main_2026_1');
console.log('Sample S01 Q:', s01Q.questionId, s01Q.scheduleOrEventId, s01Q.subject);

const schNum = parseInt(s01Q.scheduleOrEventId.replace(/\D/g, ''), 10) || 1;
console.log('schNum parsed:', schNum);

const matchedGUs = candidateGUs.filter(g => g.canonicalNodeId.toLowerCase().includes('u02_t_057') || g.canonicalNodeId.toLowerCase().includes('u02_t_ad1'));
console.log('Matched GUs count:', matchedGUs.length);

let matchedFactIds = [];
matchedGUs.forEach(gu => {
  matchedFactIds.push(...gu.atomicFactIds.slice(0, 3));
});
console.log('Matched fact IDs count:', matchedFactIds.length);
