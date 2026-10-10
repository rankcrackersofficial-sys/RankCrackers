"use strict";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "rankcrackers-55",
  });
}

const db = admin.firestore();

async function quarantine() {
  console.log("🔱 STARTING PROTOYPE SEED QUARANTINE INTERVENTION...");

  const topics = [
    "amtn_bio_cell_001",
    "amtn_bio_cell_002",
    "amtn_bio_cell_003",
    "amtn_bio_cell_004",
    "amtn_bio_cell_005",
    "amtn_bio_cell_006",
    "amtn_bio_cell_007"
  ];

  const blocks = [
    "db_cell_001_core",
    "db_cell_002_core",
    "db_cell_003_core",
    "db_cell_004_core",
    "db_cell_005_core",
    "db_cell_006_core",
    "db_cell_007_core"
  ];

  const questions = [
    "q_cell_001",
    "q_cell_002",
    "q_cell_003",
    "q_cell_004",
    "q_cell_005",
    "q_cell_006",
    "q_cell_007"
  ];

  const payloads = [
    "payload_bio_cell_001",
    "payload_bio_cell_002",
    "payload_bio_cell_003",
    "payload_bio_cell_004",
    "payload_bio_cell_005",
    "payload_bio_cell_006",
    "payload_bio_cell_007"
  ];

  // 1. Quarantine micro_nodes
  console.log("\n- Quarantining micro_nodes...");
  for (const id of topics) {
    const docRef = db.collection("micro_nodes").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ status: "quarantined" });
      console.log(`  [OK] micro_nodes/${id} status updated to quarantined.`);
    } else {
      console.log(`  [SKIP] micro_nodes/${id} does not exist.`);
    }
  }

  // 2. Quarantine digibook_refinery blocks
  console.log("\n- Quarantining digibook_refinery blocks...");
  for (const id of blocks) {
    const docRef = db.collection("digibook_refinery").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ status: "quarantined" });
      console.log(`  [OK] digibook_refinery/${id} status updated to quarantined.`);
    } else {
      console.log(`  [SKIP] digibook_refinery/${id} does not exist.`);
    }
  }

  // 3. Quarantine published_questions
  console.log("\n- Quarantining published_questions...");
  for (const id of questions) {
    const docRef = db.collection("published_questions").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ status: "quarantined" });
      console.log(`  [OK] published_questions/${id} status updated to quarantined.`);
    } else {
      console.log(`  [SKIP] published_questions/${id} does not exist.`);
    }
  }

  // 4. Quarantine content_payloads
  console.log("\n- Quarantining content_payloads...");
  for (const id of payloads) {
    const docRef = db.collection("content_payloads").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      await docRef.update({ status: "quarantined" });
      console.log(`  [OK] content_payloads/${id} status updated to quarantined.`);
    } else {
      console.log(`  [SKIP] content_payloads/${id} does not exist.`);
    }
  }

  console.log("\n🔱 QUARANTINE INTERVENTION COMPLETED SUCCESSFULLY.");
}

quarantine().catch(console.error);
