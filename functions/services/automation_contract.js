'use strict';

/**
 * Automation-first Founder pipeline contract.
 *
 * The Founder is not a routine reviewer. A run is eligible for automatic
 * progression only when an independent generator and verifier agree on the
 * same source-bound result. Material disagreement becomes an exception.
 */

const AUTO_STATUSES = Object.freeze({
  QUEUED: 'queued',
  GENERATING: 'generating',
  VERIFYING: 'verifying',
  RECONCILING: 'reconciling',
  AUTO_PASSED: 'auto_passed',
  AUTO_REPAIRED: 'auto_repaired',
  AUTO_HOLD: 'auto_hold',
  FAILED: 'failed',
});

const EXCEPTION_SEVERITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

function normalizeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function normalizeWorkerResult(result, workerId) {
  const safe = result && typeof result === 'object' ? result : {};
  return {
    workerId,
    verdict: String(safe.verdict || 'fail').toLowerCase(),
    confidence: normalizeConfidence(safe.confidence),
    output: safe.output ?? safe.result ?? null,
    ocrSource: safe.ocrSource ?? safe.ocr_source ?? null,
    vectorHashes: Array.isArray(safe.vectorHashes)
      ? safe.vectorHashes
      : Array.isArray(safe.vector_hashes)
        ? safe.vector_hashes
        : [],
    evidence: Array.isArray(safe.evidence) ? safe.evidence : [],
    findings: Array.isArray(safe.findings) ? safe.findings : [],
    repairs: Array.isArray(safe.repairs) ? safe.repairs : [],
    sourceHash: safe.sourceHash ? String(safe.sourceHash) : null,
    generatedAt: safe.generatedAt || null,
  };
}

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function validateWorkerEvidence(worker, label) {
  if (!worker.sourceHash) return `${label}_SOURCE_HASH_MISSING`;
  if (!worker.ocrSource || typeof worker.ocrSource !== 'string') return `${label}_OCR_SOURCE_MISSING`;
  if (worker.vectorHashes.length === 0) return `${label}_VECTOR_HASHES_MISSING`;
  if (worker.evidence.length === 0) return `${label}_EVIDENCE_MISSING`;
  if (worker.output === null || worker.output === undefined) return `${label}_OUTPUT_MISSING`;
  return null;
}

function compareOutputs(generator, verifier) {
  const generatorSource = generator.sourceHash;
  const verifierSource = verifier.sourceHash;
  const generatorEvidenceError = validateWorkerEvidence(generator, 'GENERATOR');
  if (generatorEvidenceError) return { agreement: false, reason: generatorEvidenceError };
  const verifierEvidenceError = validateWorkerEvidence(verifier, 'VERIFIER');
  if (verifierEvidenceError) return { agreement: false, reason: verifierEvidenceError };
  if (generatorSource && verifierSource && generatorSource !== verifierSource) {
    return { agreement: false, reason: 'SOURCE_HASH_MISMATCH' };
  }

  const generatorJson = stableSerialize(generator.output);
  const verifierJson = stableSerialize(verifier.output);
  if (generatorJson !== verifierJson) {
    return { agreement: false, reason: 'INDEPENDENT_OUTPUT_DISAGREEMENT' };
  }

  if (generator.verdict !== 'pass' || verifier.verdict !== 'pass') {
    return { agreement: false, reason: 'WORKER_VERDICT_NOT_PASS' };
  }

  return { agreement: true, reason: 'INDEPENDENT_WORKERS_AGREE' };
}

function reconcileAutomationRun({ generator, verifier, minimumConfidence = 0.9 }) {
  const g = normalizeWorkerResult(generator, 'generator_worker');
  const v = normalizeWorkerResult(verifier, 'independent_verifier_worker');
  const comparison = compareOutputs(g, v);
  const confidence = Math.min(g.confidence, v.confidence);

  if (!comparison.agreement) {
    return {
      status: AUTO_STATUSES.AUTO_HOLD,
      publicationEligible: false,
      confidence,
      reason: comparison.reason,
      exceptionSeverity: 'HIGH',
      canonicalOutput: null,
    };
  }

  if (confidence < minimumConfidence) {
    return {
      status: AUTO_STATUSES.AUTO_HOLD,
      publicationEligible: false,
      confidence,
      reason: 'CONFIDENCE_BELOW_AUTOMATION_THRESHOLD',
      exceptionSeverity: 'MEDIUM',
      canonicalOutput: null,
    };
  }

  return {
    status: AUTO_STATUSES.AUTO_PASSED,
    publicationEligible: true,
    confidence,
    reason: comparison.reason,
    exceptionSeverity: null,
    canonicalOutput: g.output,
  };
}

function buildAutomationPrompts({ domain, input, evidence }) {
  const serializedInput = JSON.stringify(input ?? null);
  const serializedEvidence = JSON.stringify(evidence ?? []);
  const domainName = String(domain || 'general').toUpperCase();

  return {
    generator: `You are the GENERATOR WORKER for RankCrackers ${domainName}.\n` +
      'Generate a complete structured result from the supplied input and evidence. ' +
      'Never invent facts. Every material claim must include evidence references. ' +
      'Return JSON only with verdict, confidence, output, ocrSource, vectorHashes, evidence, findings, repairs, sourceHash.\n' +
      `INPUT:\n${serializedInput}\nEVIDENCE:\n${serializedEvidence}`,
    verifier: `You are the INDEPENDENT VERIFIER WORKER for RankCrackers ${domainName}.\n` +
      'You are not a formatter and must not trust the generator output. Independently ' +
      'reconstruct/check the result against the source evidence. Reject unsupported, ' +
      'ambiguous, stale, duplicated or hallucinated claims. Return JSON only with ' +
      'verdict, confidence, output, ocrSource, vectorHashes, evidence, findings, repairs, sourceHash. The verifier ' +
      'must use the same source evidence but an independent reasoning path.\n' +
      `INPUT:\n${serializedInput}\nEVIDENCE:\n${serializedEvidence}`,
  };
}

module.exports = {
  AUTO_STATUSES,
  EXCEPTION_SEVERITIES,
  buildAutomationPrompts,
  normalizeWorkerResult,
  reconcileAutomationRun,
};
