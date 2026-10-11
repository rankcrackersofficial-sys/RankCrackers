'use strict';

const crypto = require('node:crypto');
const {
  buildMissionShellBootstrapPlan,
  executeMissionShellBootstrap,
} = require('./mission_shell_bootstrap');
const {
  executeMissionOfficialSourcePairStaging,
  SOURCE_PAIR_SCHEMA_VERSION,
} = require('./mission_official_source_staging');
const { preflightSourceBinding } = require('./mission_source_preflight');
const {
  buildPrivateOfficialSourceStoragePath,
} = require('./private_official_source_storage');

const SOURCE_TYPES = Object.freeze(['notification', 'syllabus']);
const SHA256_HEX = /^[a-f0-9]{64}$/i;
const ENGLISH = new Set(['en', 'eng', 'english']);

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function normalizeSha256(value, code) {
  const normalized = requiredString(value, code).toLowerCase();
  if (!SHA256_HEX.test(normalized)) throw new Error(code);
  return normalized;
}

function toBuffer(bytes) {
  if (Buffer.isBuffer(bytes)) return Buffer.from(bytes);
  if (bytes instanceof Uint8Array) return Buffer.from(bytes);
  throw new Error('CODEX_OFFICIAL_SOURCE_BYTES_INVALID');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function assertOfficialHttpsProvenance(officialUrl, officialDomain) {
  const urlValue = requiredString(officialUrl, 'CODEX_OFFICIAL_SOURCE_URL_REQUIRED');
  let parsed;
  try {
    parsed = new URL(urlValue);
  } catch (_) {
    throw new Error('CODEX_OFFICIAL_SOURCE_URL_INVALID');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) {
    throw new Error('CODEX_OFFICIAL_SOURCE_URL_INVALID');
  }
  const domain = requiredString(officialDomain, 'CODEX_OFFICIAL_SOURCE_DOMAIN_REQUIRED').toLowerCase();
  if (parsed.hostname.toLowerCase() !== domain) throw new Error('CODEX_OFFICIAL_SOURCE_URL_DOMAIN_MISMATCH');
  return { officialUrl: parsed.toString(), officialDomain: domain };
}

function assertTrustedCodexAuthorization(grant) {
  if (!grant || grant.authorized !== true) throw new Error('CODEX_INVOCATION_AUTHORIZATION_FAILED');
  const authorizationId = requiredString(grant.authorizationId, 'CODEX_AUTHORIZATION_ID_REQUIRED');
  const actorId = requiredString(grant.actorId, 'CODEX_ACTOR_ID_REQUIRED');
  const founderAuth = grant.founderAuth;
  if (!founderAuth || founderAuth.uid !== actorId || !founderAuth.token || founderAuth.token.founder !== true) {
    throw new Error('CODEX_FOUNDER_AUTH_CONTEXT_REQUIRED');
  }
  if (grant.stageAuthorized !== true) throw new Error('CODEX_SOURCE_STAGE_AUTHORIZATION_REQUIRED');
  return Object.freeze({ authorizationId, actorId, founderAuth });
}

function validateSourceInput({ source, sourceType, plan, requestId }) {
  if (!source || source.sourceType !== sourceType) throw new Error('CODEX_OFFICIAL_SOURCE_TYPES_INVALID');
  if (source.missionId !== plan.missionId || source.cycleKey !== plan.cycleKey) {
    throw new Error('CODEX_OFFICIAL_SOURCE_CYCLE_BINDING_MISMATCH');
  }
  if (source.authorityKey !== plan.realm.authorityKey) throw new Error('CODEX_OFFICIAL_SOURCE_AUTHORITY_MISMATCH');
  if (source.isOfficial !== true) throw new Error('CODEX_OFFICIAL_SOURCE_NOT_OFFICIAL');
  const provenance = assertOfficialHttpsProvenance(source.officialUrl, source.officialDomain);
  const language = requiredString(source.language, 'CODEX_OFFICIAL_SOURCE_LANGUAGE_REQUIRED').toLowerCase();
  if (!ENGLISH.has(language)) throw new Error('CODEX_OFFICIAL_SOURCE_LANGUAGE_UNSUPPORTED');
  const bytes = toBuffer(source.bytes);
  if (bytes.length === 0) throw new Error('CODEX_OFFICIAL_SOURCE_BYTES_EMPTY');
  const actualSha256 = sha256(bytes);
  const expectedSha256 = normalizeSha256(source.expectedSha256, 'CODEX_OFFICIAL_SOURCE_EXPECTED_SHA_INVALID');
  if (expectedSha256 !== actualSha256) throw new Error('CODEX_OFFICIAL_SOURCE_SHA_MISMATCH');

  const storagePath = buildPrivateOfficialSourceStoragePath({
    missionId: plan.missionId,
    sourceType,
    requestId,
  });
  if (source.storagePath !== undefined && source.storagePath !== storagePath) {
    throw new Error('CODEX_OFFICIAL_SOURCE_STORAGE_PATH_MISMATCH');
  }

  const report = preflightSourceBinding({
    source: {
      sourceId: actualSha256,
      sourceType,
      governanceStatus: 'ACTIVE',
      verificationState: 'verified',
      isOfficial: true,
      officialDomain: provenance.officialDomain,
      language,
      expectedSha256,
      actualSha256,
      authorityKey: plan.realm.authorityKey,
      boundMissionId: plan.missionId,
      boundCycleKey: plan.cycleKey,
    },
    expectation: {
      missionId: plan.missionId,
      cycleKey: plan.cycleKey,
      sourceType,
      expectedSha256,
      authorityKey: plan.realm.authorityKey,
    },
  });
  if (!report || report.status !== 'PASS') throw new Error('CODEX_OFFICIAL_SOURCE_PREFLIGHT_FAILED');

  return Object.freeze({
    sourceType,
    missionId: plan.missionId,
    cycleKey: plan.cycleKey,
    authorityKey: plan.realm.authorityKey,
    isOfficial: true,
    officialUrl: provenance.officialUrl,
    officialDomain: provenance.officialDomain,
    language,
    expectedSha256,
    bytes,
    storagePath,
    fileName: source.fileName,
    mimeType: source.mimeType,
  });
}

function assertStorageAdapter(storage) {
  if (!storage || typeof storage.putPrivateObject !== 'function' || typeof storage.readPrivateObject !== 'function') {
    throw new Error('CODEX_PRIVATE_SOURCE_STORAGE_ADAPTER_REQUIRED');
  }
}

/**
 * Internal backend boundary for a trusted Codex invocation.
 *
 * `authorizeCodexInvocation` is deliberately injected: this repository does
 * not yet define a Codex service identity. A production caller must bind that
 * adapter to an authenticated service identity and return an already verified
 * ACTIVE-Founder Firebase auth context; caller-supplied tokens are rejected by
 * this boundary. No callable or public upload URL is introduced here.
 */
async function executeCodexMissionOfficialSourcePair({
  db,
  storage,
  request = {},
  authorizeCodexInvocation,
  recordedAt,
}) {
  if (!db || typeof db.runTransaction !== 'function') throw new Error('CODEX_INVOCATION_DB_REQUIRED');
  assertStorageAdapter(storage);
  if (typeof authorizeCodexInvocation !== 'function') throw new Error('CODEX_INVOCATION_AUTHORIZATION_REQUIRED');
  if (!recordedAt) throw new Error('CODEX_INVOCATION_RECORDED_AT_REQUIRED');

  const requestId = requiredString(request.requestId, 'CODEX_INVOCATION_REQUEST_ID_REQUIRED');
  const bootstrapPayload = request.bootstrapPayload;
  if (!bootstrapPayload || bootstrapPayload.requestId !== requestId) {
    throw new Error('CODEX_INVOCATION_BOOTSTRAP_REQUEST_ID_MISMATCH');
  }
  if (request.schemaVersion !== undefined && request.schemaVersion !== SOURCE_PAIR_SCHEMA_VERSION) {
    throw new Error('CODEX_INVOCATION_SCHEMA_VERSION_UNSUPPORTED');
  }

  const grant = await authorizeCodexInvocation({ requestId, bootstrapPayload });
  const authorization = assertTrustedCodexAuthorization(grant);
  const plan = buildMissionShellBootstrapPlan({
    payload: bootstrapPayload,
    actorId: authorization.actorId,
    recordedAt,
  });
  if (!Array.isArray(request.sources) || request.sources.length !== 2) {
    throw new Error('CODEX_OFFICIAL_SOURCE_PAIR_REQUIRES_EXACTLY_TWO');
  }
  const byType = new Map();
  for (const source of request.sources) {
    if (!source || !SOURCE_TYPES.includes(source.sourceType) || byType.has(source.sourceType)) {
      throw new Error('CODEX_OFFICIAL_SOURCE_TYPES_INVALID');
    }
    byType.set(source.sourceType, source);
  }
  if (!byType.has('notification') || !byType.has('syllabus')) {
    throw new Error('CODEX_OFFICIAL_SOURCE_PAIR_INCOMPLETE');
  }

  // Validate all evidence before the first database or Storage write.
  const validatedSources = SOURCE_TYPES.map(sourceType => validateSourceInput({
    source: byType.get(sourceType), sourceType, plan, requestId,
  }));

  const bootstrap = await db.runTransaction(transaction => executeMissionShellBootstrap({
    transaction,
    db,
    payload: bootstrapPayload,
    auth: authorization.founderAuth,
    recordedAt,
  }));

  for (const source of validatedSources) {
    await storage.putPrivateObject({
      storagePath: source.storagePath,
      bytes: source.bytes,
      contentType: source.mimeType,
      metadata: {
        missionId: source.missionId,
        cycleKey: source.cycleKey,
        authorityKey: source.authorityKey,
        sourceType: source.sourceType,
        requestId,
      },
    });
  }

  const expectedByPath = new Map(validatedSources.map(source => [source.storagePath, source.expectedSha256]));
  const stagingRequest = {
    requestId,
    missionId: plan.missionId,
    cycleKey: plan.cycleKey,
    authorityKey: plan.realm.authorityKey,
    schemaVersion: SOURCE_PAIR_SCHEMA_VERSION,
    actorId: authorization.actorId,
    sources: validatedSources.map(source => ({
      sourceType: source.sourceType,
      missionId: source.missionId,
      cycleKey: source.cycleKey,
      authorityKey: source.authorityKey,
      isOfficial: source.isOfficial,
      officialUrl: source.officialUrl,
      officialDomain: source.officialDomain,
      language: source.language,
      expectedSha256: source.expectedSha256,
      storagePath: source.storagePath,
      fileName: source.fileName,
      mimeType: source.mimeType,
    })),
  };
  const staging = await db.runTransaction(transaction => executeMissionOfficialSourcePairStaging({
    transaction,
    db,
    request: stagingRequest,
    authorizeStage: context => context.actorId === authorization.actorId && grant.stageAuthorized === true,
    readStagedBytes: async storagePath => {
      const object = await storage.readPrivateObject({
        storagePath,
        expectedSha256: expectedByPath.get(storagePath),
      });
      return Buffer.isBuffer(object) || object instanceof Uint8Array ? object : object.bytes;
    },
    recordedAt,
  }));

  return Object.freeze({
    success: true,
    authorizationId: authorization.authorizationId,
    missionId: plan.missionId,
    cycleKey: plan.cycleKey,
    bootstrap,
    staging,
    objectRefs: validatedSources.map(source => ({
      sourceType: source.sourceType,
      storagePath: source.storagePath,
      sha256: source.expectedSha256,
    })),
  });
}

module.exports = {
  executeCodexMissionOfficialSourcePair,
  assertOfficialHttpsProvenance,
};
