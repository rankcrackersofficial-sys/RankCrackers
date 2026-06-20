const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto"); // 🔱 For Atomic Fact ID Hashing
const { callLlm } = require("../services/llm_orchestrator");
const { logAiAudit } = require("../services/audit_service");
const { trackSystemBudget } = require("../services/budget_service");
const calculateTokenEstimate = require("../helpers/token_estimator");
const sanitizeJsonResponse = require("../helpers/sanitizer");
const getRefineryPrompt = require("../helpers/prompts");
const { isWorkerEnabled, updateHeartbeat } = require("../services/worker_service");

const WORKER_VERSION = "1.0.5";
const PROMPT_VERSION = "50J_SVO_V2"; // 🔱 Upgraded Prompt
const SCHEMA_VERSION = "1.2.0";

/**
 * 🔱 SVO EXTRACTION WORKER (Refinery Pass 2)
 * Transforms Semantic Units into Structured Atomic Facts.
 */
exports.svoWorker = functions
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .firestore
  .document("ai_queue/{taskId}")
  .onCreate(async (snapshot, context) => {
    const taskId = context.params.taskId;
    const task = snapshot.data();

    // Only process SVO_EXTRACTION tasks
    if (task.type !== 'SVO_EXTRACTION') return;

    const { payload } = task;
    const startTime = Date.now();
    const taskRef = admin.firestore().collection("ai_queue").doc(taskId);

    // 🛡️ GOVERNANCE LAYER ENFORCEMENT
    if (!(await isWorkerEnabled('svo_worker'))) {
        console.log("SVO: Worker disabled or budget exceeded.");
        return;
    }

    const workflowId = task.workflowId || `wf_svo_${taskId}`;
    const correlationId = task.correlationId || `corr_svo_${taskId}`;

    console.log(`SVO: Processing unit ${payload.unitId} (Workflow: ${workflowId})`);
    await updateHeartbeat('svo_worker', { activeTask: taskId, status: 'ONLINE' });

    try {
      // 1. FETCH INPUT (Semantic Unit)
      const unitSnap = await admin.firestore().collection("semantic_units").doc(payload.unitId).get();
      if (!unitSnap.exists) throw new Error(`MISSING_UNIT: Unit ${payload.unitId} not found.`);
      const unitData = unitSnap.data();

      // 2. AI EXTRACTION (Pass 2)
      const prompt = getRefineryPrompt('svo_extraction', { text: unitData.rawText });
      const responseText = await callLlm(prompt, 'SVO_EXTRACTION');

      const sanitized = sanitizeJsonResponse(responseText);
      const result = JSON.parse(sanitized);

      if (!result.facts || !Array.isArray(result.facts)) {
        console.warn("🔱 SVO WARNING: No facts array found in LLM response:", responseText);
        throw new Error("INVALID_OUTPUT: AI failed to return facts array.");
      }

      const batch = admin.firestore().batch();
      const factIds = [];

      // 3. FACT PERSISTENCE (SVO v2.2 - Forensic Hashing)
      result.facts.forEach((fact, index) => {
        if (!fact.subject || fact.subject.toLowerCase() === "unknown" || !fact.predicate) {
          return;
        }

        // 🔱 Forensic Hashing for Deduplication (v4.2 - Context Aware)
        // ID is based on content hash to prevent duplication if re-extracted
        const factString = `${fact.subject}_${fact.predicate}_${fact.object || ''}_${fact.context || ''}_${fact.factType || ''}`.toLowerCase().replace(/\s/g, '');
        const factHash = crypto.createHash('sha256').update(factString).digest('hex').substring(0, 16);
        const factId = `fact_${factHash}`;

        const factRef = admin.firestore().collection("atomic_facts").doc(factId);

        const atomicFact = {
          id: factId,
          sourceDocumentId: unitData.sourceDocumentId,
          derivedFromUnitId: payload.unitId,
          lineageId: `lineage_svo_${taskId}`,
          factVersion: 2,
          subject: fact.subject,
          predicate: fact.predicate,
          object: fact.object || "",
          context: fact.context || null,
          factType: fact.factType || "fact",
          confidence: fact.confidence ?? 0.5, // 🔱 Honest Confidence (Audit v4.1)
          difficulty: 3,
          importance: 5,
          isCore: fact.isCore || false,
          schemaVersion: SCHEMA_VERSION,
          workerVersion: WORKER_VERSION,
          promptVersion: PROMPT_VERSION,
          sourceHash: task.payload.sourceHash || "unknown",
          workflowId: workflowId,
          correlationId: correlationId,
          extractedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        batch.set(factRef, atomicFact, { merge: true });
        factIds.push(factId);
      });

      if (factIds.length === 0 && result.facts.length > 0) {
        throw new Error("KNOWLEDGE_EXTRACTION_FAILED: All facts filtered as dummy/invalid.");
      }

      // 4. LINEAGE LOGGING
      const lineageRef = admin.firestore().collection("transformation_lineage").doc(`lineage_svo_${taskId}`);
      batch.set(lineageRef, {
        id: `lineage_svo_${taskId}`,
        inputCollection: "semantic_units",
        inputId: payload.unitId,
        outputCollection: "atomic_facts",
        outputIds: factIds,
        workerId: "svo_worker",
        promptVersion: PROMPT_VERSION,
        type: "extraction",
        workflowId: workflowId,
        correlationId: correlationId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // 5. TASK UPDATE
      batch.update(taskRef, {
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        factsCount: factIds.length
      });

      await batch.commit();

      // 6. TELEMETRY
      const estTokens = calculateTokenEstimate(prompt, result);
      await trackSystemBudget(estTokens);
      await logAiAudit({
        taskId,
        type: 'SVO_EXTRACTION',
        status: 'success',
        tokens: estTokens,
        model: 'orchestrated',
        workflowId: workflowId,
        correlationId: correlationId
      });
      await updateHeartbeat('svo_worker', { success: true });

      console.log(`SVO SUCCESS: Generated ${factIds.length} atomic facts from unit ${payload.unitId}.`);

    } catch (error) {
      console.error(`SVO ERROR:`, error);
      await updateHeartbeat('svo_worker', { error: error.message });

      await admin.firestore().collection("ai_failed_tasks").doc(taskId).set({
        taskId, type: 'SVO_EXTRACTION', payload,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await taskRef.update({
        status: "failed",
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
