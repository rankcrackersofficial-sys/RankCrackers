export {};

const mockFirestoreDocs = new Map<string, any>();
const mockFirestoreWrites: Array<{ type: string; path: string; data: any }> = [];

function getDocByPath(path: string): any {
  return mockFirestoreDocs.get(path);
}

function setDocByPath(path: string, data: any, merge = false) {
  mockFirestoreWrites.push({ type: 'set', path, data });
  if (merge && mockFirestoreDocs.has(path)) {
    const existing = mockFirestoreDocs.get(path);
    mockFirestoreDocs.set(path, { ...existing, ...JSON.parse(JSON.stringify(data)) });
  } else {
    mockFirestoreDocs.set(path, JSON.parse(JSON.stringify(data)));
  }
}

function updateDocByPath(path: string, data: any) {
  mockFirestoreWrites.push({ type: 'update', path, data });
  const existing = mockFirestoreDocs.get(path) || {};
  mockFirestoreDocs.set(path, { ...existing, ...JSON.parse(JSON.stringify(data)) });
}

function createMockRef(fullPath: string): any {
  return {
    path: fullPath,
    id: fullPath.split('/').pop() || '',
    get: jest.fn(async () => {
      const data = getDocByPath(fullPath);
      return {
        exists: data !== undefined,
        data: () => (data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined),
      };
    }),
    set: jest.fn(async (data: any, options?: any) => {
      setDocByPath(fullPath, data, options?.merge === true);
    }),
    update: jest.fn(async (data: any) => {
      updateDocByPath(fullPath, data);
    }),
    collection: (subName: string) => createMockCollection(`${fullPath}/${subName}`),
  };
}

function createMockCollection(collPath: string): any {
  return {
    path: collPath,
    doc: (docId?: string) => {
      const id = docId || `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return createMockRef(`${collPath}/${id}`);
    },
    add: jest.fn(async (data: any) => {
      const autoId = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullPath = `${collPath}/${autoId}`;
      setDocByPath(fullPath, data);
      return createMockRef(fullPath);
    }),
    get: jest.fn(async () => {
      const docs: any[] = [];
      const prefix = `${collPath}/`;
      for (const [key, value] of mockFirestoreDocs.entries()) {
        if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) {
          docs.push({
            id: key.slice(prefix.length),
            exists: true,
            data: () => JSON.parse(JSON.stringify(value)),
          });
        }
      }
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
}

const mockDb = {
  collection: (name: string) => createMockCollection(name),
  doc: (path: string) => createMockRef(path),
  runTransaction: async (updateFunction: (transaction: any) => Promise<any>) => {
    const tx = {
      get: async (ref: any) => {
        const path = ref.path;
        const data = getDocByPath(path);
        return {
          exists: data !== undefined,
          data: () => (data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined),
        };
      },
      set: (ref: any, data: any, options?: any) => {
        setDocByPath(ref.path, data, options?.merge === true);
        return tx;
      },
      update: (ref: any, data: any) => {
        updateDocByPath(ref.path, data);
        return tx;
      },
    };
    return updateFunction(tx);
  },
};

jest.mock('firebase-admin', () => {
  const firestoreMock = Object.assign(jest.fn(() => mockDb), {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
      increment: jest.fn((n: number) => n),
    },
    Timestamp: {
      fromDate: jest.fn((d: Date) => d),
      fromMillis: jest.fn((ms: number) => new Date(ms)),
    },
  });
  return {
    apps: [{ name: 'mockApp' }],
    initializeApp: jest.fn(),
    firestore: firestoreMock,
  };
});

import { aafJobRegistry } from '../academicFactory/core/aafJobRegistry';
import { AafDispatcher } from '../academicFactory/core/aafDispatcher';
import { syllabusLifecycleWorker, completeGovernedB3Lifecycle } from '../workers/syllabusLifecycleWorker';
import { B3_CONTRACT_VERSION } from '../syllabus/b3Contract';
import { SyllabusB3Executor } from '../workers/syllabusB3Executor';
import { createSyllabusB3AafWorker } from '../academicFactory/workers/syllabusB3AafWorker';
import { routeAafTask, isLegacyGenericTask } from '../workers/queueWorker';

describe('P02B1-R3B2A2: Pre-R3B2 B3 Launch Quarantine Suite', () => {
  const missionId = 'ssc_cgl_2026';
  const docId = 'doc_cgl_official_notice';
  const sourceSha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  beforeEach(() => {
    mockFirestoreDocs.clear();
    mockFirestoreWrites.length = 0;
  });

  // Proof 1: ACADEMIC_CORPUS_VERIFIED does not create SYLLABUS_B3
  test('1. ACADEMIC_CORPUS_VERIFIED transition does not create SYLLABUS_B3 queue task', async () => {
    const docPath = `mission_realms/${missionId}/official_documents/${docId}`;
    setDocByPath(docPath, {
      lifecycle_state: 'PAGE_EXTRACTION_COMPLETE',
      sourceSha256: sourceSha,
      expected_physical_pages: 10,
    });

    const taskId = `verify_corpus_${missionId}_${sourceSha}`;
    const change = {
      before: {
        data: () => ({ status: 'queued', task_type: 'CORPUS_VERIFICATION' }),
      },
      after: {
        data: () => ({
          status: 'completed',
          task_type: 'CORPUS_VERIFICATION',
          mission_id: missionId,
          document_id: docId,
          result: { verified: true },
        }),
      },
    };
    const context = { params: { taskId } };

    await (syllabusLifecycleWorker as any).run(change, context);

    const docAfter = getDocByPath(docPath);
    expect(docAfter).toBeDefined();
    // Scope authority is not set, so state should advance to SCOPE_AUTHORITY_PENDING
    expect(docAfter.lifecycle_state).toBe('SCOPE_AUTHORITY_PENDING');

    // Verify ZERO SYLLABUS_B3 task created in ai_queue
    const legacyB3TaskId = `struct_${missionId}_${sourceSha}`;
    expect(getDocByPath(`ai_queue/${legacyB3TaskId}`)).toBeUndefined();

    // Verify all ai_queue documents
    for (const [path, data] of mockFirestoreDocs.entries()) {
      if (path.startsWith('ai_queue/')) {
        expect(data.task_type).not.toBe('SYLLABUS_B3');
        expect(data.type).not.toBe('SYLLABUS_B3');
      }
    }
  });

  // Proof 2: RESOLVED scope alone does not create SYLLABUS_B3
  test('2. RESOLVED scope authority alone does not create SYLLABUS_B3 queue task', async () => {
    const docPath = `mission_realms/${missionId}/official_documents/${docId}`;
    setDocByPath(docPath, {
      lifecycle_state: 'PAGE_EXTRACTION_COMPLETE',
      sourceSha256: sourceSha,
      expected_physical_pages: 10,
    });

    // Provide RESOLVED scope authority (the exact prior triggering condition)
    const scopeRef = `mission_realms/${missionId}/variables/scope_authority`;
    setDocByPath(scopeRef, {
      status: 'RESOLVED',
      missionId,
      decisionRevision: 1,
      resolutionSha: sourceSha,
    });

    const taskId = `verify_corpus_${missionId}_${sourceSha}`;
    const change = {
      before: {
        data: () => ({ status: 'queued', task_type: 'CORPUS_VERIFICATION' }),
      },
      after: {
        data: () => ({
          status: 'completed',
          task_type: 'CORPUS_VERIFICATION',
          mission_id: missionId,
          document_id: docId,
          result: { verified: true },
        }),
      },
    };
    const context = { params: { taskId } };

    await (syllabusLifecycleWorker as any).run(change, context);

    const docAfter = getDocByPath(docPath);
    expect(docAfter).toBeDefined();
    expect(docAfter.lifecycle_state).toBe('ACADEMIC_CORPUS_VERIFIED');

    // CRITICAL QUARANTINE ASSERTION: No SYLLABUS_B3 task is created even though scope authority is RESOLVED!
    const legacyB3TaskId = `struct_${missionId}_${sourceSha}`;
    expect(getDocByPath(`ai_queue/${legacyB3TaskId}`)).toBeUndefined();

    for (const [path, data] of mockFirestoreDocs.entries()) {
      if (path.startsWith('ai_queue/')) {
        expect(data.task_type).not.toBe('SYLLABUS_B3');
        expect(data.type).not.toBe('SYLLABUS_B3');
      }
    }
  });

  // Proof 3: ACADEMIC_SOURCE_READY does not create SYLLABUS_B3
  test('3. ACADEMIC_SOURCE_READY does not create SYLLABUS_B3', async () => {
    const docPath = `mission_realms/${missionId}/official_documents/${docId}`;
    setDocByPath(docPath, {
      lifecycle_state: 'ACADEMIC_SOURCE_READY',
      sourceSha256: sourceSha,
    });

    // An arbitrary task completing under ACADEMIC_SOURCE_READY
    const taskId = `dummy_task_${missionId}`;
    const change = {
      before: { data: () => ({ status: 'queued', task_type: 'unknown_stage' }) },
      after: {
        data: () => ({
          status: 'completed',
          task_type: 'unknown_stage',
          mission_id: missionId,
          document_id: docId,
        }),
      },
    };
    const context = { params: { taskId } };

    await (syllabusLifecycleWorker as any).run(change, context);

    expect(getDocByPath(`ai_queue/struct_${missionId}_${sourceSha}`)).toBeUndefined();
    for (const [path, data] of mockFirestoreDocs.entries()) {
      if (path.startsWith('ai_queue/')) {
        expect(data.task_type).not.toBe('SYLLABUS_B3');
        expect(data.type).not.toBe('SYLLABUS_B3');
      }
    }
  });

  // Proof 4: HIERARCHY_REVIEW_REQUIRED does not create SYLLABUS_B3
  test('4. HIERARCHY_REVIEW_REQUIRED does not create SYLLABUS_B3', async () => {
    const docPath = `mission_realms/${missionId}/official_documents/${docId}`;
    setDocByPath(docPath, {
      lifecycle_state: 'HIERARCHY_REVIEW_REQUIRED',
      sourceSha256: sourceSha,
    });

    const taskId = `review_task_${missionId}`;
    const change = {
      before: { data: () => ({ status: 'queued', task_type: 'hierarchy_review' }) },
      after: {
        data: () => ({
          status: 'completed',
          task_type: 'hierarchy_review',
          mission_id: missionId,
          document_id: docId,
        }),
      },
    };
    const context = { params: { taskId } };

    await (syllabusLifecycleWorker as any).run(change, context);

    expect(getDocByPath(`ai_queue/struct_${missionId}_${sourceSha}`)).toBeUndefined();
    for (const [path, data] of mockFirestoreDocs.entries()) {
      if (path.startsWith('ai_queue/')) {
        expect(data.task_type).not.toBe('SYLLABUS_B3');
        expect(data.type).not.toBe('SYLLABUS_B3');
      }
    }
  });

  // Proof 5: Existing syllabus nodes do not authorize B3
  test('5. Existing syllabus nodes do not authorize B3 launch or enqueue', async () => {
    // Populate pre-existing syllabus nodes
    const nodePath = `mission_realms/${missionId}/official_documents/${docId}/syllabus_nodes/node_existing`;
    setDocByPath(nodePath, {
      id: 'node_existing',
      title: 'Mathematics',
      level: 'subject',
    });

    const docPath = `mission_realms/${missionId}/official_documents/${docId}`;
    setDocByPath(docPath, {
      lifecycle_state: 'ACADEMIC_CORPUS_VERIFIED',
      sourceSha256: sourceSha,
      hasExistingNodes: true,
    });

    const taskId = `verify_corpus_${missionId}_${sourceSha}`;
    const change = {
      before: { data: () => ({ status: 'queued', task_type: 'CORPUS_VERIFICATION' }) },
      after: {
        data: () => ({
          status: 'completed',
          task_type: 'CORPUS_VERIFICATION',
          mission_id: missionId,
          document_id: docId,
          result: { verified: true },
        }),
      },
    };
    const context = { params: { taskId } };

    await (syllabusLifecycleWorker as any).run(change, context);

    expect(getDocByPath(`ai_queue/struct_${missionId}_${sourceSha}`)).toBeUndefined();
    for (const [path, data] of mockFirestoreDocs.entries()) {
      if (path.startsWith('ai_queue/')) {
        expect(data.task_type).not.toBe('SYLLABUS_B3');
        expect(data.type).not.toBe('SYLLABUS_B3');
      }
    }
  });

  // Proof 6: AAF registry has no SYLLABUS_B3 handler
  test('6. AAF registry has no SYLLABUS_B3 handler / fails unregistered', () => {
    expect(aafJobRegistry.getHandler('SYLLABUS_B3')).toBeUndefined();
    expect(aafJobRegistry.getHandler('SYLLABUS_B3_PREPARE')).toBeUndefined();
    expect(aafJobRegistry.getHandler('SYLLABUS_B3_EXECUTE')).toBeUndefined();
    expect(aafJobRegistry.getHandler('SYLLABUS_B3_COMPLETE')).toBeUndefined();

    // Verify all registered types do not include SYLLABUS_B3
    const registeredTypes = aafJobRegistry.getRegisteredTypes();
    expect(registeredTypes).not.toContain('SYLLABUS_B3');
    expect(registeredTypes.length).toBe(13);

    // Verify canonical types remain exactly 13
    const canonicalTypes = aafJobRegistry.getCanonicalTypes();
    expect(canonicalTypes).not.toContain('SYLLABUS_B3');
    expect(canonicalTypes.length).toBe(13);
  });

  // Proof 7: Forged academic_factory_v1 SYLLABUS_B3 job cannot dispatch
  test('7. Forged academic_factory_v1 SYLLABUS_B3 job cannot dispatch because handler is unregistered', async () => {
    const forgedJobId = 'forged_b3_job_001';
    const queueDocPath = `ai_queue/${forgedJobId}`;

    // Place a forged ready job into the queue
    setDocByPath(queueDocPath, {
      queueContract: 'academic_factory_v1',
      schemaVersion: 1,
      runId: 'run_forge_001',
      jobId: forgedJobId,
      missionId,
      canonicalTargetId: 'target_001',
      idempotencyKey: forgedJobId,
      state: 'ready',
      attempts: 0,
      maxAttempts: 3,
      leaseOwner: null,
      leaseExpiresAtUtc: null,
      nextRetryAtUtc: null,
      dependencyJobIds: [],
      inputHash: 'input_hash_forged',
      outputHash: null,
      type: 'SYLLABUS_B3',
      targetId: 'target_001',
      sourceDocumentIds: [docId],
    });

    const dispatcher = new AafDispatcher();
    await dispatcher.dispatch(forgedJobId, 'worker_node_1');

    // The job must NOT be in running or reviewing state!
    const jobAfter = getDocByPath(queueDocPath);
    expect(jobAfter).toBeDefined();
    expect(jobAfter.state).not.toBe('running');
    expect(jobAfter.state).not.toBe('reviewing');
    // It must fail closed due to UNREGISTERED_HANDLER (state becomes retryWait or failed, never running/reviewing)
    expect(['retryWait', 'failed']).toContain(jobAfter.state);
    expect(jobAfter.lastError).toContain("UNREGISTERED_HANDLER: No worker bound for type 'SYLLABUS_B3'");
  });

  // Proof 8: Production index has no legacy lifecycle trigger export
  test('8. Production index.js has zero legacy lifecycle trigger export', () => {
    const prodExports = require('../../index');
    expect(prodExports.syllabusLifecycleWorker).toBeUndefined();
    expect(prodExports.syllabusIngestionOrchestrator).toBeUndefined();
    expect(prodExports.SYLLABUS_B3).toBeUndefined();
    expect(prodExports.genericB3Worker).toBeUndefined();
  });

  // Proof 9: No direct production worker/executor bypass is introduced
  test('9. No direct production worker/executor bypass is introduced', async () => {
    // 1. routeAafTask routes to dispatch for AAF contract, but AAF registry has no B3 handler
    const dispatch = jest.fn().mockResolvedValue(undefined);
    expect(await routeAafTask({ queueContract: 'academic_factory_v1', type: 'SYLLABUS_B3' }, 'id', 'worker', { dispatch })).toBe(true);
    expect(dispatch).toHaveBeenCalledWith('id', 'worker');
    const isLegacy = isLegacyGenericTask({ queueContract: 'academic_factory_v1', type: 'SYLLABUS_B3' });
    expect(isLegacy).toBe(false);

    // 2. Legacy completion rejection in completeGovernedB3Lifecycle
    const legacyTaskId = 'legacy_completed_task';
    setDocByPath(`ai_queue/${legacyTaskId}`, {
      status: 'completed',
      task_type: 'SYLLABUS_B3',
    });
    await expect(completeGovernedB3Lifecycle(mockDb as any, legacyTaskId))
      .rejects.toThrow('B3_LIFECYCLE_AUTHORITY_REJECTED:WRONG_QUEUE_CONTRACT');

    // 3. Fake reviewing job without valid sealed revision envelope is rejected
    const forgedReviewTaskId = 'forged_review_b3';
    setDocByPath(`ai_queue/${forgedReviewTaskId}`, {
      queueContract: 'academic_factory_v1',
      type: 'SYLLABUS_B3',
      state: 'reviewing',
      b3ExecutorInput: null,
    });
    await expect(completeGovernedB3Lifecycle(mockDb as any, forgedReviewTaskId))
      .rejects.toThrow('B3_LIFECYCLE_AUTHORITY_REJECTED:MISSING_EXECUTOR_INPUT');
  });

  // Proof 10: Reusable B3 executor/materializer/repository/completion verifier components remain valid
  test('10. Reusable B3 components remain intact, preserved, and structurally valid', () => {
    expect(B3_CONTRACT_VERSION).toBe('B3-CANONICAL-V1');

    const mockMaterializer: any = {
      materialize: jest.fn(),
    };
    const mockRepo: any = {
      fetchEvidence: jest.fn(),
      fetchExistingNodeKeys: jest.fn(),
      runInTransaction: jest.fn(),
    };
    const executor = new SyllabusB3Executor(mockMaterializer, mockRepo);
    expect(executor).toBeDefined();
    expect(typeof executor.execute).toBe('function');

    // Verify createSyllabusB3AafWorker can be instantiated
    const mockStore: any = { persist: jest.fn() };
    const aafWorker = createSyllabusB3AafWorker(executor, mockStore);
    expect(typeof aafWorker).toBe('function');
  });
});
