"use strict";

// Unconditionally configure host before loading firebase-admin to connect to local emulator
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const admin = require("firebase-admin");

const PROJECT_ID = "rankcrackers-55";
const MISSION_ID = "neet_(ug)-2027";
const SYLLABUS_HASH = "2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925";
const DOCUMENT_ID = `hash_${SYLLABUS_HASH}`;

console.log("🔱 INITIALIZING FOUNDER SYLLABUS PROVENANCE BRIDGE...");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

async function seed() {
  // 1. Clear any duplicate/stale metadata to avoid conflict
  console.log(`- Deleting stale work orders or uploads if any...`);
  await db.collection("founder_uploads").doc(DOCUMENT_ID).delete();
  await db.collection("ingestion_refinery").doc(DOCUMENT_ID).delete();
  await db.collection("ingestion_work_orders").doc(`wo_${MISSION_ID}_${SYLLABUS_HASH}`).delete();

  // 2. Write exact production metadata to founder_uploads
  console.log(`- Bridging true Founder upload: founder_uploads/${DOCUMENT_ID}`);
  await db.collection("founder_uploads").doc(DOCUMENT_ID).set({
    documentId: DOCUMENT_ID,
    missionId: MISSION_ID,
    sourceType: "syllabus",
    storageIdentity: `ingestion_refinery/${SYLLABUS_HASH}.json`,
    sourceSha256: SYLLABUS_HASH,
    sourceAuthority: "Founder",
    uploadedAtUtc: "2026-08-22T18:22:40.000Z",
    status: "accepted",
    createdAt: new Date().toISOString()
  });

  // 3. Write exact production metadata to ingestion_refinery with status "received"
  console.log(`- Seeding ingestion_refinery with status 'received': ingestion_refinery/${DOCUMENT_ID}`);
  await db.collection("ingestion_refinery").doc(DOCUMENT_ID).set({
    id: DOCUMENT_ID,
    fileName: "neet_ug_2027_official_syllabus.json",
    fileType: "json",
    fileHash: SYLLABUS_HASH,
    status: "received",
    storagePath: `ingestion_refinery/${SYLLABUS_HASH}.json`,
    sourceUrl: `https://firebasestorage.googleapis.com/v0/b/rankcrackers-55.firebasestorage.app/o/ingestion_refinery%2F${SYLLABUS_HASH}.json?alt=media`,
    assetType: "syllabus",
    missionId: MISSION_ID,
    sourceAuthority: "Founder",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    uploadedAtUtc: "2026-08-22T18:22:40.000Z"
  });

  console.log("✅ FOUNDER PROVENANCE BRIDGED SUCCESSFULLY!");
}

seed().catch(console.error);
