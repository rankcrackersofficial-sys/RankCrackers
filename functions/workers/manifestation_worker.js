const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { callGemini } = require("../services/gemini_service");
const { updateHeartbeat, isWorkerEnabled } = require("../services/worker_service");
const sanitizeJsonResponse = require("../helpers/sanitizer");

const WORKER_VERSION = "1.0.0 (Truth-to-Learning)";

/**
 * 🔱 KNOWLEDGE MANIFESTATION WORKER (Refinery Pass 3)
 * Transforms Structured Atomic Facts into Human-Readable Learning Blocks.
 */
exports.knowledgeManifestationWorker = functions
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .firestore
  .document("ai_queue/{taskId}")
  .onCreate(async (snapshot, context) => {
    const taskId = context.params.taskId;
    const task = snapshot.data();

    if (task.type !== 'MANIFEST_KNOWLEDGE') return;

    // 🛡️ AAF GUARD: AAF jobs have their own orchestration spine.
    if (task.runId || task.jobId || task.idempotencyKey) {
      console.log(`🔱 MANIFESTATION QUARANTINE: Task ${taskId} is an AAF job. Ignoring.`);
      return;
    }

    const { payload } = task;
    const { sourceDocumentId, nodeIds, examId } = payload; // 🔱 Added: examId scoping
    const db = admin.firestore();

    if (!(await isWorkerEnabled('manifestation_worker'))) return;

    await updateHeartbeat('manifestation_worker', { activeTask: taskId, status: 'ONLINE' });

    try {
      // 1. FETCH ATOMIC TRUTH
      const factsSnap = await db.collection("atomic_facts")
        .where("sourceDocumentId", "==", sourceDocumentId)
        .limit(50) // Batch processing to control tokens
        .get();

      if (factsSnap.empty) throw new Error("NO_FACTS_FOUND: Cannot manifest from vacuum.");

      const facts = factsSnap.docs.map(doc => {
        const d = doc.data();
        return `${d.subject} ${d.predicate} ${d.object}`;
      }).join("\n");

      // 2. AI MANIFESTATION (Truth -> Learning)
      const prompt = `
        🔱 SOVEREIGN KNOWLEDGE MANIFESTATION PROTOCOL
        You are the Voice of the RankCrackers Knowledge Factory.

        INPUT TRUTH (Atomic Facts):
        ${facts}

        TASK: Transform these facts into Human-Readable Learning Blocks for a DigiBook.

        CONSTITUTIONAL RULES:
        1. Accuracy is Absolute. Do not add information not present in the facts.
        2. Language: Use the original language of the facts (Hindi or English).
        3. Formats:
           - 'concept_note': Deep explanation.
           - 'brief_note': Quick summary.
           - 'one_liner': Memory axioms.
           - 'memory_aid': Mnemonics/Revision points.

        RETURN JSON FORMAT:
        {
          "blocks": [
            {
              "type": "concept_note" | "brief_note" | "one_liner" | "memory_aid",
              "title": "Clear Heading",
              "content": "Professional educational content",
              "importance": 1-10
            }
          ]
        }
      `;

      const responseText = await callGemini(prompt);
      const result = JSON.parse(sanitizeJsonResponse(responseText));

      const batch = db.batch();

      // 3. PERSIST TO PRESENTATION LAYER (digibook_refinery)
      result.blocks.forEach((block, index) => {
        const blockId = `manifest_${sourceDocumentId}_${index}`;
        const blockRef = db.collection("digibook_refinery").doc(blockId);

        batch.set(blockRef, {
          ...block,
          id: blockId,
          sourceDocumentId: sourceDocumentId,
          examId: examId || 'global', // 🔱 Physical Isolation Seal
          atomicTopicId: payload.atomicTopicId || 'unmapped',
          status: 'review', // Needs Founder verification
          workerVersion: WORKER_VERSION,
          sourceFactIds: factsSnap.docs.map(d => d.id),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      await db.collection("ai_queue").doc(taskId).update({ status: 'completed' });
      await updateHeartbeat('manifestation_worker', { success: true });

      console.log(`MANIFESTATION SUCCESS: ${result.blocks.length} blocks created.`);

    } catch (error) {
      console.error(`MANIFESTATION ERROR:`, error);
      await db.collection("ai_queue").doc(taskId).update({ status: 'failed', error: error.message });
    }
  });
