/**
 * 🔱 OFFICIAL AUTHORITY INTELLIGENCE EVENT PERSISTENCE STORE
 * Target Collection: authority_intelligence_events
 * Command: RC-AUTHORITY-INTELLIGENCE-EVENT-PERSISTENCE-AND-FOUNDER-READ-CONTRACT-AG1-20260913
 *
 * Laws:
 *   - Deterministic eventId from dedupe contract.
 *   - Idempotent create-once semantics: identical duplicate returns canonical record.
 *   - Fail-closed on conflict: differing content under same eventId throws EVENT_COLLISION_ERROR.
 *   - Data minimization: forbidden readiness / fake fields strictly rejected.
 *   - Source trust separation: eventId != notificationId; PRODUCTION_SOURCE_CREATE_READY remains false.
 *   - Server ownership: client create/update/delete strictly denied.
 *   - Zero mission creation, zero publication.
 */

'use strict';

const {
  createAuthorityIntelligenceEvent,
} = require('./authority_intelligence_event');
const { canonicalAuthorityRegistry } = require('./authority_registry_loader');

const AUTHORITY_INTELLIGENCE_EVENTS_COLLECTION = 'authority_intelligence_events';

const FORBIDDEN_EVENT_PERSISTENCE_FIELDS = Object.freeze([
  'trustedNotificationId',
  'publicationReady',
  'missionCreated',
  'missionPublished',
  'sourceTrusted',
  'isPublished',
  'notificationId',
  'missionId',
  'realmId',
]);

/**
 * Asserts that the event data respects data minimization and does not contain
 * speculative or fake readiness fields.
 */
function assertEventDataMinimization(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('EVENT_RECORD_INVALID: Event record must be a non-null object.');
  }

  for (const forbidden of FORBIDDEN_EVENT_PERSISTENCE_FIELDS) {
    if (event[forbidden] !== undefined) {
      throw new Error(`EVENT_DATA_MINIMIZATION_VIOLATION: Speculative or fake field '${forbidden}' is strictly forbidden on authority_intelligence_events.`);
    }
  }

  // Strict invariant: eventId != notificationId
  if (event.notificationId !== undefined || event.trustedNotificationId !== undefined) {
    throw new Error('EVENT_SOURCE_TRUST_VIOLATION: eventId must NEVER be assigned or fabricated as notificationId.');
  }
}

/**
 * Compares two event records to determine if they are content-identical under the same event identity.
 */
function isEventContentIdentical(existing, incoming) {
  if (!existing || !incoming) return false;

  const fieldsToCompare = [
    'authorityKey',
    'updateType',
    'title',
    'operationalMode',
    'officialUrl',
    'documentSha256',
    'referenceNumber',
    'targetYear',
    'examKey',
    'examFamily',
  ];

  for (const f of fieldsToCompare) {
    const v1 = existing[f] ?? null;
    const v2 = incoming[f] ?? null;
    if (String(v1).trim() !== String(v2).trim()) {
      return false;
    }
  }

  // Dedupe semantic signature comparison if present
  if (existing.dedupe && incoming.dedupe) {
    if (existing.dedupe.semanticSignature !== incoming.dedupe.semanticSignature) {
      return false;
    }
  }

  return true;
}

/**
 * Persists an Authority Intelligence Event record into Firestore.
 * 
 * Behavior:
 *   - Validates event via createAuthorityIntelligenceEvent (if not already instantiated).
 *   - Validates data minimization.
 *   - Checks if doc exists:
 *       - If doc does not exist: creates and sets doc in authority_intelligence_events.
 *       - If doc exists and is content-identical: returns existing record (idempotent, no duplication).
 *       - If doc exists and content conflicts: fails closed and throws EVENT_COLLISION_ERROR.
 *
 * @param {object} db - Firestore database handle (supports runTransaction or standard docRef)
 * @param {object} eventOrInput - validated event or raw input object
 * @param {object} [registry] - canonical authority registry
 * @returns {Promise<{ event: object, isDuplicate: boolean, status: string }>}
 */
async function saveAuthorityIntelligenceEvent(db, eventOrInput, registry = canonicalAuthorityRegistry) {
  if (!db) {
    throw new Error('EVENT_STORE_DB_REQUIRED: A database handle must be provided.');
  }

  // 1. Ensure event is instantiated and validated via canonical factory
  let event = eventOrInput;
  if (!event || event.collection !== AUTHORITY_INTELLIGENCE_EVENTS_COLLECTION || !event.eventId) {
    event = createAuthorityIntelligenceEvent(eventOrInput, registry);
  }

  // 2. Enforce Data Minimization & P2A/P2B Separation
  assertEventDataMinimization(event);

  const eventId = event.eventId;
  const docRef = db.collection(AUTHORITY_INTELLIGENCE_EVENTS_COLLECTION).doc(eventId);

  // 3. Transactional / Atomic Create-Once & Idempotency Check
  if (typeof db.runTransaction === 'function') {
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (snap.exists) {
        const existingData = snap.data();
        if (isEventContentIdentical(existingData, event)) {
          return {
            event: existingData,
            isDuplicate: true,
            status: 'IDEMPOTENT_EXISTING',
          };
        }
        throw new Error(`EVENT_COLLISION_ERROR: Event identity collision detected for eventId '${eventId}'. Existing historical content differs from incoming event content. Fail closed.`);
      }

      tx.set(docRef, event);
      return {
        event,
        isDuplicate: false,
        status: 'CREATED',
      };
    });
  }

  // Fallback for mock db without transactions
  const snap = await docRef.get();
  if (snap.exists) {
    const existingData = snap.data();
    if (isEventContentIdentical(existingData, event)) {
      return {
        event: existingData,
        isDuplicate: true,
        status: 'IDEMPOTENT_EXISTING',
      };
    }
    throw new Error(`EVENT_COLLISION_ERROR: Event identity collision detected for eventId '${eventId}'. Existing historical content differs from incoming event content. Fail closed.`);
  }

  await docRef.set(event);
  return {
    event,
    isDuplicate: false,
    status: 'CREATED',
  };
}

/**
 * Retrieves an Authority Intelligence Event by its eventId.
 */
async function getAuthorityIntelligenceEvent(db, eventId) {
  if (!db) throw new Error('EVENT_STORE_DB_REQUIRED: db handle required.');
  if (!eventId || typeof eventId !== 'string') {
    throw new Error('EVENT_QUERY_INVALID: eventId must be a non-empty string.');
  }
  const snap = await db.collection(AUTHORITY_INTELLIGENCE_EVENTS_COLLECTION).doc(eventId.trim()).get();
  if (!snap.exists) return null;
  return snap.data();
}

/**
 * Asserts client mutation denial on authority_intelligence_events.
 */
function assertClientEventMutationDenied({ callerContext, operation }) {
  if (!callerContext || !callerContext.isServerAdmin) {
    throw new Error(`CLIENT_MUTATION_DENIED: Client mutation '${operation}' on '${AUTHORITY_INTELLIGENCE_EVENTS_COLLECTION}' is strictly forbidden. Server/Admin SDK only.`);
  }
}

module.exports = {
  AUTHORITY_INTELLIGENCE_EVENTS_COLLECTION,
  FORBIDDEN_EVENT_PERSISTENCE_FIELDS,
  assertEventDataMinimization,
  isEventContentIdentical,
  saveAuthorityIntelligenceEvent,
  getAuthorityIntelligenceEvent,
  assertClientEventMutationDenied,
};
