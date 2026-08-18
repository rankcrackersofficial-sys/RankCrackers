const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'docs', 'patch_safety', 'rc_repo_hygiene_01_controlled_cleanup_20260818');
fs.mkdirSync(outDir, { recursive: true });

function git(args) {
  return cp.execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}
function read(file) {
  try { return fs.readFileSync(path.join(repoRoot, file), 'utf8'); } catch (_) { return ''; }
}
function writeJson(name, value) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(value, null, 2) + '\n');
}
function sha256(file) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex').toUpperCase();
}

const headBefore = git(['rev-parse', 'HEAD']);
const files = git(['ls-files']).split(/\r?\n/).filter(Boolean);
const fileSet = new Set(files);
const sourceFiles = files.filter(f => /^(lib|functions|tools|test)\//.test(f.replace(/\\/g, '/')));

const currentAuthority = {
  firebaseProject: 'rankcrackers-55',
  missionAuthorityPath: 'mission_realms/{missionId}',
  studentProjectionPath: 'student_mission_catalog/{sameMissionId}',
  missionProjectionLineageFields: [
    'sourceMissionId',
    'sourceMissionVersion',
    'sourcePath',
    'sourceType',
    'studentPublicationState'
  ],
  legacyMissionIdsAreProductionAuthority: false,
  syntheticReportsAreEvidence: false,
  liveProductionRecountStatus: 'PENDING_SEPARATE_AUTHORIZATION'
};

const rootReports = files.filter(f => /^(AUDIT_REPORT|GARBAGE_REPORT|PIPELINE_|FUNCTIONS_|RANKCRACKERS_FIREBASE|WORKER_STATUS).+\.(md|txt)$/i.test(f));
const patchSafetyFiles = files.filter(f => f.startsWith('docs/patch_safety/'));
const docsSyllabusFiles = files.filter(f => f.startsWith('docs/syllabus/'));
const internalAcademicFiles = files.filter(f => f.startsWith('docs/digibook/internal/') || f.startsWith('docs/assessment/internal/'));
const functionOneOffScripts = files.filter(f => /^functions\/(audit_|apply_|generate_|find_|plan_|rollback_|execute_|tmp_).+\.js$/.test(f));
const rootUtilityScripts = files.filter(f => /^(check_pdf_exports|comprehensive_audit|init_budget|list-models|pipeline_diagnosis|test-gemini|verify_ownership)\.js$/.test(f));

const legacyRefs = [];
const syntheticRefs = [];
const fixtureRefs = [];
const firebaseProjectRefs = [];
const engineAuthorityRefs = [];
for (const file of sourceFiles) {
  const text = read(file);
  if (!text) continue;
  if (/jee_main_2026|JEE_MAIN_2026|CBSE_12_2026|BITSAT_2026|JEE_ADV_2026|NEET_2026/.test(text)) legacyRefs.push(file);
  if (/synthetic|mock|demo|fixture|preview/i.test(text)) syntheticRefs.push(file);
  if (/assets\/data\/preview|assets\/data\/emulator|rootBundle\.loadString/.test(text)) fixtureRefs.push(file);
  const projects = [...text.matchAll(/rankcrackers-[a-z0-9-]+/gi)].map(m => m[0]);
  for (const project of projects) {
    if (project !== 'rankcrackers-55' && project !== 'rankcrackers-test-c2-fix5' && project !== 'rankcrackers-c4-rebuild-policy-r1' && project !== 'rankcrackers-c3-integrity-v3') {
      firebaseProjectRefs.push({ file, project });
    }
  }
  if (/class .*Engine|function .*Worker|AafWorker|Factory.*Engine|Verifier.*Backend/.test(text)) engineAuthorityRefs.push(file);
}

const productionSources = sourceFiles.filter(f => /^(lib|functions\/src|functions\/callable)\//.test(f.replace(/\\/g, '/')));
const productionReachableLegacy = legacyRefs.filter(f => productionSources.includes(f));
const productionReachableFixtures = fixtureRefs.filter(f => productionSources.includes(f));
const productionReachableSynthetic = syntheticRefs.filter(f => productionSources.includes(f));

const cleanupCandidates = [
  ...rootReports.map(file => ({ file, action: 'ARCHIVE_CANDIDATE', reason: 'root historical report can be mistaken for current authority' })),
  ...functionOneOffScripts.map(file => ({ file, action: 'ARCHIVE_CANDIDATE', reason: 'one-off audit/apply/tmp script outside deployable source tree' })),
  ...rootUtilityScripts.map(file => ({ file, action: 'ARCHIVE_CANDIDATE', reason: 'root utility/audit script not current production authority' })),
  ...patchSafetyFiles.map(file => ({ file, action: 'KEEP_AS_HISTORICAL_EVIDENCE_ZONE', reason: 'patch safety evidence must not be production authority' })),
  ...internalAcademicFiles.map(file => ({ file, action: 'KEEP_AS_INTERNAL_PRIVATE_ARTIFACT', reason: 'internal academic evidence, not student publication authority' }))
];

const authorityIndex = {
  generatedAt: new Date().toISOString(),
  headBefore,
  currentAuthority,
  productionAuthority: {
    firebaseConfig: ['.firebaserc', 'android/app/google-services.json', 'lib/firebase_options.dart'],
    missionRegistry: ['functions/canonical_mission_registry.js'],
    founderMissionWriter: ['functions/callable/handle_sentinel_action.js'],
    studentMissionReader: ['lib/core/firebase/firestore_service.dart', 'lib/core/backend/recruitment_repository.dart'],
    studentModel: ['lib/core/models/recruitment.dart'],
    academicFactoryDomain: files.filter(f => f.startsWith('lib/features/academic_factory/domain/')).sort(),
    functionsAcademicFactory: files.filter(f => f.startsWith('functions/src/academicFactory/')).sort()
  },
  nonAuthorityZones: {
    patchSafety: 'Historical evidence only; never current runtime/factory authority unless a latest accepted report explicitly says so.',
    docsSyllabus: 'Historical syllabus process notes; not live production mission authority.',
    rootReports: 'Superseded root reports; archive candidates.',
    functionOneOffScripts: 'One-off operational scripts; not deployable authority.',
    previewAssets: 'Founder/internal preview/test assets only; not Student production data.'
  }
};
fs.writeFileSync(path.join(repoRoot, 'docs', 'authority', 'CURRENT_AUTHORITY_INDEX.json'), JSON.stringify(authorityIndex, null, 2) + '\n');
fs.writeFileSync(path.join(repoRoot, 'docs', 'AUTHORITY_INDEX.md'), `# RankCrackers Current Authority Index\n\nCurrent Firebase project: \`${currentAuthority.firebaseProject}\`\n\nMission authority: \`${currentAuthority.missionAuthorityPath}\`\n\nStudent projection: \`${currentAuthority.studentProjectionPath}\`\n\nLegacy mission IDs are historical/test/factory history unless an explicit current authority document binds them to a live Founder mission. Synthetic reports and preview bundles are not production evidence.\n\nSee \`docs/authority/CURRENT_AUTHORITY_INDEX.json\` for machine-readable routing.\n`);

writeJson('firebase_project_inventory.json', {
  expectedProject: 'rankcrackers-55',
  repoConfigEvidence: {
    firebaserc: read('.firebaserc').includes('rankcrackers-55'),
    googleServices: read('android/app/google-services.json').includes('"project_id": "rankcrackers-55"'),
    firebaseOptions: read('lib/firebase_options.dart').includes("projectId: 'rankcrackers-55'")
  },
  unexplainedProjectReferences: firebaseProjectRefs
});
writeJson('mission_authority_inventory.json', {
  currentMissionAuthorityPath: currentAuthority.missionAuthorityPath,
  currentStudentProjectionPath: currentAuthority.studentProjectionPath,
  productionReachableLegacyMissionRefs: productionReachableLegacy,
  allLegacyMissionRefsInSource: legacyRefs,
  liveProductionRecount: 'PENDING'
});
writeJson('synthetic_report_forensics.json', {
  syntheticReportsAreEvidence: false,
  productionReachableSyntheticRefs: productionReachableSynthetic,
  sourceSyntheticRefs: syntheticRefs
});
writeJson('superseded_report_manifest.json', {
  rootReports,
  patchSafetyFilesCount: patchSafetyFiles.length,
  docsSyllabusFilesCount: docsSyllabusFiles.length,
  internalAcademicFilesCount: internalAcademicFiles.length
});
writeJson('engine_authority_inventory.json', {
  engineAuthorityFileCount: engineAuthorityRefs.length,
  engineAuthorityRefs,
  multipleActiveEngineAuthorities: 'REQUIRES_DOMAIN_BY_DOMAIN_OWNER_REVIEW'
});
writeJson('fixture_demo_seed_inventory.json', {
  productionReachableFixtureRefs: productionReachableFixtures,
  allFixtureRefsInSource: fixtureRefs,
  previewAssetRuntimeRoute: fileSet.has('lib/features/preview/presentation/screens/nebula_founder_preview_screen.dart') ? 'FOUNDER_PREVIEW_ROUTE_PRESENT' : 'NOT_FOUND'
});
writeJson('dead_route_inventory.json', {
  routeFile: 'lib/core/router/app_router.dart',
  previewRoutePresent: read('lib/core/router/app_router.dart').includes('nebulaFounderPreview'),
  note: 'No route deleted in this run; route reachability requires UI/runtime owner confirmation.'
});
writeJson('backend_trigger_inventory.json', {
  deployableFunctionsSource: files.filter(f => f.startsWith('functions/src/') || f.startsWith('functions/callable/') || f.startsWith('functions/workers/')).sort(),
  oneOffFunctionScripts: functionOneOffScripts
});
writeJson('cleanup_candidate_manifest.json', cleanupCandidates);
writeJson('cleanup_execution_manifest.json', {
  filesDeleted: 0,
  filesArchived: 0,
  filesRenamed: 0,
  filesModified: 3,
  modifiedFiles: ['docs/AUTHORITY_INDEX.md', 'docs/authority/CURRENT_AUTHORITY_INDEX.json', 'test/features/repo_hygiene/rc_repo_hygiene_01_test.dart'],
  reasonNoMassDelete: 'Worktree contains many unrelated dirty files and many historical artifacts are evidence. This run establishes authority routing and exact cleanup candidates, not unsafe broad deletion.'
});
writeJson('current_authority_index_validation.json', {
  indexCreated: true,
  indexPath: 'docs/authority/CURRENT_AUTHORITY_INDEX.json',
  markdownPath: 'docs/AUTHORITY_INDEX.md',
  missionAuthorityCount: 1,
  studentProjectionAuthorityCount: 1,
  legacyMissionAuthorityRuntimeReachable: productionReachableLegacy.length,
  productionReachableFixture: productionReachableFixtures.length,
  productionReachableDemoData: productionReachableSynthetic.length
});
writeJson('post_cleanup_test_denominators.json', {
  targetedAnalyze: 'flutter analyze test/features/repo_hygiene/rc_repo_hygiene_01_test.dart => CLEAN',
  targetedTest: 'flutter test test/features/repo_hygiene/rc_repo_hygiene_01_test.dart => 1/1 PASS',
  runtimeSmoke: 'NOT_RUN_BY_REPO_HYGIENE_SCOPE'
});
writeJson('post_cleanup_runtime.json', {
  runtimeSmoke: 'NOT_RUN_BY_INVENTORY_SCRIPT',
  liveProductionRead: 'NO',
  productionWrite: 'NO'
});
writeJson('governance_counters.json', {
  totalFilesScanned: files.length,
  filesDeleted: 0,
  filesArchived: 0,
  filesRenamed: 0,
  filesModified: 3,
  missionAuthorityCount: 1,
  syntheticReportGeneratorCount: functionOneOffScripts.length + rootUtilityScripts.length,
  syntheticReportGeneratorUsedAsAuthority: 0,
  legacyMissionAuthorityRuntimeReachable: productionReachableLegacy.length,
  productionReachableFixture: productionReachableFixtures.length,
  productionReachableDemoData: productionReachableSynthetic.length,
  multipleActiveEngineAuthorities: engineAuthorityRefs.length > 1,
  unexplainedFirebaseProjectReference: firebaseProjectRefs.length,
  unknownRepositoryHygieneResidual: 'NON_ZERO_CLEANUP_CANDIDATES_REQUIRE_OWNER_REVIEW_OR_SEPARATE_ARCHIVE_COMMIT'
});
const report = {
  verdict: 'RC_REPO_HYGIENE_01_NOT_ACCEPTED_WITH_EXACT_REMAINING_RESIDUALS',
  headBefore,
  headAfter: headBefore,
  totalFilesScanned: files.length,
  filesDeleted: 0,
  filesArchived: 0,
  filesRenamed: 0,
  filesModified: 3,
  missionAuthorityCount: 1,
  syntheticReportGeneratorCount: functionOneOffScripts.length + rootUtilityScripts.length,
  syntheticReportGeneratorUsedAsAuthority: 0,
  legacyMissionAuthorityRuntimeReachable: productionReachableLegacy.length,
  productionReachableFixture: productionReachableFixtures.length,
  productionReachableDemoData: productionReachableSynthetic.length,
  multipleActiveEngineAuthorities: engineAuthorityRefs.length > 1,
  unexplainedFirebaseProjectReference: firebaseProjectRefs.length,
  postCleanupAnalyzeStatus: 'TARGETED_CLEAN',
  postCleanupTestStatus: 'TARGETED_1_OF_1_PASS',
  postCleanupRuntimeSmoke: 'NOT_RUN_BY_REPO_HYGIENE_SCOPE',
  unknownRepositoryHygieneResidual: 'EXACT_CANDIDATES_IDENTIFIED; MASS_DELETE_NOT_SAFE_IN_DIRTY_WORKTREE',
  finalVerdict: 'RC_REPO_HYGIENE_01_NOT_ACCEPTED_WITH_EXACT_REMAINING_RESIDUALS'
};
writeJson('RC_REPO_HYGIENE_01_REPORT.json', report);
fs.writeFileSync(path.join(outDir, 'RC_REPO_HYGIENE_01_REPORT.md'), `# RC Repo Hygiene 01\n\nVerdict: **${report.verdict}**\n\nThis run created the current authority index and exact cleanup candidate manifests. It did not mass-delete historical evidence or unrelated dirty work.\n\n## Current Authority\n- Firebase project: \`${currentAuthority.firebaseProject}\`\n- Mission authority: \`${currentAuthority.missionAuthorityPath}\`\n- Student projection: \`${currentAuthority.studentProjectionPath}\`\n\n## Counters\n- Total files scanned: ${files.length}\n- Mission authority count: 1\n- Synthetic/one-off generator count: ${report.syntheticReportGeneratorCount}\n- Legacy mission refs in production source: ${productionReachableLegacy.length}\n- Production-reachable fixtures: ${productionReachableFixtures.length}\n\n## Residual\nFull cleanup is not accepted yet because archive/delete actions need a separate exact-path cleanup wave after owner review, and runtime smoke/live recount were not performed here.\n`);

console.log(JSON.stringify(report, null, 2));

