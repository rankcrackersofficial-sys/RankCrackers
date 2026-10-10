/**
 * STANDALONE ORPHAN CLEANUP SCRIPT: test_mission_catalog_bridge
 * 
 * Gate: 48B1 / Governance Safe
 * Mode: DRY-RUN by default. Pass --apply to execute.
 * 
 * SAFETY INVARIANTS:
 * - NEVER touches any document other than 'test_mission_catalog_bridge'
 * - Verifies collection state across mission_realms, recruitments, student_mission_catalog
 * - Idempotent: safe to run repeatedly
 */

const admin = require('firebase-admin');

async function runCleanup() {
  const isApply = process.argv.includes('--apply');
  console.log('================================================================================');
  console.log('CLEANUP PREFLIGHT: test_mission_catalog_bridge');
  console.log('Mode: ' + (isApply ? '*** LIVE WRITE (APPLY) ***' : 'DRY RUN ONLY (Zero Writes)'));
  console.log('================================================================================');

  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const targetId = 'test_mission_catalog_bridge';
  const collections = ['mission_realms', 'recruitments', 'student_mission_catalog'];

  const audit = {};
  for (const col of collections) {
    const docRef = db.collection(col).doc(targetId);
    const snap = await docRef.get();
    audit[col] = snap.exists ? { exists: true, data: snap.data() } : { exists: false };
    console.log(`Collection [${col}]: exists = ${snap.exists}`);
  }

  if (!isApply) {
    console.log('\n[DRY RUN COMPLETE] Zero modifications performed.');
    console.log('To apply deletion of orphan, run: node scripts/cleanup_test_mission_catalog_bridge.js --apply');
    return;
  }

  console.log('\n[APPLYING DELETION] Proceeding with orphan removal...');
  for (const col of collections) {
    if (audit[col].exists) {
      await db.collection(col).doc(targetId).delete();
      console.log(`Deleted ${col}/${targetId}`);
    } else {
      console.log(`Skipping ${col}/${targetId} (does not exist)`);
    }
  }
  console.log('Deletion applied successfully.');
}

if (require.main === module) {
  runCleanup().catch(err => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  });
}

module.exports = { runCleanup };
