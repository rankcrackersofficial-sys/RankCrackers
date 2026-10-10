const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const PDFParse = require("pdf-parse");
const mammoth = require("mammoth");
const XLSX = require("xlsx");
const vision = require("@google-cloud/vision");
const { callGemini } = require("../services/gemini_service");
const { logAiAudit, logFounderActivity } = require("../services/audit_service");
const { trackSystemBudget } = require("../services/budget_service");
const { isWorkerEnabled, getWorkerMode, updateHeartbeat } = require("../services/worker_service");
const sanitizeJsonResponse = require("../helpers/sanitizer");
const getRefineryPrompt = require("../helpers/prompts");
const calculateTokenEstimate = require("../helpers/token_estimator");

const WORKER_VERSION = "9.2.0 (Forensic-Supreme)";
let visionClient = null;
const ALLOWED_STORAGE_HOSTS = ["firebasestorage.googleapis.com"];

/**
 * SUPREME SENTINEL WORKER (Hardened v9.2 - Truth & Governance Restoration)
 * Multi-format Extraction Engine with Physical Integrity Audits.
 */
exports.sentinelBackgroundWorker = functions
  .runWith({
    secrets: ["GEMINI_API_KEY"]
  })
  .firestore
  .document("ai_queue/{taskId}")
  .onWrite(async (change, context) => {
    const taskId = context.params.taskId;

    // RC-A.2: Trigger on Create OR Status Reset to 'received'/'parsing'
    if (!change.after.exists) return;
    const task = change.after.data();
    const beforeTask = change.before.exists ? change.before.data() : null;

    if (task.status !== 'received' && task.status !== 'parsing') return;
    if (beforeTask && beforeTask.status === task.status) return;

    // 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (task.queueContract === 'academic_factory_v1') {
      console.log(`🔱 SENTINEL QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
      return;
    }

    const { type, payload } = task;

    if (type === 'STRUCTURAL' || type === 'SVO_EXTRACTION' || type === 'MANIFEST_KNOWLEDGE' || type === 'ENCODING_NORMALIZATION' || type === 'SYLLABUS_B3') return;

    // 🛡️ GENERIC TASK GUARD: mcq, digibook, and revision are handled by the generic queue worker.
    if (['mcq', 'digibook', 'revision'].includes(type)) return;

    const startTime = Date.now();
    const taskRef = admin.firestore().collection("ai_queue").doc(taskId);

    // 🛡️ GOVERNANCE LAYER 1: Worker State & Budget
    if (!(await isWorkerEnabled('sentinel_worker'))) {
        console.log("SENTINEL: Worker disabled or budget exceeded.");
        return;
    }

    const mode = await getWorkerMode('sentinel_worker');
    if (mode === 'manual' && !task.manualTrigger) {
      console.log("SENTINEL: Manual mode active. Skipping auto-trigger.");
      return;
    }

    await updateHeartbeat('sentinel_worker', { activeTask: taskId, status: 'ONLINE' });

    try {
      // 🛡️ GOVERNANCE LAYER 2: DEDUPLICATION
      if (payload.fileHash) {
        const extractionIntent = payload.intent || payload.task || type;
        const existingDraft = await admin.firestore()
          .collection("sentinel_drafts")
          .where("fileHash", "==", payload.fileHash)
          .where("type", "==", extractionIntent)
          .limit(1)
          .get();

        if (!existingDraft.empty) {
          await taskRef.set({ status: "skipped_duplicate", processedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          return;
        }
      }

      // 🛡️ GOVERNANCE LAYER 3: SSRF PROTECTION
      if (payload.filePath && payload.filePath.startsWith('http')) {
        const url = new URL(payload.filePath);
        if (!ALLOWED_STORAGE_HOSTS.includes(url.host)) throw new Error(`SECURITY_VIOLATION: Unauthorized host ${url.host}`);
      }

      // 🛡️ GOVERNANCE LAYER 4: QUEUE LOCKING
      const lockResult = await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists || doc.data().status === "processing") return false;
        transaction.update(taskRef, { status: "processing", processingStartedAt: admin.firestore.FieldValue.serverTimestamp() });
        return true;
      });

      if (!lockResult) return;

      console.log(`SENTINEL: Mobilizing ${payload.fileType || 'unknown'} source: ${payload.id}`);

      let rawText = "";
      let extractionMethod = "NATIVE";
      const extension = payload.fileName?.split(".").pop()?.toLowerCase();
      const fileUrl = payload.filePath;

      // UNIVERSAL EXTRACTION ENGINE v4 (Physical Truth Path)
      let fileBuffer;
      if (payload.storagePath) {
        console.log(`SENTINEL: Accessing internal storage: ${payload.storagePath}`);
        const [buffer] = await admin.storage().bucket().file(payload.storagePath).download();
        fileBuffer = buffer;
      } else {
        console.log(`SENTINEL: Accessing external URL: ${fileUrl}`);
        const downloadResponse = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 30000 });
        fileBuffer = Buffer.from(downloadResponse.data);
      }

      if (payload.fileType === "pdf" || extension === "pdf") {
        const data = await PDFParse(fileBuffer);
        rawText = data.text;
        extractionMethod = "PDF";

        if (!rawText || rawText.trim().length < 150) {
            console.log(`OCR: Scanned PDF detected. Invoking Vision API with Buffer.`);
            if (!visionClient) {
                visionClient = new vision.ImageAnnotatorClient();
            }
            const [result] = await visionClient.documentTextDetection({ content: fileBuffer });
            rawText = result.fullTextAnnotation?.text || "";
            extractionMethod = "OCR";
        }
      }
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
        console.log(`OCR: Processing image source via Vision API.`);
        if (!visionClient) {
            visionClient = new vision.ImageAnnotatorClient();
        }
        const [result] = await visionClient.textDetection({ content: fileBuffer });
        rawText = result.fullTextAnnotation?.text || "";
        extractionMethod = "OCR";
      }
      else if (extension === "docx") {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = result.value;
      }
      else if (extension === "xlsx" || extension === "xls") {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        rawText = workbook.SheetNames.map(name => {
            const sheet = workbook.Sheets[name];
            return `SHEET: ${name}\n${XLSX.utils.sheet_to_txt(sheet)}`;
        }).join("\n---\n");
      }
      else if (extension === "json") {
        rawText = fileBuffer.toString('utf8');
      }
      else {
        rawText = payload.text || "";
      }

      if (!rawText || rawText.trim().length < 5) throw new Error("EXTRACTION_FAILED: No text recovered from physical buffer.");

      // AI REFINERY
      const extractionIntent = payload.intent || payload.task || type;
      const prompt = getRefineryPrompt(extractionIntent, { ...payload, fullText: rawText });

      const responseText = await callGemini(prompt);
      const refinement = JSON.parse(sanitizeJsonResponse(responseText));

      const latency = Date.now() - startTime;
      const estTokens = calculateTokenEstimate(prompt, refinement);

      // 🛡️ GOVERNANCE LAYER 5: BUDGET & AUDIT
      await trackSystemBudget(estTokens);

      // 🔱 Forensic Fix: Collision Protection (RC-11)
      const safeId = payload.fileHash || payload.id || `unknown_${taskId}`;
      const fileId = String(safeId).substring(0, 6);
      const sourceId = payload.id || `unknown_${taskId}`;
      let draftId = `draft_${fileId}`;

      if (refinement.exam_name && refinement.year && refinement.document_type) {
        const cleanName = refinement.exam_name.toLowerCase().replace(/\s/g, '_');
        const cleanOrg = (refinement.organization || 'unknown').toLowerCase().replace(/\s/g, '_');
        const cleanType = refinement.document_type.toLowerCase();
        // ID: HASH_ORG_EXAM_YEAR_TYPE
        draftId = `${fileId}_${cleanOrg}_${cleanName}_${refinement.year}_${cleanType}`;
      }

      await admin.firestore().collection("sentinel_drafts").doc(draftId).set({
        id: draftId,
        sourceId: sourceId,
        fileHash: payload.fileHash || null,
        type: extractionIntent,
        status: "under_review",
        fullText: rawText, // Physical Truth Preservation (Audit Fix)
        rawData: refinement,
        audit: {
          workerVersion: WORKER_VERSION,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          extractionMethod: extractionMethod,
          latencyMs: latency,
          estTokens: estTokens,
          provider: "gemini"
        },
      });

      // Update Ingestion Refinery
      await admin.firestore().collection("ingestion_refinery").doc(sourceId).set({
        status: "under_review",
        fullText: rawText,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        linkedDraftId: draftId,
        extractionMethod: extractionMethod
      }, { merge: true });

      // 🛡️ GOVERNANCE LAYER 6: QUEUE COMPLETION
      await taskRef.update({
        status: "classified",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        latencyMs: latency,
        estTokens: estTokens,
        generatedDraftId: draftId
      });

      await logAiAudit({ taskId, type, provider: "gemini", latency, status: 'success', tokens: estTokens });
      await logFounderActivity({
        type: 'SENTINEL_DISCOVERY',
        taskId: taskId,
        message: `Knowledge manifested via ${extractionMethod}. ID: ${draftId}`,
        metadata: { method: extractionMethod, draftId: draftId }
      });

      await updateHeartbeat('sentinel_worker', { success: true });

    } catch (error) {
      console.error(`SENTINEL ERROR:`, error);
      await taskRef.update({ status: "failed", error: error.message });
      await updateHeartbeat('sentinel_worker', { error: error.message });
      await logAiAudit({ taskId, type, status: 'failed', error: error.message });

      await admin.firestore().collection("ai_failed_tasks").doc(taskId).set({
        taskId, type, payload, error: error.message, timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
