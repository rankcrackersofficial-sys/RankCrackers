const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function runSvoValidation(unitId) {
  console.log(`--- 🔱 SVO EXTRACTION VALIDATION: Unit ${unitId} ---`);

  // 1. FETCH UNIT
  const unitSnap = await db.collection("semantic_units").doc(unitId).get();
  if (!unitSnap.exists) {
    console.log("❌ FAIL: Semantic unit not found.");
    return;
  }
  const unitData = unitSnap.data();
  console.log(`Target Text Snippet: ${unitData.rawText.substring(0, 150)}...`);

  // 2. INJECT SVO TASK
  const taskId = `svo_val_${Date.now()}`;
  console.log("Triggering SVO_EXTRACTION task via Event Bus...");
  await db.collection("ai_queue").doc(taskId).set({
    type: 'SVO_EXTRACTION',
    payload: {
      unitId: unitId,
      sourceHash: unitData.sourceDocumentId // Assuming docId is used as hash for test
    },
    status: 'pending',
    workflowId: `wf_val_${unitId}`,
    correlationId: `corr_val_${unitId}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. WAIT FOR COMPLETION
  console.log("Waiting for svoWorker execution...");
  let attempts = 0;
  let taskDoc;
  while (attempts < 15) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    taskDoc = await db.collection("ai_queue").doc(taskId).get();
    if (taskDoc.data().status === 'completed' || taskDoc.data().status === 'failed') break;
    attempts++;
  }

  if (taskDoc.data().status !== 'completed') {
    console.log(`❌ FAIL: svoWorker failed or timed out. Status: ${taskDoc.data().status}, Error: ${taskDoc.data().error}`);
    return;
  }
  console.log("✅ svoWorker execution COMPLETED.");

  // 4. VERIFY ATOMIC FACTS
  const factsSnap = await db.collection("atomic_facts")
    .where("derivedFromUnitId", "==", unitId)
    .where("lineageId", "==", `lineage_svo_${taskId}`)
    .get();

  if (factsSnap.empty) {
    console.log("❌ FAIL: No atomic_facts generated.");
  } else {
    console.log(`✅ Success: Generated ${factsSnap.size} atomic facts.`);
    let realFacts = 0;
    factsSnap.forEach((doc, i) => {
        const f = doc.data();
        console.log(`\n--- Fact ${i+1} [${f.factType}] ---`);
        console.log(`S: ${f.subject}`);
        console.log(`P: ${f.predicate}`);
        console.log(`O: ${f.object}`);
        if(f.context) console.log(`C: ${f.context}`);

        if (f.subject.toLowerCase() === "unknown" || f.predicate.toLowerCase() === "exists") {
           console.log("❌ FAIL: Dummy fact detected (Unknown/exists).");
        } else {
           realFacts++;
        }
    });
    console.log(`\nReal Knowledge Coverage: ${realFacts}/${factsSnap.size}`);
    if (realFacts === 0) console.log("❌ FAIL: Knowledge Factory produced zero real facts.");
  }

  // 5. LINEAGE CHECK
  const lineageSnap = await db.collection("transformation_lineage").doc(`lineage_svo_${taskId}`).get();
  if (lineageSnap.exists) {
    console.log("\n✅ Lineage Record Persisted.");
  } else {
    console.log("\n❌ FAIL: Lineage record missing.");
  }

  console.log("\n--- SVO VALIDATION COMPLETE ---");
}

const targetUnit = process.argv[2] || "unit_bench_1781344269122_0";
runSvoValidation(targetUnit).catch(console.error);
