import { GenericB3Worker, B3Input } from '../workers/genericB3Worker';

describe('🔱 GENERIC B3 SYLLABUS STRUCTURE SUITE (B3H-T01 to B3H-T24)', () => {
  let worker: GenericB3Worker;
  let baseInput: B3Input;

  beforeAll(() => {
    process.env.RC_BYPASS_AUTHORITY_LEDGER = 'true'; // Most B3 unit tests don't need ledger
    worker = new GenericB3Worker();
    baseInput = {
      missionId: "jee_main_2026",
      documentId: "hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      sourceSha256: "7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905",
      sourceVersionId: "jee-main-2026-v1",
      verifiedPageCorpus: [
        {
          pageNumber: 1,
          text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation\nTOPIC: Equivalence relations",
          isVerified: true,
          pageDigest: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        },
        {
          pageNumber: 12,
          text: "Paper 2A\nSUBJECT: Mathematics\nUNIT: Calculus\nTOPIC: Limits and Continuity",
          isVerified: true,
          pageDigest: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
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
      runId: "run_b3_test_123"
    };
  });

  // B3H-T01
  test('B3H-T01: verified pages accepted', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    expect(res.length).toBeGreaterThan(0);
  });

  // B3H-T02
  test('B3H-T02: unverified pages rejected', async () => {
    const badInput = {
      ...baseInput,
      verifiedPageCorpus: [
        { pageNumber: 1, text: "Some text", isVerified: false, pageDigest: "digest" }
      ]
    };
    await expect(worker.materializeSyllabusStructure(badInput)).rejects.toThrow("B3_REJECT");
  });

  // B3H-T03
  test('B3H-T03: wrong SHA rejected', async () => {
    const badInput = { ...baseInput, sourceSha256: "" };
    await expect(worker.materializeSyllabusStructure(badInput)).rejects.toThrow("B3_REJECT");
  });

  // B3H-T04
  test('B3H-T04: wrong mission rejected', async () => {
    const badInput = { ...baseInput, missionId: "" };
    await expect(worker.materializeSyllabusStructure(badInput)).rejects.toThrow("B3_REJECT");
  });

  // B3H-T05
  test('B3H-T05: Paper optional contract', async () => {
    const optionalInput = {
      ...baseInput,
      authorizedScope: { papersEnabled: false, allowedSubjects: ['Mathematics'] }
    };
    const res = await worker.materializeSyllabusStructure(optionalInput);
    expect(res[0].paperId).toBeNull();
  });

  // B3H-T06
  test('B3H-T06: mission->subject hierarchy works', async () => {
    const optionalInput = {
      ...baseInput,
      authorizedScope: { papersEnabled: false, allowedSubjects: ['Mathematics'] }
    };
    const res = await worker.materializeSyllabusStructure(optionalInput);
    const mathNode = res.find(n => n.nodeType === 'subject' && n.subjectId === 'Mathematics');
    expect(mathNode).toBeDefined();
    expect(mathNode?.parentId).toBeNull();
  });

  // B3H-T07
  test('B3H-T07: mission->paper->subject hierarchy works', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    const p1Math = res.find(n => n.nodeType === 'subject' && n.paperId === 'PAPER_1');
    expect(p1Math).toBeDefined();
    expect(p1Math?.paperId).toBe("PAPER_1");
  });

  // B3H-T08
  test('B3H-T08: Paper 1 isolation', async () => {
    const p1OnlyInput = {
      ...baseInput,
      authorizedScope: { ...baseInput.authorizedScope, allowedPaperIds: ["PAPER_1"] }
    };
    const res = await worker.materializeSyllabusStructure(p1OnlyInput);
    const hasP2A = res.some(n => n.paperId === 'PAPER_2A');
    expect(hasP2A).toBe(false);
  });

  // B3H-T09
  test('B3H-T09: Paper 2A isolation', async () => {
    const p2AOnlyInput = {
      ...baseInput,
      authorizedScope: { ...baseInput.authorizedScope, allowedPaperIds: ["PAPER_2A"] }
    };
    const res = await worker.materializeSyllabusStructure(p2AOnlyInput);
    const hasP1 = res.some(n => n.paperId === 'PAPER_1');
    expect(hasP1).toBe(false);
  });

  // B3H-T10
  test('B3H-T10: Paper 2B isolation', async () => {
    const p2BOnlyInput = {
      ...baseInput,
      verifiedPageCorpus: [
        { pageNumber: 15, text: "Paper 2B\nSUBJECT: Mathematics\nUNIT: Planning Theory", isVerified: true, pageDigest: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" }
      ],
      authorizedScope: { ...baseInput.authorizedScope, allowedPaperIds: ["PAPER_2B"] }
    };
    const res = await worker.materializeSyllabusStructure(p2BOnlyInput);
    const p2BNode = res.find(n => n.paperId === 'PAPER_2B');
    expect(p2BNode).toBeDefined();
  });

  // B3H-T11
  test('B3H-T11: shared Mathematics stays paper-scoped', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    const mathNodes = res.filter(n => n.nodeType === 'subject' && n.subjectId === 'Mathematics');
    expect(mathNodes.length).toBe(2);
    expect(mathNodes[0].paperId).toBe("PAPER_1");
    expect(mathNodes[1].paperId).toBe("PAPER_2A");
  });

  // B3H-T12
  test('B3H-T12: source order preserved', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    const orders = res.map(n => n.sourceOrder);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sortedOrders);
  });

  // B3H-T13
  test('B3H-T13: page-spanning source preserved', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    expect(res[0].sourcePages).toEqual([1]);
  });

  // B3H-T14
  test('B3H-T14: source-less node rejected', async () => {
    const sourcelessInput = {
      ...baseInput,
      verifiedPageCorpus: [
        { pageNumber: 1, text: "UNIT: Sets and Relations (No Subject Heading)", isVerified: true, pageDigest: "digest" }
      ]
    };
    await expect(worker.materializeSyllabusStructure(sourcelessInput)).rejects.toThrow("B3_REJECT");
  });

  // B3H-T15
  test('B3H-T15: orphan impossible', async () => {
    const orphanInput = {
      ...baseInput,
      verifiedPageCorpus: [
        { pageNumber: 1, text: "TOPIC: Sets representation (No Unit Heading)", isVerified: true, pageDigest: "digest" }
      ]
    };
    await expect(worker.materializeSyllabusStructure(orphanInput)).rejects.toThrow("B3_REJECT");
  });

  // B3H-T16
  test('B3H-T16: duplicate prevention', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    const ids = res.map(n => n.nodeId);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  // B3H-T17
  test('B3H-T17: deterministic rerun', async () => {
    const res1 = await worker.materializeSyllabusStructure(baseInput);
    const res2 = await worker.materializeSyllabusStructure(baseInput);
    expect(res1).toEqual(res2);
  });

  // B3H-T18
  test('B3H-T18: no B4 atomic nodes created', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    const hasAtoms = res.some(n => n.nodeType as string === 'atom' || n.nodeType as string === 'atomic');
    expect(hasAtoms).toBe(false);
  });

  // B3H-T19
  test('B3H-T19: no student publication', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    for (const node of res) {
      expect((node as any).isStudentVisible).toBeUndefined();
      expect((node as any).published).toBeUndefined();
    }
  });

  // B3H-T20
  test('B3H-T20: NEET fixture compatibility', async () => {
    const neetInput = {
      ...baseInput,
      missionId: "neet_(ug)-2027",
      authorizedScope: { papersEnabled: false, allowedSubjects: ['Mathematics'] }
    };
    const res = await worker.materializeSyllabusStructure(neetInput);
    expect(res.length).toBeGreaterThan(0);
  });

  // B3H-T21
  test('B3H-T21: RPSC fixture compatibility', async () => {
    const rpscInput = {
      ...baseInput,
      missionId: "rpsc_2027",
      authorizedScope: { papersEnabled: false, allowedSubjects: ['Mathematics'] }
    };
    const res = await worker.materializeSyllabusStructure(rpscInput);
    expect(res.length).toBeGreaterThan(0);
  });

  // B3H-T22
  test('B3H-T22: no JEE-specific code path', async () => {
    const isGeneric = !GenericB3Worker.prototype.materializeSyllabusStructure.toString().includes("jee_main");
    expect(isGeneric).toBe(true);
  });

  // B3H-T23
  test('B3H-T23: provenance complete', async () => {
    const res = await worker.materializeSyllabusStructure(baseInput);
    for (const node of res) {
      expect(node.nodeId).toBeDefined();
      expect(node.missionId).toBe(baseInput.missionId);
      expect(node.documentId).toBe(baseInput.documentId);
      expect(node.sourceSha256).toBe(baseInput.sourceSha256);
      expect(node.runId).toBe(baseInput.runId);
      expect(node.workerRevision).toBe(GenericB3Worker.REVISION);
    }
  });

  // B3H-T24
  test('B3H-T24: malformed response / input fails closed', async () => {
    const badInput = { ...baseInput, documentType: "invalid_type" };
    await expect(worker.materializeSyllabusStructure(badInput)).rejects.toThrow("B3_REJECT");
  });

  test('mission-independent scope cannot invent JEE subjects from an empty authority', async () => {
    const bad = { ...baseInput, authorizedScope: { papersEnabled: false } };
    await expect(worker.materializeSyllabusStructure(bad)).rejects.toThrow('authorized subjects required');
  });

  test('arbitrary declared subject is eligible without exam-name privileges', async () => {
    const input = {
      ...baseInput,
      missionId: 'new_unknown_exam',
      verifiedPageCorpus: [{ pageNumber: 1, text: 'SUBJECT: Philosophy\nUNIT: Ethics\nTOPIC: Duty', isVerified: true, pageDigest: 'digest' }],
      authorizedScope: { papersEnabled: false, allowedSubjects: ['Philosophy'] },
    };
    const parsed = await worker.materializeSyllabusStructure(input);
    expect(parsed.some(n => n.subjectId === 'Philosophy')).toBe(true);
    expect(parsed.every(n => n.missionId === 'new_unknown_exam')).toBe(true);
  });

  // B3H-T25: Regression tests for paper scope schema normalization & Unit 14 fix
  describe('B3 Repair Regression Tests', () => {
    test('B3-R1: scope using papers key enables papers and normalizes to paperDefinitions', async () => {
      const input = {
        ...baseInput,
        verifiedPageCorpus: [baseInput.verifiedPageCorpus[0]],
        authorizedScope: {
          papers: {
            PAPER_1: {
              allowedSubjects: ["Mathematics"],
              allowedPageRanges: [{ start: 1, end: 1 }]
            }
          }
        } as any
      };
      const res = await worker.materializeSyllabusStructure(input);
      expect(res[0].paperId).toBe("PAPER_1");
    });

    test('B3-R2: identical unit/topic text across different papers does NOT merge', async () => {
      const input = {
        ...baseInput,
        verifiedPageCorpus: [
          {
            pageNumber: 1,
            text: "Paper 1\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
            isVerified: true,
            pageDigest: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          },
          {
            pageNumber: 12,
            text: "Paper 2A\nSUBJECT: Mathematics\nUNIT: Sets and Relations\nTOPIC: Sets representation",
            isVerified: true,
            pageDigest: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
          }
        ]
      };
      const res = await worker.materializeSyllabusStructure(input);
      const mathUnits = res.filter(n => n.nodeType === 'unit' && n.canonicalTitle === 'UNIT: Sets and Relations');
      const mathTopics = res.filter(n => n.nodeType === 'topic' && n.canonicalTitle === 'Sets representation');
      
      expect(mathUnits.length).toBe(2);
      expect(mathTopics.length).toBe(2);
      expect(mathUnits.some(n => n.paperId === 'PAPER_1')).toBe(true);
      expect(mathUnits.some(n => n.paperId === 'PAPER_2A')).toBe(true);
      expect(mathTopics.some(n => n.paperId === 'PAPER_1')).toBe(true);
      expect(mathTopics.some(n => n.paperId === 'PAPER_2A')).toBe(true);
    });

    test('B3-R3: Chemistry Unit 14 survives shouldSkipLine and its topics attach correctly', async () => {
      const input = {
        ...baseInput,
        verifiedPageCorpus: [
          {
            pageNumber: 1,
            text: "Paper 1\nSUBJECT: Chemistry\nUNIT 13: PURIFICATION\nTOPIC: Crystallization\nUNIT 14: SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY\nTOPIC: Tetravalency of carbon\nTOPIC: Homologous series",
            isVerified: true,
            pageDigest: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          }
        ],
        authorizedScope: {
          papersEnabled: true,
          allowedPaperIds: ["PAPER_1"],
          paperDefinitions: {
            PAPER_1: {
              allowedSubjects: ["Chemistry"],
              allowedPageRanges: [{ start: 1, end: 1 }]
            }
          }
        }
      };
      const res = await worker.materializeSyllabusStructure(input);
      const unit14 = res.find(n => n.nodeType === 'unit' && n.canonicalTitle.includes("UNIT 14"));
      expect(unit14).toBeDefined();
      
      const topics = res.filter(n => n.nodeType === 'topic' && n.parentId === unit14?.nodeId);
      expect(topics.length).toBe(2);
      expect(topics.some(t => t.canonicalTitle === "Tetravalency of carbon")).toBe(true);
      expect(topics.some(t => t.canonicalTitle === "Homologous series")).toBe(true);
    });

    test('B3-R4: no paper-null JEE topic when papers are enabled', async () => {
      const res = await worker.materializeSyllabusStructure(baseInput);
      const paperNullTopic = res.find(n => n.nodeType === 'topic' && n.paperId === null);
      expect(paperNullTopic).toBeUndefined();
    });
  });

  test('B3 preserves a missing Unit level and never invents Micro/Atomic official nodes', async () => {
    const input: B3Input = {
      ...baseInput,
      missionId: 'generic_mission',
      authorizedScope: { papersEnabled: false, allowedSubjects: ['History'] },
      verifiedPageCorpus: [{
        pageNumber: 1,
        text: 'SUBJECT: History\\nTOPIC: Ancient trade routes',
        isVerified: true,
        pageDigest: 'page-digest-1',
      }],
    };

    const result = await worker.materializeSyllabusStructure(input);
    const subject = result.find((node) => node.nodeType === 'subject');
    const topic = result.find((node) => node.nodeType === 'topic');

    expect(result.some((node) => node.nodeType === 'unit')).toBe(false);
    expect(topic?.parentId).toBe(subject?.nodeId);
    expect(topic?.ancestorIds).toEqual([subject?.nodeId]);
    expect(result.every((node) => node.provenance === 'OFFICIAL_CANDIDATE')).toBe(true);
    expect(result.every((node) => node.verificationState === 'PENDING_REVIEW')).toBe(true);
    expect(result.some((node) => (node.nodeType as string).includes('atomic'))).toBe(false);
  });
});
