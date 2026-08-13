"use strict";

const fs = require("fs");
const path = require("path");

const FORBIDDEN_RUNTIME_PATTERNS = [
  /require\s*\(\s*["']firebase-admin["']\s*\)/,
  /admin\.firestore\s*\(/,
  /\.collection\s*\(\s*["']mission_realms["']\s*\)/,
  /\.collection\s*\(\s*["']official_documents["']\s*\)/,
];

const FORBIDDEN_SOURCE_PATH_PATTERNS = [
  /assets[\\/]+data[\\/]+preview/i,
  /syllabus_preview_tree\.json$/i,
];

const ALLOWED_SOURCE_CLASSES = new Set([
  "OFFICIAL_SOURCE",
  "OFFICIAL_EXTRACTION",
]);

function fail(message) {
  console.error("WAVE2_SOURCE_GUARD=FAIL");
  console.error(`REASON=${message}`);
  process.exit(1);
}

function assertNoProductionReadImplementation(scriptPath) {
  const absolute = path.resolve(scriptPath);

  if (!fs.existsSync(absolute)) {
    fail(`Wave-2 script missing: ${absolute}`);
  }

  const source = fs.readFileSync(absolute, "utf8");

  for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
    if (pattern.test(source)) {
      fail(
        `Wave-2 factory contains forbidden production/cloud read pattern: ${pattern}`
      );
    }
  }
}

function assertOfficialSourceEntry(entry, label) {
  if (!entry || typeof entry !== "object") {
    fail(`${label} must be an object`);
  }

  if (!ALLOWED_SOURCE_CLASSES.has(entry.sourceClass)) {
    fail(
      `${label}.sourceClass must be OFFICIAL_SOURCE or OFFICIAL_EXTRACTION`
    );
  }

  if (
    typeof entry.document !== "string" ||
    entry.document.trim() === ""
  ) {
    fail(`${label}.document missing`);
  }

  for (const forbidden of FORBIDDEN_SOURCE_PATH_PATTERNS) {
    if (forbidden.test(entry.document)) {
      fail(
        `${label} points to preview/derived source: ${entry.document}`
      );
    }
  }

  if (
    typeof entry.locator !== "string" ||
    entry.locator.trim() === ""
  ) {
    fail(`${label}.locator missing`);
  }

  if (
    typeof entry.sourceHash !== "string" ||
    entry.sourceHash.trim() === ""
  ) {
    fail(`${label}.sourceHash missing`);
  }
}

module.exports = {
  assertNoProductionReadImplementation,
  assertOfficialSourceEntry,
};
