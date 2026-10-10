import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import firebaseFunctionsTest from 'firebase-functions-test';
import { GenericB3Worker, B3Input, genericB3Worker } from '../workers/genericB3Worker';

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
    await new Promise(r => setTimeout(r, 500));
  } catch (err: any) {
    console.error('Failed to clear database via REST:', err.message);
  }
}

const fft = firebaseFunctionsTest({ projectId: 'rankcrackers-55' });
const wrappedB3 = fft.wrap(genericB3Worker);
jest.setTimeout(60000);

function setupAuthorityLedger(missionId: string, ledgerData: any) {
  const ledgerDir = path.join(__dirname, '../../..', 'docs', 'authority');
  if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });
  const lp = path.join(ledgerDir, `${missionId}_authority_decision.json`);
  fs.writeFileSync(lp, JSON.stringify(ledgerData));
  return lp;
}

describe('🔱 B3 HARDENING SUITE (B3X-T01 to B3X-T12)', () => {
  let worker: GenericB3Worker;
  let ledgerPaths: string[] = [];
  let testCounter = 0;

  function getUniqueIds() {
    testCounter++;
    const ts = Date.now();
    return {
      mId: `b3h_mission_${ts}_${testCounter}`,
      rId: `b3h_run_${ts}_${testCounter}`
    };
  }

  const baseLedger = {
    source_sha256: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
    decision: "OPTION_A",
    studentPublicationAuthorized: false,
    papers: {
      PAPER_1: { allowedSubjects: ["Mathematics", "Physics", "Chemistry"], allowedPageRanges: [{ start: 1, end: 11 }] },
      PAPER_2A: { allowedSubjects: ["Mathematics", "Aptitude", "Drawing"], allowedPageRanges: [{ start: 12, end: 14 }] },
      PAPER_2B: { allowedSubjects: ["Mathematics", "Aptitude", "Planning"], allowedPageRanges: [{ start: 15, end: 17 }] }
    }
  };

  function getBaseInput(missionId: string, runId: string): B3Input {
    return {
      missionId,
      documentId: "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      sourceSha256: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      verifiedPageCorpus: [
        {
          pageNumber: 1,
          text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
          isVerified: true,
          pageDigest: "digest1"
        }
      ],
      authorizedScope: {
        papersEnabled: true,
        allowedPaperIds: ["PAPER_1", "PAPER_2A", "PAPER_2B"],
        paperDefinitions: {
          PAPER_1: {
            allowedSubjects: ["Mathematics", "Physics", "Chemistry"],
            allowedPageRanges: [{ start: 1, end: 11 }]
          },
          PAPER_2A: {
            allowedSubjects: ["Mathematics", "Aptitude", "Drawing"],
            allowedPageRanges: [{ start: 12, end: 14 }]
          },
          PAPER_2B: {
            allowedSubjects: ["Mathematics", "Aptitude", "Planning"],
            allowedPageRanges: [{ start: 15, end: 17 }]
          }
        }
      },
      documentType: "syllabus",
      runId
    };
  }

  beforeEach(async () => {
    await clearDb();
  });

  beforeAll(() => {
    process.env.RC_BYPASS_AUTHORITY_LEDGER = 'false';
    worker = new GenericB3Worker();
  });

  afterEach(() => {
    ledgerPaths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
    ledgerPaths = [];
  });

  afterAll(() => {
    process.env.RC_BYPASS_AUTHORITY_LEDGER = 'true';
  });

  test('B3X-T01 wrong paper-subject blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "Paper 1\nSUBJECT: Drawing\nUNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest1"
      }
    ];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('B3X-T02 out-of-range page blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 12,
        text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest12"
      }
    ];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('B3X-T03 cross-paper span blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest1"
      },
      {
        pageNumber: 12,
        text: "UNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest12"
      }
    ];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('B3X-T04 shared Mathematics paper-isolated', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest1"
      },
      {
        pageNumber: 12,
        text: "Paper 2A\nSUBJECT: Mathematics\nUNIT: Calculus\nTOPIC: Limits",
        isVerified: true,
        pageDigest: "digest12"
      }
    ];
    const res = await worker.materializeSyllabusStructure(input);
    const mathNodes = res.filter(n => n.nodeType === 'subject' && n.subjectId === 'Mathematics');
    expect(mathNodes.length).toBe(2);
    expect(mathNodes[0].paperId).toBe("PAPER_1");
    expect(mathNodes[1].paperId).toBe("PAPER_2A");
    expect(mathNodes[0].nodeId).not.toBe(mathNodes[1].nodeId);
  });

  test('B3X-T05 validation failure = zero writes', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const taskId = "task_b3x_t05_" + Date.now();
    const taskRef = db.collection('ai_queue').doc(taskId);
    const input = getBaseInput(mId, rId);
    input.documentType = "invalid_type" as any;
    const taskData = {
      type: 'SYLLABUS_B3',
      status: 'queued',
      payload: input
    };
    await taskRef.set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrappedB3(snap, { params: { taskId } });

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');

    const nodesSnap = await db.collection('mission_realms').doc(mId).collection('structured_nodes').get();
    expect(nodesSnap.docs.length).toBe(0);
  });

  test('B3X-T06 orphan blocks graph', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "UNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest1"
      }
    ];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('B3X-T07 source-less candidate blocks graph', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const res = await worker.materializeSyllabusStructure(input);
    res[0].sourcePages = [];
    expect(() => (worker as any).validateGraph(res, input)).toThrow("B3_REJECT");
  });

  test('B3X-T08 duplicates deterministic', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest1"
      }
    ];
    const res = await worker.materializeSyllabusStructure(input);
    const topics = res.filter(n => n.nodeType === 'topic');
    expect(topics.length).toBe(1);
  });

  test('B3X-T09 multi-page ancestry preserved', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations",
        isVerified: true,
        pageDigest: "digest1"
      },
      {
        pageNumber: 2,
        text: "TOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest2"
      }
    ];
    const res = await worker.materializeSyllabusStructure(input);
    const topic = res.find(n => n.nodeType === 'topic');
    expect(topic?.sourcePages).toEqual([2]);
    expect(topic?.ancestorIds.length).toBe(2);
  });

  test('B3X-T10 authority mutation before commit blocks', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const res = await worker.materializeSyllabusStructure(input);
    res[0].subjectId = "History";
    expect(() => (worker as any).validateGraph(res, input)).toThrow("B3_REJECT");
  });

  test('B3X-T11 unresolved source segment blocks', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.verifiedPageCorpus = [
      {
        pageNumber: 1,
        text: "Paper 1\nSome random noise line before subject\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
        isVerified: true,
        pageDigest: "digest1"
      }
    ];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('B3X-T12 transaction failure cannot partially commit', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const originalRunTransaction = admin.firestore().runTransaction.bind(admin.firestore());
    admin.firestore().runTransaction = jest.fn().mockRejectedValue(new Error("Transient transaction failure"));

    const taskId = "task_b3x_t12_" + Date.now();
    const taskRef = db.collection('ai_queue').doc(taskId);
    await taskRef.set({ type: 'SYLLABUS_B3', status: 'queued', payload: input });

    const snap = fft.firestore.makeDocumentSnapshot({ type: 'SYLLABUS_B3', status: 'queued', payload: input }, `ai_queue/${taskId}`);
    await wrappedB3(snap, { params: { taskId } });

    const updatedTask = await taskRef.get();
    expect(updatedTask.data()?.status).toBe('failed');
    admin.firestore().runTransaction = originalRunTransaction;
  });
});
