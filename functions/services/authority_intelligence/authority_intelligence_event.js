/**
 * 🔱 AUTHORITY INTELLIGENCE EVENT MODEL & FACTORY
 * Target Collection: authority_intelligence_events
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 *
 * Implements the canonical backend contract for intelligence events emitted
 * across all monitored official government sources.
 */

'use strict';

const {
  UPDATE_VOCABULARY,
  OPERATIONAL_MODES,
  deepFreeze,
} = require('./registry_schema');
const { canonicalAuthorityRegistry } = require('./authority_registry_loader');
const { generateDedupeDescriptor } = require('./dedupe_contract');
const { evaluateMissionSuitability } = require('./suitability_classifier');
const { normalizeOfficialUrl } = require('./url_normalization');

/**
 * Creates a validated, typed Authority Intelligence Event object.
 * Pure in-memory factory; zero Firestore writes.
 */
function createAuthorityIntelligenceEvent(input = {}, registry = canonicalAuthorityRegistry) {
  // 1. Validate Authority
  const authorityKey = String(input.authorityKey || '').trim();
  const authority = registry.getByKey(authorityKey, true);

  // 2. Validate Update Type from Controlled Vocabulary
  const updateType = String(input.updateType || '').toUpperCase().trim();
  if (!UPDATE_VOCABULARY.includes(updateType)) {
    throw new Error(`INVALID_UPDATE_TYPE: "${updateType}" is not in controlled UPDATE_VOCABULARY.`);
  }

  // 3. Validate Operational Mode
  const operationalMode = String(input.operationalMode || OPERATIONAL_MODES.DAILY_FORWARD_WATCH).toUpperCase().trim();
  if (!Object.values(OPERATIONAL_MODES).includes(operationalMode)) {
    throw new Error(`INVALID_OPERATIONAL_MODE: "${operationalMode}" is not a valid OPERATIONAL_MODE.`);
  }

  // 4. Validate Official URL if provided
  let normalizedUrl = null;
  if (input.officialUrl) {
    normalizedUrl = normalizeOfficialUrl(input.officialUrl);
    if (!registry.isDomainApprovedForAuthority(normalizedUrl, authorityKey)) {
      throw new Error(`UNAUTHORIZED_DOMAIN_ERROR: URL domain for "${normalizedUrl}" is not approved for authority "${authorityKey}".`);
    }
  }

  // 5. Generate Dedupe & Lineage Descriptor
  const dedupe = generateDedupeDescriptor({
    authorityKey,
    officialUrl: normalizedUrl,
    referenceNumber: input.referenceNumber || input.advertisementNumber,
    documentSha256: input.documentSha256,
    examKey: input.examKey || input.examFamily,
    updateType,
    targetYear: input.targetYear,
    parentReferenceNumber: input.parentReferenceNumber,
    parentDocumentSha256: input.parentDocumentSha256,
    lineageChain: input.lineageChain,
  });

  // 6. Evaluate Mission Suitability
  const suitability = evaluateMissionSuitability({
    qualificationBreadth: input.qualificationBreadth,
    qualificationType: input.qualificationType,
    recruitmentRecurrence: input.recruitmentRecurrence,
    participationScale: input.participationScale,
    vacancyScale: input.vacancyScale,
    preparationValue: input.preparationValue,
    writtenCompetitiveExamPresent: input.writtenCompetitiveExamPresent,
    specializationRarity: input.specializationRarity,
    hasEstablishedExamKey: Boolean(input.examKey || input.examFamily),
    syllabusScope: input.syllabusScope,
    selectionMode: input.selectionMode,
    isAdministrativeNotice: input.isAdministrativeNotice,
    isProcurementOrTender: input.isProcurementOrTender,
  });

  // 7. Assemble Event Object
  const event = {
    eventId: dedupe.eventId,
    collection: 'authority_intelligence_events',
    authorityKey: authority.authorityKey,
    authorityShortName: authority.shortName,
    jurisdiction: authority.jurisdiction,
    stateCode: authority.stateCode,
    updateType,
    operationalMode,
    title: String(input.title || '').trim(),
    examKey: input.examKey || input.examFamily || null,
    examFamily: input.examFamily || input.examKey || null,
    targetYear: input.targetYear != null ? Number(input.targetYear) : null,
    officialUrl: normalizedUrl,
    documentSha256: dedupe.binarySha256,
    referenceNumber: input.referenceNumber || input.advertisementNumber || null,
    publicationDate: input.publicationDate || null,
    discoveredAtIso: input.discoveredAtIso || new Date().toISOString(),
    dedupe: {
      referenceIdentity: dedupe.referenceIdentity,
      urlHash: dedupe.urlIdentity.urlHash,
      semanticSignature: dedupe.semanticEventSignature,
      sourceLineage: dedupe.sourceLineage,
    },
    suitability: {
      suitabilityClass: suitability.suitabilityClass,
      decision: suitability.decision,
      confidence: suitability.confidence,
      reason: suitability.reason,
      reasons: suitability.reasons,
    },
    triageState: 'PENDING_TRIAGE',
  };

  return deepFreeze(event);
}

module.exports = {
  createAuthorityIntelligenceEvent,
};
