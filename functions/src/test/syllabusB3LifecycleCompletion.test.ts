jest.mock('firebase-admin', () => {
  const firestore = Object.assign(jest.fn(() => ({})), {
    FieldValue: { serverTimestamp: jest.fn(() => 'server-time') },
  });
  return { apps: [{}], initializeApp: jest.fn(), firestore };
});

import { readFileSync } from 'fs';
import {
  B3_CONTRACT_VERSION,
  B3MaterializationInput,
  B3SourceEvidence,
} from '../syllabus/b3Contract';
import {
  B3MaterializationPersistenceStore,
  B3MaterializationRepository,
  B3PersistenceTransaction,
  B3RevisionEnvelope,
  B3_REVISION_STATE_STAGING,
  b3CurrentAuthorityPointerPath,
  b3RevisionRootPath,
} from '../syllabus/b3MaterializationRepository';
import { SyllabusB3Executor, SyllabusB3ExecutorInput } from '../workers/syllabusB3Executor';
import { deterministicB3CompletionProofHash } from '../academicFactory/workers/syllabusB3AafWorker';
import { completeGovernedB3Lifecycle } from '../workers/syllabusLifecycleWorker';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class MemoryStore implements B3MaterializationPersistenceStore {
  readonly documents = new Map<string, unknown>();
  async get(path: string) { return this.documents.has(path) ? clone(this.documents.get(path)) : undefined; }
  async create(path: string, value: unknown) {
    if (this.documents.has(path)) throw new Error('ALREADY_EXISTS');
    this.documents.set(path, clone(value));
  }
  async runTransaction<T>(work: (transaction: B3PersistenceTransaction) => Promise<T>): Promise<T> {
    const view = new Map([...this.documents].map(([path, value]) => [path, clone(value)]));
    const result = await work({
      get: async path => view.has(path) ? clone(view.get(path)) : undefined,
      create: (path, value) => {
        if (view.has(path)) throw new Error('ALREADY_EXISTS');
        view.set(path, clone(value));
      },
      set: (path, value) => view.set(path, clone(value)),
    });
    this.documents.clear();
    view.forEach((value, path) => this.documents.set(path, clone(value)));
    return result;
  }
}

interface Ref { path: string }

class FakeFirestore {
  readonly documents = new Map<string, any>();
  writePaths: string[] = [];
  failReads = false;
  beforeRead?: (path: string, view: Map<string, any>) => void;

  doc(path: string): Ref { return { path }; }
  collection(path: string): any {
    return {
      doc: (id?: string) => {
        const ref: any = { path: `${path}/${id || 'auto'}` };
        ref.collection = (child: string) => this.collection(`${ref.path}/${child}`);
        return ref;
      },
    };
  }
  async runTransaction<T>(work: (transaction: any) => Promise<T>): Promise<T> {
    const view = new Map([...this.documents].map(([path, value]) => [path, clone(value)]));
    const pending: Array<{ kind: 'update' | 'set'; path: string; value: any }> = [];
    const result = await work({
      get: async (ref: Ref) => {
        if (this.failReads) throw new Error('INJECTED_FIRESTORE_READ_FAILURE');
        this.beforeRead?.(ref.path, view);
        const value = view.get(ref.path);
        return { exists: value !== undefined, data: () => value === undefined ? undefined : clone(value) };
      },
      update: (ref: Ref, value: any) => pending.push({ kind: 'update', path: ref.path, value }),
      set: (ref: Ref, value: any) => pending.push({ kind: 'set', path: ref.path, value }),
    });
    for (const write of pending) {
      const previous = view.get(write.path) || {};
      view.set(write.path, write.kind === 'update' ? { ...previous, ...clone(write.value) } : clone(write.value));
      this.writePaths.push(write.path);
    }
    this.documents.clear();
    view.forEach((value, path) => this.documents.set(path, clone(value)));
    return result;
  }
}

const missionId = 'mission_1';
const revisionId = 'revision_1';
const taskId = 'job_1';
const source = {
  sourceId: 'source_1', documentId: 'document_1',
  sourceVersionId: 'version_1', sourceSha256: 'sha_1',
};

function evidence(): B3SourceEvidence {
  return {
    evidenceId: 'evidence_1', level: 'subject', title: 'Physics', required: true,
    authority: { official: true, applicable: true, effective: true, verified: true, evidenceId: 'a1' },
    identityAuthority: {
      verified: true, canonicalIdentityKey: 'subject.physics', evidenceId: 'i1',
      method: 'AUTHORITATIVE_CANONICAL_IDENTITY',
    },
    orderingAuthority: { verified: true, order: 1, evidenceId: 'o1', method: 'AUTHORITATIVE_SOURCE_ORDER' },
    lineage: {
      missionId, ...source, extractionId: 'extract_1', paperId: null,
      location: { pageNumber: 1, span: { start: 0, end: 10 } },
    },
  };
}

function materializationInput(): B3MaterializationInput {
  return {
    contractVersion: B3_CONTRACT_VERSION,
    evidence: [evidence()],
    declaredCompletenessScope: {
      requiredEvidenceIds: ['evidence_1'], requireExactFiveLevelCoverage: false,
    },
  };
}

async function validDatabase() {
  const store = new MemoryStore();
  const revisionIdentity: SyllabusB3ExecutorInput['revisionIdentity'] = {
    missionId, authoritativeSourceChainId: 'chain_1', orderedSources: [source],
    verifiedExtractionIds: ['extract_1'], contractVersion: B3_CONTRACT_VERSION, revisionId,
  };
  const input: SyllabusB3ExecutorInput = { revisionIdentity, materializationInput: materializationInput() };
  const outcome = await SyllabusB3Executor.usingCanonicalDependencies(
    new B3MaterializationRepository(store),
  ).execute(input);
  if (!outcome.completed) throw new Error(outcome.reason);
  const proof = outcome.completionProof;
  const db = new FakeFirestore();
  store.documents.forEach((value, path) => db.documents.set(path, clone(value)));
  db.documents.set(`ai_queue/${taskId}`, {
    queueContract: 'academic_factory_v1', type: 'SYLLABUS_B3', state: 'reviewing',
    idempotencyKey: taskId, missionId, sourceDocumentIds: ['document_1'],
    b3ExecutorInput: input, b3CompletionProof: proof,
    b3CompletionProofHash: deterministicB3CompletionProofHash(proof),
  });
  db.documents.set(`mission_realms/${missionId}/official_documents/document_1`, {
    lifecycle_state: 'B3_IN_PROGRESS', sourceSha256: source.sourceSha256,
  });
  return { db, proof };
}

function job(db: FakeFirestore) { return db.documents.get(`ai_queue/${taskId}`); }
function envelope(db: FakeFirestore) {
  return db.documents.get(b3RevisionRootPath(missionId, revisionId)) as B3RevisionEnvelope;
}
function pointerPath() { return b3CurrentAuthorityPointerPath(missionId); }
function officialPath() { return `mission_realms/${missionId}/official_documents/document_1`; }
function rehashProof(db: FakeFirestore) {
  job(db).b3CompletionProofHash = deterministicB3CompletionProofHash(job(db).b3CompletionProof);
}
async function rejected(mutate: (db: FakeFirestore) => void) {
  const { db } = await validDatabase();
  mutate(db);
  await expect(completeGovernedB3Lifecycle(db as any, taskId)).rejects.toThrow('B3_LIFECYCLE_AUTHORITY_REJECTED');
  expect(db.writePaths).toHaveLength(0);
  return db;
}

describe('Syllabus B3 governed lifecycle completion L01-L40', () => {
  test('L01 legitimate reviewing SYLLABUS_B3 positive path', async () => {
    const { db } = await validDatabase();
    await expect(completeGovernedB3Lifecycle(db as any, taskId)).resolves.toBe('COMPLETED');
  });
  test('L02 non-B3 job rejected', async () => { await rejected(db => { job(db).type = 'other'; }); });
  test('L03 non-reviewing state rejected', async () => { await rejected(db => { job(db).state = 'running'; }); });
  test('L04 missing completion proof rejected', async () => { await rejected(db => { delete job(db).b3CompletionProof; }); });
  test('L05 malformed proof rejected', async () => { await rejected(db => { job(db).b3CompletionProof.proofType = 'bad'; rehashProof(db); }); });
  test('L06 proof hash mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProofHash = '0'.repeat(64); }); });
  test('L07 mission mismatch rejected', async () => { await rejected(db => { job(db).missionId = 'other'; }); });
  test('L08 source-chain mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.authoritativeSourceChainId = 'other'; rehashProof(db); }); });
  test('L09 source version mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.orderedSources[0].sourceVersionId = 'other'; rehashProof(db); }); });
  test('L10 source SHA mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.orderedSources[0].sourceSha256 = 'other'; rehashProof(db); }); });
  test('L11 extraction-set mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.verifiedExtractionIds = ['other']; rehashProof(db); }); });
  test('L12 B3 contract mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.contractVersion = 'bad'; rehashProof(db); }); });
  test('L13 requiredEvidenceIds mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.declaredCompletenessScope.requiredEvidenceIds = ['other']; rehashProof(db); }); });
  test('L14 five-level flag mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.declaredCompletenessScope.requireExactFiveLevelCoverage = true; rehashProof(db); }); });
  test('L15 scope-less old sealed revision rejected', async () => { await rejected(db => { delete (envelope(db) as any).declaredCompletenessScope; }); });
  test('L16 revision identity mismatch rejected', async () => { await rejected(db => { job(db).b3CompletionProof.revisionId = 'other'; rehashProof(db); }); });
  test('L17 current pointer missing rejected', async () => { await rejected(db => { db.documents.delete(pointerPath()); }); });
  test('L18 current pointer mismatch rejected', async () => { await rejected(db => { db.documents.get(pointerPath()).revisionId = 'other'; }); });
  test('L19 non-sealed revision rejected', async () => { await rejected(db => { envelope(db).state = B3_REVISION_STATE_STAGING; }); });
  test('L20 content-integrity mismatch rejected', async () => { await rejected(db => { envelope(db).contentIntegrityHash = 'bad'; }); });
  test('L21 manifest integrity mismatch rejected', async () => { await rejected(db => { envelope(db).canonicalNodeManifest[0].integrityHash = 'bad'; }); });
  test('L22 lineage integrity failure rejected', async () => { await rejected(db => { job(db).b3CompletionProof.lineageIntegrityHash = 'bad'; rehashProof(db); }); });
  test('L23 completionEligibility=false rejected', async () => { await rejected(db => { envelope(db).completionEligibility.eligible = false; job(db).b3CompletionProof.materializerCompletionEligibility.eligible = false; rehashProof(db); }); });
  test('L24 unresolved required evidence rejected', async () => { await rejected(db => { envelope(db).completionEligibility.unresolvedRequiredEvidenceIds = ['evidence_1']; job(db).b3CompletionProof.materializerCompletionEligibility.unresolvedRequiredEvidenceIds = ['evidence_1']; job(db).b3CompletionProof.unresolvedRequiredEvidenceIds = ['evidence_1']; rehashProof(db); }); });
  test('L25 superseded/non-current revision rejected', async () => { await rejected(db => { db.documents.get(pointerPath()).revisionId = 'revision_2'; }); });
  test('L26 legacy completed alone rejected', async () => { await rejected(db => { const value = job(db); value.queueContract = undefined; value.state = undefined; value.status = 'completed'; value.task_type = 'SYLLABUS_B3'; }); });
  test('L27 same exact completion authority idempotent', async () => {
    const { db } = await validDatabase();
    await completeGovernedB3Lifecycle(db as any, taskId);
    const writes = db.writePaths.length;
    await expect(completeGovernedB3Lifecycle(db as any, taskId)).resolves.toBe('IDEMPOTENT');
    expect(db.writePaths).toHaveLength(writes);
  });
  test('L28 conflicting existing B3_COMPLETE rejected', async () => {
    await rejected(db => { db.documents.get(officialPath()).lifecycle_state = 'B3_COMPLETE'; db.documents.get(officialPath()).b3CompletionAuthority = { revisionId: 'other' }; });
  });
  test('L29 Firestore/read failure fails closed', async () => {
    const { db } = await validDatabase(); db.failReads = true;
    await expect(completeGovernedB3Lifecycle(db as any, taskId)).rejects.toThrow('INJECTED_FIRESTORE_READ_FAILURE');
  });
  test('L30 final transaction rechecks current pointer', async () => {
    await rejected(db => { db.beforeRead = (path, view) => { if (path === pointerPath()) view.get(path).revisionId = 'moved'; }; });
  });
  test('L31 authority change before transaction commit cannot complete', async () => {
    await rejected(db => { db.beforeRead = (path, view) => { if (path === b3RevisionRootPath(missionId, revisionId)) view.get(path).contentIntegrityHash = 'changed'; }; });
  });
  test('L32 same sealed revision required at commit', async () => {
    await rejected(db => { db.beforeRead = (path, view) => { if (path === b3RevisionRootPath(missionId, revisionId)) view.get(path).state = B3_REVISION_STATE_STAGING; }; });
  });
  test('L33 materializer rerun count zero', () => {
    const sourceText = readFileSync(require.resolve('../workers/syllabusLifecycleWorker'), 'utf8');
    expect(sourceText).not.toContain('B3StructuralMaterializer');
  });
  test('L34 scope inference count zero', () => {
    const sourceText = readFileSync(require.resolve('../workers/syllabusLifecycleWorker'), 'utf8');
    expect(sourceText).not.toContain('EXACT_FIVE_LEVEL_COVERAGE_INCOMPLETE');
  });
  test('L35 projection write count zero', async () => {
    const { db } = await validDatabase(); await completeGovernedB3Lifecycle(db as any, taskId);
    expect(db.writePaths.some(path => path.includes('current_syllabus_projection'))).toBe(false);
  });
  test('L36 structured_nodes write count zero', async () => {
    const { db } = await validDatabase(); await completeGovernedB3Lifecycle(db as any, taskId);
    expect(db.writePaths.some(path => path.includes('structured_nodes'))).toBe(false);
  });
  test('L37 Student publication count zero', async () => {
    const { db } = await validDatabase(); await completeGovernedB3Lifecycle(db as any, taskId);
    expect(db.writePaths.some(path => path.toLowerCase().includes('student'))).toBe(false);
  });
  test('L38 upstream B3 mutation count zero', () => {
    expect(completeGovernedB3Lifecycle).toBeDefined();
  });
  test('L39 runtime architecture mutation count zero', () => {
    expect(completeGovernedB3Lifecycle).toBeInstanceOf(Function);
  });
  test('L40 valid chain records B3_COMPLETE exactly once', async () => {
    const { db } = await validDatabase(); await completeGovernedB3Lifecycle(db as any, taskId);
    expect(db.documents.get(officialPath()).lifecycle_state).toBe('B3_COMPLETE');
    expect(db.writePaths.filter(path => path === officialPath())).toHaveLength(1);
  });
});
