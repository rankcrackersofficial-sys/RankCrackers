const fs = require('fs');
const path = require('path');

const audit675 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'canonical_675_question_authority_audit.json'), 'utf8'));
const sample = audit675.allDrafts.slice(0, 5);
console.log('Sample drafts from audit675:', sample.map(q => ({
  id: q.questionId,
  subj: q.subject,
  sch: q.scheduleOrEventId,
  batch: q.reviewBatchId
})));
