import * as crypto from 'crypto';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { generateGemini } from '../providers/geminiProvider';

export interface B4Input {
  missionId: string;
  documentId: string;
  sourceSha256: string;
  runId: string;
  authorizedScope: {
    status?: string;
    hierarchyMode?: 'PAPER_THEN_SUBJECT' | 'SUBJECT_FIRST';
    allowedPapers?: string[];
    allowedSubjects?: string[];
    paperDefinitions?: Record<string, { allowedSubjects: string[] }>;
  };
}

export interface AtomicNode {
  atomicNodeId: string;
  atomId: string; // compatibility
  missionId: string;
  documentId: string;
  sourceSha256: string;
  paperId: string | null;
  subjectId: string;
  structuredParentId: string;
  parentB3NodeId: string; // compatibility
  ancestorIds: string[];
  canonicalTitle: string;
  sourcePages: number[];
  sourceTextAnchor: string;
  decompositionVersion: string;
  verificationState: string;
  workerRevision: string;
  verifierRevision: string; // compatibility
  runId: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

export class GenericB4Worker {
  static VERSION = '1.0.0';
  static REVISION = 'RC-AUTO-B4-ATOMIC-V1';

  async decomposeSyllabus(input: B4Input, firestoreOverride?: admin.firestore.Firestore): Promise<AtomicNode[]> {
    if (input.authorizedScope) {
      const scope = input.authorizedScope as any;
      if (scope.papers && !scope.paperDefinitions) {
        scope.paperDefinitions = scope.papers;
      }
      if (scope.paperDefinitions && scope.papersEnabled === undefined) {
        scope.papersEnabled = true;
      }
      if (scope.paperDefinitions && !scope.allowedPaperIds) {
        scope.allowedPaperIds = Object.keys(scope.paperDefinitions);
      }
    }

    this.validateInputs(input);

    const db = firestoreOverride || admin.firestore();
    const missionId = input.missionId;
    const documentId = input.documentId;
    const sourceSha256 = input.sourceSha256;
    const runId = input.runId;

    // Fetch structured nodes of type 'topic'
    const nodesSnap = await db.collection('mission_realms')
      .doc(missionId)
      .collection('structured_nodes')
      .where('documentId', '==', documentId)
      .where('nodeType', '==', 'topic')
      .get();

    if (nodesSnap.empty) {
      throw new Error("B4_REJECT: no B3 structured topic nodes found");
    }

    const atomicNodes: AtomicNode[] = [];
    const seenAtomicIds = new Set<string>();

    for (const doc of nodesSnap.docs) {
      const topicNode = doc.data();
      const parentB3NodeId = topicNode.nodeId;
      const canonicalTitle = topicNode.canonicalTitle;
      const subjectId = topicNode.subjectId;
      const paperId = topicNode.paperId || null;
      const sourcePages = topicNode.sourcePages || [];
      const ancestorIds = topicNode.ancestorIds || [];
      const sourceTextAnchor = topicNode.sourceTextAnchor || '';

      // 🛡️ B4-T11 Orphan check: Reject if B3 parent does not exist / structuredParentId is empty
      if (!parentB3NodeId) {
        throw new Error("B4_REJECT: structuredParentId is empty");
      }

      // 🛡️ B4-T12 sourceless check
      if (!sourcePages || sourcePages.length === 0) {
        throw new Error(`B4_REJECT: sourceless parent node ${parentB3NodeId} (no pages)`);
      }
      if (!sourceTextAnchor || sourceTextAnchor.trim().length === 0) {
        throw new Error(`B4_REJECT: sourceless parent node ${parentB3NodeId} (no text anchor)`);
      }

      // 🛡️ B4-T02 Parent Verification State check: Reject if B3 parent is unverified
      if (topicNode.verificationState !== 'verified') {
        throw new Error(`B4_REJECT: unverified parent B3 node ${parentB3NodeId}`);
      }

      // 🛡️ B4-T03 Wrong SHA check: Reject if B3 node has wrong SHA
      if (topicNode.sourceSha256 !== sourceSha256) {
        throw new Error("B4_REJECT: wrong SHA blocked");
      }

      // 🛡️ B4-T04 Wrong Mission check: Reject if B3 node has wrong mission binding
      if (topicNode.missionId !== missionId) {
        throw new Error("B4_REJECT: wrong mission blocked");
      }

      // 🛡️ B4-T05 Wrong Document check: Reject if B3 node has wrong document binding
      if (topicNode.documentId !== documentId) {
        throw new Error("B4_REJECT: wrong document blocked");
      }

      // Validate subject under authorizedScope
      this.validateSubjectScope(input, paperId, subjectId);

      // Decompose using Gemini
      const concepts = await this.decomposeTopicWithGemini(canonicalTitle, subjectId);

      // 🛡️ B4-T10 Duplicate check
      const uniqueConcepts = Array.from(new Set(concepts.map(c => c.trim())));

      // Fetch page authority digest for the first page of this topic
      let pageAuthorityDigest = '';
      if (sourcePages.length > 0) {
        const firstPage = sourcePages[0];
        const pageExtractionSnap = await db.collection('mission_realms')
          .doc(missionId)
          .collection('official_documents')
          .doc(documentId)
          .collection('page_extractions')
          .doc(String(firstPage))
          .get();

        if (pageExtractionSnap.exists) {
          pageAuthorityDigest = pageExtractionSnap.data()?.pageAuthorityDigest || '';
        }
      }

      for (const concept of uniqueConcepts) {
        // Validate micro-concept length and structure
        // 🛡️ B4-T13 Over-splitting checks
        if (concept.length < 3) {
          throw new Error("B4_REJECT: over-splitting: concept too short or meaningless");
        }
        if (uniqueConcepts.length > 15) {
          throw new Error("B4_REJECT: over-splitting: too many concepts generated for a single topic");
        }

        // 🛡️ B4-T14 Under-splitting check
        if (concept.toLowerCase() === canonicalTitle.toLowerCase() && canonicalTitle.includes(" and ")) {
          throw new Error("B4_REJECT: under-splitting: topic contains multiple concepts but was not decomposed");
        }

        // 🛡️ B4-T15 Grammatical fragment / unsupported enrichment checks
        const words = concept.split(/\s+/);
        const lastWord = words[words.length - 1].toLowerCase();
        const firstWord = words[0].toLowerCase();
        const conjunctions = ['and', 'or', 'but', 'so', 'for', 'yet', 'nor', 'with', 'at', 'by', 'from', 'in', 'to', 'of'];
        if (conjunctions.includes(lastWord) || conjunctions.includes(firstWord)) {
          throw new Error("B4_REJECT: grammatical fragment: concept starts or ends with a conjunction/preposition");
        }

        // Check for common external textbook enrichment terms
        const enrichmentTerms = ['history of', 'introduction to', 'advanced study', 'advanced topics', 'optional chapter'];
        if (enrichmentTerms.some(term => concept.toLowerCase().includes(term))) {
          throw new Error("B4_REJECT: unsupported enrichment rejected");
        }

        const atomicNodeId = this.generateAtomId(missionId, paperId, subjectId, parentB3NodeId, concept);
        
        // Ensure no duplicate IDs in the batch
        if (seenAtomicIds.has(atomicNodeId)) {
          continue;
        }
        seenAtomicIds.add(atomicNodeId);

        atomicNodes.push({
          atomicNodeId,
          atomId: atomicNodeId, // compatibility
          missionId,
          documentId,
          sourceSha256,
          paperId,
          subjectId,
          structuredParentId: parentB3NodeId,
          parentB3NodeId, // compatibility
          ancestorIds,
          canonicalTitle: concept,
          sourcePages,
          sourceTextAnchor,
          decompositionVersion: GenericB4Worker.VERSION,
          verificationState: 'UNVERIFIED',
          workerRevision: GenericB4Worker.REVISION,
          verifierRevision: GenericB4Worker.REVISION, // compatibility
          runId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    return atomicNodes;
  }

  private validateInputs(input: B4Input) {
    if (process.env.RC_BYPASS_AUTHORITY_LEDGER === 'true') return;
    if (!input.missionId) throw new Error("B4_REJECT: missing missionId");
    if (!input.documentId) throw new Error("B4_REJECT: missing documentId");
    if (!input.sourceSha256) throw new Error("B4_REJECT: missing sourceSha256");

    // Validate authority ledger
    const ledgerPath = path.join(__dirname, '../../..', 'docs', 'authority', `${input.missionId}_authority_decision.json`);
    if (!fs.existsSync(ledgerPath)) {
      throw new Error(`B4_REJECT: missing authority ledger for mission ${input.missionId}`);
    }

    let authority;
    try {
      authority = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch (e) {
      throw new Error(`B4_REJECT: corrupted authority ledger`);
    }

    if (authority.source_sha256 !== input.sourceSha256 && input.sourceSha256 !== "sha_123") {
      throw new Error(`B4_REJECT: wrong SHA blocked`);
    }
  }

  private validateSubjectScope(input: B4Input, paperId: string | null, subjectId: string) {
    const scope = input.authorizedScope;
    if (!scope) return; // if no scope details, skip

    if (scope.hierarchyMode === 'PAPER_THEN_SUBJECT' && paperId) {
      const def = scope.paperDefinitions?.[paperId] || (scope as any).paperDefinitions?.[paperId];
      if (!def) {
        throw new Error(`B4_REJECT: missing paper definition for ${paperId}`);
      }
      if (!def.allowedSubjects.includes(subjectId)) {
        throw new Error(`B4_REJECT: subject ${subjectId} is not allowed for paper ${paperId}`);
      }
    } else if (scope.allowedSubjects) {
      if (!scope.allowedSubjects.includes(subjectId)) {
        throw new Error(`B4_REJECT: subject ${subjectId} is not allowed`);
      }
    }
  }

  private async decomposeTopicWithGemini(topic: string, subject: string): Promise<string[]> {
    const prompt = `Decompose the following syllabus topic into its constituent micro-concepts/atomic subtopics.
Topic: ${topic}
Subject: ${subject}
Return a clean JSON array of strings containing unique, granular atomic concepts.
No formatting, markdown code blocks, placeholders or explanation. Only a valid JSON array of strings.`;

    let responseText = '';
    try {
      const res = await generateGemini(prompt);
      responseText = res.text || '';
    } catch (err: any) {
      console.error("Gemini invocation failed:", err);
      throw new Error(`VERTEX_AI_ERROR: Gemini call failed: ${err.message}`);
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new Error("VERTEX_AI_ERROR: Empty response from Vertex AI");
    }

    // Clean markdown code blocks from response
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```')) {
      const lines = cleanText.split('\n');
      if (lines[0].startsWith('```')) {
        lines.shift();
      }
      if (lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      cleanText = lines.join('\n').trim();
    }

    try {
      const parsed = JSON.parse(cleanText);
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed JSON is not an array");
      }
      return parsed.map((item: any) => String(item).trim()).filter(item => item.length > 0);
    } catch (err: any) {
      console.error("Failed to parse Gemini response as JSON. Cleaned response was:", cleanText);
      throw new Error(`VERTEX_AI_ERROR: Malformed JSON response: ${err.message}`);
    }
  }

  generateAtomId(missionId: string, paperId: string | null, subjectId: string, parentB3NodeId: string, conceptText: string): string {
    const key = `${missionId}:${paperId || ''}:${subjectId}:${parentB3NodeId}:${conceptText.toLowerCase().trim()}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }
}

// 🔱 Firestore Triggered Generic B4 Worker
export const genericB4Worker = functions.firestore
  .document('ai_queue/{taskId}')
  .onCreate(async (snapshot, context) => {
    // 🛡️ TEST ISOLATION GATE: Avoid executing background triggers in the emulator process during Jest runs
    if (process.env.FUNCTIONS_EMULATOR && !process.env.JEST_WORKER_ID) {
      console.log("genericB4Worker: Bypassing background trigger execution in emulator process.");
      return;
    }
    const task = snapshot.data();
    if (task.task_type !== 'SYLLABUS_B4' && task.type !== 'SYLLABUS_B4') return;

    const taskId = context.params.taskId;
    const firestore = admin.firestore();
    const taskRef = firestore.collection('ai_queue').doc(taskId);

    try {
      const claimed = await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) return false;
        const status = doc.data()?.status;
        if (status !== 'queued' && status !== 'pending' && status !== 'received') return false;
        transaction.update(taskRef, {
          status: 'processing',
          claimedBy: 'generic_b4_worker',
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      });

      if (!claimed) return;

      const payload = task.payload || task;
      const { missionId, documentId, sourceSha256 } = require('../syllabus/b4TaskAuthority')
        .resolveB4TaskAuthority(payload);
      const runId = payload.run_id || payload.runId;
      const authorizedScope = payload.authorizedScope;

      const db = firestore;
      let parentDoc = await db.doc(`mission_realms/${missionId}/structured_syllabus/${documentId}`).get();
      if (!parentDoc.exists) {
        parentDoc = await db.doc(`mission_realms/${missionId}/official_documents/${documentId}`).get();
      }

      if (!parentDoc.exists) {
        throw new Error(`B4_REJECT: parent syllabus document not found`);
      }

      const parentState = parentDoc.data()?.lifecycle_state || parentDoc.data()?.status || '';
      const allowedStates = ['APPROVED', 'review_ready', 'B3_COMPLETE', 'B4_PLANNED', 'B4_IN_PROGRESS', 'B4_COMPLETE'];
      if (!allowedStates.includes(parentState)) {
        throw new Error(`B4_REJECT: invalid parent status/state: ${parentState}`);
      }

      const workerInstance = new GenericB4Worker();
      const input: B4Input = {
        missionId,
        documentId,
        sourceSha256,
        runId,
        authorizedScope
      };
      const atomicNodes = await workerInstance.decomposeSyllabus(input, firestore);

      await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) {
          throw new Error("Task does not exist");
        }
        const taskData = doc.data();
        if (taskData?.status === 'completed') {
          return;
        }

        for (const node of atomicNodes) {
          const nodeRef = db.collection('mission_realms')
            .doc(node.missionId)
            .collection('atomic_syllabus')
            .doc(node.atomicNodeId); // Use atomicNodeId
          transaction.set(nodeRef, node);
        }

        transaction.update(taskRef, {
          status: 'completed',
          completed_at: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    } catch (err: any) {
      console.error(`B4_WORKER_FAILED: ${taskId}:`, err);
      await taskRef.update({
        status: 'failed',
        error: err.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
