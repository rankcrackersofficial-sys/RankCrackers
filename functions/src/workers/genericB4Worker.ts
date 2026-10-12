import * as crypto from 'crypto';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateGemini } from '../providers/geminiProvider';
import { resolveB4TaskAuthority } from '../syllabus/b4TaskAuthority';

export interface B4Input {
  missionId: string;
  documentId: string;
  sourceVersionId: string;
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

  async decomposeSyllabus(input: B4Input, firestoreOverride?: admin.firestore.Firestore): Promise<any[]> {
    this.validateInputs(input);
    const db = firestoreOverride || admin.firestore();
    const boundarySnap = await db.collection('mission_realms').doc(input.missionId)
      .collection('academic_boundary_profiles').doc('current').get();
    if (!boundarySnap.exists) throw new Error('DSD_BOUNDARY_PROFILE_MISSING');

    const topicSnap = await db.collection('mission_realms').doc(input.missionId)
      .collection('official_syllabus_candidates')
      .where('documentId', '==', input.documentId)
      .where('sourceVersionId', '==', input.sourceVersionId)
      .where('sourceSha256', '==', input.sourceSha256)
      .where('nodeType', '==', 'topic')
      .where('provenance', '==', 'OFFICIAL')
      .where('verificationState', '==', 'VERIFIED')
      .get();
    if (topicSnap.empty) throw new Error('DSD_NO_VERIFIED_OFFICIAL_TOPICS');

    const officialTopics = topicSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        nodeId: doc.id,
        level: String(data.nodeType || '').toUpperCase(),
        title: data.canonicalTitle,
      };
    });
    const proposals = [];
    for (const topic of officialTopics) {
      const proposal = await this.decomposeTopicWithGemini(topic, boundarySnap.data() || {});
      proposals.push(proposal);
    }
    const result = (require('../../services/mission_syllabus_workers') as any).composeMissionSyllabus({
      binding: {
        missionId: input.missionId,
        documentId: input.documentId,
        sourceVersionId: input.sourceVersionId,
        sourceSha256: input.sourceSha256,
        runId: input.runId,
      },
      boundaryProfile: boundarySnap.data(),
      officialNodes: officialTopics,
      proposals,
    });
    return result.nodes;
  }

  private validateInputs(input: B4Input) {
    if (!input.missionId) throw new Error('B4_REJECT: missing missionId');
    if (!input.documentId) throw new Error('B4_REJECT: missing documentId');
    if (!/^[a-f0-9]{64}$/.test(input.sourceSha256)) throw new Error('B4_REJECT: invalid sourceSha256');
    if (!input.sourceVersionId) throw new Error('B4_REJECT: missing sourceVersionId');
    if (!input.runId) throw new Error('B4_REJECT: missing runId');
  }

  private async decomposeTopicWithGemini(topic: any, profile: any): Promise<any> {
    const prompt = [
      'Propose a mission-bounded syllabus decomposition as JSON.',
      'Return exactly one object with officialTopicId and microTopics.',
      'Each microTopic must have title, scopeRationale, sourcePages, atomicTopics.',
      'Each atomicTopic must have title, scopeRationale, sourcePages.',
      'If the official topic is already atomic at the specified mission depth, return microTopics: [] and atomicStop: true.',
      'Never add scope beyond the official topic. Do not return explanations, teaching steps, definitions, examples, mnemonics, or question content as syllabus nodes.',
      'AI output is an unverified proposal and will be independently validated and reviewed.',
      JSON.stringify({
        officialTopicId: topic.nodeId,
        officialTopic: topic.canonicalTitle,
        officialAncestor: topic.nearestOfficialAncestorId || topic.nodeId,
        sourcePages: topic.sourcePages || [],
        missionEnvironment: {
          academicLevel: profile.academicLevel,
          scopePolicy: profile.scopePolicy,
          depthPolicy: profile.depthPolicy,
          referenceStandards: profile.referenceStandards,
          officialSyllabusVersion: profile.officialSyllabusVersion,
          profileVersion: profile.profileVersion,
        },
      }),
    ].join('\\n');

    let responseText = '';
    try {
      const response = await generateGemini(prompt);
      responseText = response.text || '';
    } catch (error: any) {
      throw new Error(`DSD_MODEL_ERROR:${error?.message || 'PROVIDER_FAILED'}`);
    }
    let clean = responseText.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    let parsed: any;
    try { parsed = JSON.parse(clean); } catch { throw new Error('DSD_MODEL_JSON_INVALID'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
        || parsed.officialTopicId !== topic.nodeId || !Array.isArray(parsed.microTopics)) {
      throw new Error('DSD_MODEL_PROPOSAL_SHAPE_INVALID');
    }
    return parsed;
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

      const payload = task.payload ? { ...task, ...task.payload } : task;
      const { missionId, documentId, sourceVersionId, sourceSha256 } = resolveB4TaskAuthority(payload);
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
        sourceVersionId: sourceVersionId || '',
        sourceSha256,
        runId,
        authorizedScope
      };
      const derivedNodes = await workerInstance.decomposeSyllabus(input, firestore);
      if (derivedNodes.length > 450) throw new Error('DSD_REVIEW_CANDIDATE_BATCH_TOO_LARGE');

      await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) {
          throw new Error("Task does not exist");
        }
        const taskData = doc.data();
        if (taskData?.status === 'completed') {
          return;
        }

        for (const node of derivedNodes) {
          const nodeRef = db.collection('mission_realms')
            .doc(node.missionId)
            .collection('derived_syllabus_candidates')
            .doc(node.nodeId);
          transaction.set(nodeRef, node, { merge: false });
        }

        transaction.update(taskRef, {
          status: 'review_required',
          reviewState: 'PENDING_FACULTY_REVIEW',
          outputCount: derivedNodes.length,
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
