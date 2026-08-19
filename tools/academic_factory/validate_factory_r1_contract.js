"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("tools/academic_factory");

const BUSINESS_FILES = [
  "syllabus_source_worker.js",
  "digibook_worker.js",
  "crucible_worker.js",
  "mission_factory_orchestrator.js",
  "run_factory.js",
];

const FORBIDDEN_PATTERNS = [
  /require\s*\(\s*["']firebase-admin["']\s*\)/,
  /from\s+["']firebase-admin["']/,
  /@google-cloud\/firestore/,
  /admin\.firestore\s*\(/,
];

function fail(reason) {
  console.error("ACADEMIC_FACTORY_R1_CONTRACT=FAIL");
  console.error(`REASON=${reason}`);
  process.exit(1);
}

function requireCondition(condition, reason) {
  if (!condition) {
    fail(reason);
  }
}

function readJson(filename) {
  const target = path.join(ROOT, filename);
  requireCondition(
    fs.existsSync(target),
    `Missing ${filename}`
  );
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function validateNoCloudDataAccess() {
  for (const filename of BUSINESS_FILES) {
    const target = path.join(ROOT, filename);

    if (!fs.existsSync(target)) {
      continue;
    }

    const source = fs.readFileSync(target, "utf8");

    for (const pattern of FORBIDDEN_PATTERNS) {
      requireCondition(
        !pattern.test(source),
        `${filename} contains forbidden production data access`
      );
    }
  }
}

function validateNoJeeBusinessHardcode() {
  const allowed = new Set([
    "test_factory_isolation.js",
  ]);

  for (const filename of BUSINESS_FILES) {
    if (allowed.has(filename)) {
      continue;
    }

    const target = path.join(ROOT, filename);

    if (!fs.existsSync(target)) {
      continue;
    }

    const source = fs.readFileSync(target, "utf8");

    requireCondition(
      !source.includes("jee_main_2026"),
      `${filename} hardcodes jee_main_2026`
    );
  }
}

function main() {
  const runtime = readJson("factory_runtime_policy.json");

  requireCondition(
    runtime.executionMode === "offline_local_evidence_only",
    "Factory must remain local/offline evidence mode"
  );

  requireCondition(
    runtime.missionInput.productionFirestoreLookupAllowed === false,
    "Production mission lookup must remain disabled"
  );

  requireCondition(
    runtime.cloud.productionFirestoreReadAllowed === false,
    "Production Firestore reads forbidden"
  );

  requireCondition(
    runtime.cloud.productionFirestoreWriteAllowed === false,
    "Production Firestore writes forbidden"
  );

  requireCondition(
    runtime.student.runtimeAiAllowed === false,
    "Student runtime AI forbidden"
  );

  requireCondition(
    runtime.student.automaticPublishAllowed === false,
    "Automatic student publish forbidden"
  );

  requireCondition(
    runtime.state.resumeEnabled === true,
    "Resume must be enabled"
  );

  requireCondition(
    runtime.state.contentHashRequired === true,
    "Content hash required"
  );

  requireCondition(
    runtime.state.reviewHashRequiredForApprovedArtifacts === true,
    "Review hash required"
  );

  validateNoCloudDataAccess();
  validateNoJeeBusinessHardcode();

  console.log("ACADEMIC_FACTORY_R1_CONTRACT=PASS");
  console.log("PRODUCTION_DATA_ACCESS=0");
  console.log("STUDENT_RUNTIME_AI=0");
  console.log("JEE_BUSINESS_HARDCODE=0");
  console.log("RESUMABLE_STATE=REQUIRED");
}

main();
