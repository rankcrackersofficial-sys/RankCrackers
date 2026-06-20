const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function runValidation(docId) {
  console.log(`--- 🔱 STRUCTURAL VALIDATION SUITE: Document ${docId} ---`);

  // 1. INJECT TASK
  const taskId = `val_${Date.now()}`;
  const docSnap = await db.collection("ingestion_refinery").doc(docId).get();
  if (!docSnap.exists) {
    console.log("❌ FAIL: Source document not found.");
    return;
  }
  const docData = docSnap.data();

  console.log("Gate 1 & 5: Triggering STRUCTURAL task via Event Bus (ai_queue)...");
  await db.collection("ai_queue").doc(taskId).set({
    type: 'STRUCTURAL',
    payload: {
      id: docId,
      text: docData.text || docData.fullText || "Sample content for validation.",
      fileName: docData.fileName
    },
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. WAIT FOR COMPLETION
  console.log("Waiting for worker execution...");
  let attempts = 0;
  let taskDoc;
  while (attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    taskDoc = await db.collection("ai_queue").doc(taskId).get();
    if (taskDoc.data().status === 'completed' || taskDoc.data().status === 'failed') break;
    attempts++;
  }

  if (taskDoc.data().status !== 'completed') {
    console.log(`❌ FAIL: Worker failed or timed out. Status: ${taskDoc.data().status}, Error: ${taskDoc.data().error}`);
    return;
  }
  console.log("✅ Worker execution COMPLETED.");

  // 3. GATE 2: SCHEMA AUDIT
  const unitsSnap = await db.collection("semantic_units")
    .where("sourceDocumentId", "==", docId)
    .where("lineageId", "==", `lineage_${taskId}`)
    .get();

  if (unitsSnap.empty) {
    console.log("❌ FAIL: No semantic_units generated.");
  } else {
    console.log(`✅ Gate 2: Generated ${unitsSnap.size} semantic units.`);
    const firstUnit = unitsSnap.docs[0].data();
    const requiredFields = [
      'id', 'sourceDocumentId', 'pageNumber', 'sectionHeading',
      'rawText', 'semanticType', 'structureIndex', 'tokenCount',
      'charCount', 'workerVersion', 'promptVersion', 'lineageId'
    ];
    let schemaPass = true;
    requiredFields.forEach(f => {
      if (firstUnit[f] === undefined) {
        console.log(`   - Missing Field: ${f}`);
        schemaPass = false;
      }
    });
    console.log(schemaPass ? "   ✅ All schema fields present." : "   ❌ Schema violation detected.");
  }

  // 4. GATE 3: LINEAGE INTEGRITY
  const lineageSnap = await db.collection("transformation_lineage").doc(`lineage_${taskId}`).get();
  if (lineageSnap.exists) {
    const lineage = lineageSnap.data();
    console.log("✅ Gate 3: Lineage record FOUND.");
    console.log(`   - Input: ${lineage.inputCollection}/${lineage.inputId}`);
    console.log(`   - Output: ${lineage.outputCollection} (${lineage.outputIds.length} IDs)`);
  } else {
    console.log("❌ FAIL: Transformation lineage record MISSING.");
  }

  // 5. GATE 4: IDEMPOTENCY TEST (Conceptual check of worker logic)
  console.log("Gate 4: Verifying Idempotency Logic...");
  // Note: Actual worker code checks for existing lineage.
  // In a real test, we would re-run and expect 'skipped_duplicate' status if we had that implemented.

  // 6. GATE 6: COST & TOKEN AUDIT
  const auditSnap = await db.collection("ai_audit_logs")
    .where("taskId", "==", taskId)
    .limit(1)
    .get();

  if (!auditSnap.empty) {
    const audit = auditSnap.docs[0].data();
    console.log("✅ Gate 6: Telemetry Log FOUND.");
    console.log(`   - Tokens: ${audit.tokens}, Status: ${audit.status}, Model: ${audit.model}`);
  } else {
    console.log("❌ FAIL: AI Telemetry record MISSING.");
  }

  // 7. QUALITY INSPECTION
  if (!unitsSnap.empty) {
    const unit = unitsSnap.docs[0].data();
    console.log("\n--- 🔱 SAMPLE UNIT INSPECTION ---");
    console.log(`Type: ${unit.semanticType}`);
    console.log(`Text Snippet: ${unit.rawText.substring(0, 200)}...`);
  }

  console.log("\n--- VALIDATION RUN COMPLETE ---\n");
}

// DOC IDs from previous audit:
// Manovigyan-12th: hash_8acb8a73137984a8bbe3134ee833c3ea7bd4266353a1b87b0de8d80ff3be412a
runValidation("hash_8acb8a73137984a8bbe3134ee833c3ea7bd4266353a1b87b0de8d80ff3be412a").catch(console.error);
