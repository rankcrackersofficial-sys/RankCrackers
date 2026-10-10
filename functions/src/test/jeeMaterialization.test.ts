import * as admin from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';
import * as fs from 'fs';
import * as path from 'path';
import { genericB3Worker } from '../workers/genericB3Worker';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}
const db = admin.firestore();
const fft = firebaseFunctionsTest({ projectId: 'rankcrackers-55' });
const wrappedB3 = fft.wrap(genericB3Worker);

async function clearDb() {
  try {
    const axios = require('axios');
    await axios.delete('http://127.0.0.1:8188/emulator/v1/projects/rankcrackers-55/databases/(default)/documents');
    await new Promise(r => setTimeout(r, 1000));
  } catch (err: any) {
    console.error('Failed to clear database via REST:', err.message);
  }
}

function setupAuthorityLedger(missionId: string, ledgerData: any) {
  const ledgerDir = path.join(__dirname, '../../..', 'docs', 'authority');
  if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });
  const lp = path.join(ledgerDir, `${missionId}_authority_decision.json`);
  fs.writeFileSync(lp, JSON.stringify(ledgerData));
  return lp;
}

let testCounter = 0;
function getUniqueIds() {
  testCounter++;
  const ts = Date.now();
  return {
    mId: `jee_mission_${ts}_${testCounter}`,
    rId: `jee_run_${ts}_${testCounter}`
  };
}

const baseLedger = {
  source_sha256: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
  decision: "OPTION_A",
  studentPublicationAuthorized: false,
  reasoning: "Verified JEE Syllabus",
  papers: {
    PAPER_1: {
      allowedSubjects: ["Mathematics", "Physics", "Chemistry", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
      allowedPageRanges: [{ start: 1, end: 11 }]
    },
    PAPER_2A: {
      allowedSubjects: ["Mathematics", "Aptitude", "Drawing", "MATHEMATICS", "APTITUDE", "DRAWING"],
      allowedPageRanges: [{ start: 12, end: 14 }]
    },
    PAPER_2B: {
      allowedSubjects: ["Mathematics", "Aptitude", "Planning", "MATHEMATICS", "APTITUDE", "PLANNING"],
      allowedPageRanges: [{ start: 15, end: 17 }]
    }
  }
};

describe('🔱 FULL JEE MAIN 2026/2027 SYLLABUS MATERIALIZATION', () => {
  jest.setTimeout(60000);

  let verifiedPageCorpus: Array<{
    pageNumber: number;
    text: string;
    isVerified: boolean;
    pageDigest: string;
  }> = [];

  beforeAll(async () => {
    await clearDb();

    const txtPath = path.join(__dirname, '../../..', 'docs', 'patch_safety', 'jee_syllabus_text.txt');
    const content = fs.readFileSync(txtPath, 'utf8');

    // Split content by page boundaries
    const pages = content.split(/--- PAGE \d+ ---/i);
    let pageNum = 1;
    for (let i = 1; i < pages.length; i++) {
      const pageText = pages[i].trim();
      if (pageText) {
        verifiedPageCorpus.push({
          pageNumber: pageNum,
          text: pageText,
          isVerified: true,
          pageDigest: `digest_page_${pageNum}`
        });
      }
      pageNum++;
    }
    console.log(`Loaded ${verifiedPageCorpus.length} pages from syllabus text.`);
  });

  // PHASE 13 — JEE B3 CANARY
  test('PHASE 13: B3 Canary Run (Pages 1 & 12)', async () => {
    const { mId, rId } = getUniqueIds();
    setupAuthorityLedger(mId, baseLedger);

    const canaryPages = verifiedPageCorpus.filter(p => p.pageNumber === 1 || p.pageNumber === 12);
    const canaryInput = {
      missionId: mId,
      documentId: "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      sourceSha256: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      verifiedPageCorpus: canaryPages,
      authorizedScope: {
        papersEnabled: true,
        allowedPaperIds: ["PAPER_1", "PAPER_2A", "PAPER_2B"],
        subjectAliases: {
          "Aptitude Test": "Aptitude",
          "APTITUDE TEST": "Aptitude"
        },
        paperDefinitions: {
          PAPER_1: {
            allowedSubjects: ["Mathematics", "Physics", "Chemistry", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
            allowedPageRanges: [{ start: 1, end: 11 }]
          },
          PAPER_2A: {
            allowedSubjects: ["Mathematics", "Aptitude", "Drawing", "MATHEMATICS", "APTITUDE", "DRAWING"],
            allowedPageRanges: [{ start: 12, end: 14 }]
          },
          PAPER_2B: {
            allowedSubjects: ["Mathematics", "Aptitude", "Planning", "MATHEMATICS", "APTITUDE", "PLANNING"],
            allowedPageRanges: [{ start: 15, end: 17 }]
          }
        }
      },
      documentType: "syllabus",
      runId: rId
    };

    const taskId = `task_canary_${rId}`;
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B3',
      status: 'queued',
      payload: canaryInput
    };
    await taskRef.set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrappedB3(snap, { params: { taskId } });

    const updatedTask = await taskRef.get();
    if (updatedTask.data()?.status === 'failed') console.log('FAILED_TASK_ERROR:', updatedTask.data()?.error);
    expect(updatedTask.data()?.status).toBe('completed');

    // Verify written nodes
    const nodesSnap = await db.collection('mission_realms').doc(mId).collection('structured_nodes').get();
    const canaryNodes = nodesSnap.docs.filter(d => d.data().runId === rId);
    expect(canaryNodes.length).toBeGreaterThan(0);
    
    for (const d of canaryNodes) {
      const node = d.data();
      expect(node.studentPublicationAuthorized).toBeUndefined();
      expect(node.sourceSha256).toBe(canaryInput.sourceSha256);
    }
  });

  // PHASE 14 — FULL JEE B3 MATERIALIZATION & PHASE 15 B3 COVERAGE GATE
  test('PHASE 14 & 15: Full 17-Page materialization and coverage verification', async () => {
    const { mId, rId } = getUniqueIds();
    setupAuthorityLedger(mId, baseLedger);

    const fullInput = {
      missionId: mId,
      documentId: "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      sourceSha256: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      verifiedPageCorpus: verifiedPageCorpus,
      authorizedScope: {
        papersEnabled: true,
        allowedPaperIds: ["PAPER_1", "PAPER_2A", "PAPER_2B"],
        subjectAliases: {
          "Aptitude Test": "Aptitude",
          "APTITUDE TEST": "Aptitude"
        },
        paperDefinitions: {
          PAPER_1: {
            allowedSubjects: ["Mathematics", "Physics", "Chemistry", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
            allowedPageRanges: [{ start: 1, end: 11 }]
          },
          PAPER_2A: {
            allowedSubjects: ["Mathematics", "Aptitude", "Drawing", "MATHEMATICS", "APTITUDE", "DRAWING"],
            allowedPageRanges: [{ start: 12, end: 14 }]
          },
          PAPER_2B: {
            allowedSubjects: ["Mathematics", "Aptitude", "Planning", "MATHEMATICS", "APTITUDE", "PLANNING"],
            allowedPageRanges: [{ start: 15, end: 17 }]
          }
        }
      },
      documentType: "syllabus",
      runId: rId
    };

    const taskId = `task_full_${rId}`;
    const taskRef = db.collection('ai_queue').doc(taskId);
    const taskData = {
      type: 'SYLLABUS_B3',
      status: 'queued',
      payload: fullInput
    };
    await taskRef.set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrappedB3(snap, { params: { taskId } });

    const updatedTask = await taskRef.get();
    if (updatedTask.data()?.status === 'failed') console.log('FAILED_TASK_ERROR:', updatedTask.data()?.error);
    expect(updatedTask.data()?.status).toBe('completed');

    // Verify written nodes
    const nodesSnap = await db.collection('mission_realms').doc(mId).collection('structured_nodes').get();
    const fullNodes = nodesSnap.docs.filter(d => d.data().runId === rId).map(d => d.data());
    
    expect(fullNodes.length).toBeGreaterThan(0);
    console.log(`Successfully materialized ${fullNodes.length} structured nodes for full JEE Main syllabus!`);

    // Verify counts of node types
    const subjects = fullNodes.filter(n => n.nodeType === 'subject');
    const units = fullNodes.filter(n => n.nodeType === 'unit');
    const topics = fullNodes.filter(n => n.nodeType === 'topic');

    console.log(`Materialized Subjects: ${subjects.length}`);
    console.log(`Materialized Units: ${units.length}`);
    console.log(`Materialized Topics: ${topics.length}`);

    // Verify no publication
    for (const node of fullNodes) {
      expect(node.studentPublicationAuthorized).toBeUndefined();
      expect(node.published).toBeUndefined();
    }
  });
});
