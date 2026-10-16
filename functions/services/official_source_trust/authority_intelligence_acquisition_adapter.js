/**
 * 🔱 AUTHORITY INTELLIGENCE → ACQUISITION ADAPTER (P2B)
 * =============================================================================
 * Pure backend adapter between verified Authority Intelligence events and the
 * official document acquisition pipeline.
 *
 * Invariants:
 *   - Does NOT modify authority_intelligence_events schema or collection.
 *   - Strictly extracts officialUrl, authorityKey, eventId, updateType, and targetYear.
 *   - Guarantees eventId != notificationId.
 *   - Zero mission creation; zero publication.
 */

'use strict';

const { acquireOfficialDocument } = require('./official_document_acquisition');

/**
 * Materializes an official document from a verified Authority Intelligence event.
 *
 * @param {object} params
 * @param {object} params.event - Authority Intelligence event document
 * @param {object} params.db - Firestore database handle
 * @param {object} [params.storageClient] - Injected storage client or bucket handle
 * @param {string} [params.storageBucket] - Cloud Storage bucket name
 * @param {object} [params.options] - Downloader options or injected fetcher
 * @returns {Promise<object>} Acquisition outcome
 */
async function acquireDocumentFromAuthorityEvent({
  event,
  db,
  storageClient = null,
  storageBucket = null,
  options = {},
}) {
  if (!event || typeof event !== 'object') {
    throw new Error('ADAPTER_EVENT_REQUIRED: valid Authority Intelligence event is required.');
  }

  if (!event.officialUrl || typeof event.officialUrl !== 'string') {
    throw new Error(`ADAPTER_EVENT_NO_URL: Event '${event.eventId || 'UNKNOWN'}' has no officialUrl to acquire.`);
  }

  if (!event.authorityKey || typeof event.authorityKey !== 'string') {
    throw new Error(`ADAPTER_EVENT_NO_AUTHORITY: Event '${event.eventId || 'UNKNOWN'}' is missing authorityKey.`);
  }

  return acquireOfficialDocument({
    authorityKey: event.authorityKey,
    sourceUrl: event.officialUrl,
    discoveryEventId: event.eventId,
    watchUpdateType: event.updateType || 'NEW_NOTIFICATION',
    documentRole: event.documentRole || 'notification',
    sourceType: event.sourceType || null,
    expectedSha256: event.documentSha256 || null,
    targetYear: event.targetYear || null,
    db,
    storageClient,
    storageBucket,
    options,
  });
}

module.exports = {
  acquireDocumentFromAuthorityEvent,
};
