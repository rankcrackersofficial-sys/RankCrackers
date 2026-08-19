"use strict";

const fs = require('fs');
const path = require('path');
const { MissionAcademicFactory } = require('./mission_factory_orchestrator');

const WORKSPACE = path.join(__dirname, '../../scratch/factory_test_workspace');
const MANIFEST_PATH = path.join(__dirname, '../../scratch/synthetic_manifest.json');

const syntheticManifest = {
  missionId: "synthetic_mission_99",
  displayName: "Synthetic Mission 99",
  missionVariables: {
    subject: "Physics"
  },
  syllabusDenominator: 3,
  digibookDenominator: 3,
  atoms: [
    { atomId: "SYNTHETIC_ATOM_01", subject: "Physics", unit: "Unit 1", chapter: "Chapter 1", topic: "Topic A" },
    { atomId: "SYNTHETIC_ATOM_02", subject: "Physics", unit: "Unit 1", chapter: "Chapter 1", topic: "Topic B" },
    { atomId: "SYNTHETIC_ATOM_03", subject: "Physics", unit: "Unit 1", chapter: "Chapter 1", topic: "Topic C" }
  ],
  officialSourceIndex: {
    SYNTHETIC_ATOM_01: {
      unit: "Unit 1",
      chapter: "Chapter 1",
      locator: "page 1",
      sourceHash: "abc123hash"
    },
    SYNTHETIC_ATOM_02: {
      unit: "Unit 1",
      chapter: "Chapter 1",
      locator: "page 2",
      sourceHash: "def456hash"
    },
    SYNTHETIC_ATOM_03: {
      unit: "Unit 1",
      chapter: "Chapter 1",
      locator: "page 3",
      sourceHash: "ghi789hash"
    }
  },
  cruciblePlan: {
    schedules: [
      {
        slotId: "synthetic_macro_1",
        phaseId: "phase_1",
        assignedAtomIds: ["SYNTHETIC_ATOM_01", "SYNTHETIC_ATOM_02"]
      }
    ]
  }
};

function cleanWorkspace() {
  if (fs.existsSync(WORKSPACE)) {
    fs.rmSync(WORKSPACE, { recursive: true, force: true });
  }
  if (fs.existsSync(MANIFEST_PATH)) {
    fs.unlinkSync(MANIFEST_PATH);
  }
  fs.mkdirSync(WORKSPACE, { recursive: true });
}

async function main() {
  console.log("=== Running Factory Framework Tests ===");
  cleanWorkspace();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(syntheticManifest, null, 2), 'utf8');

  // Test 1: First Run (Initial Generation)
  console.log("\n[Test 1] Starting initial generation run...");
  const report1 = await MissionAcademicFactory.run({
    manifestPath: MANIFEST_PATH,
    workspacePath: WORKSPACE
  });

  // Verify that it processed synthetic atoms and didn't touch JEE
  const statePath = path.join(WORKSPACE, "synthetic_mission_99/factory_state.json");
  if (!fs.existsSync(statePath)) {
    throw new Error("Synthetic mission state file not found!");
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  
  const hasJeeData = JSON.stringify(state).includes("jee_main_2026") || JSON.stringify(state).includes("JEE_MAIN");
  if (hasJeeData) {
    console.error("DATA LEAKAGE DETECTED!");
    console.log("SECOND_MISSION_ISOLATION=FAIL");
    process.exit(1);
  }
  console.log("SECOND_MISSION_ISOLATION=PASS");
  console.log("JEE_DATA_LEAKAGE=0");

  // Test 2: Second Run (Resumability and Idempotency)
  console.log("\n[Test 2] Starting second run (resume/idempotency)...");
  
  // Hook stdout to check if items are skipped
  let skipCount = 0;
  const originalLog = console.log;
  console.log = function(...args) {
    const text = args.join(' ');
    if (text.includes("Skipping") || text.includes("already approved")) {
      skipCount++;
    }
    originalLog.apply(console, args);
  };

  const report2 = await MissionAcademicFactory.run({
    manifestPath: MANIFEST_PATH,
    workspacePath: WORKSPACE
  });

  // Restore stdout logging
  console.log = originalLog;

  console.log(`[Test 2] Skip count: ${skipCount}`);
  if (skipCount >= 3) {
    console.log("FACTORY_RESUME_IDEMPOTENCY=PASS");
  } else {
    console.error("REGENERATION ERROR: Approved items were not skipped!");
    console.log("FACTORY_RESUME_IDEMPOTENCY=FAIL");
    process.exit(1);
  }

  // Cleanup test workspace
  cleanWorkspace();
  console.log("Framework tests complete!");
}

main().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
