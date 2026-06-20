const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * PHYSICAL STORAGE CLEANUP WORKER (Hardened v1.2 - Audit Trail Preservation)
 * Destroy Bytes, Preserve Knowledge.
 *
 * CONSTITUTIONAL RULES:
 * 1. Physical deletion occurs ONLY if 'purgeApproved' is TRUE.
 * 2. Firestore records are NEVER deleted; they are marked as 'purged'.
 * 3. Audit trail must remain intact (Who, What, When).
 */
exports.physicalStorageCleanupWorker = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log(" PURGE: Initiating Founder-Authorized audit strike...");

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    //  TARGET: Explicitly authorized purges only
    const purgeSnap = await db.collection('ingestion_refinery')
      .where('purgeApproved', '==', true)
      .where('storagePurged', '!=', true) // Safeguard S-05
      .limit(100)
      .get();

    if (purgeSnap.empty) {
        console.log(" PURGE: No new authorized purges found.");
        return null;
    }

    console.log(` PURGE: Found ${purgeSnap.size} records authorized for destruction.`);

    for (const doc of purgeSnap.docs) {
        const data = doc.data();

        //  Safeguard: Skip if already processed
        if (data.storagePurged === true) continue;

        if (data.storagePath) {
            try {
                await bucket.file(data.storagePath).delete();
                console.log(`PURGE SUCCESS: Physical bytes destroyed for ${data.storagePath}`);

                // AUDIT PRESERVATION (Finding S-04 Fix)
                await doc.ref.update({
                    status: 'purged',
                    storagePurged: true,
                    purgedAt: admin.firestore.FieldValue.serverTimestamp(),
                    sourceUrl: admin.firestore.FieldValue.delete(), // Physical link severed
                    lastAction: 'physical_purge'
                });
            } catch (e) {
                console.warn(`PURGE WARNING: Physical file already missing or unreachable - ${e.message}`);
                // Still mark as purged in DB to stop retry loop
                await doc.ref.update({ storagePurged: true, purgeError: e.message });
            }
        }
    }

    console.log("PURGE: Audit strike complete. Memory preserved, bytes destroyed.");
    return null;
  });
