import * as admin from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';
import { GenericB4Worker, B4Input, genericB4Worker } from '../workers/genericB4Worker';
import { syllabusLifecycleWorker } from '../workers/syllabusLifecycleWorker';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../providers/geminiProvider', () => {
  return {
    generateGemini: jest.fn().mockImplementation(async () => {
      return {
        text: JSON.stringify([
          "Atom Subtopic A",
          "Atom Subtopic B"
        ]),
        model: 'gemini-2.5-flash'
      };
    })
  };
});

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}
const db = admin.firestore();

async function clearDb() {
  try {
    const axios = require('axios');
    await axios.delete('http://127.0.0.1:8188/emulator/v1/projects/rankcrackers-55/databases/(default)/documents');
    await new Promise(resolve => setTimeout(resolve, 500)); // Cool down
  } catch (err: any) {
    console.error('Failed to clear database via REST:', err.message);
  }
}

const fft = firebaseFunctionsTest({ projectId: 'rankcrackers-55' });
const wrappedB4 = fft.wrap(genericB4Worker);
const wrappedLifecycle = fft.wrap(syllabusLifecycleWorker);
jest.setTimeout(60000);

describe('🔱 B4 ATOMIC SYLLABUS HARDENING SUITE (B4-T01 to B4-T28)', () => {
  let worker: GenericB4Worker;
  let baseInput: B4Input;
  const sourceSha256 = "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905";
  const documentId = "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905";
  const createdAuthorityFiles: string[] = [];

  beforeAll(() => {
    process.env.RC_BYPASS_AUTHORITY_LEDGER = 'false';
    worker = new GenericB4Worker();
    baseInput = {
      missionId: "jee_main_2026",
      documentId,
      sourceSha256,
      runId: "run_b4x_123",
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "PAPER_THEN_SUBJECT",
        allowedPapers: ["PAPER_1", "PAPER_2A", "PAPER_2B"],
        allowedSubjects: ["Mathematics", "Physics", "Chemistry", "Aptitude", "Drawing", "Planning"],
        paperDefinitions: {
          PAPER_1: {
            allowedSubjects: ["Mathematics", "Physics", "Chemistry"]
          },
          PAPER_2A: {
            allowedSubjects: ["Mathematics", "Aptitude", "Drawing"]
          },
          PAPER_2B: {
            allowedSubjects: ["Mathematics", "Aptitude", "Planning"]
          }
        }
      }
    };
  });

  beforeEach(async () => {
    await clearDb();
    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockReset();
    (generateGemini as jest.Mock).mockImplementation(async () => {
      return {
        text: JSON.stringify(["Atom Subtopic A", "Atom Subtopic B"]),
        model: 'gemini-2.5-flash'
      };
    });
  });

  afterEach(() => {
    while (createdAuthorityFiles.length) {
      const f = createdAuthorityFiles.pop();
      if (f && fs.existsSync(f)) try { fs.unlinkSync(f); } catch(e) {}
    }
  });

  afterAll(() => {
    process.env.RC_BYPASS_AUTHORITY_LEDGER = 'true';
    const ledgerDir = path.join(__dirname, '../../..', 'docs', 'authority');
    if (fs.existsSync(ledgerDir)) {
      const files = fs.readdirSync(ledgerDir);
      files.forEach((f: string) => {
        if (f.startsWith('test_mission_') || f.includes('temp_')) {
          try { fs.unlinkSync(path.join(ledgerDir, f)); } catch (e) {}
        }
      });
    }
  });

  // 🛡️ REPAIRED HELPER
  async function setupMockSyllabusState(opts: {
      lifecycleState?: string,
      verificationState?: string,
      missionId?: string,
      documentId?: string,
      sourceSha?: string,
      paperId?: string,
      subjectId?: string,
      paperDefinitions?: any
  } = {}) {
    const mId = opts.missionId || `test_mission_${Math.random().toString(36).substring(7)}`;
    const dId = opts.documentId || documentId;
    const sha = opts.sourceSha || sourceSha256;
    const nId = "topic_123";

    // Write parent official document
    await db.doc(`mission_realms/${mId}/official_documents/${dId}`).set({
      id: dId,
      missionId: mId,
      lifecycle_state: opts.lifecycleState || 'B3_COMPLETE',
      sourceSha256: sha
    });

    // Write a B3 structured node of type topic
    await db.doc(`mission_realms/${mId}/structured_nodes/${nId}`).set({
      nodeId: nId,
      missionId: mId,
      documentId: dId,
      sourceSha256: sha,
      paperId: opts.hasOwnProperty('paperId') ? opts.paperId : "PAPER_1",
      subjectId: opts.subjectId || "Physics",
      nodeType: "topic",
      canonicalTitle: "Motion in a straight line",
      parentId: "unit_456",
      ancestorIds: ["subject_789", "unit_456"],
      sourcePages: [2],
      sourceTextAnchor: "TOPIC: Motion in a straight line",
      verificationState: opts.verificationState || 'verified'
    });

    // Write a page extraction doc to hold the digest
    await db.doc(`mission_realms/${mId}/official_documents/${dId}/page_extractions/2`).set({
      page_number: 2,
      pageAuthorityDigest: "digest_page_2"
    });

    // Write ledger on disk
    const ledgerDir = path.join(__dirname, '../../..', 'docs', 'authority');
    if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });

    const mockLedger = {
      source_sha256: sha,
      decision: "OPTION_A",
      studentPublicationAuthorized: false,
      papers: opts.paperDefinitions || {
          PAPER_1: { allowedSubjects: ["Mathematics", "Physics", "Chemistry"], allowedPageRanges: [{start: 1, end: 11}] },
          PAPER_2A: { allowedSubjects: ["Mathematics", "Aptitude", "Drawing"], allowedPageRanges: [{start: 12, end: 14}] },
          PAPER_2B: { allowedSubjects: ["Mathematics", "Aptitude", "Planning"], allowedPageRanges: [{start: 15, end: 17}] }
      }
    };
    const lp = path.join(ledgerDir, `${mId}_authority_decision.json`);
    fs.writeFileSync(lp, JSON.stringify(mockLedger));
    createdAuthorityFiles.push(lp);

    return { missionId: mId, documentId: dId, nodeId: nId, sourceSha: sha };
  }

  // Helper for wrapped calls
  async function runWrappedB4(taskId: string, taskData: any) {
    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    const oldId = process.env.JEST_WORKER_ID;
    delete process.env.JEST_WORKER_ID;
    try {
        await (wrappedB4 as any)(snap, { params: { taskId } });
    } finally {
        process.env.JEST_WORKER_ID = oldId;
    }
  }

  // B4-T01 verified structured input accepted
  test('B4-T01 verified structured input accepted', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t01";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId, documentId: fixture.documentId, sourceSha256: fixture.sourceSha }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('completed');

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(false);
  });

  // B4-T02 unverified structured input blocked
  test('B4-T02 unverified structured input blocked', async () => {
    const fixture = await setupMockSyllabusState({ verificationState: 'draft' });

    const taskId = "task_b4_t02";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("B4_REJECT: unverified parent B3 node");
  });

  // B4-T03 wrong SHA blocked
  test('B4-T03 wrong SHA blocked', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t03";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId, sourceSha256: "mismatched_sha_xyz" }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("B4_REJECT: wrong SHA blocked");
  });

  // B4-T04 wrong mission blocked
  test('B4-T04 wrong mission blocked', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t04";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: 'different_mission_id' }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
  });

  // B4-T05 wrong document blocked
  test('B4-T05 wrong document blocked', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t05";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId, documentId: 'different_document_id' }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
  });

  // B4-T06 paper ancestry preserved
  test('B4-T06 paper ancestry preserved', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t06";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(false);
    atomicSnap.forEach(doc => {
      expect(doc.data().paperId).toBe("PAPER_1");
    });
  });

  // B4-T07 subject ancestry preserved
  test('B4-T07 subject ancestry preserved', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t07";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(false);
    atomicSnap.forEach(doc => {
      expect(doc.data().subjectId).toBe("Physics");
      expect(doc.data().ancestorIds).toEqual(["subject_789", "unit_456"]);
    });
  });

  // B4-T08 deterministic IDs
  test('B4-T08 deterministic IDs', () => {
    const id1 = worker.generateAtomId("jee", "PAPER_1", "Physics", "topic_123", "Concept Title");
    const id2 = worker.generateAtomId("jee", "PAPER_1", "Physics", "topic_123", "Concept Title");
    const id3 = worker.generateAtomId("jee", "PAPER_2A", "Physics", "topic_123", "Concept Title");

    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
  });

  // B4-T09 rerun idempotent
  test('B4-T09 rerun idempotent', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t09";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    // First run
    await runWrappedB4(taskId, taskData);
    const snap1 = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    const count1 = snap1.size;

    // Reset status and rerun
    await taskRef.update({ status: 'queued' });
    await runWrappedB4(taskId, { ...taskData, status: 'queued' });
    const snap2 = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    const count2 = snap2.size;

    expect(count1).toBe(count2);
  });

  // B4-T10 duplicate prevention
  test('B4-T10 duplicate prevention', async () => {
    const fixture = await setupMockSyllabusState();

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockResolvedValueOnce({
      text: JSON.stringify(["Concept A", "Concept A", "Concept B"]),
      model: 'gemini-2.5-flash'
    });

    const taskId = "task_b4_t10";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.size).toBe(2); // Duplicates should be filtered
  });

  // B4-T11 orphan impossible
  test('B4-T11 orphan impossible', async () => {
    const fixture = await setupMockSyllabusState();

    // Invalidate the nodeId in the document
    await db.doc(`mission_realms/${fixture.missionId}/structured_nodes/${fixture.nodeId}`).update({
      nodeId: "" // empty
    });

    const taskId = "task_b4_t11";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("B4_REJECT: structuredParentId is empty");
  });

  // B4-T12 source-less atom impossible
  test('B4-T12 source-less atom impossible', async () => {
    const fixture = await setupMockSyllabusState();

    // Write B3 topic with empty sourcePages
    await db.doc(`mission_realms/${fixture.missionId}/structured_nodes/${fixture.nodeId}`).update({
      sourcePages: [], // empty pages
    });

    const taskId = "task_b4_t12";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("B4_REJECT: sourceless parent node");
  });

  // B4-T13 over-splitting negative case
  test('B4-T13 over-splitting negative case', async () => {
    const fixture = await setupMockSyllabusState();

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockResolvedValueOnce({
      text: JSON.stringify(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15", "C16"]), // > 15
      model: 'gemini-2.5-flash'
    });

    const taskId = "task_b4_t13";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("over-splitting");
  });

  // B4-T14 under-splitting negative case
  test('B4-T14 under-splitting negative case', async () => {
    const fixture = await setupMockSyllabusState();

    // Update parent topic canonicalTitle to have " and "
    await db.doc(`mission_realms/${fixture.missionId}/structured_nodes/${fixture.nodeId}`).update({
      canonicalTitle: "Speed and Velocity",
    });

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockResolvedValueOnce({
      text: JSON.stringify(["Speed and Velocity"]),
      model: 'gemini-2.5-flash'
    });

    const taskId = "task_b4_t14";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("under-splitting");
  });

  // B4-T15 unsupported enrichment rejected
  test('B4-T15 unsupported enrichment rejected', async () => {
    const fixture = await setupMockSyllabusState();

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockResolvedValueOnce({
      text: JSON.stringify(["Introduction to motion", "Motion in optionally chapter"]),
      model: 'gemini-2.5-flash'
    });

    const taskId = "task_b4_t15";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("unsupported enrichment");
  });

  // B4-T16 malformed Vertex response blocked
  test('B4-T16 malformed Vertex response blocked', async () => {
    const fixture = await setupMockSyllabusState();

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockResolvedValueOnce({
      text: "['concept1', 'concept2'", // malformed
      model: 'gemini-2.5-flash'
    });

    const taskId = "task_b4_t16";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("VERTEX_AI_ERROR");

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(true);
  });

  // B4-T17 empty Vertex response blocked
  test('B4-T17 empty Vertex response blocked', async () => {
    const fixture = await setupMockSyllabusState();

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockResolvedValueOnce({
      text: "",
      model: 'gemini-2.5-flash'
    });

    const taskId = "task_b4_t17";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    expect(updatedTask.data()?.error).toContain("VERTEX_AI_ERROR");
  });

  // B4-T18 provider error zero writes
  test('B4-T18 provider error zero writes', async () => {
    const fixture = await setupMockSyllabusState();

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock).mockRejectedValueOnce(new Error("API Overloaded / Timeout"));

    const taskId = "task_b4_t18";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(true);
  });

  // B4-T19 JEE Paper 1 fixture
  test('B4-T19 JEE Paper 1 fixture', async () => {
    const fixture = await setupMockSyllabusState();

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "PAPER_THEN_SUBJECT" as const,
        allowedPapers: ["PAPER_1"],
        allowedSubjects: ["Mathematics", "Physics", "Chemistry"],
        paperDefinitions: {
          PAPER_1: {
            allowedSubjects: ["Mathematics", "Physics", "Chemistry"]
          }
        }
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
  });

  // B4-T20 JEE Paper 2A fixture
  test('B4-T20 JEE Paper 2A fixture', async () => {
    const fixture = await setupMockSyllabusState({ paperId: 'PAPER_2A', subjectId: 'Aptitude' });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "PAPER_THEN_SUBJECT" as const,
        allowedPapers: ["PAPER_2A"],
        allowedSubjects: ["Mathematics", "Aptitude", "Drawing"],
        paperDefinitions: {
          PAPER_2A: {
            allowedSubjects: ["Mathematics", "Aptitude", "Drawing"]
          }
        }
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
    expect(res[0].paperId).toBe("PAPER_2A");
    expect(res[0].subjectId).toBe("Aptitude");
  });

  // B4-T21 JEE Paper 2B fixture
  test('B4-T21 JEE Paper 2B fixture', async () => {
    const fixture = await setupMockSyllabusState({ paperId: 'PAPER_2B', subjectId: 'Planning' });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "PAPER_THEN_SUBJECT" as const,
        allowedPapers: ["PAPER_2B"],
        allowedSubjects: ["Mathematics", "Aptitude", "Planning"],
        paperDefinitions: {
          PAPER_2B: {
            allowedSubjects: ["Mathematics", "Aptitude", "Planning"]
          }
        }
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
    expect(res[0].paperId).toBe("PAPER_2B");
  });

  // B4-T22 NEET fixture including Biology
  test('B4-T22 NEET fixture including Biology', async () => {
    const fixture = await setupMockSyllabusState({
      paperId: null as any,
      subjectId: "Biology"
    });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "SUBJECT_FIRST" as const,
        allowedSubjects: ["Physics", "Chemistry", "Biology"]
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
    expect(res[0].subjectId).toBe("Biology");
  });

  // B4-T23 RPSC fixture with non-JEE subjects
  test('B4-T23 RPSC fixture with non-JEE subjects', async () => {
    const fixture = await setupMockSyllabusState({
      paperId: null as any,
      subjectId: "History"
    });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "SUBJECT_FIRST" as const,
        allowedSubjects: ["History", "Geography", "Hindi", "English"]
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
    expect(res[0].subjectId).toBe("History");
  });

  // B4-T24 unknown future mission fixture
  test('B4-T24 unknown future mission fixture', async () => {
    const fixture = await setupMockSyllabusState({
      paperId: null as any,
      subjectId: "Quantum Physics"
    });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "SUBJECT_FIRST" as const,
        allowedSubjects: ["Quantum Physics"]
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
    expect(res[0].subjectId).toBe("Quantum Physics");
  });

  // B4-T25 no mission hardcoding
  test('B4-T25 no mission hardcoding', async () => {
    const fixture = await setupMockSyllabusState({
      paperId: null as any,
      subjectId: "Botany"
    });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "SUBJECT_FIRST" as const,
        allowedSubjects: ["Botany"]
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(2);
    expect(res[0].subjectId).toBe("Botany");
  });

  // B4-T26 partial candidate set causes zero writes
  test('B4-T26 partial candidate set causes zero writes', async () => {
    const fixture = await setupMockSyllabusState();

    // Add another B3 topic node
    await db.doc(`mission_realms/${fixture.missionId}/structured_nodes/topic_456`).set({
      nodeId: "topic_456",
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      paperId: "PAPER_1",
      subjectId: "Physics",
      nodeType: "topic",
      canonicalTitle: "Laws of motion",
      parentId: "unit_456",
      ancestorIds: ["subject_789", "unit_456"],
      sourcePages: [3],
      sourceTextAnchor: "TOPIC: Laws of motion",
      verificationState: 'verified'
    });

    const { generateGemini } = require('../providers/geminiProvider');
    (generateGemini as jest.Mock)
      .mockResolvedValueOnce({ text: JSON.stringify(["Concept A"]), model: 'gemini-2.5-flash' })
      .mockResolvedValueOnce({ text: JSON.stringify(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15", "C16"]), model: 'gemini-2.5-flash' });

    const taskId = "task_b4_t26";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(true);
  });

  // B4-T27 full provenance required
  test('B4-T27 full provenance required', async () => {
    const fixture = await setupMockSyllabusState();

    const taskId = "task_b4_t27";
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B4',
      status: 'queued',
      payload: { ...baseInput, missionId: fixture.missionId }
    };
    await taskRef.set(taskData);

    await runWrappedB4(taskId, taskData);

    const atomicSnap = await db.collection('mission_realms').doc(fixture.missionId).collection('atomic_syllabus').get();
    expect(atomicSnap.empty).toBe(false);
    atomicSnap.forEach(doc => {
      const data = doc.data();
      expect(data.atomicNodeId).toBeDefined();
      expect(data.missionId).toBe(fixture.missionId);
      expect(data.documentId).toBe(fixture.documentId);
      expect(data.sourceSha256).toBe(fixture.sourceSha);
      expect(data.paperId).toBe("PAPER_1");
      expect(data.subjectId).toBe("Physics");
      expect(data.structuredParentId).toBe("topic_123");
      expect(data.ancestorIds).toEqual(["subject_789", "unit_456"]);
      expect(data.canonicalTitle).toBeDefined();
      expect(data.sourcePages).toEqual([2]);
      expect(data.sourceTextAnchor).toBe("TOPIC: Motion in a straight line");
      expect(data.decompositionVersion).toBe("1.0.0");
      expect(data.verificationState).toBe("UNVERIFIED");
      expect(data.workerRevision).toBe("RC-AUTO-B4-ATOMIC-V1");
      expect(data.runId).toBe("run_b4x_123");
    });
  });

  // B4-T28 cross-paper leakage = 0
  test('B4-T28 cross-paper leakage = 0', async () => {
    const fixture = await setupMockSyllabusState();

    // Add another B3 topic node with different paperId and subjectId
    await db.doc(`mission_realms/${fixture.missionId}/structured_nodes/topic_999`).set({
      nodeId: "topic_999",
      missionId: fixture.missionId,
      documentId: fixture.documentId,
      sourceSha256: fixture.sourceSha,
      paperId: "PAPER_2A",
      subjectId: "Aptitude",
      nodeType: "topic",
      canonicalTitle: "3D visualization topic",
      parentId: "unit_456",
      ancestorIds: ["subject_789", "unit_456"],
      sourcePages: [12],
      sourceTextAnchor: "TOPIC: 3D visualization topic",
      verificationState: 'verified'
    });

    const input = {
      ...baseInput,
      missionId: fixture.missionId,
      authorizedScope: {
        status: "RESOLVED",
        hierarchyMode: "PAPER_THEN_SUBJECT" as const,
        allowedPapers: ["PAPER_1", "PAPER_2A"],
        allowedSubjects: ["Physics", "Aptitude"],
        paperDefinitions: {
          PAPER_1: { allowedSubjects: ["Physics"] },
          PAPER_2A: { allowedSubjects: ["Aptitude"] }
        }
      }
    };

    const res = await worker.decomposeSyllabus(input);
    expect(res.length).toBe(4);
    
    const paper1Nodes = res.filter(n => n.paperId === "PAPER_1");
    const paper2Nodes = res.filter(n => n.paperId === "PAPER_2A");
    
    expect(paper1Nodes.length).toBe(2);
    expect(paper2Nodes.length).toBe(2);
    
    paper1Nodes.forEach(n => expect(n.subjectId).toBe("Physics"));
    paper2Nodes.forEach(n => expect(n.subjectId).toBe("Aptitude"));
  });
});

describe('🔱 B3_TO_B4_AUTOMATION LIFECYCLE TRANSITIONS', () => {
  beforeEach(async () => {
    await clearDb();
  });

  async function runWrappedLifecycle(taskId: string, change: any) {
    const oldId = process.env.JEST_WORKER_ID;
    delete process.env.JEST_WORKER_ID;
    try {
        await wrappedLifecycle(change, { params: { taskId } });
    } finally {
        process.env.JEST_WORKER_ID = oldId;
    }
  }

  test('B3 incomplete -> no B4', async () => {
    const mId = "lifecycle_mission_1";
    const docId = "doc_1";
    const taskId = "task_b3_incomplete";
    const taskData = {
      task_type: 'SYLLABUS_B3',
      status: 'processing',
      mission_id: mId,
      document_id: docId
    };
    await db.collection('ai_queue').doc(taskId).set(taskData);
    await db.doc(`mission_realms/${mId}/official_documents/${docId}`).set({
      lifecycle_state: 'B3_IN_PROGRESS',
      sourceSha256: "sha_1"
    });

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    const change = fft.makeChange(fft.firestore.makeDocumentSnapshot({ ...taskData, status: 'queued' }, `ai_queue/${taskId}`), snap);

    await runWrappedLifecycle(taskId, change);

    const b4TaskSnap = await db.collection('ai_queue').doc(`atomic_${mId}_sha_1`).get();
    expect(b4TaskSnap.exists).toBe(false);
  });

  test('B3 complete but authority missing -> HOLD', async () => {
    const mId = "lifecycle_mission_2";
    const docId = "doc_2";
    const taskId = "task_b3_auth_missing";
    const taskData = {
      task_type: 'SYLLABUS_B3',
      status: 'completed',
      mission_id: mId,
      document_id: docId
    };
    await db.collection('ai_queue').doc(taskId).set(taskData);
    await db.doc(`mission_realms/${mId}/official_documents/${docId}`).set({
      lifecycle_state: 'B3_IN_PROGRESS',
      sourceSha256: "sha_2"
    });

    await db.doc(`mission_realms/${mId}/variables/scope_authority`).delete();

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    const change = fft.makeChange(fft.firestore.makeDocumentSnapshot({ ...taskData, status: 'queued' }, `ai_queue/${taskId}`), snap);

    await runWrappedLifecycle(taskId, change);

    const docSnap = await db.doc(`mission_realms/${mId}/official_documents/${docId}`).get();
    expect(docSnap.data()?.lifecycle_state).toBe('SCOPE_AUTHORITY_PENDING');

    const b4TaskSnap = await db.collection('ai_queue').doc(`atomic_${mId}_sha_2`).get();
    expect(b4TaskSnap.exists).toBe(false);
  });

  test('B3 complete + authority valid -> one deterministic B4 task', async () => {
    const mId = "lifecycle_mission_3";
    const docId = "doc_3";
    const taskId = "task_b3_valid";
    const taskData = {
      task_type: 'SYLLABUS_B3',
      status: 'completed',
      mission_id: mId,
      document_id: docId,
      runId: 'run_lifecycle_test'
    };
    await db.collection('ai_queue').doc(taskId).set(taskData);
    await db.doc(`mission_realms/${mId}/official_documents/${docId}`).set({
      lifecycle_state: 'B3_IN_PROGRESS',
      sourceSha256: "sha_3"
    });

    await db.doc(`mission_realms/${mId}/variables/scope_authority`).set({
      status: "RESOLVED",
      allowedPapers: ["PAPER_1"]
    });

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    const change = fft.makeChange(fft.firestore.makeDocumentSnapshot({ ...taskData, status: 'queued' }, `ai_queue/${taskId}`), snap);

    await runWrappedLifecycle(taskId, change);

    const docSnap = await db.doc(`mission_realms/${mId}/official_documents/${docId}`).get();
    expect(docSnap.data()?.lifecycle_state).toBe('B4_PLANNED');

    const b4TaskId = `atomic_${mId}_sha_3`;
    const b4TaskSnap = await db.collection('ai_queue').doc(b4TaskId).get();
    expect(b4TaskSnap.exists).toBe(true);
  });

  test('duplicate B3 completion -> no duplicate B4 task', async () => {
    const mId = "lifecycle_mission_4";
    const docId = "doc_4";
    const taskId = "task_b3_dup";
    const taskData = {
      task_type: 'SYLLABUS_B3',
      status: 'completed',
      mission_id: mId,
      document_id: docId
    };
    await db.collection('ai_queue').doc(taskId).set(taskData);
    await db.doc(`mission_realms/${mId}/official_documents/${docId}`).set({
      lifecycle_state: 'B3_IN_PROGRESS',
      sourceSha256: "sha_4"
    });

    await db.doc(`mission_realms/${mId}/variables/scope_authority`).set({
      status: "RESOLVED",
      allowedPapers: ["PAPER_1"]
    });

    const b4TaskId = `atomic_${mId}_sha_4`;
    await db.collection('ai_queue').doc(b4TaskId).set({
      id: b4TaskId,
      task_type: 'SYLLABUS_B4',
      status: 'completed',
      preExistingFlag: true
    });

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    const change = fft.makeChange(fft.firestore.makeDocumentSnapshot({ ...taskData, status: 'queued' }, `ai_queue/${taskId}`), snap);

    await runWrappedLifecycle(taskId, change);

    const b4TaskSnap = await db.collection('ai_queue').doc(b4TaskId).get();
    expect(b4TaskSnap.data()?.preExistingFlag).toBe(true);
  });
});
