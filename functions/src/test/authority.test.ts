import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { GenericB3Worker, B3Input } from '../workers/genericB3Worker';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}
const db = admin.firestore();

async function clearDb() {
  try {
    const axios = require('axios');
    await axios.delete('http://127.0.0.1:8088/emulator/v1/projects/rankcrackers-55/databases/(default)/documents');
    await new Promise(r => setTimeout(r, 500));
  } catch (err: any) {
    console.error('Failed to clear database via REST:', err.message);
  }
}

jest.setTimeout(60000);

function setupAuthorityLedger(missionId: string, ledgerData: any) {
  const ledgerDir = path.join(__dirname, '../../..', 'docs', 'authority');
  if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });
  const lp = path.join(ledgerDir, `${missionId}_authority_decision.json`);
  fs.writeFileSync(lp, JSON.stringify(ledgerData));
  return lp;
}

describe('🔱 FOUNDER AUTHORITY LEDGER SUITE (AUTH-T01 to AUTH-T10)', () => {
  let worker: GenericB3Worker;
  let ledgerPaths: string[] = [];
  let testCounter = 0;

  function getUniqueIds() {
    testCounter++;
    const ts = Date.now();
    return {
      mId: `auth_mission_${ts}_${testCounter}`,
      rId: `auth_run_${ts}_${testCounter}`
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

  test('AUTH-T01: valid authority accepted', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const res = await worker.materializeSyllabusStructure(input);
    expect(res.length).toBeGreaterThan(0);
  });

  test('AUTH-T02: missing authority blocked', async () => {
    const { mId, rId } = getUniqueIds();
    const input = getBaseInput(mId, rId);
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('AUTH-T03: modified authority blocked', async () => {
    const { mId, rId } = getUniqueIds();
    const modifiedLedger = { ...baseLedger, decision: "OPTION_B" };
    ledgerPaths.push(setupAuthorityLedger(mId, modifiedLedger));
    const input = getBaseInput(mId, rId);
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('AUTH-T04: wrong SHA blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.sourceSha256 = "wrong_sha";
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('AUTH-T05: wrong paper blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.authorizedScope.allowedPaperIds = ["PAPER_1", "PAPER_3_WRONG"];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('AUTH-T06: wrong subject blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.authorizedScope.paperDefinitions!.PAPER_1.allowedSubjects.push("Biology_Wrong");
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('AUTH-T07: wrong range blocked', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    input.authorizedScope.paperDefinitions!.PAPER_1.allowedPageRanges = [{ start: 1, end: 15 }];
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  test('AUTH-T08: duplicate creation safe', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const res1 = await worker.materializeSyllabusStructure(input);
    const res2 = await worker.materializeSyllabusStructure(input);
    expect(res1).toEqual(res2);
  });

  test('AUTH-T09: publication remains false', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const res = await worker.materializeSyllabusStructure(input);
    for (const node of res) {
      expect((node as any).isStudentVisible).toBeUndefined();
      expect((node as any).published).toBeUndefined();
    }
  });

  test('AUTH-T10: provenance retained', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = getBaseInput(mId, rId);
    const res = await worker.materializeSyllabusStructure(input);
    for (const node of res) {
      expect(node.missionId).toBe(mId);
      expect(node.documentId).toBe(input.documentId);
      expect(node.sourceSha256).toBe(input.sourceSha256);
      expect(node.runId).toBe(rId);
      expect(node.workerRevision).toBe(GenericB3Worker.REVISION);
    }
  });
});
