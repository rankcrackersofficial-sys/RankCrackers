const assert = require('assert');

// Mock Firestore Database and Transaction
const mockDatabaseState = {};
const allowedCollections = new Set([
  'mission_realms',
  'recruitments',
  'student_mission_catalog',
  'sentinel_drafts',
  'certificates'
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

// Require implementation
const { 
  handleSentinelAction,
  buildStudentMissionCatalogShell, 
  mirrorMissionShellToStudentCatalog
} = require('./callable/handle_sentinel_action');

const {
  resolveCanonicalMissionId,
  validateOrResolveId
} = require('./canonical_mission_registry');

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
      token: { admin: true, email: 'admin@rankcrackers.in' }
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

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.ok(shell);
    assert.strictEqual(shell.status, 'LIVE');
    assert.strictEqual(shell.userPanelVisible, true);
  });

  // 2. Admin launch behavior follows permission policy (allow launch)
  await testCase("Admin launch behavior follows permission policy (allow launch)", async () => {
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
    
    await handleSentinelAction(data, adminContext);
    
    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.ok(shell);
    assert.strictEqual(shell.status, 'LIVE');
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
    assert.strictEqual(shell.catalogStatus, 'COMING_SOON');
    assert.strictEqual(shell.userPanelVisible, false);
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
      recruitmentId: 'jee_main_2026'
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'LIVE');
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
      recruitmentId: 'jee_main_2026'
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'COMING_SOON');
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
      recruitmentId: 'jee_main_2026'
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
      recruitmentId: 'jee_main_2026'
    };

    await handleSentinelAction(data, founderContext);

    const shell = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    assert.strictEqual(shell.catalogStatus, 'COMING_SOON');
    assert.strictEqual(shell.userPanelVisible, false); // Option A: always hidden on restore/passive
    assert.strictEqual(shell.cardVisible, true);
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
    assert.strictEqual(shell.catalogStatus, 'LIVE');
    assert.strictEqual(shell.userPanelVisible, true);
    assert.strictEqual(shell.studentMessage, 'Mission completed successfully. Material remains available.');
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
    const doc1 = mockDatabaseState.student_mission_catalog['jee_main_2026'];
    
    await handleSentinelAction(data, founderContext);
    const doc2 = mockDatabaseState.student_mission_catalog['jee_main_2026'];

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
      recruitmentId: realmId
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

  // 19. Canonical mapping of JEE Main 2027 to jee_main_2026
  await testCase("Canonical mapping of JEE Main 2027 to jee_main_2026", async () => {
    const mapped = resolveCanonicalMissionId('JEE Main', 'NTA', 2027);
    assert.strictEqual(mapped, 'jee_main_2026');
  });

  // 20. Duplicate-Mission Migration Risk (prevent rec_nta_jee_main_2027 creation)
  await testCase("Duplicate-Mission Migration Risk (prevent rec_nta_jee_main_2027)", async () => {
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

    // Verify it resolved to jee_main_2026 and NOT rec_nta_jee_main_2027
    assert.ok(mockDatabaseState.student_mission_catalog['jee_main_2026']);
    assert.strictEqual(mockDatabaseState.student_mission_catalog['rec_nta_jee_main_2027'], undefined);
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
    assert.strictEqual(shell.mission_id, 'jee_main_2026');
    assert.strictEqual(shell.name, 'JEE Main');
    assert.strictEqual(shell.title, 'JEE Main');
    assert.strictEqual(shell.boardId, 'NTA');
    assert.strictEqual(shell.organizationCode, 'NTA');
    assert.strictEqual(shell.year, 2027);
    assert.strictEqual(shell.target_year, 2027);
    assert.strictEqual(shell.priority, 5);
    assert.strictEqual(shell.sortOrder, 5);
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
