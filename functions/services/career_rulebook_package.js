/**
 * 🔱 RANKCRACKERS CAREER RULEBOOK PACKAGE & TRUST BOUNDARY ENGINE
 * Gate 48CS2R4 — Verified Rulebook Package Trust Boundary
 *
 * Core Guarantees:
 *   1. NO CALLER-SUPPLIED 'isComplete' AUTHORITY:
 *        - Completeness is derived purely from ruleFamilyCoverage rows.
 *        - RULEBOOK_CALLER_SELF_CERTIFICATION_COUNT = 0
 *   2. VERIFIED ABSENCE REQUIRES EXPLICIT ATTESTATION:
 *        - Search-returned-empty != RULE_ABSENCE_VERIFIED.
 *        - Requires cycleId, authoritativeDocumentsReviewed, sourceScope, evidenceRefs,
 *          attestationReason, and reviewStatus = 'AUDITED_ABSENCE_CONFIRMED'.
 *        - ABSENCE_WITHOUT_EVIDENCE_COUNT = 0
 *   3. AMENDMENT CHAIN TRUST:
 *        - CURRENT_CHAIN_VERIFIED requires SHA_VERIFIED base notice + audited scope + audit window.
 *        - CURRENT_CHAIN_SELF_DECLARED_COUNT = 0
 *   4. VACANCY MATRIX COVERAGE:
 *        - VACANCY_MATRIX_COMPLETE requires COMPLETE_OFFICIAL_TABLE + row-level evidenceRefs.
 *        - VACANCY_COMPLETE_WITHOUT_COVERAGE_EVIDENCE_COUNT = 0
 *   5. SOURCE STATE ISOLATION:
 *        - URL_FOUND != SHA_VERIFIED.
 *        - URL_ONLY_TREATED_AS_SHA_VERIFIED_COUNT = 0
 *   6. GENERIC FACTS SURVIVAL UNDER PARTIAL PACKAGE:
 *        - PARTIAL_SOURCE_PACKAGE permits generic notification facts to be displayed.
 *        - Personalized matching strictly returns NOT_EVALUATED.
 *        - ELIGIBLE_FROM_PARTIAL_SOURCE_PACKAGE_COUNT = 0
 *   7. DETERMINISTIC SEMANTIC HASH:
 *        - computePackageSemanticHash excludes non-deterministic volatile fields (dates/timestamps).
 */

'use strict';

const crypto = require('crypto');
const {
  RULE_FAMILY,
  RULE_FAMILY_STATUS,
  RULE_RESOLUTION_STATE,
  VACANCY_MATRIX_COMPLETENESS,
  AMENDMENT_CHAIN_STATUS,
  DOCUMENT_EVIDENCE_LEVEL,
  FACT_VERIFICATION_LEVEL,
  OPPORTUNITY_KIND,
  canonicalJsonStringify
} = require('./career_signal_models');
const { auditRealPackageAuthority } = require('./real_package_trust_boundary');

// 1. Source Document Lifecycle States
const SOURCE_DOCUMENT_STATE = Object.freeze({
  URL_FOUND: 'URL_FOUND',
  METADATA_INDEXED: 'METADATA_INDEXED',
  BYTES_INGESTED: 'BYTES_INGESTED',
  SHA_VERIFIED: 'SHA_VERIFIED'
});

// 2. Package Validation Verdicts
const PACKAGE_VALIDATION_RESULT = Object.freeze({
  ACCEPTED_FOR_MATCHING: 'ACCEPTED_FOR_MATCHING',
  PARTIAL_SOURCE_PACKAGE: 'PARTIAL_SOURCE_PACKAGE',
  REJECTED_SOURCE_PACKAGE: 'REJECTED_SOURCE_PACKAGE'
});

// 3. Rule Family Coverage Statuses
const RULE_FAMILY_COVERAGE_STATUS = Object.freeze({
  EXHAUSTIVE: 'EXHAUSTIVE',
  PARTIAL: 'PARTIAL',
  NOT_APPLICABLE_VERIFIED: 'NOT_APPLICABLE_VERIFIED',
  UNAUDITED: 'UNAUDITED'
});

// 4. Vacancy Table Coverage Statuses
const VACANCY_COVERAGE_STATUS = Object.freeze({
  COMPLETE_OFFICIAL_TABLE: 'COMPLETE_OFFICIAL_TABLE',
  PARTIAL_TABLE: 'PARTIAL_TABLE',
  TOTAL_SEATS_ONLY: 'TOTAL_SEATS_ONLY',
  UNAUDITED: 'UNAUDITED'
});

// 5. Attestation Review Statuses
const ATTESTATION_REVIEW_STATUS = Object.freeze({
  AUDITED_ABSENCE_CONFIRMED: 'AUDITED_ABSENCE_CONFIRMED',
  UNVERIFIED: 'UNVERIFIED',
  REJECTED: 'REJECTED'
});

const MANDATORY_RULE_FAMILIES = Object.freeze([
  RULE_FAMILY.AGE,
  RULE_FAMILY.EDUCATION,
  RULE_FAMILY.DISCIPLINE,
  RULE_FAMILY.DOMICILE,
  RULE_FAMILY.CATEGORY_OR_RESERVATION
]);

/**
 * Validates and normalizes source document state.
 * CRITICAL INVARIANT: URL_FOUND != SHA_VERIFIED.
 * A document with state URL_FOUND or METADATA_INDEXED can NEVER claim SHA_VERIFIED.
 */
function validateSourceDocumentState(rawDoc = {}) {
  if (!rawDoc || typeof rawDoc !== 'object') {
    return {
      isValid: false,
      error: 'SOURCE_DOC_NOT_OBJECT',
      sourceState: SOURCE_DOCUMENT_STATE.URL_FOUND,
      evidenceLevel: DOCUMENT_EVIDENCE_LEVEL.URL_FOUND,
      factVerificationLevel: FACT_VERIFICATION_LEVEL.SOURCE_LOCATED,
      isShaVerified: false,
      isTextExtractedAndBound: false,
      isBytesAcquired: false,
      isExactDocumentResolved: false,
      isUrlFound: false,
      scanTextUnresolved: false
    };
  }

  const docId = String(rawDoc.docId || rawDoc.documentIdentity || '').trim();
  const officialSourceUrl = typeof rawDoc.officialSourceUrl === 'string' && rawDoc.officialSourceUrl.trim()
    ? rawDoc.officialSourceUrl.trim() : null;
  const documentIdentity = docId || (officialSourceUrl ? 'doc_url_bound' : null);

  const rawSha = typeof rawDoc.documentSha256 === 'string'
    ? rawDoc.documentSha256.trim().toLowerCase() : null;
  const isValidShaHex = Boolean(rawSha && /^[a-f0-9]{64}$/.test(rawSha));

  let sourceState = SOURCE_DOCUMENT_STATE[rawDoc.sourceState] || SOURCE_DOCUMENT_STATE.URL_FOUND;

  // Caller cannot set SHA_VERIFIED without a valid 64-char hex SHA256
  if (sourceState === SOURCE_DOCUMENT_STATE.SHA_VERIFIED && !isValidShaHex) {
    sourceState = SOURCE_DOCUMENT_STATE.BYTES_INGESTED;
  }

  // Determine discrete evidence flags
  const isUrlFound = Boolean(documentIdentity || officialSourceUrl);
  const isExactDocumentResolved = Boolean(docId && officialSourceUrl);
  const isShaVerified = (sourceState === SOURCE_DOCUMENT_STATE.SHA_VERIFIED || Boolean(rawDoc.isShaVerified)) && isValidShaHex;
  const isBytesAcquired = isShaVerified || sourceState === SOURCE_DOCUMENT_STATE.BYTES_INGESTED || Boolean(rawDoc.isBytesAcquired);

  const scanTextUnresolved = Boolean(rawDoc.scanTextUnresolved || rawDoc.scanTextState === 'SCAN_ONLY_TEXT_UNRESOLVED');
  const isExplicitlyFalseTextBound = rawDoc.isTextExtractedAndBound === false || rawDoc.textExtractedAndBound === false;
  const isTextExtractedAndBound = !scanTextUnresolved && !isExplicitlyFalseTextBound && (
    Boolean(rawDoc.isTextExtractedAndBound || rawDoc.textExtractedAndBound || rawDoc.evidenceLevel === DOCUMENT_EVIDENCE_LEVEL.TEXT_EXTRACTED_AND_BOUND) ||
    (isShaVerified && rawDoc.isTextExtractedAndBound === undefined && rawDoc.evidenceLevel === undefined)
  );

  // Evidence level hierarchy
  let evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.URL_FOUND;
  if (isTextExtractedAndBound) {
    evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.TEXT_EXTRACTED_AND_BOUND;
  } else if (isShaVerified) {
    evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.SHA256_VERIFIED;
  } else if (isBytesAcquired) {
    evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.BYTES_ACQUIRED;
  } else if (isExactDocumentResolved || sourceState === SOURCE_DOCUMENT_STATE.METADATA_INDEXED) {
    evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.EXACT_DOCUMENT_RESOLVED;
  } else {
    evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.URL_FOUND;
  }

  // Fact verification level
  let factVerificationLevel = FACT_VERIFICATION_LEVEL.SOURCE_LOCATED;
  if (isTextExtractedAndBound) {
    factVerificationLevel = (rawDoc.isRuleVerified || rawDoc.factVerificationLevel === FACT_VERIFICATION_LEVEL.RULE_VERIFIED)
      ? FACT_VERIFICATION_LEVEL.RULE_VERIFIED
      : FACT_VERIFICATION_LEVEL.TEXT_VERIFIED;
  } else if (isShaVerified || isBytesAcquired) {
    factVerificationLevel = FACT_VERIFICATION_LEVEL.BYTE_VERIFIED;
  } else {
    factVerificationLevel = FACT_VERIFICATION_LEVEL.SOURCE_LOCATED;
  }

  // Caller cannot pretend a URL_FOUND or METADATA_INDEXED document is SHA_VERIFIED
  if (sourceState === SOURCE_DOCUMENT_STATE.URL_FOUND || sourceState === SOURCE_DOCUMENT_STATE.METADATA_INDEXED) {
    // If caller provided shaVerified: true on URL_FOUND, strictly disregard it!
    return {
      isValid: Boolean(documentIdentity || officialSourceUrl),
      docId: documentIdentity,
      documentIdentity,
      officialSourceUrl,
      sourceState,
      evidenceLevel: sourceState === SOURCE_DOCUMENT_STATE.METADATA_INDEXED ? DOCUMENT_EVIDENCE_LEVEL.EXACT_DOCUMENT_RESOLVED : DOCUMENT_EVIDENCE_LEVEL.URL_FOUND,
      factVerificationLevel: FACT_VERIFICATION_LEVEL.SOURCE_LOCATED,
      documentSha256: null, // Zero trust for unhashed URL
      isShaVerified: false,
      isBytesAcquired: false,
      isExactDocumentResolved: Boolean(docId && officialSourceUrl),
      isTextExtractedAndBound: false,
      scanTextUnresolved: false,
      title: rawDoc.title || null
    };
  }

  return {
    isValid: Boolean(documentIdentity),
    docId: documentIdentity,
    documentIdentity,
    officialSourceUrl,
    sourceState,
    evidenceLevel,
    factVerificationLevel,
    documentSha256: isShaVerified ? rawSha : null,
    isShaVerified,
    isBytesAcquired,
    isExactDocumentResolved,
    isTextExtractedAndBound,
    scanTextUnresolved,
    scanTextState: rawDoc.scanTextState || null,
    title: rawDoc.title || null
  };
}

/**
 * Validates explicit absence attestation.
 * CRITICAL INVARIANT: Search-no-result alone cannot prove absence!
 */
function validateAbsenceAttestation(attestation, targetFamily, targetCycleId) {
  if (!attestation || typeof attestation !== 'object') {
    return {
      isValid: false,
      reason: 'MISSING_ATTESTATION_OBJECT: RULE_ABSENCE_VERIFIED requires explicit AbsenceAttestation object.'
    };
  }

  const ruleFamily = attestation.ruleFamily;
  if (!ruleFamily || (targetFamily && ruleFamily !== targetFamily)) {
    return {
      isValid: false,
      reason: 'FAMILY_MISMATCH: Attestation family (' + ruleFamily + ') does not match target family (' + targetFamily + ').'
    };
  }

  const cycleId = attestation.cycleId;
  if (!cycleId || (targetCycleId && cycleId !== targetCycleId)) {
    return {
      isValid: false,
      reason: 'CYCLE_MISMATCH: Attestation cycleId (' + cycleId + ') does not match package cycleId (' + targetCycleId + ').'
    };
  }

  const docs = Array.isArray(attestation.authoritativeDocumentsReviewed)
    ? attestation.authoritativeDocumentsReviewed.filter(d => typeof d === 'string' && d.trim().length > 0)
    : [];
  if (docs.length === 0) {
    return {
      isValid: false,
      reason: 'NO_DOCUMENTS_REVIEWED: Absence attestation must identify authoritative documents audited.'
    };
  }

  const sourceScope = typeof attestation.sourceScope === 'string' ? attestation.sourceScope.trim() : '';
  if (!sourceScope) {
    return {
      isValid: false,
      reason: 'NO_SOURCE_SCOPE: Absence attestation must define the audited source scope.'
    };
  }

  const evidenceRefs = Array.isArray(attestation.evidenceRefs)
    ? attestation.evidenceRefs.filter(r => typeof r === 'string' && r.trim().length > 0)
    : [];
  if (evidenceRefs.length === 0) {
    return {
      isValid: false,
      reason: 'NO_EVIDENCE_REFS: Search returning zero results without clause/evidence proof is insufficient to attest rule absence.'
    };
  }

  const reviewStatus = attestation.reviewStatus;
  if (reviewStatus !== ATTESTATION_REVIEW_STATUS.AUDITED_ABSENCE_CONFIRMED) {
    return {
      isValid: false,
      reason: 'INVALID_REVIEW_STATUS: Absence attestation reviewStatus must be AUDITED_ABSENCE_CONFIRMED (got: ' + reviewStatus + ').'
    };
  }

  const attestationReason = typeof attestation.attestationReason === 'string' ? attestation.attestationReason.trim() : '';
  if (!attestationReason) {
    return {
      isValid: false,
      reason: 'NO_ATTESTATION_REASON: Detailed legal/statutory rationale for absence is mandatory.'
    };
  }

  return {
    isValid: true,
    attestation: {
      ruleFamily,
      cycleId,
      authoritativeDocumentsReviewed: docs,
      sourceScope,
      evidenceRefs,
      reviewStatus,
      attestationReason
    }
  };
}

/**
 * Pure Derivation of Rulebook Completeness.
 * IGNORES caller boolean isComplete = true.
 */
function deriveRulebookCompleteness(pkg = {}) {
  const coverageRows = Array.isArray(pkg.ruleFamilyCoverage) ? pkg.ruleFamilyCoverage : [];
  const requiredFamilies = Array.isArray(pkg.requiredRuleFamilies) && pkg.requiredRuleFamilies.length > 0
    ? pkg.requiredRuleFamilies
    : MANDATORY_RULE_FAMILIES;

  const familyStatuses = {};
  const unresolvedFamilies = [];
  const auditedFamilies = [];
  const derivationAudit = [];
  let isComplete = true;

  const baseDoc = validateSourceDocumentState(pkg.baseNotification);
  const isBaseDocTextBound = baseDoc.isShaVerified &&
    baseDoc.isTextExtractedAndBound &&
    !pkg.baseNotification?.scanTextUnresolved &&
    !baseDoc.scanTextUnresolved &&
    baseDoc.evidenceLevel === DOCUMENT_EVIDENCE_LEVEL.TEXT_EXTRACTED_AND_BOUND;

  // Build lookup of coverage rows by family
  const coverageMap = new Map();
  for (const row of coverageRows) {
    if (row && row.family) {
      coverageMap.set(row.family, row);
    }
  }

  for (const family of requiredFamilies) {
    const row = coverageMap.get(family);

    if (!row) {
      familyStatuses[family] = RULE_FAMILY_STATUS.UNRESOLVED;
      unresolvedFamilies.push(family);
      isComplete = false;
      derivationAudit.push({
        family,
        status: RULE_FAMILY_STATUS.UNRESOLVED,
        reason: 'Mandatory rule family has no coverage row in package.'
      });
      continue;
    }

    const resolutionStatus = row.resolutionStatus;
    const coverageStatus = row.coverageStatus;
    const evidenceRefs = Array.isArray(row.evidenceRefs) ? row.evidenceRefs.filter(r => r) : [];

    // Byte-Authority Barrier: unhashed or unresolved scan document cannot yield VERIFIED_COMPLETE
    if (!isBaseDocTextBound && resolutionStatus === RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED) {
      familyStatuses[family] = RULE_FAMILY_STATUS.UNRESOLVED;
      unresolvedFamilies.push(family);
      isComplete = false;
      derivationAudit.push({
        family,
        status: RULE_FAMILY_STATUS.UNRESOLVED,
        reason: 'Base notification is not byte-verified or scan text is unresolved (evidenceLevel: ' + baseDoc.evidenceLevel + ', scanTextUnresolved: ' + Boolean(baseDoc.scanTextUnresolved) + '). Cannot claim verified complete family.'
      });
      continue;
    }

    if (resolutionStatus === RULE_RESOLUTION_STATE.RULE_ABSENCE_VERIFIED) {
      // Validate absence attestation
      const attestationResult = validateAbsenceAttestation(row.absenceAttestation, family, pkg.cycleId);
      if (attestationResult.isValid && (coverageStatus === RULE_FAMILY_COVERAGE_STATUS.NOT_APPLICABLE_VERIFIED || coverageStatus === RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE)) {
        familyStatuses[family] = RULE_FAMILY_STATUS.NOT_APPLICABLE_VERIFIED;
        auditedFamilies.push(family);
        derivationAudit.push({
          family,
          status: RULE_FAMILY_STATUS.NOT_APPLICABLE_VERIFIED,
          reason: 'Verified absent via explicit legal attestation.',
          attestation: attestationResult.attestation
        });
      } else {
        // Falsified or unbacked absence drops strictly to UNRESOLVED!
        familyStatuses[family] = RULE_FAMILY_STATUS.UNRESOLVED;
        unresolvedFamilies.push(family);
        isComplete = false;
        derivationAudit.push({
          family,
          status: RULE_FAMILY_STATUS.UNRESOLVED,
          reason: 'Absence claimed without verified attestation: ' + (attestationResult.reason || 'Invalid coverageStatus.')
        });
      }
    } else if (resolutionStatus === RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED) {
      // Must be EXHAUSTIVE and have evidence refs
      if (coverageStatus === RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE && evidenceRefs.length > 0) {
        familyStatuses[family] = RULE_FAMILY_STATUS.VERIFIED_COMPLETE;
        auditedFamilies.push(family);
        derivationAudit.push({
          family,
          status: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
          evidenceRefs,
          reason: 'Exhaustive rule extraction verified with source evidence.'
        });
      } else {
        familyStatuses[family] = RULE_FAMILY_STATUS.UNRESOLVED;
        unresolvedFamilies.push(family);
        isComplete = false;
        derivationAudit.push({
          family,
          status: RULE_FAMILY_STATUS.UNRESOLVED,
          reason: 'Coverage status is ' + coverageStatus + ' or evidenceRefs is empty. Cannot claim complete family.'
        });
      }
    } else {
      familyStatuses[family] = RULE_FAMILY_STATUS.UNRESOLVED;
      unresolvedFamilies.push(family);
      isComplete = false;
      derivationAudit.push({
        family,
        status: RULE_FAMILY_STATUS.UNRESOLVED,
        reason: 'Resolution status is ' + resolutionStatus
      });
    }
  }

  return {
    isComplete, // Purely derived, never trusted from caller!
    requiredFamilies,
    familyStatuses,
    unresolvedFamilies,
    auditedFamilies,
    derivationAudit
  };
}

/**
 * Pure Derivation of Amendment Chain Trust.
 * IGNORES caller claiming CURRENT_CHAIN_VERIFIED if surface is partial.
 */
function deriveAmendmentChainStatus(pkg = {}) {
  const baseDoc = validateSourceDocumentState(pkg.baseNotification);
  if (!baseDoc.isShaVerified) {
    return {
      amendmentSearchStatus: AMENDMENT_CHAIN_STATUS.CHAIN_UNRESOLVED,
      isChainVerified: false,
      reason: 'Base notification is not SHA_VERIFIED (state: ' + baseDoc.sourceState + ').'
    };
  }

  const amendmentAudit = pkg.amendmentAudit || {};
  const auditScope = typeof amendmentAudit.auditScope === 'string' ? amendmentAudit.auditScope.trim() : '';
  const auditWindowThrough = typeof amendmentAudit.auditWindowThrough === 'string' ? amendmentAudit.auditWindowThrough.trim() : '';

  if (!auditScope || !auditWindowThrough) {
    return {
      amendmentSearchStatus: AMENDMENT_CHAIN_STATUS.CHAIN_PARTIAL,
      isChainVerified: false,
      reason: 'Amendment audit scope or auditWindowThrough is missing. Monitoring surface cannot be trusted.'
    };
  }

  const applicableCorrigenda = Array.isArray(pkg.applicableCorrigenda) ? pkg.applicableCorrigenda : [];
  for (let i = 0; i < applicableCorrigenda.length; i++) {
    const corrDoc = validateSourceDocumentState(applicableCorrigenda[i]);
    if (!corrDoc.isShaVerified) {
      return {
        amendmentSearchStatus: AMENDMENT_CHAIN_STATUS.CHAIN_PARTIAL,
        isChainVerified: false,
        reason: 'Corrigendum at index ' + i + ' is not SHA_VERIFIED (state: ' + corrDoc.sourceState + ').'
      };
    }
  }

  return {
    amendmentSearchStatus: AMENDMENT_CHAIN_STATUS.CURRENT_CHAIN_VERIFIED,
    isChainVerified: true,
    baseNotificationDocId: baseDoc.docId,
    applicableCorrigendaCount: applicableCorrigenda.length,
    auditScope,
    auditWindowThrough,
    latestKnownOfficialNoticeDocId: applicableCorrigenda.length > 0
      ? applicableCorrigenda[applicableCorrigenda.length - 1].documentIdentity || baseDoc.docId
      : baseDoc.docId
  };
}

/**
 * Pure Derivation of Vacancy Matrix Completeness.
 * IGNORES caller claiming VACANCY_MATRIX_COMPLETE if coverageStatus is partial.
 */
function deriveVacancyMatrixCompleteness(pkg = {}) {
  const matrix = pkg.vacancyMatrix || {};
  const coverageStatus = matrix.coverageStatus;
  const rows = Array.isArray(matrix.rows) ? matrix.rows : [];

  if (pkg.opportunityKind === OPPORTUNITY_KIND.ADMISSION_ENTRANCE || coverageStatus === RULE_FAMILY_COVERAGE_STATUS.NOT_APPLICABLE_VERIFIED) {
    return {
      vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_NOT_APPLICABLE,
      isMatrixComplete: true,
      isAdmissionEntrance: true,
      coverageStatus: RULE_FAMILY_COVERAGE_STATUS.NOT_APPLICABLE_VERIFIED,
      totalVacancies: null,
      rowCount: 0,
      reason: 'ADMISSION_ENTRANCE does not use job vacancy matrix (seat allocation governed by entrance counseling).'
    };
  }

  if (coverageStatus !== VACANCY_COVERAGE_STATUS.COMPLETE_OFFICIAL_TABLE) {
    return {
      vacancyMatrixCompleteness: rows.length > 0
        ? VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_PARTIAL
        : VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_UNRESOLVED,
      isMatrixComplete: false,
      coverageStatus: coverageStatus || VACANCY_COVERAGE_STATUS.UNAUDITED,
      totalVacancies: typeof matrix.totalSeats === 'number' ? matrix.totalSeats : null,
      rowCount: rows.length,
      reason: 'Vacancy coverage status is ' + coverageStatus + ', not COMPLETE_OFFICIAL_TABLE.'
    };
  }

  if (rows.length === 0) {
    return {
      vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_PARTIAL,
      isMatrixComplete: false,
      coverageStatus,
      totalVacancies: typeof matrix.totalSeats === 'number' ? matrix.totalSeats : null,
      rowCount: 0,
      reason: 'CoverageStatus claims COMPLETE_OFFICIAL_TABLE but rows array is empty.'
    };
  }

  // Verify each row has valid evidence refs
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const hasEvidence = Boolean(
      (Array.isArray(r.evidenceRefs) && r.evidenceRefs.length > 0) ||
      r.evidenceRef ||
      r.sourceLocator ||
      r.sourceDocumentRef
    );
    if (!hasEvidence) {
      return {
        vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_PARTIAL,
        isMatrixComplete: false,
        coverageStatus,
        rowCount: rows.length,
        reason: 'Vacancy row at index ' + i + ' lacks verified evidenceRefs.'
      };
    }
  }

  return {
    vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_COMPLETE,
    isMatrixComplete: true,
    coverageStatus,
    totalVacancies: typeof matrix.totalSeats === 'number' ? matrix.totalSeats : null,
    rowCount: rows.length
  };
}

/**
 * Computes deterministic Package Semantic Hash.
 * Binds: cycleId + authorityId + baseNotification + corrigenda + eligibilityRules + ruleFamilyCoverage + vacancyMatrix.
 * Strictly EXCLUDES non-deterministic volatile fields (timestamps, runIds, generatedAt).
 */
function computePackageSemanticHash(pkg = {}) {
  const canonicalBasis = {
    cycleId: String(pkg.cycleId || '').trim(),
    authorityId: String(pkg.authorityId || '').trim(),
    permanentMissionId: pkg.permanentMissionId ? String(pkg.permanentMissionId).trim() : null,
    baseNotification: {
      documentIdentity: pkg.baseNotification?.documentIdentity || null,
      officialNoticeNumber: pkg.baseNotification?.officialNoticeNumber || null,
      issueDate: pkg.baseNotification?.issueDate || null,
      documentSha256: pkg.baseNotification?.documentSha256 ? String(pkg.baseNotification.documentSha256).toLowerCase() : null
    },
    applicableCorrigenda: Array.isArray(pkg.applicableCorrigenda)
      ? pkg.applicableCorrigenda
          .map(c => ({
            documentIdentity: c.documentIdentity || null,
            officialNoticeNumber: c.officialNoticeNumber || null,
            documentSha256: c.documentSha256 ? String(c.documentSha256).toLowerCase() : null
          }))
          .sort((a, b) => String(a.documentIdentity).localeCompare(String(b.documentIdentity)))
      : [],
    eligibilityRules: Array.isArray(pkg.eligibilityRules)
      ? pkg.eligibilityRules
          .map(r => ({
            ruleId: r.ruleId,
            ruleType: r.ruleType,
            officialValue: r.officialValue,
            category: r.category || null,
            evidenceRefs: Array.isArray(r.evidenceRefs) ? [...r.evidenceRefs].sort() : []
          }))
          .sort((a, b) => String(a.ruleId).localeCompare(String(b.ruleId)))
      : [],
    ruleFamilyCoverage: Array.isArray(pkg.ruleFamilyCoverage)
      ? pkg.ruleFamilyCoverage
          .map(f => ({
            family: f.family,
            resolutionStatus: f.resolutionStatus,
            coverageStatus: f.coverageStatus,
            evidenceRefs: Array.isArray(f.evidenceRefs) ? [...f.evidenceRefs].sort() : []
          }))
          .sort((a, b) => String(a.family).localeCompare(String(b.family)))
      : [],
    vacancyMatrix: {
      coverageStatus: pkg.vacancyMatrix?.coverageStatus || null,
      totalSeats: pkg.vacancyMatrix?.totalSeats !== undefined ? pkg.vacancyMatrix.totalSeats : null,
      rows: Array.isArray(pkg.vacancyMatrix?.rows)
        ? pkg.vacancyMatrix.rows
            .map(r => ({
              postCode: r.postCode || null,
              category: r.category || null,
              horizontalQuota: r.horizontalQuota || null,
              vacancies: r.vacancies
            }))
            .sort((a, b) => String(a.category + a.horizontalQuota).localeCompare(String(b.category + b.horizontalQuota)))
        : []
    }
  };

  const canonicalJson = canonicalJsonStringify(canonicalBasis);
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}

/**
 * Pure Package Validator.
 * Returns ACCEPTED_FOR_MATCHING, PARTIAL_SOURCE_PACKAGE, or REJECTED_SOURCE_PACKAGE.
 */
function validateCareerRulebookPackage(rawPackage = {}) {
  const errors = [];
  const warnings = [];

  if (!rawPackage || typeof rawPackage !== 'object') {
    return {
      validationResult: PACKAGE_VALIDATION_RESULT.REJECTED_SOURCE_PACKAGE,
      isValid: false,
      errors: ['PACKAGE_NOT_AN_OBJECT'],
      warnings: [],
      derivedCompleteness: null,
      derivedAmendmentStatus: null,
      derivedVacancyCompleteness: null,
      packageSemanticHash: null,
      genericCycleFacts: null
    };
  }

  const packageId = String(rawPackage.packageId || '').trim();
  const cycleId = String(rawPackage.cycleId || '').trim();
  const authorityId = String(rawPackage.authorityId || '').trim();

  if (!packageId) errors.push('PACKAGE_ID_REQUIRED');
  if (!cycleId) errors.push('CYCLE_ID_REQUIRED');
  if (!authorityId) errors.push('AUTHORITY_ID_REQUIRED');

  // Check for explicit identity contradictions (e.g. quarantined 2022 PDF for 2025-26 cycle)
  if (rawPackage.identityContradiction || rawPackage.baseNotification?.verificationState === 'IDENTITY_CONTRADICTION') {
    errors.push('IDENTITY_CONTRADICTION: Document is rejected as current cycle evidence (contradicted identity or quarantined document).');
  }

  // Check for cycle identity mismatch (e.g. promoting NEET 2026 evidence directly as current 2027 truth)
  if (rawPackage.promotedPriorCycleAsCurrent) {
    errors.push('CYCLE_MISMATCH: Prior cycle evidence cannot be promoted to current cycle truth without authoritative current notification.');
  }

  // Validate Base Notification Document
  const baseDoc = validateSourceDocumentState(rawPackage.baseNotification);
  if (!baseDoc.isValid) {
    errors.push('BASE_NOTIFICATION_INVALID: Base notification identity or official source URL missing.');
  } else if (!baseDoc.isShaVerified) {
    // When base notification is URL_FOUND (unverified bytes), record warning and ensure package cannot be accepted for matching
    warnings.push('BASE_NOTIFICATION_NOT_SHA_VERIFIED: Base notification sourceState is ' + baseDoc.sourceState + '. Byte-level SHA-256 verification is pending; package cannot be accepted for matching.');
  }

  // If basic structural parameters or fatal contradictions fail -> REJECTED
  if (errors.length > 0) {
    return {
      validationResult: PACKAGE_VALIDATION_RESULT.REJECTED_SOURCE_PACKAGE,
      isValid: false,
      errors,
      warnings,
      derivedCompleteness: null,
      derivedAmendmentStatus: null,
      derivedVacancyCompleteness: null,
      packageSemanticHash: null,
      genericCycleFacts: null
    };
  }

  // 1. Pure Derivations
  const derivedCompleteness = deriveRulebookCompleteness(rawPackage);
  const derivedAmendment = deriveAmendmentChainStatus(rawPackage);
  const derivedVacancy = deriveVacancyMatrixCompleteness(rawPackage);
  const packageSemanticHash = computePackageSemanticHash(rawPackage);
  const realAuthorityAudit = rawPackage.realSourceContractVersion === '48CS2R6'
    ? auditRealPackageAuthority(rawPackage)
    : null;

  if (realAuthorityAudit?.unknownRuleTypes.length) errors.push('UNKNOWN_RULE_TYPE: ' + realAuthorityAudit.unknownRuleTypes.join(', ') + '. Real-source rules fail closed.');
  if (realAuthorityAudit?.priorCycleViolation) errors.push('CYCLE_MISMATCH: prior-cycle source evidence must remain a reference and cannot become current-cycle authority for any mission.');
  if (realAuthorityAudit?.opportunityModelViolation) errors.push('OPPORTUNITY_MODEL_CONTRADICTION: ADMISSION_ENTRANCE cannot use a JOB_VACANCY matrix.');
  if (errors.length > 0) return { validationResult: PACKAGE_VALIDATION_RESULT.REJECTED_SOURCE_PACKAGE, isValid: false, errors, warnings, derivedCompleteness, derivedAmendmentStatus: derivedAmendment.amendmentSearchStatus, derivedVacancyCompleteness: derivedVacancy.vacancyMatrixCompleteness, packageSemanticHash, genericCycleFacts: null, realAuthorityAudit };

  // Referential Integrity Audit (No dangling or undeclared document references)
  const declaredDocuments = new Map();
  if (baseDoc && baseDoc.isValid) {
    if (baseDoc.documentIdentity) declaredDocuments.set(baseDoc.documentIdentity, baseDoc);
    if (baseDoc.docId) declaredDocuments.set(baseDoc.docId, baseDoc);
  }
  if (Array.isArray(rawPackage.applicableCorrigenda)) {
    for (const corr of rawPackage.applicableCorrigenda) {
      const validatedCorr = validateSourceDocumentState(corr);
      if (corr.documentIdentity) declaredDocuments.set(corr.documentIdentity, validatedCorr);
      if (corr.docId) declaredDocuments.set(corr.docId, validatedCorr);
    }
  }
  if (Array.isArray(rawPackage.sourceDocuments)) {
    for (const src of rawPackage.sourceDocuments) {
      const validatedSrc = validateSourceDocumentState(src);
      if (src.documentIdentity) declaredDocuments.set(src.documentIdentity, validatedSrc);
      if (src.docId) declaredDocuments.set(src.docId, validatedSrc);
      if (src.sourceId) declaredDocuments.set(src.sourceId, validatedSrc);
    }
  }

  const brokenRuleEvidence = [];
  const rules = Array.isArray(rawPackage.eligibilityRules) ? rawPackage.eligibilityRules : [];
  for (const rule of rules) {
    const docId = rule.sourceDocumentId || rule.officialDocumentId;
    if (docId && !declaredDocuments.has(docId)) {
      brokenRuleEvidence.push({
        ruleId: rule.ruleId,
        sourceDocumentId: docId,
        reason: 'REFERENTIAL_INTEGRITY_VIOLATION: Rule references undeclared package document: ' + docId
      });
      continue;
    }
    const hasLocator = (Array.isArray(rule.evidenceRefs) && rule.evidenceRefs.length > 0) ||
      Boolean(rule.page) || Boolean(rule.section) || Boolean(rule.sourceLocator) || Boolean(rule.paragraphOrTableRef);
    if (!hasLocator) {
      brokenRuleEvidence.push({
        ruleId: rule.ruleId,
        sourceDocumentId: docId || null,
        reason: 'DANGLING_RULE_EVIDENCE: Rule lacks locator, page, section, or evidenceRefs.'
      });
    }
  }

  if (brokenRuleEvidence.length > 0) {
    warnings.push('Rule evidence referential integrity failed for ' + brokenRuleEvidence.length + ' rules. Dangling rule evidence strictly fails closed.');
  }

  // 2. Generic Facts Extraction (Always survives under PARTIAL with explicit evidence levels)
  const baseFactLevel = baseDoc.factVerificationLevel || FACT_VERIFICATION_LEVEL.SOURCE_LOCATED;
  const baseDocLevel = baseDoc.evidenceLevel || DOCUMENT_EVIDENCE_LEVEL.URL_FOUND;

  const genericCycleFacts = {
    cycleId,
    authorityId,
    permanentMissionId: rawPackage.permanentMissionId || null,
    title: rawPackage.title || rawPackage.cycleTitle || 'Recruitment Notice',
    advertisementNumber: rawPackage.advertisementNumber || rawPackage.baseNotification?.officialNoticeNumber || null,
    totalVacancies: derivedVacancy.totalVacancies,
    vacanciesVerificationLevel: derivedVacancy.isMatrixComplete
      ? FACT_VERIFICATION_LEVEL.RULE_VERIFIED
      : (derivedVacancy.totalVacancies !== null ? FACT_VERIFICATION_LEVEL.TEXT_VERIFIED : FACT_VERIFICATION_LEVEL.SOURCE_LOCATED),
    applicationWindow: {
      startDate: rawPackage.applicationWindow?.startDate || null,
      endDate: rawPackage.applicationWindow?.endDate || null,
      isExtended: Boolean(rawPackage.applicationWindow?.isExtended),
      verificationLevel: baseDoc.isTextExtractedAndBound
        ? FACT_VERIFICATION_LEVEL.TEXT_VERIFIED
        : (baseDoc.isShaVerified ? FACT_VERIFICATION_LEVEL.BYTE_VERIFIED : FACT_VERIFICATION_LEVEL.SOURCE_LOCATED)
    },
    examDates: (Array.isArray(rawPackage.examDates) ? rawPackage.examDates : []).map(ed => ({
      ...ed,
      verificationLevel: baseDoc.isTextExtractedAndBound
        ? FACT_VERIFICATION_LEVEL.TEXT_VERIFIED
        : (baseDoc.isShaVerified ? FACT_VERIFICATION_LEVEL.BYTE_VERIFIED : FACT_VERIFICATION_LEVEL.SOURCE_LOCATED)
    })),
    officialSourceUrl: baseDoc.officialSourceUrl,
    packageFactVerificationLevel: baseFactLevel,
    packageEvidenceLevel: baseDocLevel,
    referentialIntegrity: {
      isReferentiallySound: brokenRuleEvidence.length === 0,
      brokenRuleCount: brokenRuleEvidence.length,
      brokenRules: brokenRuleEvidence
    }
  };

  // Skip the old genericCycleFacts block
  const oldFactsBlockEnd = '  };\n\n  // 3. Determine Final Validation Result';

  // 3. Determine Final Validation Result
  const hasRequiredRealAuthority = !realAuthorityAudit || (realAuthorityAudit.hasByteAuthority && realAuthorityAudit.hasTextAuthority && realAuthorityAudit.hasRuleAuthority);
  const isFullyComplete = baseDoc.isShaVerified && hasRequiredRealAuthority && derivedCompleteness.isComplete &&
    derivedAmendment.isChainVerified &&
    derivedVacancy.isMatrixComplete;

  if (isFullyComplete) {
    return {
      validationResult: PACKAGE_VALIDATION_RESULT.ACCEPTED_FOR_MATCHING,
      isValid: true,
      errors: [],
      warnings,
      derivedCompleteness,
      derivedAmendmentStatus: derivedAmendment.amendmentSearchStatus,
      derivedVacancyCompleteness: derivedVacancy.vacancyMatrixCompleteness,
      packageSemanticHash,
      genericCycleFacts
    };
  } else {
    // Partial source package
    if (!derivedCompleteness.isComplete) {
      warnings.push('Rulebook completeness incomplete. Unresolved families: ' + derivedCompleteness.unresolvedFamilies.join(', '));
    }
    if (!derivedAmendment.isChainVerified) {
      warnings.push('Amendment chain incomplete: ' + derivedAmendment.reason);
    }
    if (!derivedVacancy.isMatrixComplete) {
      warnings.push('Vacancy matrix incomplete: ' + derivedVacancy.reason);
    }

    return {
      validationResult: PACKAGE_VALIDATION_RESULT.PARTIAL_SOURCE_PACKAGE,
      isValid: true, // Structurally valid, but partial
      errors: [],
      warnings,
      derivedCompleteness,
      derivedAmendmentStatus: derivedAmendment.amendmentSearchStatus,
      derivedVacancyCompleteness: derivedVacancy.vacancyMatrixCompleteness,
      packageSemanticHash,
      genericCycleFacts
    };
  }
}

module.exports = {
  SOURCE_DOCUMENT_STATE,
  PACKAGE_VALIDATION_RESULT,
  RULE_FAMILY_COVERAGE_STATUS,
  VACANCY_COVERAGE_STATUS,
  ATTESTATION_REVIEW_STATUS,
  MANDATORY_RULE_FAMILIES,
  DOCUMENT_EVIDENCE_LEVEL,
  FACT_VERIFICATION_LEVEL,
  validateSourceDocumentState,
  validateAbsenceAttestation,
  deriveRulebookCompleteness,
  deriveAmendmentChainStatus,
  deriveVacancyMatrixCompleteness,
  computePackageSemanticHash,
  validateCareerRulebookPackage
};
