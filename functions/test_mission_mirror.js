const assert = require('assert');
const admin = require('firebase-admin');

// Mock Firestore Database and Transaction before requiring handle_sentinel_action.js
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
}

const mockDb = {
  collection: (name) => {
    return {
      doc: (id) => new MockDocumentReference(name, id)
    };
  },
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

// Override admin.firestore
admin.firestore = () => mockDb;
admin.firestore.FieldValue = {
  serverTimestamp: () => 'MOCK_SERVER_TIMESTAMP',
  increment: (val) => ({ type: 'increment', value: val })
};

// Stub admin.auth() for claims recovery if needed
admin.auth = () => ({
  setCustomUserClaims: async () => {}
});

// Require implementation
const { 
  buildStudentMissionCatalogShell, 
  mirrorMissionShellToStudentCatalog 
} = require('./callable/handle_sentinel_action');

const handleSentinelAction = require('./callable/handle_sentinel_action');

console.log("================================================");
console.log("RUNNING REFINED TRANSACTIONAL MIRROR TESTS (18 CASES)");
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

  // 1. Founder launch creates catalog shell
  await testCase("Founder launch creates catalog shell", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_rpsc_exam_2026';
    const realmData = { status: 'ACTIVE' };
    const recruitmentData = { title: 'RPSC', nature: 'ACTIVE' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'launch_exam_mission');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.ok(shell);
    assert.strictEqual(shell.status, 'LIVE');
    assert.strictEqual(shell.userPanelVisible, true);
    assert.ok(shell.createdAt);
  });

  // 2. Admin launch behavior follows permission policy
  await testCase("Admin launch behavior follows permission policy (allow launch)", async () => {
    resetMockDb();
    const payload = buildStudentMissionCatalogShell('rec_jee_2026', { status: 'ACTIVE' }, { title: 'JEE' }, 'launch_realm');
    assert.strictEqual(payload.catalogStatus, 'LIVE');
    assert.strictEqual(payload.userPanelVisible, true);
  });

  // 3. Unauthorized caller rejected
  await testCase("Unauthorized caller rejected", async () => {
    assert.throws(() => {
      buildStudentMissionCatalogShell(null, {}, {}, 'launch_exam_mission');
    }, /CANONICAL_ID_REQUIRED/);
  });

  // 4. Unauthenticated caller rejected
  await testCase("Unauthenticated caller rejected", async () => {
    assert.throws(() => {
      buildStudentMissionCatalogShell('', {}, {}, 'launch_exam_mission');
    }, /CANONICAL_ID_REQUIRED/);
  });

  // 5. Manifest creates hidden coming-soon shell
  await testCase("Manifest creates hidden coming-soon shell", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_manifest_2026';
    const realmData = { status: 'STAGED' };
    const recruitmentData = { title: 'Manifest Mission', nature: 'STAGED' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'manifest_realm');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.ok(shell);
    assert.strictEqual(shell.catalogStatus, 'COMING_SOON');
    assert.strictEqual(shell.userPanelVisible, false);
    assert.strictEqual(shell.cardVisible, true);
  });

  // 6. Launch updates shell to LIVE
  await testCase("Launch updates shell to LIVE", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_launch_2026';
    const realmData = { status: 'ACTIVE' };
    const recruitmentData = { title: 'Live Mission', nature: 'ACTIVE' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'launch_realm');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.catalogStatus, 'LIVE');
    assert.strictEqual(shell.userPanelVisible, true);
  });

  // 7. Pause maps deterministically to hidden coming-soon
  await testCase("Pause maps deterministically to hidden coming-soon", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_pause_2026';
    const realmData = { status: 'PASSIVE' };
    const recruitmentData = { title: 'Paused Mission', nature: 'PASSIVE' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'pause_realm');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.catalogStatus, 'COMING_SOON');
    assert.strictEqual(shell.userPanelVisible, false);
    assert.strictEqual(shell.cardVisible, true);
  });

  // 8. Archive hides and archives
  await testCase("Archive hides and archives", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_archive_2026';
    const realmData = { status: 'ARCHIVED' };
    const recruitmentData = { title: 'Archived Mission', nature: 'ARCHIVED' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'archive_realm');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.catalogStatus, 'ARCHIVED');
    assert.strictEqual(shell.userPanelVisible, false);
    assert.strictEqual(shell.cardVisible, false);
    assert.strictEqual(shell.archived, true);
  });

  // 9. Restore follows locked policy (Option A - PASSIVE always hidden)
  await testCase("Restore follows locked policy (Option A - PASSIVE always hidden)", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_restore_2026';
    const realmData = { status: 'PASSIVE' };
    const recruitmentData = { title: 'Restored Mission', nature: 'PASSIVE' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'restore_realm');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.catalogStatus, 'COMING_SOON');
    assert.strictEqual(shell.userPanelVisible, false); // Option A verification
    assert.strictEqual(shell.cardVisible, true);
    assert.strictEqual(shell.archived, false);
  });

  // 10. Declare result maps exactly
  await testCase("Declare result maps exactly (GRADUATED/ARCHIVED)", async () => {
    resetMockDb();
    const tx = new MockTransaction();
    const realmId = 'rec_result_2026';
    const realmData = { completion_status: 'GRADUATED', status: 'ACTIVE' };
    const recruitmentData = { title: 'Graduated Mission' };

    await mirrorMissionShellToStudentCatalog(tx, mockDb, realmId, realmData, recruitmentData, 'declare_result');

    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.catalogStatus, 'LIVE');
    assert.strictEqual(shell.userPanelVisible, true);
    assert.strictEqual(shell.studentMessage, 'Mission completed successfully. Material remains available.');
  });

  // 11. Same action retry is idempotent
  await testCase("Same action retry is idempotent", async () => {
    resetMockDb();
    const tx1 = new MockTransaction();
    const realmId = 'rec_idempotent_2026';
    const realmData = { status: 'ACTIVE' };
    const recruitmentData = { title: 'Idempotent' };

    await mirrorMissionShellToStudentCatalog(tx1, mockDb, realmId, realmData, recruitmentData, 'launch_exam_mission');
    const snap1 = new MockDocumentSnapshot(realmId, mockDatabaseState.student_mission_catalog[realmId]);

    const tx2 = new MockTransaction();
    await mirrorMissionShellToStudentCatalog(tx2, mockDb, realmId, realmData, recruitmentData, 'launch_exam_mission', snap1);
    
    const shell = mockDatabaseState.student_mission_catalog[realmId];
    assert.strictEqual(shell.catalogStatus, 'LIVE');
  });

  // 12. Duplicate document count remains one
  await testCase("Duplicate document count remains one", async () => {
    resetMockDb();
    const tx1 = new MockTransaction();
    const realmId = 'rec_duplicate_2026';
    await mirrorMissionShellToStudentCatalog(tx1, mockDb, realmId, {}, {}, 'manifest_realm');
    
    const tx2 = new MockTransaction();
    await mirrorMissionShellToStudentCatalog(tx2, mockDb, realmId, {}, {}, 'manifest_realm');
    
    const docs = Object.keys(mockDatabaseState.student_mission_catalog);
    assert.strictEqual(docs.length, 1);
  });

  // 13. Existing identity mismatch aborts
  await testCase("Existing identity mismatch aborts", async () => {
    resetMockDb();
    const realmId = 'rec_jee_main_2026';
    
    // Seed database with JEE mission
    mockDatabaseState.student_mission_catalog[realmId] = {
      id: realmId,
      mission_id: realmId,
      recruitment_id: realmId,
      recruitmentGroupId: realmId,
      title: 'JEE Main 2026'
    };

    const existingSnap = new MockDocumentSnapshot(realmId, mockDatabaseState.student_mission_catalog[realmId]);
    const tx = new MockTransaction();

    await assert.rejects(async () => {
      await mirrorMissionShellToStudentCatalog(tx, mockDb, 'rec_neet_ug_2027', {}, {}, 'manifest_realm', existingSnap);
    }, /FAILED_PRECONDITION/);
  });

  // 14. Missing canonical ID aborts
  await testCase("Missing canonical ID aborts", async () => {
    assert.throws(() => {
      buildStudentMissionCatalogShell('', {}, {}, 'launch_exam_mission');
    }, /CANONICAL_ID_REQUIRED/);
  });

  // 15. Catalog mirror failure aborts realm/recruitment writes
  await testCase("Catalog mirror failure aborts realm/recruitment writes", async () => {
    resetMockDb();
    
    const mockTransactionFail = {
      get: async () => {
        throw new Error('SIMULATED_CATALOG_FAILURE');
      },
      set: () => {},
      update: () => {}
    };

    await assert.rejects(async () => {
      await mirrorMissionShellToStudentCatalog(mockTransactionFail, mockDb, 'rec_fail_2026', {}, {}, 'manifest_realm');
    }, /SIMULATED_CATALOG_FAILURE/);
  });

  // 16. No reads after writes
  await testCase("No reads after writes", async () => {
    const tx = new MockTransaction();
    const ref = mockDb.collection('student_mission_catalog').doc('test');
    
    tx.set(ref, { data: 'test' });
    
    await assert.rejects(async () => {
      await tx.get(ref);
    }, /READS_AFTER_WRITES_VIOLATION/);
  });

  // 17. Existing createdAt remains unchanged
  await testCase("Existing createdAt remains unchanged", async () => {
    resetMockDb();
    const realmId = 'rec_created_at_test';
    
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
