/**
 * 🔱 OFFICIAL AUTHORITY INTELLIGENCE — ROLE ENDPOINT EVIDENCE VERIFIER
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-R2-AG2-STRICT-TLS-ENDPOINT-EVIDENCE-AND-FREEZE-20260912
 *
 * Generic, data-driven role endpoint evidence verification.
 * Zero authority-specific branching (no if-UPSC, if-SSC, if-RPSC).
 * Evaluates declared role evidence contracts against live HTTP probe results.
 */

'use strict';

const { deepFreeze, ROLE_PROOF_METHODS } = require('./registry_schema');

const ROLE_EVIDENCE_VERDICTS = deepFreeze({
  VERIFIED: 'VERIFIED',
  SAFE_NULL: 'SAFE_NULL',
  INVALID: 'INVALID',
  UNAVAILABLE: 'UNAVAILABLE',
  NOT_PROVEN: 'NOT_PROVEN',
});

/**
 * Validates whether a probed host is in the allowed official domains list.
 * Enforces strict boundary safety (exact domain match or dot-prefixed subdomain match).
 * E.g., 'evilssc.gov.in.attacker.com' is REJECTED for 'ssc.gov.in'.
 */
function isDomainAllowed(host, allowedDomains) {
  if (!host || typeof host !== 'string') return false;
  if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) return false;
  const cleanHost = host.toLowerCase().trim();
  return allowedDomains.some((d) => {
    const cleanAllowed = d.toLowerCase().trim();
    return cleanHost === cleanAllowed || cleanHost.endsWith('.' + cleanAllowed);
  });
}

/**
 * Generic, data-driven role evidence evaluator.
 * Validates probe output (host, status, finalUrl, title, headings, body) against
 * the authority's declared role endpoint evidence contract.
 *
 * @param {Object} evidenceContract - Declared evidence contract for this slot
 * @param {Object} probeResult - Live HTTP probe result
 * @param {Array<string>} [allowedDomains] - Authority allowed official domains
 * @returns {Object} Verdict and diagnostic reasoning
 */
function evaluateRoleEvidence(evidenceContract, probeResult, allowedDomains = []) {
  // 1. Safe Null Evaluation (only when evidence contract declares SAFE_NULL or slot canonicalUrl is null)
  if (evidenceContract && (evidenceContract.proofMethod === ROLE_PROOF_METHODS.SAFE_NULL || evidenceContract.canonicalUrl === null)) {
    return {
      verdict: ROLE_EVIDENCE_VERDICTS.SAFE_NULL,
      semanticMatch: null,
      verificationPerformed: false,
      reason: 'NO_GOVERNED_CONSOLIDATED_ENDPOINT',
      isSafeNull: true,
    };
  }

  // 2. Missing contract for non-null endpoint fails closed as NOT_PROVEN
  if (!evidenceContract) {
    return {
      verdict: ROLE_EVIDENCE_VERDICTS.NOT_PROVEN,
      semanticMatch: false,
      verificationPerformed: false,
      reason: 'MISSING_ROLE_EVIDENCE_CONTRACT',
      isSafeNull: false,
    };
  }

  // 3. Probe Network / TLS Error
  if (probeResult.error) {
    return {
      verdict: ROLE_EVIDENCE_VERDICTS.UNAVAILABLE,
      semanticMatch: false,
      verificationPerformed: true,
      reason: 'NETWORK_OR_TLS_ERROR: ' + probeResult.error,
      isSafeNull: false,
    };
  }

  // 4. HTTP Status Verification (must be 2xx or 3xx)
  if (!probeResult.status || probeResult.status < 200 || probeResult.status >= 400) {
    return {
      verdict: ROLE_EVIDENCE_VERDICTS.INVALID,
      semanticMatch: false,
      verificationPerformed: true,
      reason: 'HTTP_STATUS_' + (probeResult.status || 'NULL'),
      isSafeNull: false,
    };
  }

  // 5. Host Domain Governance & Boundary Safety Check
  const probeHost = (probeResult.finalHost || '').toLowerCase().trim();
  if (allowedDomains.length > 0 && !isDomainAllowed(probeHost, allowedDomains)) {
    return {
      verdict: ROLE_EVIDENCE_VERDICTS.INVALID,
      semanticMatch: false,
      verificationPerformed: true,
      reason: 'UNAPPROVED_FINAL_HOST: "' + probeHost + '" not in allowedOfficialDomains',
      isSafeNull: false,
    };
  }

  if (evidenceContract.expectedFinalHost) {
    const expectedHost = evidenceContract.expectedFinalHost.toLowerCase().trim();
    if (probeHost !== expectedHost) {
      return {
        verdict: ROLE_EVIDENCE_VERDICTS.INVALID,
        semanticMatch: false,
        verificationPerformed: true,
        reason: 'HOST_MISMATCH: expected "' + expectedHost + '", got "' + probeHost + '"',
        isSafeNull: false,
      };
    }
  }

  // 6. Path Pattern Verification
  if (evidenceContract.expectedPathPattern) {
    try {
      const parsedUrl = new URL(probeResult.finalUrl);
      const pathRegex = new RegExp(evidenceContract.expectedPathPattern, 'i');
      if (!pathRegex.test(parsedUrl.pathname)) {
        return {
          verdict: ROLE_EVIDENCE_VERDICTS.NOT_PROVEN,
          semanticMatch: false,
          verificationPerformed: true,
          reason: 'PATH_PATTERN_MISMATCH: path "' + parsedUrl.pathname + '" does not match "' + evidenceContract.expectedPathPattern + '"',
          isSafeNull: false,
        };
      }
    } catch (err) {
      return {
        verdict: ROLE_EVIDENCE_VERDICTS.INVALID,
        semanticMatch: false,
        verificationPerformed: true,
        reason: 'INVALID_FINAL_URL: ' + err.message,
        isSafeNull: false,
      };
    }
  }

  // 7. Title Tokens Verification
  const pageTitle = (probeResult.title || '').trim();
  if (Array.isArray(evidenceContract.expectedTitleTokens) && evidenceContract.expectedTitleTokens.length > 0) {
    const missingTitleTokens = evidenceContract.expectedTitleTokens.filter(token => {
      return !pageTitle.toLowerCase().includes(token.toLowerCase());
    });
    if (missingTitleTokens.length > 0) {
      return {
        verdict: ROLE_EVIDENCE_VERDICTS.NOT_PROVEN,
        semanticMatch: false,
        verificationPerformed: true,
        reason: 'TITLE_TOKENS_MISSING: [' + missingTitleTokens.join(', ') + '] not found in page title "' + pageTitle + '"',
        isSafeNull: false,
      };
    }
  }

  // 8. Page / Heading Tokens Verification (for PATH_AND_PAGE_HEADING and PATH_AND_PAGE_TOKENS)
  if (evidenceContract.proofMethod === ROLE_PROOF_METHODS.PATH_AND_PAGE_HEADING ||
      evidenceContract.proofMethod === ROLE_PROOF_METHODS.PATH_AND_PAGE_TOKENS) {
    const combinedContent = [
      probeResult.bodySnippet || '',
      Array.isArray(probeResult.headings) ? probeResult.headings.join(' ') : '',
    ].join(' ');

    if (Array.isArray(evidenceContract.expectedPageTokens) && evidenceContract.expectedPageTokens.length > 0) {
      const missingPageTokens = evidenceContract.expectedPageTokens.filter(token => {
        return !combinedContent.toLowerCase().includes(token.toLowerCase());
      });
      if (missingPageTokens.length > 0) {
        return {
          verdict: ROLE_EVIDENCE_VERDICTS.NOT_PROVEN,
          semanticMatch: false,
          verificationPerformed: true,
          reason: 'PAGE_TOKENS_MISSING: [' + missingPageTokens.join(', ') + '] not found in page body/headings',
          isSafeNull: false,
        };
      }
    }
  }

  // 9. Strict Proof Achieved
  return {
    verdict: ROLE_EVIDENCE_VERDICTS.VERIFIED,
    semanticMatch: true,
    verificationPerformed: true,
    reason: 'DATA_DRIVEN_EVIDENCE_SATISFIED',
    isSafeNull: false,
  };
}

module.exports = {
  ROLE_EVIDENCE_VERDICTS,
  isDomainAllowed,
  evaluateRoleEvidence,
};
