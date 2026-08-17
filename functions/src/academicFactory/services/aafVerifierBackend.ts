/**
 * Compatibility export for AAF-006B.
 *
 * The authoritative verifier backend is independentFactVerifierBackend. This
 * wrapper exists so older local tests/imports cannot drift into a second
 * lifecycle authority or silent provider implementation.
 */
export {
  GovernedVerificationDecision,
  GovernedVerificationVerdict,
  IndependentProviderFinding,
  IndependentVerifierProviderAdapter,
  LaunchBundleCompatibilityResult,
  LaunchBundleSummary,
  ProviderFinding,
  RealProviderExecutionDisabledAdapter,
  SourceBoundIndependentVerifierBackend,
  SourceBoundVerifierEnvelope,
} from './independentFactVerifierBackend';
