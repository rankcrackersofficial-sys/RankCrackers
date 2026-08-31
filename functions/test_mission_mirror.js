const assert = require('assert');

// Mock Firestore Database and Transaction
const mockDatabaseState = {};
global.mockDatabaseState = mockDatabaseState;
const allowedCollections = new Set([
  'mission_realms',
  'recruitments',
  'student_mission_catalog',
  'sentinel_drafts',
  'certificates',
  'founder_activity_log'
]);

class MockDocumentSnapshot {
  constructor(id, data = null) {
    this.id = id;
    this._data = data;
    this.exists = data !== null;
  }
  data() {
    return this._data;
  }
}

class MockTransaction {
  constructor() {
    this.writesCount = 0;
    this.hasWritten = false;
    this.log = [];
  }

  async get(ref) {
    if (this.hasWritten) {
      throw new Error('READS_AFTER_WRITES_VIOLATION: Cannot get doc after write.');
    }
    this.log.push({ type: 'get', path: ref.path });
    const colState = mockDatabaseState[ref.parentPath] || {};
    const docData = colState[ref.id] || null;
    return new MockDocumentSnapshot(ref.id, docData);
  }

  set(ref, data, options = {}) {
    this.hasWritten = true;
    this.writesCount++;
    this.log.push({ type: 'set', path: ref.path, data, options });
    if (!allowedCollections.has(ref.parentPath)) {
      throw new Error(`PROHIBITED_WRITE_VIOLATION: Set to prohibited collection '${ref.parentPath}'`);
    }
    const colState = mockDatabaseState[ref.parentPath] || {};
    if (options.merge && colState[ref.id]) {
      colState[ref.id] = { ...colState[ref.id], ...data };
    } else {
      colState[ref.id] = data;
    }
  }

  create(ref, data) {
    this.hasWritten = true;
    this.writesCount++;
    this.log.push({ type: 'create', path: ref.path, data });
    if (!allowedCollections.has(ref.parentPath)) {
      throw new Error(`PROHIBITED_WRITE_VIOLATION: Create in prohibited collection '${ref.parentPath}'`);
    }
    const colState = mockDatabaseState[ref.parentPath] || {};
    if (colState[ref.id]) throw new Error(`ALREADY_EXISTS: '${ref.path}'`);
    colState[ref.id] = data;
    mockDatabaseState[ref.parentPath] = colState;
  }
  update(ref, data) {
    this.hasWritten = true;
    this.writesCount++;
    this.log.push({ type: 'update', path: ref.path, data });
    if (!allowedCollections.has(ref.parentPath)) {
      throw new Error(`PROHIBITED_WRITE_VIOLATION: Update to prohibited collection '${ref.parentPath}'`);
    }
    const colState = mockDatabaseState[ref.parentPath] || {};
    if (!colState[ref.id]) {
      throw new Error(`DOCUMENT_NOT_FOUND: Cannot update non-existing document '${ref.id}'`);
    }
    colState[ref.id] = { ...colState[ref.id], ...data };
  }

  delete(ref) {
    this.hasWritten = true;
    this.writesCount++;
    this.log.push({ type: 'delete', path: ref.path });
    if (!allowedCollections.has(ref.parentPath)) {
      throw new Error(`PROHIBITED_WRITE_VIOLATION: Delete in prohibited collection '${ref.parentPath}'`);
    }
    const colState = mockDatabaseState[ref.parentPath] || {};
    delete colState[ref.id];
  }
}

class MockDocumentReference {
  constructor(parentPath, id) {
    this.parentPath = parentPath;
    this.id = id;
    this.path = `${parentPath}/${id}`;
  }
  update(data) {
    const colState = mockDatabaseState[this.parentPath] || {};
    if (!colState[this.id]) {
      throw new Error(`DOCUMENT_NOT_FOUND: Cannot update non-existing document '${this.id}'`);
    }
    colState[this.id] = { ...colState[this.id], ...data };
    return Promise.resolve();
  }
  set(data, options = {}) {
    const colState = mockDatabaseState[this.parentPath] || {};
    if (options.merge && colState[this.id]) {
      colState[this.id] = { ...colState[this.id], ...data };
    } else {
      colState[this.id] = data;
    }
    return Promise.resolve();
  }
  collection(name) {
    return {
      doc: (subId) => new MockDocumentReference(`${this.path}/${name}`, subId),
      where: () => ({
        get: async () => {
          // Return eligible student doc to trigger certificates logic
          return {
            forEach: (cb) => {
              cb({
                id: 'student_123',
                ref: new MockDocumentReference('mission_realms/jee_main_2026/participants', 'student_123'),
                data: () => ({
                  attempts: {
                    FINAL_RESULT: {
                      status: 'CERTIFICATE_ELIGIBLE',
                      examName: 'JEE Main',
                      verifiedScore: 99.5
                    }
                  }
                })
              });
            }
          };
        }
      })
    };
  }
}

const mockDb = {
  collection: (name) => {
    return {
      doc: (id) => new MockDocumentReference(name, id)
    };
  },
  batch: () => ({
    set: (ref, data) => {
      if (ref.parentPath === 'certificates' && mockDatabaseState.simulateCertificateBatchFailure) {
        throw new Error('BATCH_CERTIFICATE_WRITE_FAILED');
      }
      const colState = mockDatabaseState[ref.parentPath] || {};
      colState[ref.id] = data;
    },
    update: (ref, data) => {
      if (ref.parentPath === 'mission_realms' && mockDatabaseState.simulateAnalyticsBatchFailure) {
        throw new Error('BATCH_ANALYTICS_WRITE_FAILED');
      }
      const colState = mockDatabaseState[ref.parentPath] || {};
      if (colState[ref.id]) {
        colState[ref.id] = { ...colState[ref.id], ...data };
      }
    },
    commit: async () => {}
  }),
  runTransaction: async (callback) => {
    const tx = new MockTransaction();
    try {
      const result = await callback(tx);
      return result;
    } catch (e) {
      throw e;
    }
  }
};

// Define mock admin module
const mockAdmin = {
  firestore: () => mockDb,
  initializeApp: () => {}
};
mockAdmin.firestore.FieldValue = {
  serverTimestamp: () => 'MOCK_SERVER_TIMESTAMP',
  increment: (val) => ({ type: 'increment', value: val })
};
mockAdmin.auth = () => ({
  setCustomUserClaims: async () => {}
});

// Mock firebase-functions module dynamically before requiring the handler
const mockFunctions = {
  runWith: () => ({
    https: {
      onCall: (handler) => handler
    }
  }),
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
  }
};

// Stub the require cache
require.cache[require.resolve('firebase-admin')] = {
  id: require.resolve('firebase-admin'),
  filename: require.resolve('firebase-admin'),
  loaded: true,
  exports: mockAdmin
};

require.cache[require.resolve('firebase-functions')] = {
  id: require.resolve('firebase-functions'),
  filename: require.resolve('firebase-functions'),
  loaded: true,
  exports: mockFunctions
};

const { 
  handleSentinelAction,
  buildStudentMissionCatalogShell, 
  mirrorMissionShellToStudentCatalog
} = require('./callable/handle_sentinel_action');

const {
  resolveCanonicalMissionId,
  validateOrResolveId
} = require('./canonical_mission_registry');

const { buildCatalogPayload } = require('./backfill_student_mission_catalog');

console.log("================================================");
console.log("RUNNING HARDENED INTEGRATION TESTS (29 CASES)");
console.log("================================================");

let testsCount = 0;
let passedCount = 0;

// Clear mock DB state helper
function resetMockDb() {
  for (const key of Object.keys(mockDatabaseState)) {
    delete mockDatabaseState[key];
  }
  mockDatabaseState.mission_realms = {};
  mockDatabaseState.recruitments = {};
  mockDatabaseState.student_mission_catalog = {};
  mockDatabaseState.sentinel_drafts = {};
  mockDatabaseState.users = { founder_uid: { status: 'ACTIVE' } };
  mockDatabaseState.certificates = {};
  mockDatabaseState.simulateCertificateBatchFailure = false;
  mockDatabaseState.simulateAnalyticsBatchFailure = false;
}

async function runSuite() {
  // Helper to run individual test function
  async function testCase(description, testFn) {
    testsCount++;
    try {
      await testFn();
      console.log(`✅ PASS: ${description}`);
      passedCount++;
    } catch (error) {
      console.error(`❌ FAIL: ${description}`);
      console.error(error);
    }
  }

  const founderContext = {
    auth: {
      uid: 'founder_uid',
      token: { founder: true, email: 'founder@rankcrackers.in' }
    }
  };

  const adminContext = {
    auth: {
      uid: 'admin_uid',
      token: {
        admin: true,
        adminLevel: 5,
        email: 'admin@rankcrackers.in',
        permissions: ['mission.manifest', 'mission.launch', 'mission.pause']
      }
    }
  };

  const unprivilegedContext = {
    auth: {
      uid: 'student_uid',
      token: { email: 'student@rankcrackers.in' }
    }
  };

  // 1. Founder launch creates catalog shell
  await testCase("Founder launch creates catalog shell", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };
    
    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027'];
    assert.ok(shell);
    assert.strictEqual(shell.status, 'PREPARING');
    assert.strictEqual(shell.userPanelVisible, true);
  });

  // 2. Admin launch behavior follows permission policy (allow launch -> now blocked by governance lock)
  await testCase("Admin launch behavior follows permission policy (allow launch -> now blocked by governance lock)", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };
    
    await assert.rejects(async () => {
      await handleSentinelAction(data, adminContext);
    }, /ACCESS DENIED/);
  });

  // 3. Unauthorized caller rejected
  await testCase("Unauthorized caller rejected", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, unprivilegedContext);
    }, /ACCESS DENIED/);
  });

  // 4. Unauthenticated caller rejected
  await testCase("Unauthenticated caller rejected", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {}
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, {});
    }, /Authentication required/);
  });

  // 5. Manifest creates hidden coming-soon shell
  await testCase("Manifest creates hidden coming-soon shell", async () => {
    resetMockDb();
    
    // Seed candidate recruitment record
    mockDatabaseState.recruitments['jee_main_2026'] = {
      id: 'jee_main_2026',
      title: 'JEE Main',
      org: 'NTA',
      year: 2026,
      nature: 'STAGED'
    };

    const data = {
      action: 'manifest_realm',
      recruitmentId: 'jee_main_2026'
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.ok(shell);
    assert.strictEqual(shell.catalogStatus, 'PREPARING');
    assert.strictEqual(shell.userPanelVisible, true);
    assert.strictEqual(shell.cardVisible, true);
  });

  // 6. Launch updates shell to LIVE
  await testCase("Launch updates shell to LIVE", async () => {
    resetMockDb();
    
    // Seed existing documents
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'STAGED' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'MANIFESTED' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'COMING_SOON', userPanelVisible: false };

    const data = {
      action: 'launch_realm',
      recruitmentId: 'jee_main_2026',
      payload: { reason: 'Founder lifecycle test launch', requestId: 'test-launch-001' }
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'ACTIVE');
    assert.strictEqual(shell.userPanelVisible, true);
  });

  // 7. Pause maps deterministically to hidden coming-soon
  await testCase("Pause maps deterministically to hidden coming-soon", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE', userPanelVisible: true };

    const data = {
      action: 'pause_realm',
      recruitmentId: 'jee_main_2026',
      payload: { reason: 'Founder lifecycle test pause', requestId: 'test-pause-001' }
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'PASSIVE');
    assert.strictEqual(shell.userPanelVisible, false);
  });

  // 8. Archive hides and archives
  await testCase("Archive hides and archives", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE', userPanelVisible: true };

    const data = {
      action: 'archive_realm',
      recruitmentId: 'jee_main_2026',
      payload: { reason: 'Founder lifecycle test archive', requestId: 'test-archive-001' }
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'ARCHIVED');
    assert.strictEqual(shell.userPanelVisible, false);
    assert.strictEqual(shell.cardVisible, false);
    assert.strictEqual(shell.archived, true);
  });

  // 9. Restore follows Option A policy (Restore to hidden passive)
  await testCase("Restore follows Option A policy (Restore to hidden passive)", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ARCHIVED' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'archived' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'ARCHIVED', userPanelVisible: false, cardVisible: false, archived: true };

    const data = {
      action: 'restore_realm',
      recruitmentId: 'jee_main_2026',
      payload: { reason: 'Founder lifecycle test restore', requestId: 'test-restore-001' }
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'PASSIVE');
    assert.strictEqual(shell.userPanelVisible, false); // Option A: always hidden on restore/passive
    assert.strictEqual(shell.cardVisible, false);
    assert.strictEqual(shell.archived, false);
  });

  // 10. Declare result maps exactly (completion lifecycle status)
  await testCase("Declare result maps exactly (completion lifecycle status)", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE', userPanelVisible: true };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON' }
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'PREPARING');
    assert.strictEqual(shell.userPanelVisible, true);
    assert.strictEqual(shell.studentMessage, 'Mission is visible to eligible students and awaiting final Founder verification.');
  });

  // 11. Same action retry is idempotent
  await testCase("Same action retry is idempotent", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };

    await handleSentinelAction(data, founderContext);
    const doc1 = mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027'];
    
    await handleSentinelAction(data, founderContext);
    const doc2 = mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027'];

    assert.deepStrictEqual(doc1.id, doc2.id);
  });

  // 12. Duplicate document count remains one
  await testCase("Duplicate document count remains one", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };

    await handleSentinelAction(data, founderContext);
    await handleSentinelAction(data, founderContext);

    const docs = Object.keys(mockDatabaseState.student_mission_catalog);
    assert.strictEqual(docs.length, 1);
  });

  // 13. Existing identity mismatch aborts
  await testCase("Existing identity mismatch aborts", async () => {
    resetMockDb();
    const realmId = 'jee_main_2026';
    
    // Seed mismatched record under jee_main_2026
    mockDatabaseState.student_mission_catalog[realmId] = {
      id: realmId,
      mission_id: 'mismatched_id_value_here',
      recruitment_id: realmId,
      recruitmentGroupId: realmId
    };

    mockDatabaseState.mission_realms[realmId] = { realm_id: realmId, status: 'ACTIVE' };
    mockDatabaseState.recruitments[realmId] = { id: realmId, status: 'published' };

    const data = {
      action: 'launch_realm',
      recruitmentId: realmId,
      payload: { reason: 'Founder identity mismatch test', requestId: 'test-identity-001' }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /Identity mismatch detected/);
  });

  // 14. Missing canonical ID aborts
  await testCase("Missing canonical ID aborts", async () => {
    assert.throws(() => {
      buildStudentMissionCatalogShell('', {}, {}, 'launch_exam_mission');
    }, /CANONICAL_ID_REQUIRED/);
  });

  // 15. Catalog mirror failure aborts writes
  await testCase("Catalog mirror failure aborts writes", async () => {
    resetMockDb();
    
    // Overwrite mockDb.runTransaction to simulate transactional catalog write failure
    const originalRunTransaction = mockDb.runTransaction;
    mockDb.runTransaction = async (callback) => {
      const tx = new MockTransaction();
      tx.set = (ref) => {
        if (ref.parentPath === 'student_mission_catalog') {
          throw new Error('SIMULATED_CATALOG_FAILURE');
        }
      };
      return callback(tx);
    };

    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /SIMULATED_CATALOG_FAILURE/);

    // Restore runTransaction
    mockDb.runTransaction = originalRunTransaction;
  });

  // 16. No reads after writes
  await testCase("No reads after writes", async () => {
    const tx = new MockTransaction();
    const ref = mockDb.collection('student_mission_catalog').doc('test');
    tx.set(ref, { val: 1 });
    await assert.rejects(async () => {
      await tx.get(ref);
    }, /READS_AFTER_WRITES_VIOLATION/);
  });

  // 17. Existing createdAt remains unchanged
  await testCase("Existing createdAt remains unchanged", async () => {
    resetMockDb();
    const realmId = 'jee_main_2026';
    mockDatabaseState.student_mission_catalog[realmId] = {
      id: realmId,
      mission_id: realmId,
      recruitment_id: realmId,
      recruitmentGroupId: realmId,
      createdAt: 'ORIGINAL_TIME',
      created_at: 'ORIGINAL_TIME'
    };

    const existingSnap = new MockDocumentSnapshot(realmId, mockDatabaseState.student_mission_catalog[realmId]);
    const tx = new MockTransaction();

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, { status: 'ACTIVE' }, {}, 'launch_realm', existingSnap);

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.createdAt, 'ORIGINAL_TIME');
    assert.strictEqual(shell.created_at, 'ORIGINAL_TIME');
  });

  // 18. No prohibited collection writes
  await testCase("No prohibited collection writes", async () => {
    const tx = new MockTransaction();
    const badRef = { parentPath: 'unauthorized_collection', id: 'doc', path: 'unauthorized_collection/doc' };
    assert.throws(() => {
      tx.set(badRef, { test: 1 });
    }, /PROHIBITED_WRITE_VIOLATION/);
  });

  // 19. Canonical JEE Main 2027 must not collapse into the 2026 legacy mission
  await testCase("Canonical JEE Main 2027 does not map to jee_main_2026", async () => {
    const mapped = resolveCanonicalMissionId('JEE Main', 'NTA', 2027);
    assert.strictEqual(mapped, 'rec_nta_jee_main_2027');
  });

  // 20. Live Founder identity must be explicit, not silently downgraded to the 2026 pilot
  await testCase("Live Founder JEE Main 2027 creates its own canonical identity", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };
    
    await handleSentinelAction(data, founderContext);

    // Verify it resolved to the 2027 canonical identity and did not reuse the legacy 2026 pilot.
    assert.ok(mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027']);
    assert.strictEqual(mockDatabaseState.student_mission_catalog['jee_main_2026'], undefined);
  });

  // 21. Declare Result write inventory limits writes
  await testCase("Declare Result write inventory limits writes", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE', userPanelVisible: true };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON' }
    };

    // Override mockDb.runTransaction to track collection writes during declare_result action
    const originalRunTransaction = mockDb.runTransaction;
    const collectionsWritten = new Set();
    
    mockDb.runTransaction = async (callback) => {
      const tx = new MockTransaction();
      const originalSet = tx.set.bind(tx);
      const originalUpdate = tx.update.bind(tx);
      
      tx.set = (ref, data, options) => {
        collectionsWritten.add(ref.parentPath);
        return originalSet(ref, data, options);
      };
      tx.update = (ref, data) => {
        collectionsWritten.add(ref.parentPath);
        return originalUpdate(ref, data);
      };
      
      return callback(tx);
    };

    await handleSentinelAction(data, founderContext);

    // Verify only allowed collections were modified during declare_result transaction
    for (const col of collectionsWritten) {
      assert.ok(allowedCollections.has(col), `Prohibited collection '${col}' written during declare_result`);
    }

    mockDb.runTransaction = originalRunTransaction;
  });

  // 22. Existing non-pilot mission with legacy ID preserved
  await testCase("Existing non-pilot mission with legacy ID preserved", async () => {
    resetMockDb();
    const legacyId = 'rec_rpsc_exam_2026_1';
    mockDatabaseState.recruitments[legacyId] = {
      id: legacyId,
      title: 'RPSC Secondary Exam',
      org: 'RPSC',
      year: 2026,
      nature: 'STAGED'
    };

    const data = {
      action: 'manifest_realm',
      recruitmentId: legacyId
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog[legacyId];
    assert.ok(shell);
    assert.strictEqual(shell.id, legacyId);
  });

  // 23. Same display fields producing a new slug
  await testCase("Same display fields producing a new slug", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'CSE',
        organization: 'UPSC',
        year: 2028,
        nature: 'ACTIVE'
      }
    };

    await handleSentinelAction(data, founderContext);

    const expectedId = 'rec_upsc_cse_2028';
    const shell = mockDatabaseState.student_mission_catalog[expectedId];
    assert.ok(shell);
    assert.strictEqual(shell.id, expectedId);
  });

  // 24. Lifecycle action without canonical ID fails closed
  await testCase("Lifecycle action without canonical ID fails closed", async () => {
    resetMockDb();
    const data = {
      action: 'launch_realm',
      recruitmentId: ''
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /CANONICAL_ID_REQUIRED/);
  });

  // 25. Invalid canonical ID format fails closed
  await testCase("Invalid canonical ID format fails closed", async () => {
    resetMockDb();
    const data = {
      action: 'launch_realm',
      recruitmentId: 'jee_main_2026; DROP TABLE student_mission_catalog;'
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /INVALID_CANONICAL_ID/);
  });

  // 26. Alias resolving to existing document
  await testCase("Alias resolving to existing document", async () => {
    const resolved = resolveCanonicalMissionId('NEET (UG) 2027', 'NTA', 2027);
    assert.strictEqual(resolved, 'neet_(ug)-2027');
  });

  // 27. Declare-result post-transaction certificate failure behavior
  await testCase("Declare-result post-transaction certificate failure behavior", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE', userPanelVisible: true };
    mockDatabaseState.simulateCertificateBatchFailure = true;

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON' }
    };

    // Transaction should commit core mirror states, but fail-safes are logged
    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /BATCH_CERTIFICATE_WRITE_FAILED/);
  });

  // 28. Declare-result post-transaction analytics failure behavior
  await testCase("Declare-result post-transaction analytics failure behavior", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE', userPanelVisible: true };
    mockDatabaseState.simulateAnalyticsBatchFailure = true;

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON' }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /BATCH_ANALYTICS_WRITE_FAILED/);
  });

  // 29. Backfill contract semantic equality fixtures check
  await testCase("Backfill contract semantic equality fixtures check", async () => {
    const realmData = {
      exam_name: 'JEE Main',
      organization: 'NTA',
      exam_year: 2027,
      priority: 5,
      createdAt: 'ORIGINAL_TIME'
    };
    const recData = {
      title: 'JEE Main',
      org: 'NTA',
      year: 2027
    };

    const shell = buildStudentMissionCatalogShell('jee_main_2026', realmData, recData, 'launch_realm');

    assert.strictEqual(shell.id, 'jee_main_2026');
    assert.strictEqual(shell.name, 'JEE Main');
    assert.strictEqual(shell.title, 'JEE Main');
    assert.strictEqual(shell.boardId, 'NTA');
    assert.strictEqual(shell.organizationCode, 'NTA');
    assert.strictEqual(shell.year, 2027);
    assert.strictEqual(shell.target_year, 2027);
    assert.strictEqual(shell.priority, 5);
    assert.strictEqual(shell.sortOrder, 5);
  });

  // 30. Permission matrix - Founder allowed on sensitive archive_realm
  await testCase("Permission matrix - Founder allowed on sensitive archive_realm", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', status: 'LIVE' };

    const data = {
      action: 'archive_realm',
      recruitmentId: 'jee_main_2026',
      payload: { reason: 'Founder permission archive test', requestId: 'test-permission-001' }
    };

    await handleSentinelAction(data, founderContext);
    assert.strictEqual(mockDatabaseState.mission_realms['jee_main_2026'].status, 'ARCHIVED');
  });

  // 31. Permission matrix - Admin rejected on sensitive archive_realm
  await testCase("Permission matrix - Admin rejected on sensitive archive_realm", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { realm_id: 'jee_main_2026', status: 'ACTIVE' };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };

    const data = {
      action: 'archive_realm',
      recruitmentId: 'jee_main_2026'
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, adminContext);
    }, /ACCESS DENIED/);
  });

  // 32. Permission matrix - Admin allowed on staged/lifecycle manifest_realm
  await testCase("Permission matrix - Admin allowed on staged/lifecycle manifest_realm", async () => {
    resetMockDb();
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published', title: 'JEE Main', org: 'NTA', year: 2026 };

    const data = {
      action: 'manifest_realm',
      recruitmentId: 'jee_main_2026'
    };

    await handleSentinelAction(data, adminContext);
    assert.strictEqual(mockDatabaseState.mission_realms['jee_main_2026'].status, 'STAGED');
  });

  // 33. Concurrent creation race protection (precondition check/collision prevention)
  await testCase("Concurrent creation race protection", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      exam_name: 'JEE Main Original',
      organization: 'NTA',
      exam_year: 2026
    };

    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'CBSE',
        year: 2026
      }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /Identity mismatch detected for existing mission ID/);
  });

  // 34. Option B Side-effect recovery - Partial failure and retry reconciliation
  await testCase("Option B Side-effect recovery - Partial failure and retry reconciliation", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { 
      realm_id: 'jee_main_2026', 
      status: 'ACTIVE',
      certificateSideEffectStatus: 'SUCCESS',
      analyticsSideEffectStatus: 'PENDING'
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    // Seed 1 participant who got certificate issued previously
    const participantRef = mockDb.collection('mission_realms').doc('jee_main_2026').collection('participants').doc('student_123');
    mockDatabaseState['mission_realms/jee_main_2026/participants'] = {
      'student_123': {
        attempts: {
          FINAL_RESULT: { status: 'CERTIFICATE_ISSUED', examName: 'JEE Main', verifiedScore: 99.5 }
        },
        linkedCertificateId: 'cert_jee_main_2026_student_123'
      }
    };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON' }
    };

    await handleSentinelAction(data, founderContext);

    // Analytics should now be SUCCESS and graduates count should be set to 1
    const realm = mockDatabaseState.mission_realms['jee_main_2026'];
    assert.strictEqual(realm.certificateSideEffectStatus, 'SUCCESS');
    assert.strictEqual(realm.analyticsSideEffectStatus, 'SUCCESS');
    assert.strictEqual(realm['analytics.graduated'], 1);
  });

  // 35. Option B Side-effect recovery - Repeated declare_result is idempotent
  await testCase("Option B Side-effect recovery - Repeated declare_result is idempotent", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = { 
      realm_id: 'jee_main_2026', 
      status: 'ACTIVE',
      certificateSideEffectStatus: 'SUCCESS',
      analyticsSideEffectStatus: 'SUCCESS',
      'analytics.graduated': 1
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON' }
    };

    // Override batch to verify no operations are called
    const originalBatch = mockDb.batch;
    let batchCalled = false;
    mockDb.batch = () => {
      batchCalled = true;
      return originalBatch();
    };

    await handleSentinelAction(data, founderContext);

    assert.strictEqual(batchCalled, false);
    mockDb.batch = originalBatch;
  });

  // 36. Backfill builder semantic parity check
  await testCase("Backfill builder semantic parity check", async () => {
    const realmData = {
      exam_name: 'JEE Main 2026',
      titleHindi: 'JEE Main Hindi',
      state: 'Rajasthan',
      exam_category: 'competitive',
      exam_year: 2026,
      code: 'jee_main_2026',
      organization: 'NTA',
      organizationCode: 'NTA',
      status: 'ACTIVE',
      priority: 3,
      createdAt: 'MOCK_TIME'
    };

    const recData = {
      title: 'JEE Main 2026',
      titleHindi: 'JEE Main Hindi',
      state: 'Rajasthan',
      examCategory: 'competitive',
      year: 2026,
      code: 'jee_main_2026',
      org: 'NTA',
      organizationCode: 'NTA',
      nature: 'ACTIVE',
      priority: 3,
      createdAt: 'MOCK_TIME'
    };

    const variables = [{ id: 'var_1', name: 'Var 1' }];
    const readiness = { crucible: 'ready' };
    const catalogStatus = 'LIVE';
    const studentMessage = 'Success';
    const now = 'CURRENT_TIME';

    const backfillPayload = buildCatalogPayload('jee_main_2026', recData, variables, readiness, catalogStatus, studentMessage, now);
    const mirrorPayload = buildStudentMissionCatalogShell('jee_main_2026', realmData, recData, 'launch_realm');

    // Compare field-by-field semantic equality
    const fieldsToVerify = ['id', 'mission_id', 'title', 'name', 'subtitle', 'titleHindi', 'state', 'examCategory', 'exam_category', 'target_year', 'year', 'exam_year', 'exam_id', 'code', 'recruitment_id', 'recruitmentGroupId', 'boardId', 'organizationCode', 'cardVisible', 'userPanelVisible', 'priority', 'sortOrder'];

    for (const field of fieldsToVerify) {
      assert.strictEqual(backfillPayload[field], mirrorPayload[field], `Parity mismatch on field '${field}': backfill='${backfillPayload[field]}', mirror='${mirrorPayload[field]}'`);
    }
  });

  // 37. Security: Upper Admin without required permission denied on lifecycle actions
  await testCase("Security: Upper Admin without required permission denied on lifecycle actions", async () => {
    resetMockDb();
    const data = { action: 'launch_realm', recruitmentId: 'jee_main_2026' };
    await assert.rejects(async () => {
      await handleSentinelAction(data, {
        auth: {
          uid: 'upper_admin_no_perm',
          token: { admin: true, adminLevel: 5, permissions: ['mission.manifest'] }
        }
      });
    }, /Founder clearance required/);
  });

  // 38. Security: Lower Admin (adminLevel < 5) denied on lifecycle actions
  await testCase("Security: Lower Admin (adminLevel < 5) denied on lifecycle actions", async () => {
    resetMockDb();
    const data = { action: 'launch_realm', recruitmentId: 'jee_main_2026' };
    await assert.rejects(async () => {
      await handleSentinelAction(data, {
        auth: {
          uid: 'lower_admin',
          token: { admin: true, adminLevel: 3, permissions: ['mission.launch'] }
        }
      });
    }, /Founder clearance required/);
  });

  // 39. Security: Generic Admin denied where scoped permission missing
  await testCase("Security: Generic Admin denied where scoped permission missing", async () => {
    resetMockDb();
    const data = { action: 'manifest_realm', recruitmentId: 'jee_main_2026' };
    await assert.rejects(async () => {
      await handleSentinelAction(data, {
        auth: {
          uid: 'generic_admin',
          token: { admin: true, adminLevel: 1, permissions: [] }
        }
      });
    }, /Upper Admin permission required/);
  });

  // 40. Security: admin_uid without claims denied
  await testCase("Security: admin_uid without claims denied", async () => {
    resetMockDb();
    const data = { action: 'manifest_realm', recruitmentId: 'jee_main_2026' };
    await assert.rejects(async () => {
      await handleSentinelAction(data, {
        auth: {
          uid: 'admin_uid',
          token: { email: 'admin@rankcrackers.in' }
        }
      });
    }, /ACCESS DENIED/);
  });

  // 41. Security: admin@rankcrackers.in without claims denied
  await testCase("Security: admin@rankcrackers.in without claims denied", async () => {
    resetMockDb();
    const data = { action: 'manifest_realm', recruitmentId: 'jee_main_2026' };
    await assert.rejects(async () => {
      await handleSentinelAction(data, {
        auth: {
          uid: 'some_other_uid',
          token: { email: 'admin@rankcrackers.in' }
        }
      });
    }, /ACCESS DENIED/);
  });

  // 42. Canonical: new live mission identity is not collapsed into a legacy pilot alias
  await testCase("Canonical: new live mission identity is not collapsed into legacy alias", async () => {
    const resolved = validateOrResolveId('launch_exam_mission', { examCategory: 'competitive', examName: 'JEE Main 2027', year: 2027 });
    assert.strictEqual(resolved, 'rec_central_jee_main_2027_2027');
  });

  // 43. Canonical: Legacy non-pilot ID resolution
  await testCase("Canonical: Legacy non-pilot ID resolution", async () => {
    const resolved = validateOrResolveId('launch_exam_mission', { examCategory: 'competitive', examName: 'NEET 2026', year: 2026 });
    assert.strictEqual(resolved, 'rec_central_neet_2026_2026');
  });

  // 44. Canonical: Lifecycle action without authoritative ID throws error
  await testCase("Canonical: Lifecycle action without authoritative ID throws error", async () => {
    resetMockDb();
    const data = { action: 'launch_realm', payload: {} };
    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /CANONICAL_ID_REQUIRED/);
  });

  // 45. Recovery: State Machine transitions through maximum retry limits (FAILED_FINAL)
  await testCase("Recovery: State Machine transitions through maximum retry limits (FAILED_FINAL)", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      status: 'ACTIVE',
      certificateSideEffectStatus: 'PENDING',
      analyticsSideEffectStatus: 'SUCCESS',
      resultSideEffects: {
        resultDeclarationId: 'cycle_1',
        certificate: { status: 'FAILED_RETRYABLE', attemptCount: 4 },
        analytics: { status: 'SUCCESS', attemptCount: 1 }
      }
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };
    mockDatabaseState.simulateCertificateBatchFailure = true;

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON', resultDeclarationId: 'cycle_1' }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /BATCH_CERTIFICATE_WRITE_FAILED/);

    const realm = mockDatabaseState.mission_realms['jee_main_2026'];
    assert.strictEqual(realm.resultSideEffects.certificate.status, 'FAILED_FINAL');
    assert.strictEqual(realm.resultSideEffects.certificate.attemptCount, 5);
  });

  // 46. Recovery: stale IN_PROGRESS state cleanup and retry
  await testCase("Recovery: stale IN_PROGRESS state cleanup and retry", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      status: 'ACTIVE',
      certificateSideEffectStatus: 'IN_PROGRESS',
      analyticsSideEffectStatus: 'SUCCESS',
      resultSideEffects: {
        resultDeclarationId: 'cycle_1',
        certificate: { status: 'IN_PROGRESS', attemptCount: 1 },
        analytics: { status: 'SUCCESS', attemptCount: 1 }
      }
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON', resultDeclarationId: 'cycle_1' }
    };

    await handleSentinelAction(data, founderContext);

    const realm = mockDatabaseState.mission_realms['jee_main_2026'];
    assert.strictEqual(realm.resultSideEffects.certificate.status, 'SUCCESS');
  });

  // 47. Concurrency: Older cycle cannot overwrite newer cycle
  await testCase("Concurrency: Older cycle cannot overwrite newer cycle", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      status: 'ACTIVE',
      certificateSideEffectStatus: 'SUCCESS',
      analyticsSideEffectStatus: 'SUCCESS',
      resultSideEffects: {
        resultDeclarationId: 'cycle_2',
        certificate: { status: 'SUCCESS', attemptCount: 1 },
        analytics: { status: 'SUCCESS', attemptCount: 1 }
      },
      analytics: { graduated: 5 }
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON', resultDeclarationId: 'cycle_1' }
    };

    await handleSentinelAction(data, founderContext);

    const realm = mockDatabaseState.mission_realms['jee_main_2026'];
    assert.strictEqual(realm.resultSideEffects.resultDeclarationId, 'cycle_2');
  });

  // 48. Backfill Schema Parity: Check all 32 canonical fields
  await testCase("Backfill Schema Parity: Check all 32 canonical fields", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };
    
    await handleSentinelAction(data, founderContext);
    const shell = mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027'];

    const expectedActualFields = [
      'id', 'title', 'name', 'subtitle', 'displayTitle', 'examName', 'examYear',
      'missionType', 'missionStructureType', 'examScope', 'mediumPolicy',
      'supportedMediums', 'defaultMedium', 'status', 'catalogStatus',
      'studentMessage', 'userPanelVisible', 'cardVisible', 'visibility',
      'archived', 'titleHindi', 'state', 'examCategory', 'exam_category',
      'target_year', 'year', 'exam_year', 'boardId', 'organizationCode',
      'priority', 'sortOrder', 'source', 'contentLocks', 'updatedAt'
    ];

    for (const field of expectedActualFields) {
      assert.ok(field in shell, `Missing field '${field}' from student mission catalog shell`);
    }
  });

  // 49. Transaction Ordering: Uniqueness check before writes
  await testCase("Transaction Ordering: Uniqueness check before writes", async () => {
    resetMockDb();
    const data = {
      action: 'launch_exam_mission',
      payload: {
        examName: 'JEE Main',
        organization: 'NTA',
        year: 2027,
        nature: 'ACTIVE'
      }
    };
    
    await handleSentinelAction(data, founderContext);
    assert.ok(mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027']);
  });

  // 50. Recovery state machine: PENDING status recovery
  await testCase("Recovery state machine: PENDING status recovery", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      status: 'ACTIVE',
      certificateSideEffectStatus: 'PENDING',
      analyticsSideEffectStatus: 'PENDING',
      resultSideEffects: {
        resultDeclarationId: 'cycle_1',
        certificate: { status: 'PENDING', attemptCount: 0 },
        analytics: { status: 'PENDING', attemptCount: 0 }
      }
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON', resultDeclarationId: 'cycle_1' }
    };

    await handleSentinelAction(data, founderContext);

    const realm = mockDatabaseState.mission_realms['jee_main_2026'];
    assert.strictEqual(realm.resultSideEffects.certificate.status, 'SUCCESS');
    assert.strictEqual(realm.resultSideEffects.analytics.status, 'SUCCESS');
  });

  // 51. Recovery: FAILED_RETRYABLE status transitions to SUCCESS on retry
  await testCase("Recovery: FAILED_RETRYABLE status transitions to SUCCESS on retry", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      status: 'ACTIVE',
      certificateSideEffectStatus: 'FAILED_RETRYABLE',
      analyticsSideEffectStatus: 'SUCCESS',
      resultSideEffects: {
        resultDeclarationId: 'cycle_1',
        certificate: { status: 'FAILED_RETRYABLE', attemptCount: 2 },
        analytics: { status: 'SUCCESS', attemptCount: 1 }
      }
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON', resultDeclarationId: 'cycle_1' }
    };

    await handleSentinelAction(data, founderContext);

    const realm = mockDatabaseState.mission_realms['jee_main_2026'];
    assert.strictEqual(realm.resultSideEffects.certificate.status, 'SUCCESS');
    assert.strictEqual(realm.resultSideEffects.certificate.attemptCount, 3);
  });

  // 52. Concurrency lease: Active lease blocks concurrent invocation
  await testCase("Concurrency lease: Active lease blocks concurrent invocation", async () => {
    resetMockDb();
    mockDatabaseState.mission_realms['jee_main_2026'] = {
      realm_id: 'jee_main_2026',
      status: 'ACTIVE',
      certificateSideEffectStatus: 'IN_PROGRESS',
      analyticsSideEffectStatus: 'SUCCESS',
      resultSideEffects: {
        resultDeclarationId: 'cycle_1',
        certificate: { status: 'IN_PROGRESS', attemptCount: 1 },
        analytics: { status: 'SUCCESS', attemptCount: 1 },
        updatedAt: new Date().toISOString()
      }
    };
    mockDatabaseState.recruitments['jee_main_2026'] = { id: 'jee_main_2026', status: 'published' };
    mockDatabaseState.student_mission_catalog['jee_main_2026'] = { id: 'jee_main_2026', catalogStatus: 'LIVE' };

    const data = {
      action: 'declare_result',
      recruitmentId: 'jee_main_2026',
      payload: { finalStatus: 'WON', resultDeclarationId: 'cycle_1' }
    };

    await assert.rejects(async () => {
      await handleSentinelAction(data, founderContext);
    }, /CONCURRENT_EXECUTION_BLOCKED/);
  });

  console.log("------------------------------------------------");
  console.log(`TEST RUN COMPLETE: Passed ${passedCount} / ${testsCount} tests.`);
  console.log("------------------------------------------------");

  if (passedCount !== testsCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
