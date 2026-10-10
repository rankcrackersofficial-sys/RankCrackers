const fs = require('fs');
const path = require('path');

const audit675 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'canonical_675_question_authority_audit.json'), 'utf8'));
const counts = {};
audit675.allDrafts.forEach(q => {
  const s = q.subject || 'Unknown';
  counts[s] = (counts[s] || 0) + 1;
});
console.log('Subject counts in 675 drafts:', counts);

// Also look at schedule distribution
const schedules = {};
audit675.allDrafts.forEach(q => {
  const s = q.scheduleOrEventId || 'Unknown';
  schedules[s] = (schedules[s] || 0) + 1;
});
console.log('Schedule counts in 675 drafts:', schedules);
