const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { callLlm } = require("../services/llm_orchestrator");
const { logAiAudit, logFounderActivity } = require("../services/audit_service");
const { trackSystemBudget } = require("../services/budget_service");
const calculateTokenEstimate = require("../helpers/token_estimator");
const sanitizeJsonResponse = require("../helpers/sanitizer");
const getRefineryPrompt = require("../helpers/prompts");
const { isWorkerEnabled, updateHeartbeat } = require("../services/worker_service");

const WORKER_VERSION = "1.0.4";
const PROMPT_VERSION = "50I_SEGMENTATION_V1";

/**
 * 🔱 STRUCTURAL WORKER (Refinery Pass 1)
 * Transforms Raw Document Text into Semantic Units.
 */
exports.structuralWorker = functions
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .firestore
  .document("ai_queue/{taskId}")
  .onCreate(async (snapshot, context) => {
    const taskId = context.params.taskId;
    const task = snapshot.data();

    // Only process STRUCTURAL tasks
    if (task.type !== 'STRUCTURAL') return;

    // 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (task.runId || task.jobId || task.idempotencyKey) {
      console.log(`🔱 STRUCTURAL QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
      return;
    }

    const { payload } = task;
    const startTime = Date.now();
    const taskRef = admin.firestore().collection("ai_queue").doc(taskId);

    // 🛡️ GOVERNANCE LAYER ENFORCEMENT
    if (!(await isWorkerEnabled('structural_worker'))) {
        console.log("STRUCTURAL: Worker disabled or budget exceeded.");
        return;
    }

    // 🔱 50L: Workflow & Correlation Extraction
    const workflowId = task.workflowId || `wf_${taskId}`;
    const correlationId = task.correlationId || `corr_${taskId}`;

    console.log(`STRUCTURAL: Processing task ${taskId} (Workflow: ${workflowId})`);
    await updateHeartbeat('structural_worker', { activeTask: taskId, status: 'ONLINE' });

    try {
      const rawText = payload.fullText || payload.text;
      if (!rawText) throw new Error("MISSING_INPUT: No text provided for segmentation.");

      // 🔱 2. IDEMPOTENCY GUARD (Document 50L Article 2)
      const existingLineage = await admin.firestore()
        .collection("transformation_lineage")
        .where("inputId", "==", payload.id || taskId)
        .where("workerId", "==", "structural_worker")
        .where("promptVersion", "==", PROMPT_VERSION)
        .limit(1)
        .get();

      if (!existingLineage.empty) {
        console.log(`STRUCTURAL: Skipping duplicate task. Lineage already exists.`);
        await taskRef.update({
          status: "skipped_duplicate",
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      // 3. AI EXECUTION (Segmentation Pass)
      let units = [];
      let usedFallback = false;
      let result = null;

      try {
        const prompt = getRefineryPrompt('structural_segmentation', { text: rawText });
        const responseText = await callLlm(prompt, 'STRUCTURAL_SEGMENTATION');
        result = JSON.parse(sanitizeJsonResponse(responseText));
        if (result.units && Array.isArray(result.units)) {
          units = result.units;
        } else {
            throw new Error("AI returned empty units.");
        }
      } catch (aiError) {
        console.warn("🔱 STRUCTURAL: AI/Orchestration Failed. Engaging Rule-Based Fallback.", aiError.message);
        units = fallbackSegmenter(rawText);
        usedFallback = true;
      }

      const batch = admin.firestore().batch();
      const unitIds = [];

      // 4. UNIT PERSISTENCE & PASS 2 TRIGGER
      units.forEach((unit, index) => {
        const unitId = `unit_${taskId}_${index}`;
        const unitRef = admin.firestore().collection("semantic_units").doc(unitId);

        const semanticUnit = {
          id: unitId,
          sourceDocumentId: payload.id || taskId,
          pageNumber: unit.pageNumber || 0,
          sectionHeading: unit.sectionHeading || "General",
          rawText: unit.rawText || "",
          semanticType: unit.semanticType || "paragraph",
          structureIndex: index,
          tokenCount: Math.ceil((unit.rawText || "").length / 4),
          charCount: (unit.rawText || "").length,
          workerVersion: WORKER_VERSION,
          promptVersion: usedFallback ? "FALLBACK_V1" : PROMPT_VERSION,
          lineageId: `lineage_${taskId}`,
          workflowId: workflowId,
          correlationId: correlationId
        };

        batch.set(unitRef, semanticUnit);
        unitIds.push(unitId);

        // 🔱 TRIGGER PASS 2: SVO EXTRACTION
        const svoTaskId = `svo_${unitId}`;
        const svoTaskRef = admin.firestore().collection("ai_queue").doc(svoTaskId);
        batch.set(svoTaskRef, {
            type: 'SVO_EXTRACTION',
            payload: {
                unitId: unitId,
                sourceDocumentId: payload.id || taskId,
                sourceHash: payload.fileHash || 'unknown'
            },
            workflowId: workflowId,
            correlationId: correlationId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // 5. LINEAGE LOGGING
      const lineageRef = admin.firestore().collection("transformation_lineage").doc(`lineage_${taskId}`);
      batch.set(lineageRef, {
        id: `lineage_${taskId}`,
        inputCollection: "ingestion_refinery",
        inputId: payload.id || taskId,
        outputCollection: "semantic_units",
        outputIds: unitIds,
        workerId: "structural_worker",
        promptVersion: usedFallback ? "FALLBACK_V1" : PROMPT_VERSION,
        type: "segmentation",
        workflowId: workflowId,
        correlationId: correlationId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // 6. TASK UPDATE
      batch.update(taskRef, {
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        unitsCount: unitIds.length,
        workflowId: workflowId,
        fallbackEngaged: usedFallback
      });

      await batch.commit();

      // 7. TELEMETRY
      const estTokens = result ? calculateTokenEstimate(getRefineryPrompt('structural_segmentation', { text: rawText }), result) : 0;
      const latencyMs = Date.now() - startTime;

      await trackSystemBudget(estTokens);
      await logAiAudit({
        taskId,
        type: 'STRUCTURAL',
        status: 'success',
        tokens: estTokens,
        model: usedFallback ? 'rule-based' : 'backend_policy_controlled_gemini_factory_flash',
        latencyMs: latencyMs,
        workflowId: workflowId,
        correlationId: correlationId,
        fallback: usedFallback
      });
      await updateHeartbeat('structural_worker', { success: true });

      console.log(`STRUCTURAL SUCCESS: Generated ${unitIds.length} semantic units and triggered SVO pass.`);

    } catch (error) {
      console.error(`STRUCTURAL ERROR:`, error);
      await updateHeartbeat('structural_worker', { error: error.message });

      await admin.firestore().collection("ai_failed_tasks").doc(taskId).set({
        taskId, type: 'STRUCTURAL', payload,
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

/**
 * 🔱 RULE-BASED FALLBACK SEGMENTER
 */
function fallbackSegmenter(text) {
  const pages = text.split(/(?:Page\s*\d+|पृष्ठ\s*\d+|\n\s*\d+\s*\n)/i);
  let allUnits = [];
  let currentGlobalIndex = 0;

  pages.forEach((pageContent, pageIdx) => {
    const blocks = pageContent.split(/\n{2,}/);

    blocks.forEach((block) => {
      let trimmed = block.trim();
      if (trimmed.length < 5) return;

      const subBlocks = [];
      if (trimmed.length > 800) {
        const sentences = trimmed.split(/(?<=[.।])\s+/);
        let currentSub = "";
        sentences.forEach(s => {
          if ((currentSub.length + s.length) > 500) {
            subBlocks.push(currentSub.trim());
            currentSub = s;
          } else {
            currentSub += " " + s;
          }
        });
        if (currentSub) subBlocks.push(currentSub.trim());
      } else {
        subBlocks.push(trimmed);
      }

      subBlocks.forEach(sb => {
        let type = "paragraph";
        const isHeading =
          /^(अध्याय|विषय|अनुभाग|भाग|CHAPTER|SECTION|UNIT|PART|राजस्थान)\s*/i.test(sb) ||
          (sb.length < 120 && /^[A-Z0-9\s.]{5,}$/.test(sb)) ||
          /^\d+\.\d+\s+[A-Z\u0900-\u097F]/.test(sb);

        if (isHeading) type = "heading";

        allUnits.push({
          pageNumber: pageIdx + 1,
          sectionHeading: type === "heading" ? sb : "Continued",
          rawText: sb,
          semanticType: type,
          structureIndex: currentGlobalIndex++
        });
      });
    });
  });

  return allUnits;
}
