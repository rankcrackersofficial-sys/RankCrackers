const assert = require('assert');
const admin = require('firebase-admin');

// Initialize admin app if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}

const { buildStudentMissionCatalogShell, mirrorMissionShellToStudentCatalog } = require('./callable/handle_sentinel_action');

console.log("================================================");
console.log("RUNNING TRANSACTIONAL MISSION MIRROR UNIT TESTS");
console.log("================================================");

let testsCount = 0;
let passedCount = 0;

function it(description, testFn) {
  testsCount++;
  try {
    testFn();
    console.log(`✅ PASS: ${description}`);
    passedCount++;
  } catch (error) {
    console.error(`❌ FAIL: ${description}`);
    console.error(error);
  }
}

// 1. Test buildStudentMissionCatalogShell properties and validations
it("should throw error if realmId is missing", () => {
  assert.throws(() => {
    buildStudentMissionCatalogShell(null, {}, {}, 'launch_exam_mission');
  }, /CANONICAL_ID_REQUIRED/);
});

it("should build default STAGED/manifest_realm catalog payload correctly", () => {
  const realmId = 'rec_rpsc_exam_2026';
  const realmData = {
    realm_id: realmId,
    recruitment_name: 'RPSC Exam',
    organization: 'RPSC',
    exam_year: 2026,
    status: 'STAGED'
  };
  const recruitmentData = {
    title: 'RPSC Exam',
    org: 'RPSC',
    year: 2026,
    examCategory: 'competitive',
    titleHindi: 'आरपीएससी परीक्षा'
  };

  const payload = buildStudentMissionCatalogShell(realmId, realmData, recruitmentData, 'manifest_realm');

  assert.strictEqual(payload.mission_id, realmId);
  assert.strictEqual(payload.id, realmId);
  assert.strictEqual(payload.title, 'RPSC Exam');
  assert.strictEqual(payload.titleHindi, 'आरपीएससी परीक्षा');
  assert.strictEqual(payload.examCategory, 'competitive');
  assert.strictEqual(payload.target_year, 2026);
  assert.strictEqual(payload.cardVisible, true);
  assert.strictEqual(payload.userPanelVisible, false);
  assert.strictEqual(payload.archived, false);
  assert.strictEqual(payload.status, 'COMING_SOON');
  assert.strictEqual(payload.catalogStatus, 'COMING_SOON');
  assert.strictEqual(payload.studentMessage, 'Mission is being prepared. Content will unlock soon.');
});

it("should build ACTIVE/launch_realm catalog payload correctly", () => {
  const realmId = 'rec_rpsc_exam_2026';
  const realmData = {
    realm_id: realmId,
    exam_name: 'RPSC Exam',
    status: 'ACTIVE',
    notification_ids: ['notif_123']
  };
  const recruitmentData = {
    title: 'RPSC Exam',
    org: 'RPSC',
    year: 2026
  };

  const payload = buildStudentMissionCatalogShell(realmId, realmData, recruitmentData, 'launch_realm');

  assert.strictEqual(payload.status, 'LIVE');
  assert.strictEqual(payload.catalogStatus, 'LIVE');
  assert.strictEqual(payload.userPanelVisible, true);
  assert.strictEqual(payload.cardVisible, true);
  assert.strictEqual(payload.archived, false);
  assert.strictEqual(payload.contentReadiness.notification, 'uploaded');
  assert.strictEqual(payload.studentMessage, 'Mission is live and fully accessible!');
});

it("should build ARCHIVED catalog payload correctly", () => {
  const realmId = 'rec_rpsc_exam_2026';
  const realmData = {
    realm_id: realmId,
    exam_name: 'RPSC Exam',
    status: 'ARCHIVED'
  };
  const recruitmentData = {
    title: 'RPSC Exam',
    org: 'RPSC',
    year: 2026
  };

  const payload = buildStudentMissionCatalogShell(realmId, realmData, recruitmentData, 'archive_realm');

  assert.strictEqual(payload.status, 'ARCHIVED');
  assert.strictEqual(payload.catalogStatus, 'ARCHIVED');
  assert.strictEqual(payload.userPanelVisible, false);
  assert.strictEqual(payload.cardVisible, false);
  assert.strictEqual(payload.archived, true);
  assert.strictEqual(payload.studentMessage, 'This mission has been archived.');
});

// 2. Test transactional mirrorMissionShellToStudentCatalog mock behavior
it("should create catalog shell if document does not exist", async () => {
  let setCalled = false;
  let targetRef = null;
  let targetPayload = null;

  const mockTransaction = {
    get: async (ref) => {
      return { exists: false };
    },
    set: (ref, payload, options) => {
      setCalled = true;
      targetRef = ref;
      targetPayload = payload;
    }
  };

  const mockDb = {
    collection: (name) => {
      assert.strictEqual(name, 'student_mission_catalog');
      return {
        doc: (id) => `REF_${id}`
      };
    }
  };

  const realmId = 'rec_rpsc_exam_2026';
  const realmData = { exam_name: 'RPSC' };
  const recruitmentData = { title: 'RPSC' };

  await mirrorMissionShellToStudentCatalog(mockTransaction, mockDb, realmId, realmData, recruitmentData, 'launch_exam_mission');

  assert.strictEqual(setCalled, true);
  assert.strictEqual(targetRef, 'REF_rec_rpsc_exam_2026');
  assert.ok(targetPayload.createdAt);
  assert.ok(targetPayload.created_at);
});

it("should update catalog shell with merge option if document exists", async () => {
  let setCalled = false;
  let mergeOption = false;

  const mockTransaction = {
    get: async (ref) => {
      return { exists: true };
    },
    set: (ref, payload, options) => {
      setCalled = true;
      mergeOption = options && options.merge === true;
    }
  };

  const mockDb = {
    collection: (name) => {
      assert.strictEqual(name, 'student_mission_catalog');
      return {
        doc: (id) => `REF_${id}`
      };
    }
  };

  const realmId = 'rec_rpsc_exam_2026';
  const realmData = { exam_name: 'RPSC' };
  const recruitmentData = { title: 'RPSC' };

  await mirrorMissionShellToStudentCatalog(mockTransaction, mockDb, realmId, realmData, recruitmentData, 'pause_realm');

  assert.strictEqual(setCalled, true);
  assert.strictEqual(mergeOption, true);
});

console.log("------------------------------------------------");
console.log(`TEST RUN COMPLETE: Passed ${passedCount} / ${testsCount} tests.`);
console.log("------------------------------------------------");

if (passedCount !== testsCount) {
  process.exit(1);
} else {
  process.exit(0);
}
