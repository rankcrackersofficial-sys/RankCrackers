"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const tempDir = path.resolve(__dirname, "../../scratch");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const validItem = {
  atomId: "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U11_T_0DB42BEA_CH001",
  sourceStatus: "SOURCE_PROVEN",
  verifiedUnit: "UNIT 11",
  verifiedChapter: "d - and f- BLOCK ELEMENTS",
  unitSource: {
    sourceClass: "OFFICIAL_SOURCE",
    document: "JEE main Syllabus 2026.pdf",
    locator: "page 9",
    sourceHash: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905"
  },
  chapterSource: {
    sourceClass: "OFFICIAL_SOURCE",
    document: "JEE main Syllabus 2026.pdf",
    locator: "page 9",
    sourceHash: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905"
  },
  modelOnlyPromotion: false
};

function runTest() {
  console.log("Running validator regression tests...");

  // Test Case 1: Valid payload
  const validPayload = {
    items: Array.from({ length: 26 }, (_, i) => ({
      ...validItem,
      atomId: `${validItem.atomId}_${i}`
    }))
  };
  const validPath = path.join(tempDir, "temp_valid_recovery.json");
  fs.writeFileSync(validPath, JSON.stringify(validPayload, null, 2));

  try {
    execSync(`node tools/student_pillars_r2_fasttrack/validate_wave2_source_provenance.js "${validPath}"`);
    console.log("Test Case 1 Passed: Valid payload passed validation.");
  } catch (err) {
    console.error("Test Case 1 Failed: Valid payload should have passed.");
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(1);
  } finally {
    if (fs.existsSync(validPath)) fs.unlinkSync(validPath);
  }

  // Test Case 2: Invalid payload (modelOnlyPromotion is true)
  const invalidPayload1 = {
    items: Array.from({ length: 26 }, (_, i) => {
      const item = {
        ...validItem,
        atomId: `${validItem.atomId}_${i}`
      };
      if (i === 0) item.modelOnlyPromotion = true;
      return item;
    })
  };
  const invalidPath1 = path.join(tempDir, "temp_invalid_recovery_1.json");
  fs.writeFileSync(invalidPath1, JSON.stringify(invalidPayload1, null, 2));

  try {
    execSync(`node tools/student_pillars_r2_fasttrack/validate_wave2_source_provenance.js "${invalidPath1}"`, { stdio: "ignore" });
    console.error("Test Case 2 Failed: Payload with modelOnlyPromotion=true should have failed validation.");
    process.exit(1);
  } catch (err) {
    console.log("Test Case 2 Passed: Payload with modelOnlyPromotion=true successfully blocked.");
  } finally {
    if (fs.existsSync(invalidPath1)) fs.unlinkSync(invalidPath1);
  }

  // Test Case 3: Invalid payload (modelOnlyProof is true)
  const invalidPayload2 = {
    items: Array.from({ length: 26 }, (_, i) => {
      const item = {
        ...validItem,
        atomId: `${validItem.atomId}_${i}`
      };
      delete item.modelOnlyPromotion;
      if (i === 0) item.modelOnlyProof = true;
      return item;
    })
  };
  const invalidPath2 = path.join(tempDir, "temp_invalid_recovery_2.json");
  fs.writeFileSync(invalidPath2, JSON.stringify(invalidPayload2, null, 2));

  try {
    execSync(`node tools/student_pillars_r2_fasttrack/validate_wave2_source_provenance.js "${invalidPath2}"`, { stdio: "ignore" });
    console.error("Test Case 3 Failed: Payload with modelOnlyProof=true should have failed validation.");
    process.exit(1);
  } catch (err) {
    console.log("Test Case 3 Passed: Payload with modelOnlyProof=true successfully blocked.");
  } finally {
    if (fs.existsSync(invalidPath2)) fs.unlinkSync(invalidPath2);
  }

  // Test Case 4: Contradictory values (modelOnlyPromotion=false, modelOnlyProof=true)
  const invalidPayload3 = {
    items: Array.from({ length: 26 }, (_, i) => {
      const item = {
        ...validItem,
        atomId: `${validItem.atomId}_${i}`,
        modelOnlyPromotion: false,
        modelOnlyProof: true
      };
      return item;
    })
  };
  const invalidPath3 = path.join(tempDir, "temp_invalid_recovery_3.json");
  fs.writeFileSync(invalidPath3, JSON.stringify(invalidPayload3, null, 2));

  try {
    execSync(`node tools/student_pillars_r2_fasttrack/validate_wave2_source_provenance.js "${invalidPath3}"`, { stdio: "ignore" });
    console.error("Test Case 4 Failed: Contradictory values (promo=false, proof=true) should have failed validation.");
    process.exit(1);
  } catch (err) {
    console.log("Test Case 4 Passed: Contradictory values successfully blocked.");
  } finally {
    if (fs.existsSync(invalidPath3)) fs.unlinkSync(invalidPath3);
  }

  // Test Case 5: Malformed/non-boolean value (modelOnlyPromotion="false")
  const invalidPayload4 = {
    items: Array.from({ length: 26 }, (_, i) => {
      const item = {
        ...validItem,
        atomId: `${validItem.atomId}_${i}`,
        modelOnlyPromotion: "false"
      };
      return item;
    })
  };
  const invalidPath4 = path.join(tempDir, "temp_invalid_recovery_4.json");
  fs.writeFileSync(invalidPath4, JSON.stringify(invalidPayload4, null, 2));

  try {
    execSync(`node tools/student_pillars_r2_fasttrack/validate_wave2_source_provenance.js "${invalidPath4}"`, { stdio: "ignore" });
    console.error("Test Case 5 Failed: Malformed non-boolean value should have failed validation.");
    process.exit(1);
  } catch (err) {
    console.log("Test Case 5 Passed: Malformed non-boolean value successfully blocked.");
  } finally {
    if (fs.existsSync(invalidPath4)) fs.unlinkSync(invalidPath4);
  }

  console.log("All validator regression tests passed successfully!");
}

runTest();
