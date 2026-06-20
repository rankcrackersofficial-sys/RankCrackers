const functions = require("firebase-functions");
const admin = require("firebase-admin");

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
    let filePath = assetUrl;

    // 🔱 Logic: Resolve storage path from Firebase public URL
    if (assetUrl.includes('firebasestorage.googleapis.com')) {
      const parts = assetUrl.split('/o/')[1].split('?')[0];
      filePath = decodeURIComponent(parts);
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
