import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { GenericB3Worker, B3Input } from '../workers/genericB3Worker';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

async function clearDb() {
  try {
    const axios = require('axios');
    await axios.delete('http://127.0.0.1:8188/emulator/v1/projects/rankcrackers-55/databases/(default)/documents');
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

describe('XP CROSS-PAGE TEST CORPUS (XP-T01 to XP-T10)', () => {
  let worker: GenericB3Worker;
  let ledgerPaths: string[] = [];
  let testCounter = 0;

  function getUniqueIds() {
    testCounter++;
    const ts = Date.now();
    return {
      mId: `xp_mission_${ts}_${testCounter}`,
      rId: `xp_run_${ts}_${testCounter}`
    };
  }

  const baseLedger = {
    source_sha256: "sha_123",
    decision: "OPTION_A",
    studentPublicationAuthorized: false,
    papers: {
      "PAPER_1": {
        allowedSubjects: ["Mathematics", "Physics", "Chemistry"],
        allowedPageRanges: [{ start: 1, end: 11 }]
      },
      "PAPER_2A": {
        allowedSubjects: ["Mathematics", "Aptitude", "Drawing"],
        allowedPageRanges: [{ start: 12, end: 14 }]
      }
    }
  };

  function getBaseInput(missionId: string, runId: string): B3Input {
    return {
      missionId: missionId,
      documentId: "doc_123",
      sourceSha256: "sha_123",
      documentType: "syllabus",
      runId: runId,
      verifiedPageCorpus: [],
      authorizedScope: {
        papersEnabled: true,
        allowedPaperIds: ["PAPER_1", "PAPER_2A"],
        paperDefinitions: {
          "PAPER_1": {
            allowedSubjects: ["Mathematics", "Physics", "Chemistry"],
            allowedPageRanges: [{ start: 1, end: 11 }]
          },
          "PAPER_2A": {
            allowedSubjects: ["Mathematics", "Aptitude", "Drawing"],
            allowedPageRanges: [{ start: 12, end: 14 }]
          }
        }
      }
    };
  }

  beforeAll(() => {
    worker = new GenericB3Worker();
  });

  beforeEach(async () => {
    await clearDb();
  });

  afterAll(() => {
    ledgerPaths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
  });

  // XP-T01
  test('XP-T01: unit heading page N, content page N+1', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics\nUNIT: Kinematics", isVerified: true, pageDigest: "d1" },
        { pageNumber: 2, text: "TOPIC: Motion in 1D", isVerified: true, pageDigest: "d2" }
      ]
    };
    const res = await worker.materializeSyllabusStructure(input);
    const topic = res.find(n => n.nodeType === 'topic');
    expect(topic?.parentId).toBeDefined();
    expect(topic?.sourcePages).toEqual([2]);
  });

  // XP-T02
  test('XP-T02: topic begins page N and continues N+1', async () => {
     const { mId, rId } = getUniqueIds();
     ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
     // Current worker merges by adding page number if ID matches.
     const input = {
       ...getBaseInput(mId, rId),
       verifiedPageCorpus: [
         { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics\nUNIT: Kinematics\nTOPIC: Motion", isVerified: true, pageDigest: "d1" },
         { pageNumber: 2, text: "TOPIC: Motion", isVerified: true, pageDigest: "d2" }
       ]
     };
     const res = await worker.materializeSyllabusStructure(input);
     const topics = res.filter(n => n.nodeType === 'topic');
     expect(topics.length).toBe(1);
     expect(topics[0].sourcePages).toEqual([1, 2]);
  });

  // XP-T03
  test('XP-T03: subject continues across pages', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics\nUNIT: Unit1", isVerified: true, pageDigest: "d1" },
        { pageNumber: 2, text: "SUBJECT: Physics\nUNIT: Unit2", isVerified: true, pageDigest: "d2" }
      ]
    };
    const res = await worker.materializeSyllabusStructure(input);
    const subjects = res.filter(n => n.nodeType === 'subject');
    expect(subjects.length).toBe(1);
    expect(subjects[0].sourcePages).toEqual([1, 2]);
  });

  // XP-T04
  test('XP-T04: new subject resets correct state', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics\nUNIT: Unit1", isVerified: true, pageDigest: "d1" },
        { pageNumber: 2, text: "SUBJECT: Chemistry\nUNIT: UnitChem", isVerified: true, pageDigest: "d2" }
      ]
    };
    const res = await worker.materializeSyllabusStructure(input);
    const unitChem = res.find(n => n.canonicalTitle === "UNIT: UnitChem");
    const chemSubject = res.find(n => n.subjectId === "Chemistry");
    expect(unitChem?.parentId).toBe(chemSubject?.nodeId);
  });

  // XP-T05
  test('XP-T05: new paper resets paper-scoped state', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Unit1", isVerified: true, pageDigest: "d1" },
        { pageNumber: 12, text: "Paper 2A\nSUBJECT: Mathematics\nUNIT: UnitP2", isVerified: true, pageDigest: "d12" }
      ]
    };
    const res = await worker.materializeSyllabusStructure(input);
    const mathNodes = res.filter(n => n.nodeType === 'subject');
    expect(mathNodes.length).toBe(2);
    expect(mathNodes[0].paperId).toBe("PAPER_1");
    expect(mathNodes[1].paperId).toBe("PAPER_2A");
  });

  // XP-T06
  test('XP-T06: continuation without parent fails closed', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nUNIT: Unit1", isVerified: true, pageDigest: "d1" }
      ]
    };
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("orphan unit");
  });

  // XP-T07
  test('XP-T07: page boundary does not create duplicate parent', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics", isVerified: true, pageDigest: "d1" },
        { pageNumber: 2, text: "UNIT: Unit1", isVerified: true, pageDigest: "d2" }
      ]
    };
    const res = await worker.materializeSyllabusStructure(input);
    expect(res.filter(n => n.nodeType === 'subject').length).toBe(1);
  });

  // XP-T08
  test('XP-T08: cross-paper continuation rejected', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    // This is handled by PAPER_X reset and validatePageRange
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics", isVerified: true, pageDigest: "d1" },
        { pageNumber: 12, text: "UNIT: UnitWrong", isVerified: true, pageDigest: "d12" }
      ]
    };
    // Page 12 is Paper 2A range, but if text says nothing, it might try to continue P1
    // But validatePageRange will catch it if it tries to use P1 for page 12.
    // Wait, the logic only validates when a NEW node is created.
    // If it continues, it should also validate.
    await expect(worker.materializeSyllabusStructure(input)).rejects.toThrow("B3_REJECT");
  });

  // XP-T09
  test('XP-T09: correct source pages aggregated', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics\nUNIT: U1", isVerified: true, pageDigest: "d1" },
        { pageNumber: 2, text: "UNIT: U1\nTOPIC: T1", isVerified: true, pageDigest: "d2" }
      ]
    };
    const res = await worker.materializeSyllabusStructure(input);
    const unit = res.find(n => n.nodeType === 'unit');
    expect(unit?.sourcePages).toEqual([1, 2]);
  });

  // XP-T10
  test('XP-T10: rerun deterministic', async () => {
    const { mId, rId } = getUniqueIds();
    ledgerPaths.push(setupAuthorityLedger(mId, baseLedger));
    const input = {
      ...getBaseInput(mId, rId),
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Paper 1\nSUBJECT: Physics\nUNIT: U1", isVerified: true, pageDigest: "d1" }
      ]
    };
    const res1 = await worker.materializeSyllabusStructure(input);
    const res2 = await worker.materializeSyllabusStructure(input);
    expect(res1).toEqual(res2);
  });
});
