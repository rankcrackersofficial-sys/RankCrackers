const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { resolveStorageAssetPath, authorizeSecureAssetPath } = require('../services/secure_asset_scope');

/**
 * 🔱 SECURE ASSET DOWNLOAD (Hardened v1.1 - Audit Hardened)
 * Generates time-limited V4 Signed URLs and logs access for piracy protection.
 */
exports.getSecureAssetUrl = functions.https.onCall(async (data, context) => {
  const { auth } = context;

  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }

  const { assetUrl, realmId, assetType } = data;
  if (!assetUrl || !realmId || !assetType) {
    throw new functions.https.HttpsError('invalid-argument', '🔱 COMMAND DENIED: assetUrl, realmId, and assetType are required.');
  }

  try {
    const db = admin.firestore();

    const bucket = admin.storage().bucket();
    let filePath;
    try {
      filePath = resolveStorageAssetPath(assetUrl, bucket.name);
      let realm = null;
      // An Admin SDK signed URL bypasses Storage rules. For public mission
      // assets, independently require an actually visible canonical realm.
      if (auth.token.founder !== true && auth.token.admin !== true
          && filePath.startsWith('assets/')) {
        const realmSnap = await db.collection('mission_realms').doc(realmId).get();
        realm = realmSnap.exists ? realmSnap.data() : null;
      }
      authorizeSecureAssetPath({
        filePath, uid: auth.uid, claims: auth.token, realmId, realm,
      });
    } catch (policyError) {
      throw new functions.https.HttpsError('permission-denied',
        '🔱 Asset request is not authorized.');
    }

    const file = bucket.file(filePath);

    // Check if file exists before signing
    const [exists] = await file.exists();
    if (!exists) {
        throw new functions.https.HttpsError('not-found', '🔱 ERROR: Physical asset not found in storage.');
    }

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // 5 Minute Expiry
    });

    // 🔱 Audit B: Signed URL Audit Trail (Abuse Detection)
    const ip = context.rawRequest?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               context.rawRequest?.ip ||
               '0.0.0.0';

    await db.collection('download_audit').add({
      uid: auth.uid,
      realmId: realmId || 'unknown',
      assetType: assetType || 'unknown',
      filePath: filePath,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: ip
    });

    return {
        success: true,
        signedUrl,
        expiresIn: '5m'
    };

  } catch (error) {
    console.error(`🔱 SECURE DOWNLOAD ERROR:`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Failed to generate secure link.');
  }
});
