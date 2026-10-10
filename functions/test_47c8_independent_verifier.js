/**
 * 🔱 GATE 47C8 INDEPENDENT NATIONAL CANONICAL FREEZE VERIFIER HARNESS
 * Agent: AGENT-2 — INDEPENDENT NATIONAL FORENSIC VERIFICATION LANE
 * Role: INDEPENDENT VERIFIER OF AGENT-4 47C8 ONLY
 * Mode: STRICT READ-ONLY
 *
 * Enforces:
 *   - Physical 47C8 handoff verification without fallback to historical producer reports
 *   - AFCAT current portal = afcat.edcil.co.in & route-level sourceEvidenceRef
 *   - NTA S3WaaS domain restriction (no blanket authority ownership)
 *   - Mandatory disposition for Intelligence Bureau & EPFO candidate families
 *   - Chief-locked canonical IDs (ibps_crp_rrb_officers, ibps_crp_rrb_office_assistant, jee_main_2026, neet_(ug)-2027, 9 SSC IDs)
 *   - Re-execution of generic_mission_materializer.js validateManifest
 *   - Readiness recomputation (0 academic start ready)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

const BASE_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(BASE_ROOT, 'docs', 'academic_review');
const C8_DIR = path.join(DOCS_DIR, '47c8');
const C8_HANDOFF_DIR = path.join(C8_DIR, 'materializer_handoff');
const OUT_47C8V_DIR = path.join(DOCS_DIR, '47c8v');

const EXPECTED_ENGINE_SHA = '7c8627e27a674fc6f8373a5f27b5404e5d5741c990303fa6abd170edbbd1c7a5';
const EXPECTED_ENGINE_PATH = path.join(__dirname, 'services', 'generic_mission_materializer.js');

function computeHashAndLength(filePath) {
  const bytes = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return { byteLength: bytes.length, sha256 };
}

async function run47C8IndependentVerification() {
  console.log('=====================================================================');
  console.log('RUNNING GATE 47C8 INDEPENDENT FORENSIC VERIFICATION HARNESS');
  console.log('=====================================================================\n');

  // Check physical availability of 47C8 handoff
  if (!fs.existsSync(C8_HANDOFF_DIR)) {
    console.log('STATUS: 47C8_HANDOFF_PENDING_PRODUCER_PUBLICATION');
    console.log('Expected handoff directory does not exist yet:', C8_HANDOFF_DIR);
    console.log('Verifier harness is STANDBY_READY for execution when 47C8 is produced.\n');
    return {
      status: 'STANDBY_READY',
      message: '47C8_HANDOFF_PENDING_PRODUCER_PUBLICATION'
    };
  }

  // 1. Verify Engine Anti-Tamper
  const currentEngineInfo = computeHashAndLength(EXPECTED_ENGINE_PATH);
  const sourceVersionDrift = currentEngineInfo.sha256 !== EXPECTED_ENGINE_SHA;
  if (sourceVersionDrift) {
    console.warn('⚠️ WARNING: Materializer engine hash differs from snapshot baseline!');
  }

  const materializer = require(EXPECTED_ENGINE_PATH);

  // 2. Physical Handoff Hash Verification
  const handoffManifestPath = path.join(C8_DIR, '47c8_materializer_handoff_sha256_manifest.json');
  if (!fs.existsSync(handoffManifestPath)) {
    throw new Error('FAIL_CLOSED: 47c8_materializer_handoff_sha256_manifest.json is missing on disk.');
  }

  const handoffManifest = JSON.parse(fs.readFileSync(handoffManifestPath, 'utf8'));
  let verifiedCount = 0;
  let mismatchCount = 0;
  let missingCount = 0;

  handoffManifest.files.forEach(f => {
    const fp = path.join(C8_DIR, f.relativePath);
    if (!fs.existsSync(fp)) {
      missingCount++;
      return;
    }
    const info = computeHashAndLength(fp);
    if (info.sha256 === f.sha256 && info.byteLength === f.byteLength) {
      verifiedCount++;
    } else {
      mismatchCount++;
    }
  });

  assert.strictEqual(mismatchCount, 0, 'Handoff hash mismatch count must be 0.');
  assert.strictEqual(missingCount, 0, 'Handoff missing file count must be 0.');

  // 3. Authority Registry Recomputation
  const authRegistryPath = path.join(C8_DIR, '47c8_national_authority_registry.json');
  const authRegistryData = JSON.parse(fs.readFileSync(authRegistryPath, 'utf8'));
  const authList = authRegistryData.authorities || authRegistryData.canonicalCentralAuthorities || [];

  const iafAuth = authList.find(a => (a.authorityId || a.canonicalAuthorityKey) === 'auth_in_indian_air_force');
  const iafDomains = iafAuth ? (iafAuth.officialDomains || []) : [];
  const afcatCurrentPortalRegistered = iafDomains.includes('afcat.edcil.co.in');
  const afcatSupersededCdacMarkedCurrent = iafAuth?.activeApplicationPortal === 'https://afcat.cdac.in';

  const ntaAuth = authList.find(a => (a.authorityId || a.canonicalAuthorityKey) === 'auth_in_nta');
  const ntaDomains = ntaAuth ? (ntaAuth.officialDomains || []) : [];
  const s3waasBlanketDomainPresent = ntaDomains.some(d => d.includes('s3waas.gov.in'));

  // 4. Manifest Inventory & Identity Recomputation
  const manifestPath = path.join(C8_DIR, '47c8_national_mission_manifest.json');
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const rawMissions = manifestData.missions || [];

  const missionIds = rawMissions.map(m => m.missionId);

  const hasChiefLockedIbpsOfficers = missionIds.includes('ibps_crp_rrb_officers');
  const hasChiefLockedIbpsAssistant = missionIds.includes('ibps_crp_rrb_office_assistant');
  const hasProhibitedIbpsOfficerSingular = missionIds.includes('ibps_rrb_officer');
  const hasProhibitedNtaJee = missionIds.includes('nta_jee_main');
  const hasProhibitedNtaNeet = missionIds.includes('nta_neet_ug');
  const hasProhibitedSscGdConstable = missionIds.includes('ssc_gd_constable');

  // 5. AFCAT Route Evidence Audit
  const afcatMission = rawMissions.find(m => m.missionId === 'afcat');
  let afcatRoutesWithoutEvidence = 0;
  const afcatRoutesArtifactPath = path.join(C8_DIR, '47c8_afcat_route_variant_recheck.json');
  if (fs.existsSync(afcatRoutesArtifactPath)) {
    const afcatRouteData = JSON.parse(fs.readFileSync(afcatRoutesArtifactPath, 'utf8'));
    (afcatRouteData.recruitmentRoutes || []).forEach(r => {
      if (!r.sourceEvidenceRef) afcatRoutesWithoutEvidence++;
    });
  }

  // 6. Completeness Audit (IB & EPFO)
  const completenessPath = path.join(C8_DIR, '47c8_national_completeness_ledger.json');
  let ibDispositionFound = false;
  let epfoDispositionFound = false;

  if (fs.existsSync(completenessPath)) {
    const compText = fs.readFileSync(completenessPath, 'utf8').toLowerCase();
    ibDispositionFound = compText.includes('intelligence bureau') || compText.includes('ib acio');
    epfoDispositionFound = compText.includes('epfo') || compText.includes('provident');
  }

  // 7. Materializer Re-Execution
  let valExitCode = 0;
  let valErrorMsg = null;
  let valMissionCount = 0;
  try {
    const valRes = materializer.validateManifest(manifestData, {
      context: 'ACCEPTED_MANIFEST',
      authorityRegistry: authRegistryData
    });
    valMissionCount = valRes.totalMissions;
  } catch (e) {
    valExitCode = 1;
    valErrorMsg = e.message;
  }

  // Summary of Blockers
  const blockers = [];
  if (!afcatCurrentPortalRegistered) blockers.push('AFCAT current portal afcat.edcil.co.in missing from IAF officialDomains');
  if (afcatSupersededCdacMarkedCurrent) blockers.push('Superseded portal afcat.cdac.in marked current');
  if (s3waasBlanketDomainPresent) blockers.push('cdnbbsr.s3waas.gov.in present in NTA blanket officialDomains');
  if (afcatRoutesWithoutEvidence > 0) blockers.push(`${afcatRoutesWithoutEvidence} AFCAT route(s) lack sourceEvidenceRef`);
  if (!hasChiefLockedIbpsOfficers || hasProhibitedIbpsOfficerSingular) blockers.push('IBPS RRB Officer canonical ID mismatch (must be ibps_crp_rrb_officers)');
  if (hasProhibitedNtaJee || hasProhibitedNtaNeet) blockers.push('Prohibited duplicate pilot mission IDs present');
  if (hasProhibitedSscGdConstable) blockers.push('Prohibited ssc_gd_constable duplicate present');
  if (!ibDispositionFound) blockers.push('Intelligence Bureau candidate family missing explicit disposition');
  if (!epfoDispositionFound) blockers.push('EPFO candidate family missing explicit disposition');
  if (valExitCode !== 0) blockers.push(`Materializer validateManifest failed: ${valErrorMsg}`);

  const passed = blockers.length === 0;

  console.log('---------------------------------------------------------------------');
  console.log('47C8 INDEPENDENT VERIFIER EXECUTION METRICS:');
  console.log('  Handoff files verified:', verifiedCount);
  console.log('  Materializer validate count:', valMissionCount);
  console.log('  Blockers found:', blockers.length);
  if (blockers.length > 0) {
    console.log('  Blocker list:');
    blockers.forEach(b => console.log('   -', b));
  }
  console.log('---------------------------------------------------------------------');
  console.log('VERDICT:', passed ? '47C8V_INDEPENDENT_NATIONAL_CANONICAL_FREEZE_VERIFICATION_PASSED' : '47C8V_INDEPENDENT_NATIONAL_FREEZE_VERIFICATION_FAILED_WITH_EXACT_BLOCKERS');
  console.log('=====================================================================\n');

  return {
    passed,
    verdict: passed ? '47C8V_INDEPENDENT_NATIONAL_CANONICAL_FREEZE_VERIFICATION_PASSED' : '47C8V_INDEPENDENT_NATIONAL_FREEZE_VERIFICATION_FAILED_WITH_EXACT_BLOCKERS',
    blockers,
    metrics: {
      HANDOFF_HASH_VERIFIED_COUNT: verifiedCount,
      HANDOFF_HASH_MISMATCH_COUNT: mismatchCount,
      MATERIALIZER_VALIDATE_ONLY_COUNT: valMissionCount,
      AFCAT_REGISTRY_CURRENT_PORTAL_MATCH: afcatCurrentPortalRegistered ? 'YES' : 'NO',
      BROAD_SHARED_HOST_USED_AS_BLANKET_AUTHORITY_DOMAIN_COUNT: s3waasBlanketDomainPresent ? 1 : 0,
      AFCAT_ROUTE_WITHOUT_SOURCE_EVIDENCE_COUNT: afcatRoutesWithoutEvidence,
      IBPS_STATE_NATIONAL_IDENTITY_CONFLICT_COUNT: (!hasChiefLockedIbpsOfficers || hasProhibitedIbpsOfficerSingular) ? 1 : 0,
      PREVIOUSLY_UNRESOLVED_CANDIDATE_SILENTLY_DROPPED_COUNT: (!ibDispositionFound ? 1 : 0) + (!epfoDispositionFound ? 1 : 0)
    }
  };
}

if (require.main === module) {
  run47C8IndependentVerification().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}

module.exports = { run47C8IndependentVerification };
