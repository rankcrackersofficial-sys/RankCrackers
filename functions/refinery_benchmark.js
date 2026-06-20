const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const { PDFParse } = require("pdf-parse");
const axios = require("axios");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'rankcrackers-55.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function runBenchmark(docId) {
  console.log(`--- 🔱 REFINERY QUALITY BENCHMARK: ${docId} ---`);

  // 1. FETCH ACTUAL BYTES FROM STORAGE (OR USE SEEDED TEXT)
  console.log("Checking for seeded text or fetching from storage...");
  const refineryDoc = await db.collection("ingestion_refinery").doc(docId).get();
  if (!refineryDoc.exists) throw new Error("Doc not found in Firestore");

  let fullText = refineryDoc.data().fullText;
  let totalPages = refineryDoc.data().totalPages || 1;

  if (!fullText) {
    console.log("Fetching bytes from storage...");
    const url = refineryDoc.data().sourceUrl;
    if (!url) throw new Error("No text and no URL found.");
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // 2. EXTRACT FULL TEXT (PASS 0 SIMULATION)
    console.log("Simulating Pass 0: Text Extraction...");
    const parser = new PDFParse({ data: response.data });
    const pdfData = await parser.getText();
    fullText = pdfData.text;
    totalPages = pdfData.total;

    console.log(`   - Raw Text Length: ${fullText.length} chars`);
    console.log(`   - Total Pages: ${totalPages}`);

    // 🔱 Update Firestore for Pass 1 handover
    await db.collection("ingestion_refinery").doc(docId).update({
      fullText: fullText,
      totalPages: totalPages
    });
  } else {
    console.log("Using pre-seeded text content.");
  }

  // 3. TRIGGER STRUCTURAL WORKER (PASS 1)
  const taskId = `bench_${Date.now()}`;
  console.log(`Triggering Pass 1 Task: ${taskId}`);

  // 🔱 Optimization: Use first 15,000 chars to avoid timeout for benchmark
  const benchmarkText = fullText.substring(0, 15000);

  await db.collection("ai_queue").doc(taskId).set({
    type: 'STRUCTURAL',
    payload: {
      id: docId,
      fullText: benchmarkText,
      fileName: refineryDoc.data().fileName
    },
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 4. WAIT FOR PHYSICAL OUTPUT
  console.log("Waiting for unit generation...");
  let attempts = 0;
  while (attempts < 15) {
    await new Promise(r => setTimeout(r, 4000));
    const task = await db.collection("ai_queue").doc(taskId).get();
    if (task.data().status === 'completed') break;
    if (task.data().status === 'failed') throw new Error(`Worker failed: ${task.data().error}`);
    attempts++;
  }

  // 5. ANALYZE RESULTS
  const unitsSnap = await db.collection("semantic_units")
    .where("sourceDocumentId", "==", docId)
    .where("lineageId", "==", `lineage_${taskId}`)
    .get();

  const report = {
    totalUnits: unitsSnap.size,
    headings: 0,
    paragraphs: 0,
    tables: 0,
    annexures: 0,
    pageCoverage: new Set()
  };

  unitsSnap.forEach(d => {
    const u = d.data();
    if (u.semanticType === 'heading') report.headings++;
    if (u.semanticType === 'paragraph') report.paragraphs++;
    if (u.semanticType === 'table_row') report.tables++;
    if (u.semanticType === 'annexure') report.annexures++;
    report.pageCoverage.add(u.pageNumber);
  });

  console.log("\n--- 🔱 BENCHMARK QUALITY REPORT ---");
  console.log(`Total Semantic Units: ${report.totalUnits}`);
  console.log(`Heading Units: ${report.headings}`);
  console.log(`Paragraph Units: ${report.paragraphs}`);
  console.log(`Table/Data Units: ${report.tables}`);
  console.log(`Annexure Units: ${report.annexures}`);
  console.log(`Page Coverage: ${report.pageCoverage.size} / ${totalPages} pages`);
  console.log(`Coverage %: ${((report.pageCoverage.size / totalPages) * 100).toFixed(2)}%`);

  // 🔱 50D Traceability Verification
  const lineageSnap = await db.collection("transformation_lineage").doc(`lineage_${taskId}`).get();
  console.log(`Lineage Status: ${lineageSnap.exists ? "✅ PHYSICAL TRACE ACTIVE" : "❌ BROKEN"}`);

  console.log("\n--- BENCHMARK COMPLETE ---");
}

// Target: Manovigyan-12th.pdf
// runBenchmark("hash_8acb8a73137984a8bbe3134ee833c3ea7bd4266353a1b87b0de8d80ff3be412a").catch(console.error);
const targetId = process.argv[2] || "hash_8acb8a73137984a8bbe3134ee833c3ea7bd4266353a1b87b0de8d80ff3be412a";
runBenchmark(targetId).catch(console.error);
