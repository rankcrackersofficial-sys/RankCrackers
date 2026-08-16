const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { detectEncoding, convertKrutiDevToUnicode } = require("../services/encoding_service");
const { updateHeartbeat } = require("../services/worker_service");

const WORKER_VERSION = "1.0.0";

/**
 * 🔱 ENCODING NORMALIZATION WORKER (Phase 2.1)
 * Detects legacy Hindi encoding and normalizes to Unicode.
 */
exports.encodingWorker = functions.firestore
  .document("ai_queue/{taskId}")
  .onCreate(async (snapshot, context) => {
    const taskId = context.params.taskId;
    const task = snapshot.data();

    if (task.type !== 'ENCODING_NORMALIZATION') return;

    // 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (task.queueContract === 'academic_factory_v1') {
      console.log(`🔱 ENCODING QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
      return;
    }

    const { payload } = task;
    const docId = payload.id;
    const taskRef = admin.firestore().collection("ai_queue").doc(taskId);

    console.log(`ENCODING: Auditing document ${docId}`);
    await updateHeartbeat('encoding_worker', { activeTask: taskId, status: 'ONLINE' });

    try {
      const refineryRef = admin.firestore().collection("ingestion_refinery").doc(docId);
      const refinerySnap = await refineryRef.get();

      if (!refinerySnap.exists) throw new Error("REFINERY_DOC_NOT_FOUND");
      const rawText = refinerySnap.data().fullText || "";

      const encoding = detectEncoding(rawText);
      console.log(`ENCODING: Detected ${encoding} for ${docId}`);

      let normalizedText = rawText;
      if (encoding === 'krutidev') {
        normalizedText = convertKrutiDevToUnicode(rawText);
        console.log(`ENCODING: Conversion applied for KrutiDev.`);
      }

      // Update Ingestion Refinery with normalized text
      await refineryRef.update({
        fullText: normalizedText,
        detectedEncoding: encoding,
        normalizedAt: admin.firestore.FieldValue.serverTimestamp(),
        normalizationVersion: WORKER_VERSION
      });

      await taskRef.update({
        status: "completed",
        detectedEncoding: encoding,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await updateHeartbeat('encoding_worker', { success: true });

    } catch (error) {
      console.error(`ENCODING ERROR:`, error);
      await taskRef.update({
        status: "failed",
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
