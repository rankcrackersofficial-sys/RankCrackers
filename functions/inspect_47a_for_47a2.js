const fs = require('fs');
const path = require('path');

const DOCS_DIR = 'C:/RankCrackers/RankCrackers-55/docs/academic_review';

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DOCS_DIR, name), 'utf8'));
}

const authoritiesData = loadJson('47a_india_state_ut_authority_registry.json');
const examsData = loadJson('47a_state_ut_major_exam_inventory.json');
const docsData = loadJson('47a_state_ut_latest_document_registry.json');
const pyqData = loadJson('47a_state_ut_pyq_archive_registry.json');
const dupData = loadJson('47a_duplicate_ownership_candidates.json');

console.log("Authorities count:", authoritiesData.authorities.length);
console.log("Exams count:", examsData.exams.length);
console.log("Documents count:", docsData.documents.length);
console.log("PYQ Archives count:", pyqData.archives.length);
console.log("Duplicate candidates count:", dupData.candidates.length);

// Check authority IDs in authorities
const authIds = authoritiesData.authorities.map(a => a.proposedStableAuthorityKey);
console.log("Check if 'auth_in_dn_upsc' is in 47A authorities:", authIds.includes('auth_in_dn_upsc'));

// Check region code collisions (LA vs LD)
const regionCodes = new Set();
authoritiesData.authorities.forEach(a => {
  if (a.regionCode === 'LA' || a.regionCode === 'LD') {
    console.log(`Authority [${a.regionCode}]: ${a.proposedStableAuthorityKey} - ${a.regionName}`);
  }
});

examsData.exams.forEach(e => {
  if (e.regionCode === 'LA' || e.regionCode === 'LD') {
    console.log(`Exam [${e.regionCode}]: ${e.proposedYearlessMissionKey} - ${e.studentRecognizableDisplayName}`);
  }
});
