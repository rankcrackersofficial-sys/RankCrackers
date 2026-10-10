const admin = require("firebase-admin");

async function getCounts(isEmulator) {
  if (isEmulator) {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  } else {
    delete process.env.FIRESTORE_EMULATOR_HOST;
  }

  const appName = isEmulator ? "emulator_app" : "production_app";
  let app;
  if (admin.apps.some(a => a.name === appName)) {
    app = admin.app(appName);
  } else {
    app = admin.initializeApp({
      projectId: "rankcrackers-55"
    }, appName);
  }

  const db = app.firestore();
  const MISSION_ID = "neet_(ug)-2027";
  const SYLLABUS_HASH = "2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925";
  const DOCUMENT_ID = `hash_${SYLLABUS_HASH}`;

  try {
    // A quick write/read check to verify connection viability within 1.5 seconds
    if (isEmulator) {
      // Set a strict timeout for emulator connection to prevent long hangs
      const verifyPromise = db.collection("student_mission_catalog").limit(1).get();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout connecting to emulator")), 1500)
      );
      await Promise.race([verifyPromise, timeoutPromise]);
    }

    // 1. Founder mission records
    const missionCatalogSnap = await db.collection("student_mission_catalog").get();
    let founderMissionCount = 0;
    missionCatalogSnap.forEach(doc => {
      if (doc.id === MISSION_ID) founderMissionCount++;
    });

    // 2. Founder source uploads
    const uploadDoc = await db.collection("founder_uploads").doc(DOCUMENT_ID).get();
    const founderSourceUploads = uploadDoc.exists ? 1 : 0;

    // 3. Ingestion work orders
    const workOrderDoc = await db.collection("ingestion_work_orders").doc(`wo_${MISSION_ID}_${SYLLABUS_HASH}`).get();
    const ingestionWorkOrders = workOrderDoc.exists ? 1 : 0;

    // 4. Refinery/canonical source documents
    const refineryDoc = await db.collection("ingestion_refinery").doc(DOCUMENT_ID).get();
    const refineryDocs = refineryDoc.exists ? 1 : 0;

    // 5. Syllabus atoms / AMTNs
    const atomsSnap = await db.collection("mission_realms").doc(MISSION_ID).collection("syllabus_atoms").get();
    const syllabusAtoms = atomsSnap.size;

    // 6. Published AMTNs
    const nodesSnap = await db.collection("micro_nodes")
      .where("examId", "==", MISSION_ID)
      .where("status", "==", "published")
      .get();
    const publishedAmtns = nodesSnap.size;

    // 7. DigiBook records/blocks
    const digibookRefinerySnap = await db.collection("digibook_refinery").get();
    let digibookCount = 0;
    digibookRefinerySnap.forEach(doc => {
      if (doc.id.includes("cell") || (doc.data().atomicTopicId && doc.data().atomicTopicId.includes("cell"))) {
        digibookCount++;
      }
    });

    // 8. Published DigiBook records/blocks
    const publishedDigibookSnap = await db.collection("content_payloads").get();
    let publishedDigibookCount = 0;
    publishedDigibookSnap.forEach(doc => {
      const data = doc.data();
      if (data.nodeId && data.nodeId.includes("cell") && data.publicationAudit) {
        publishedDigibookCount++;
      }
    });

    // 9. Crucible records/items
    const publishedQuestionsSnap = await db.collection("published_questions").get();
    let crucibleCount = 0;
    publishedQuestionsSnap.forEach(doc => {
      const data = doc.data();
      if (data.nodeId && data.nodeId.includes("cell")) {
        crucibleCount++;
      }
    });

    // 10. Published Crucible records/items
    const publishedCrucibleSnap = await db.collection("content_payloads").get();
    let publishedCrucibleCount = 0;
    publishedCrucibleSnap.forEach(doc => {
      const data = doc.data();
      if (data.nodeId && data.nodeId.includes("cell") && data.easyMcqs && data.easyMcqs.length > 0) {
        publishedCrucibleCount += data.easyMcqs.length;
      }
    });

    // 11. Authentic PYQ records
    let pyqCount = 0;
    publishedCrucibleSnap.forEach(doc => {
      const data = doc.data();
      if (data.nodeId && data.nodeId.includes("cell") && data.easyMcqs) {
        data.easyMcqs.forEach(q => {
          if (q.isPYQ) pyqCount++;
        });
      }
    });

    // 12. content_payloads
    const payloadsSnap = await db.collection("content_payloads").get();
    let neetPayloadsCount = 0;
    payloadsSnap.forEach(doc => {
      if (doc.id.includes("cell")) {
        neetPayloadsCount++;
      }
    });

    // 13. Publication holds
    const holdsSnap = await db.collection("ai_queue")
      .where("state", "==", "held")
      .get();
    const holdsCount = holdsSnap.size;

    // 14. Active/ready/running/retrying AAF jobs
    const activeJobsSnap = await db.collection("ai_queue")
      .where("state", "in", ["ready", "leased", "running", "retryWait"])
      .get();
    const activeJobsCount = activeJobsSnap.size;

    // 15. Quarantined records
    const quarantinedSnap = await db.collection("micro_nodes")
      .where("status", "==", "quarantined")
      .get();
    const quarantinedCount = quarantinedSnap.size;

    return {
      founderMissionCount,
      founderSourceUploads,
      ingestionWorkOrders,
      refineryDocs,
      syllabusAtoms,
      publishedAmtns,
      digibookCount,
      publishedDigibookCount,
      crucibleCount,
      publishedCrucibleCount,
      pyqCount,
      neetPayloadsCount,
      holdsCount,
      activeJobsCount,
      quarantinedCount
    };
  } catch (err) {
    if (isEmulator) {
      console.log("⚠️ Emulator is offline. Falling back to zero-state for emulator environment counts.");
      return {
        founderMissionCount: 0,
        founderSourceUploads: 0,
        ingestionWorkOrders: 0,
        refineryDocs: 0,
        syllabusAtoms: 0,
        publishedAmtns: 0,
        digibookCount: 0,
        publishedDigibookCount: 0,
        crucibleCount: 0,
        publishedCrucibleCount: 0,
        pyqCount: 0,
        neetPayloadsCount: 0,
        holdsCount: 0,
        activeJobsCount: 0,
        quarantinedCount: 0
      };
    } else {
      throw err;
    }
  }
}

async function run() {
  console.log("🔱 RUNNING DUAL-ENV CENSUS SCANNERS...");
  
  const emulator = await getCounts(true);
  const production = await getCounts(false);

  console.log("\n=================================================");
  console.log("🔱 CENSUS RESULTS (LOCAL/EMULATOR VS PRODUCTION):");
  console.log("=================================================");
  console.log("Category | Emulator | Production");
  console.log("-------------------------------------------------");
  console.log(`1. Founder mission records: ${emulator.founderMissionCount} | ${production.founderMissionCount}`);
  console.log(`2. Founder source uploads: ${emulator.founderSourceUploads} | ${production.founderSourceUploads}`);
  console.log(`3. Ingestion work orders: ${emulator.ingestionWorkOrders} | ${production.ingestionWorkOrders}`);
  console.log(`4. Refinery/canonical docs: ${emulator.refineryDocs} | ${production.refineryDocs}`);
  console.log(`5. Syllabus atoms / AMTNs: ${emulator.syllabusAtoms} | ${production.syllabusAtoms}`);
  console.log(`6. Published AMTNs: ${emulator.publishedAmtns} | ${production.publishedAmtns}`);
  console.log(`7. DigiBook records/blocks: ${emulator.digibookCount} | ${production.digibookCount}`);
  console.log(`8. Published DigiBook: ${emulator.publishedDigibookCount} | ${production.publishedDigibookCount}`);
  console.log(`9. Crucible records/items: ${emulator.crucibleCount} | ${production.crucibleCount}`);
  console.log(`10. Published Crucible: ${emulator.publishedCrucibleCount} | ${production.publishedCrucibleCount}`);
  console.log(`11. Authentic PYQ records: ${emulator.pyqCount} | ${production.pyqCount}`);
  console.log(`12. content_payloads: ${emulator.neetPayloadsCount} | ${production.neetPayloadsCount}`);
  console.log(`13. Publication holds: ${emulator.holdsCount} | ${production.holdsCount}`);
  console.log(`14. Active AAF jobs: ${emulator.activeJobsCount} | ${production.activeJobsCount}`);
  console.log(`15. Quarantined records: ${emulator.quarantinedCount} | ${production.quarantinedCount}`);
  console.log("=================================================");

  console.log("\n🔱 MANDATORY KEY-VALUE OUTPUT BLOCK:");
  console.log(`EMULATOR_NEET_AMTN_COUNT=${emulator.publishedAmtns}`);
  console.log(`PRODUCTION_NEET_AMTN_COUNT=${production.publishedAmtns}`);
  console.log(`PRODUCTION_PUBLISHED_NEET_AMTN_COUNT=${production.publishedAmtns}`);
  console.log("");
  console.log(`PRODUCTION_NEET_DIGIBOOK_COUNT=${production.digibookCount}`);
  console.log(`PRODUCTION_PUBLISHED_NEET_DIGIBOOK_COUNT=${production.publishedDigibookCount}`);
  console.log("");
  console.log(`PRODUCTION_NEET_CRUCIBLE_COUNT=${production.crucibleCount}`);
  console.log(`PRODUCTION_PUBLISHED_NEET_CRUCIBLE_COUNT=${production.publishedCrucibleCount}`);
  console.log("");
  console.log(`PRODUCTION_NEET_AUTHENTIC_PYQ_COUNT=${production.pyqCount}`);
  console.log(`PRODUCTION_NEET_CONTENT_PAYLOAD_COUNT=${production.neetPayloadsCount}`);
  console.log("");
  console.log(`PRODUCTION_HOLD_COUNT=${production.holdsCount}`);
  console.log(`PRODUCTION_QUARANTINED_VISIBLE_COUNT=${production.quarantinedCount}`);
  console.log("=================================================");
}

run().catch(console.error);
