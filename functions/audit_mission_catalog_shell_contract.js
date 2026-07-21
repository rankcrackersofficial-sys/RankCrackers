const fs = require('fs');

const backendFile = 'functions/callable/handle_sentinel_action.js';
const backfillFile = 'functions/backfill_student_mission_catalog.js';
const backend = fs.readFileSync(backendFile, 'utf8');
const backfill = fs.readFileSync(backfillFile, 'utf8');

function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return '';
  if (name === 'buildStudentMissionCatalogShell') {
    const end = src.indexOf('/**', start + 10);
    return end >= 0 ? src.slice(start, end) : src.slice(start);
  }
  if (name === 'buildCatalogPayload') {
    const end = src.indexOf('module.exports', start + 10);
    return end >= 0 ? src.slice(start, end) : src.slice(start);
  }
  const next = src.indexOf('\n}\n\n', start);
  return next >= 0 ? src.slice(start, next + 3) : src.slice(start);
}

const backendBuilder = extractFunction(backend, 'buildStudentMissionCatalogShell');
const backfillBuilder = extractFunction(backfill, 'buildCatalogPayload');
const checks = [];
function check(name, pass, detail) { checks.push({ name, pass, detail }); }
function lacksForbidden(fnSrc, field) {
  return !new RegExp(`\\b${field}\\s*:`).test(fnSrc);
}

check('backend builder exists', backendBuilder.length > 0, backendFile);
check('backfill builder exists', backfillBuilder.length > 0, backfillFile);
check('writer exists', /function\s+mirrorMissionShellToStudentCatalog\s*\(/.test(backend), 'mirrorMissionShellToStudentCatalog');
check('student catalog target exists', /collection\(['"]student_mission_catalog['"]\)/.test(backend), 'student_mission_catalog');
check('backend has visibility object', /visibility\s*:\s*{[\s\S]*studentVisible\s*:\s*false[\s\S]*catalogVisible\s*:\s*false[\s\S]*userPanelVisible\s*:\s*false/.test(backendBuilder), 'visibility defaults false');
check('backend has contentLocks false', /contentLocks\s*:\s*{[\s\S]*syllabusPublished\s*:\s*false[\s\S]*questionCellsPublished\s*:\s*false/.test(backendBuilder), 'contentLocks defaults false');
check('backend does not set live', !/LIVE/.test(backendBuilder), 'backend builder must not set LIVE');
check('backend does not expose user visible true', !/userPanelVisible\s*[:=]\s*true/.test(backendBuilder), 'no userPanelVisible true');
check('backend no contentReadiness', lacksForbidden(backendBuilder, 'contentReadiness'), 'no contentReadiness field');
check('backend no variables', lacksForbidden(backendBuilder, 'variables'), 'no variables field');
check('backend no legacy id fields', lacksForbidden(backendBuilder, 'mission_id') && lacksForbidden(backendBuilder, 'recruitment_id') && lacksForbidden(backendBuilder, 'recruitmentGroupId'), 'allowed shell fields only');
check('backfill has visibility object', /visibility\s*:\s*{[\s\S]*studentVisible\s*:\s*false[\s\S]*catalogVisible\s*:\s*false[\s\S]*userPanelVisible\s*:\s*false/.test(backfillBuilder), 'backfill visibility defaults false');
check('backfill has contentLocks false', /contentLocks\s*:\s*{[\s\S]*syllabusPublished\s*:\s*false[\s\S]*questionCellsPublished\s*:\s*false/.test(backfillBuilder), 'backfill contentLocks defaults false');
check('backfill no user visible true', !/userPanelVisible\s*[:=]\s*true/.test(backfillBuilder), 'backfill no userPanelVisible true');
check('backfill no contentReadiness', lacksForbidden(backfillBuilder, 'contentReadiness'), 'backfill no contentReadiness field');
check('backfill no variables', lacksForbidden(backfillBuilder, 'variables'), 'backfill no variables field');
check('no forbidden collection writes', !/topic_nodes|atomic_question_cells|question_bank|digibook_units|crucible_schedule/.test(backendBuilder + backfillBuilder), 'no academic collection writes in shell builders');

const failed = checks.filter((c) => !c.pass);
const verdict = failed.length ? 'MISSION_CATALOG_SHELL_CONTRACT_FAIL' : 'MISSION_CATALOG_SHELL_CONTRACT_PASS';
console.log(JSON.stringify({ checks, failed, verdict, noWriteProof: true }, null, 2));
console.log(verdict);
if (failed.length) process.exit(1);

