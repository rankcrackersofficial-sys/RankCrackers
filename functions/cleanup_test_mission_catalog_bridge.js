const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const TEST_MISSION_ID = 'test_mission_catalog_bridge';
const CONFIRMATION = 'CONFIRM_CLEANUP_TEST_MISSION_CATALOG_BRIDGE';
const PROTECTED_MISSION_PATTERNS = [/jee/i, /neet/i, /rpsc/i];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || !args.includes('--apply'),
    apply: args.includes('--apply'),
    confirmation: args[args.indexOf('--apply') + 1] || '',
  };
}

function assertHardSafety(missionId) {
  if (missionId !== TEST_MISSION_ID) {
    throw new Error(`STOP: mission ID is not exactly ${TEST_MISSION_ID}. Received: ${missionId}`);
  }
  for (const pattern of PROTECTED_MISSION_PATTERNS) {
    if (pattern.test(missionId)) {
      throw new Error(`STOP: cleanup target matched protected real mission pattern: ${missionId}`);
    }
  }
}

async function createDb() {
  let token;
  try {
    token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Authentication Error: Could not get gcloud access token. Ensure gcloud is logged in.', e.message);
    process.exit(1);
  }

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });

  return new Firestore({
    projectId: 'rankcrackers-55',
    authClient: auth,
  });
}

async function inspectDoc(ref) {
  const snap = await ref.get();
  const subcollections = await ref.listCollections();
  return {
    exists: snap.exists,
    ref,
    path: ref.path,
    subcollections: subcollections.map((collection) => collection.id),
  };
}

async function archiveDoc(docInfo) {
  if (!docInfo.exists) return 'not_found';
  await docInfo.ref.set({
    archived: true,
    status: 'archived_test_mission',
    userPanelVisible: false,
    cardVisible: false,
    archived_reason: 'temporary_m4b_live_bridge_test_cleanup',
    archived_at: FieldValue.serverTimestamp(),
  }, { merge: true });
  return 'archived';
}

async function deleteDoc(docInfo) {
  if (!docInfo.exists) return 'not_found';
  await docInfo.ref.delete();
  return 'deleted';
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH M7 — REMOVE TEST MISSION CATALOG BRIDGE');
  console.log('================================================================================');

  const { dryRun, apply, confirmation } = parseArgs();
  assertHardSafety(TEST_MISSION_ID);

  if (apply && confirmation !== CONFIRMATION) {
    throw new Error(`STOP: apply requires exact confirmation: ${CONFIRMATION}`);
  }

  const db = await createDb();
  const catalogRef = db.collection('student_mission_catalog').doc(TEST_MISSION_ID);
  const missionRef = db.collection('mission_realms').doc(TEST_MISSION_ID);

  const catalogInfo = await inspectDoc(catalogRef);
  const missionInfo = await inspectDoc(missionRef);
  const relatedSubcollections = [
    ...catalogInfo.subcollections.map((id) => `${catalogInfo.path}/${id}`),
    ...missionInfo.subcollections.map((id) => `${missionInfo.path}/${id}`),
  ];
  const hasSubcollections = relatedSubcollections.length > 0;
  const plannedAction = hasSubcollections ? 'archive test docs' : 'delete test docs if they exist';

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log(`Target mission ID: ${TEST_MISSION_ID}`);
  console.log(`student_mission_catalog/${TEST_MISSION_ID} exists: ${catalogInfo.exists ? 'yes' : 'no'}`);
  console.log(`mission_realms/${TEST_MISSION_ID} exists: ${missionInfo.exists ? 'yes' : 'no'}`);
  console.log(`Related subcollections found: ${relatedSubcollections.length ? relatedSubcollections.join(', ') : 'none'}`);
  console.log(`Planned action: ${plannedAction}`);

  if (dryRun) {
    console.log('Dry run only. No documents were changed.');
    console.log('PATCH_M7_DRY_RUN_READY');
    return;
  }

  let catalogAction;
  let missionAction;
  if (hasSubcollections) {
    catalogAction = await archiveDoc(catalogInfo);
    missionAction = await archiveDoc(missionInfo);
  } else {
    catalogAction = await deleteDoc(catalogInfo);
    missionAction = await deleteDoc(missionInfo);
  }

  console.log(`Applied action for ${catalogInfo.path}: ${catalogAction}`);
  console.log(`Applied action for ${missionInfo.path}: ${missionAction}`);

  const remainingVisibleSnap = await db.collection('student_mission_catalog')
    .where('cardVisible', '==', true)
    .get();
  const visibleIds = remainingVisibleSnap.docs.map((doc) => doc.id).sort();
  console.log(`Visible student_mission_catalog docs remaining (${visibleIds.length}): ${visibleIds.join(', ') || 'none'}`);

  const testSnapAfter = await catalogRef.get();
  const testVisibleAfter = testSnapAfter.exists && testSnapAfter.data().cardVisible !== false && testSnapAfter.data().userPanelVisible !== false;
  console.log(`test_mission_catalog_bridge visible after cleanup: ${testVisibleAfter ? 'YES' : 'NO'}`);
  console.log('No JEE/NEET/RPSC mission was selected or touched by this script.');
  console.log('PATCH_M7_APPLY_READY');
}

main().catch((error) => {
  console.error('PATCH_M7_BLOCKED');
  console.error(error.message || error);
  process.exit(1);
});