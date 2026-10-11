'use strict';

/**
 * Defense in depth: Admin SDK signed URLs BYPASS Firebase Storage rules.
 * Never use a caller's bucket/path alone as authorization.
 */
function resolveStorageAssetPath(assetUrl, bucketName) {
  if (typeof assetUrl !== 'string' || !assetUrl.trim()
      || typeof bucketName !== 'string' || !bucketName.trim()) {
    throw new Error('SECURE_ASSET_IDENTITY_REQUIRED');
  }
  let raw = assetUrl.trim();
  if (/^(?:https?:|gs:)/i.test(raw)) {
    let url;
    try { url = new URL(raw); } catch (_) { throw new Error('SECURE_ASSET_URL_INVALID'); }
    if (url.protocol === 'gs:') {
      if (url.host !== bucketName || url.search || url.hash) {
        throw new Error('SECURE_ASSET_BUCKET_MISMATCH');
      }
      raw = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    } else {
      if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com'
          || url.username || url.password || url.port) {
        throw new Error('SECURE_ASSET_HOST_NOT_TRUSTED');
      }
      const parts = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!parts || decodeURIComponent(parts[1]) !== bucketName) {
        throw new Error('SECURE_ASSET_BUCKET_MISMATCH');
      }
      raw = decodeURIComponent(parts[2]);
    }
  }
  if (!raw || raw.startsWith('/') || /[\\\u0000-\u001f?#]/.test(raw)
      || raw.split('/').some(segment => !segment || segment === '.' || segment === '..')
      || /%(?:2f|5c|2e|00)/i.test(raw)) {
    throw new Error('SECURE_ASSET_PATH_INVALID');
  }
  return raw;
}

function isVisibleRealm(realm) {
  if (!realm || typeof realm !== 'object' || realm.archived === true) return false;
  const gate = realm.visibilityGate || {};
  return realm.cardVisible === true || realm.userPanelVisible === true
    || gate.studentVisible === true || gate.userPanelVisible === true;
}

function authorizeSecureAssetPath({ filePath, uid, claims, realmId, realm }) {
  if (typeof uid !== 'string' || !uid || filePath.split('/').length < 2) {
    throw new Error('SECURE_ASSET_ACTOR_REQUIRED');
  }
  if (claims?.founder === true || claims?.admin === true) return true;
  // Self-owned files cannot be upgraded into arbitrary other-user access.
  if (filePath.startsWith('users/' + uid + '/')
      || filePath.startsWith('certificates/' + uid + '/')) return true;
  if (typeof realmId === 'string' && realmId.trim()
      && filePath.startsWith('assets/' + realmId + '/')
      && isVisibleRealm(realm)) return true;
  throw new Error('SECURE_ASSET_PATH_NOT_AUTHORIZED');
}

module.exports = {
  resolveStorageAssetPath,
  authorizeSecureAssetPath,
  isVisibleRealm,
};
