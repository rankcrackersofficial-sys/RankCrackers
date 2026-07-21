const fs = require('fs');

const paths = {
  oldCreate: 'lib/web/founder/mission_control/create_mission_dialog.dart',
  oldEdit: 'lib/web/founder/mission_control/edit_mission_dialog.dart',
  currentCreate: 'lib/features/admin/presentation/widgets/mission_control/mission_creation_center.dart',
  currentEdit: 'lib/features/admin/presentation/widgets/mission_control/mission_control_center.dart',
  backend: 'functions/callable/handle_sentinel_action.js'
};
const src = fs.readFileSync(paths.backend, 'utf8');
const builderStart = src.indexOf('function buildStudentMissionCatalogShell(');
const builderEnd = src.indexOf('/**', builderStart + 10);
const builder = builderStart >= 0 && builderEnd >= 0 ? src.slice(builderStart, builderEnd) : '';
const checks = [];
function exists(p) { return fs.existsSync(p); }
function check(name, pass, detail) { checks.push({ name, pass, detail }); }

check('old create path stale/missing', !exists(paths.oldCreate), paths.oldCreate);
check('old edit path stale/missing', !exists(paths.oldEdit), paths.oldEdit);
check('current create path exists', exists(paths.currentCreate), paths.currentCreate);
check('current edit path exists', exists(paths.currentEdit), paths.currentEdit);
check('backend action path exists', exists(paths.backend), paths.backend);
check('builder exists', /buildStudentMissionCatalogShell/.test(src), 'builder marker');
check('writer exists', /mirrorMissionShellToStudentCatalog/.test(src), 'writer marker');
check('launch mirror call exists', /launch_exam_mission[\s\S]*mirrorMissionShellToStudentCatalog/.test(src), 'launch action mirror');
check('manifest mirror call exists', /manifest_realm[\s\S]*mirrorMissionShellToStudentCatalog/.test(src), 'manifest action mirror');
check('lifecycle mirror call exists', /launch_realm[\s\S]*mirrorMissionShellToStudentCatalog/.test(src), 'lifecycle mirror');
check('declare result mirror call exists', /declare_result[\s\S]*mirrorMissionShellToStudentCatalog/.test(src), 'declare result mirror');
check('visibility safe', /visibility\s*:\s*{[\s\S]*studentVisible\s*:\s*false[\s\S]*catalogVisible\s*:\s*false[\s\S]*userPanelVisible\s*:\s*false/.test(builder), 'false visibility defaults');
check('content locks safe', /contentLocks\s*:\s*{[\s\S]*syllabusPublished\s*:\s*false[\s\S]*questionCellsPublished\s*:\s*false/.test(builder), 'false contentLocks');
check('no broad content readiness mirror', !/contentReadiness\s*:/.test(builder), 'no contentReadiness in shell');
check('no variable mirror', !/variables\s*:/.test(builder), 'no variables in shell');
check('no auto-live in builder', !/LIVE|userPanelVisible\s*[:=]\s*true/.test(builder), 'no auto live/user visible');

const failed = checks.filter((c) => !c.pass);
let verdict = 'MISSION_MIRROR_PROOF_PASS_SERVICE_LEVEL';
if (failed.length) verdict = 'MISSION_MIRROR_PROOF_FAIL';
console.log(JSON.stringify({ paths, checks, failed, verdict, noWriteProof: true }, null, 2));
console.log(verdict);
if (failed.length) process.exit(1);
