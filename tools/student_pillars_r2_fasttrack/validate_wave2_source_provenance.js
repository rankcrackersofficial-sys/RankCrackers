"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertOfficialSourceEntry,
  assertNoProductionReadImplementation,
} = require("./wave2_source_guard");

const EXPECTED_ATOMS = 26;

function fail(message) {
  console.error("WAVE2_SOURCE_PROVENANCE_VALIDATION=FAIL");
  console.error(`REASON=${message}`);
  process.exit(1);
}

function main() {
  const recoveryPath = process.argv[2];

  if (!recoveryPath) {
    fail("Usage: node validate_wave2_source_provenance.js <recovery.json>");
  }

  const absolute = path.resolve(recoveryPath);

  if (!fs.existsSync(absolute)) {
    fail(`Recovery file missing: ${absolute}`);
  }

  const data = JSON.parse(fs.readFileSync(absolute, "utf8"));
  const items = data.items;

  if (!Array.isArray(items) || items.length !== EXPECTED_ATOMS) {
    fail(`Expected exactly ${EXPECTED_ATOMS} recovery items`);
  }

  const seen = new Set();
  let proven = 0;
  let unresolved = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const label = `items[${index}]`;

    if (
      typeof item.atomId !== "string" ||
      item.atomId.trim() === ""
    ) {
      fail(`${label}.atomId missing`);
    }

    if (seen.has(item.atomId)) {
      fail(`Duplicate atomId: ${item.atomId}`);
    }
    seen.add(item.atomId);

    if (item.modelOnlyProof !== false) {
      fail(`${label}: modelOnlyProof must be false`);
    }

    if (item.sourceStatus === "SOURCE_PROVEN") {
      if (
        typeof item.verifiedUnit !== "string" ||
        !item.verifiedUnit.trim()
      ) {
        fail(`${label}.verifiedUnit missing`);
      }

      if (
        typeof item.verifiedChapter !== "string" ||
        !item.verifiedChapter.trim()
      ) {
        fail(`${label}.verifiedChapter missing`);
      }

      assertOfficialSourceEntry(
        item.unitSource,
        `${label}.unitSource`
      );

      assertOfficialSourceEntry(
        item.chapterSource,
        `${label}.chapterSource`
      );

      proven += 1;
      continue;
    }

    if (
      item.sourceStatus !== "SOURCE_NOT_PRESENT" &&
      item.sourceStatus !== "SOURCE_AMBIGUOUS"
    ) {
      fail(`${label}.sourceStatus invalid`);
    }

    if (
      typeof item.blocker !== "string" ||
      !item.blocker.trim()
    ) {
      fail(`${label}.blocker required`);
    }

    unresolved += 1;
  }

  assertNoProductionReadImplementation(
    "tools/student_pillars_r2_fasttrack/run_wave2_parallel_factory.js"
  );

  console.log("WAVE2_SOURCE_PROVENANCE_VALIDATION=PASS");
  console.log(`ACCOUNTED=${items.length}/26`);
  console.log(`SOURCE_PROVEN=${proven}/26`);
  console.log(`UNRESOLVED=${unresolved}/26`);
  console.log("PRODUCTION_READ_PATHS=0");
}

main();
