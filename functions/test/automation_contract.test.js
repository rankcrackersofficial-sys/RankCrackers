'use strict';

const {
  AUTO_STATUSES,
  reconcileAutomationRun,
} = require('../services/automation_contract');

describe('automation-first contract', () => {
  const base = {
    verdict: 'pass',
    confidence: 0.97,
    output: { subject: 'Chemistry', topics: ['Bonding'] },
    evidence: ['source://official/page/1'],
    ocrSource: 'official-pdf:page-1',
    vectorHashes: ['vec:test-1'],
    sourceHash: 'sha256:test',
  };

  test('auto-passes only when independent workers agree', () => {
    const result = reconcileAutomationRun({
      generator: base,
      verifier: base,
    });

    expect(result.status).toBe(AUTO_STATUSES.AUTO_PASSED);
    expect(result.publicationEligible).toBe(true);
    expect(result.canonicalOutput).toEqual(base.output);
  });

  test('holds disagreement without Founder content verification', () => {
    const result = reconcileAutomationRun({
      generator: base,
      verifier: { ...base, output: { subject: 'Physics' } },
    });

    expect(result.status).toBe(AUTO_STATUSES.AUTO_HOLD);
    expect(result.publicationEligible).toBe(false);
    expect(result.exceptionSeverity).toBe('HIGH');
  });

  test('holds low confidence even when outputs match', () => {
    const result = reconcileAutomationRun({
      generator: { ...base, confidence: 0.89 },
      verifier: { ...base, confidence: 0.99 },
    });

    expect(result.status).toBe(AUTO_STATUSES.AUTO_HOLD);
    expect(result.reason).toBe('CONFIDENCE_BELOW_AUTOMATION_THRESHOLD');
  });

  test('accepts equivalent output key order but still requires provenance', () => {
    const verifier = {
      ...base,
      output: { topics: ['Bonding'], subject: 'Chemistry' },
    };
    expect(reconcileAutomationRun({ generator: base, verifier }).status)
      .toBe(AUTO_STATUSES.AUTO_PASSED);

    const missingEvidence = { ...base, vectorHashes: [] };
    expect(reconcileAutomationRun({ generator: missingEvidence, verifier: base }).status)
      .toBe(AUTO_STATUSES.AUTO_HOLD);
    expect(reconcileAutomationRun({ generator: missingEvidence, verifier: base }).reason)
      .toBe('GENERATOR_VECTOR_HASHES_MISSING');
  });
});
