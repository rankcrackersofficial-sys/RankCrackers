const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "service-account.json");

if (fs.existsSync(serviceAccountPath)) {
  console.log("🔱 Using service-account.json for authentication...");
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.log("⚠️ service-account.json not found, attempting default initialization...");
  admin.initializeApp();
}

async function createWorker() {
  console.log("🔱 Attempting to write to Firestore...");
  await admin.firestore()
    .collection("worker_registry")
    .doc("sentinel_worker")
    .set({
      enabled: true,
      mode: "fullAuto",
      priority: "normal",
      monthlyTokenUsage: 0,
      monthlyTokenLimit: 1000000,
      monthlyCost: 0,
      monthlyCostLimit: 1000,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  console.log("🔱 sentinel_worker created successfully in worker_registry");
  process.exit(0);
}

createWorker().catch(err => {
  console.error("❌ FAILED TO CREATE WORKER:", err);
  process.exit(1);
});
