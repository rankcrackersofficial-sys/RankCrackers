import * as admin from 'firebase-admin';
import {
  B3_CONTRACT_VERSION,
  B3MaterializationResult,
  B3MaterializedNode,
  B3SourceEvidence,
} from '../syllabus/b3Contract';
import {
  B3CurrentAuthorityPointer,
  B3GovernedRevisionIdentity,
  B3MaterializationRepository,
  B3PersistenceConflictError,
  B3RevisionEnvelope,
  B3_REVISION_STATE_SEALED,
  B3_REVISION_STATE_STAGING,
  b3CanonicalNodePath,
  b3CurrentAuthorityPointerPath,
  b3RevisionRootPath,
  b3UnresolvedEvidencePath,
} from '../syllabus/b3MaterializationRepository';
import { FirestoreB3MaterializationPersistenceStore } from '../syllabus/firestoreB3MaterializationRepository';

jest.setTimeout(120000);

const PROJECT_ID = 'demo-rankcrackers-b3-p2c';
const APP_NAME = 'b3-p2c-firestore-emulator-proof';
const PRIMARY_MISSION = 'b3_p2c_emulator_primary';
const ROLLBACK_MISSION = 'b3_p2c_emulator_rollback';
const CONCURRENT_MISSION = 'b3_p2c_emulator_concurrent';

function assertLocalEmulator(): string {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) throw new Error('FIRESTORE_EMULATOR_HOST_REQUIRED_BEFORE_FIRESTORE_INITIALIZATION');
  const hostname = host.split(':')[0].toLowerCase();
  if (hostname !== '127.0.0.1' && hostname !== 'localhost' && hostname !== '::1') {
    throw new Error(`NON_LOCAL_FIRESTORE_EMULATOR_HOST_REJECTED:${host}`);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('PRODUCTION_CREDENTIALS_FORBIDDEN_IN_B3_P2C_EMULATOR_TEST');
  }
  return host;
}

const lineage = {
  missionId: PRIMARY_MISSION,
  sourceId: 'source_1',
  documentId: 'document_1',
  sourceVersionId: 'version_1',
  sourceSha256: 'sha256_source_1',
  extractionId: 'extraction_node_1',
  paperId: 'PAPER_1',
  location: { pageNumber: 1, sectionId: 'physics', span: { start: 0, end: 10 } },
};

function canonicalNode(missionId: string, title = 'Physics'): B3MaterializedNode {
  return {
    nodeId: 'node_subject_physics',
    canonicalIdentityKey: 'subject.physics',
    level: 'subject',
    title,
    parentId: null,
    parentCanonicalIdentityKey: null,
    order: 1,
    authorityEvidenceIds: ['authority_node_1'],
    structuralAuthorityEvidenceIds: [],
    orderingAuthorityEvidenceIds: ['order_node_1'],
    supportingOccurrences: [{ ...lineage, missionId }],
  };
}

function unresolvedEvidence(missionId: string): B3SourceEvidence {
  return {
    evidenceId: 'evidence_unresolved_1',
    level: 'unit',
    title: 'Unresolved Mechanics',
    required: true,
    authority: {
      official: true,
      applicable: true,
      effective: true,
      verified: true,
      evidenceId: 'authority_unresolved_1',
    },
    identityAuthority: {
      verified: true,
      canonicalIdentityKey: 'unit.unresolved',
      evidenceId: 'identity_unresolved_1',
      method: 'AUTHORITATIVE_CANONICAL_IDENTITY',
    },
    orderingAuthority: {
      verified: true,
      order: 2,
      evidenceId: 'order_unresolved_1',
      method: 'AUTHORITATIVE_SOURCE_ORDER',
    },
    lineage: {
      ...lineage,
      missionId,
      extractionId: 'extraction_unresolved_1',
      location: { pageNumber: 2, sectionId: 'physics', span: { start: 11, end: 30 } },
    },
  };
}

function materializationResult(
  missionId: string,
  title = 'Physics',
  requiredEvidenceIds = ['evidence_node_1', 'evidence_unresolved_1'],
  requireExactFiveLevelCoverage = true,
): B3MaterializationResult {
  return {
    declaredCompletenessScope: {
      requiredEvidenceIds,
      requireExactFiveLevelCoverage,
    },
    canonicalMaterializedNodes: [canonicalNode(missionId, title)],
    unresolvedSourceEvidence: [{
      evidence: unresolvedEvidence(missionId),
      reasons: ['MISSING_PARENTAGE_AUTHORITY'],
    }],
    completionEligibility: {
      eligible: false,
      reasons: ['UNRESOLVED_REQUIRED_EVIDENCE'],
      resolvedRequiredEvidenceIds: ['evidence_node_1'],
      unresolvedRequiredEvidenceIds: ['evidence_unresolved_1'],
    },
  };
}

function revisionIdentity(
  missionId: string,
  revisionId: string,
  supersedesRevisionId?: string,
): B3GovernedRevisionIdentity {
  return {
    missionId,
    authoritativeSourceChainId: 'source_chain_1',
    orderedSources: [{
      sourceId: 'source_1',
      documentId: 'document_1',
      sourceVersionId: 'version_1',
      sourceSha256: 'sha256_source_1',
    }],
    verifiedExtractionIds: ['extraction_node_1', 'extraction_unresolved_1'],
    contractVersion: B3_CONTRACT_VERSION,
    revisionId,
    ...(supersedesRevisionId ? { supersedesRevisionId } : {}),
  };
}

describe('Firestore B3 materialization adapter emulator proof F01-F30', () => {
  let emulatorHost: string;
  let app: admin.app.App;
  let db: admin.firestore.Firestore;
  let store: FirestoreB3MaterializationPersistenceStore;
  let repository: B3MaterializationRepository;

  let stagingEnvelope: B3RevisionEnvelope;
  let stagingNode: B3MaterializedNode;
  let stagingUnresolved: B3MaterializationResult['unresolvedSourceEvidence'][number];
  let pointerBeforeSeal: unknown;
  let sealedEnvelope: B3RevisionEnvelope;
  let sealedPointer: B3CurrentAuthorityPointer;
  let replayDocumentCount = 0;
  let replayProofStatus = '';
  let conflictRejected = false;
  let scopeConflictRejected = false;
  let scopeMutationRejected = false;
  let mutationRejected = false;
  let unresolvedAfterSeal: unknown;
  let revisionOneAfterSupersession: B3RevisionEnvelope;
  let revisionTwoAfterSupersession: B3RevisionEnvelope;
  let pointerAfterSupersession: B3CurrentAuthorityPointer;
  let rollbackEnvelope: B3RevisionEnvelope;
  let rollbackPointer: unknown;
  let concurrencyFulfilled = 0;
  let concurrencyRejected = 0;
  let concurrencyPointer: B3CurrentAuthorityPointer;
  let concurrencyPointedEnvelope: B3RevisionEnvelope;
  let forbiddenProjectionEmpty = false;
  let forbiddenStructuredEmpty = false;
  let forbiddenStudentMissing = false;

  beforeAll(async () => {
    emulatorHost = assertLocalEmulator();
    app = admin.apps.find(candidate => candidate?.name === APP_NAME)
      ?? admin.initializeApp({ projectId: PROJECT_ID }, APP_NAME);
    db = app.firestore();
    db.settings({ ignoreUndefinedProperties: false });
    store = new FirestoreB3MaterializationPersistenceStore(db);
    repository = new B3MaterializationRepository(store);

    for (const missionId of [PRIMARY_MISSION, ROLLBACK_MISSION, CONCURRENT_MISSION]) {
      await db.recursiveDelete(db.collection('mission_realms').doc(missionId));
      await db.recursiveDelete(db.collection('student_mission_catalog').doc(missionId));
    }

    const revisionOneIdentity = revisionIdentity(PRIMARY_MISSION, 'revision_1');
    const revisionOneResult = materializationResult(PRIMARY_MISSION);
    const stagingProof = await repository.stage(revisionOneIdentity, revisionOneResult);
    stagingEnvelope = await store.get(stagingProof.revisionRootPath) as B3RevisionEnvelope;
    stagingNode = await store.get(
      b3CanonicalNodePath(PRIMARY_MISSION, 'revision_1', 'node_subject_physics'),
    ) as B3MaterializedNode;
    stagingUnresolved = await store.get(
      b3UnresolvedEvidencePath(PRIMARY_MISSION, 'revision_1', 'evidence_unresolved_1'),
    ) as B3MaterializationResult['unresolvedSourceEvidence'][number];
    pointerBeforeSeal = await store.get(b3CurrentAuthorityPointerPath(PRIMARY_MISSION));

    await repository.seal(PRIMARY_MISSION, 'revision_1', stagingProof.contentIntegrityHash);
    sealedEnvelope = await store.get(stagingProof.revisionRootPath) as B3RevisionEnvelope;
    sealedPointer = await store.get(
      b3CurrentAuthorityPointerPath(PRIMARY_MISSION),
    ) as B3CurrentAuthorityPointer;
    unresolvedAfterSeal = await store.get(
      b3UnresolvedEvidencePath(PRIMARY_MISSION, 'revision_1', 'evidence_unresolved_1'),
    );

    const countBeforeReplay = (await db.collection(
      `${b3RevisionRootPath(PRIMARY_MISSION, 'revision_1')}/canonical_nodes`,
    ).get()).size + (await db.collection(
      `${b3RevisionRootPath(PRIMARY_MISSION, 'revision_1')}/unresolved_evidence`,
    ).get()).size;
    const replayProof = await repository.persistAuthoritatively(revisionOneIdentity, revisionOneResult);
    const countAfterReplay = (await db.collection(
      `${b3RevisionRootPath(PRIMARY_MISSION, 'revision_1')}/canonical_nodes`,
    ).get()).size + (await db.collection(
      `${b3RevisionRootPath(PRIMARY_MISSION, 'revision_1')}/unresolved_evidence`,
    ).get()).size;
    replayDocumentCount = countAfterReplay;
    if (countBeforeReplay !== countAfterReplay) throw new Error('REPLAY_CREATED_DUPLICATE_CHILDREN');
    replayProofStatus = replayProof.status;

    try {
      await repository.persistAuthoritatively(
        revisionOneIdentity,
        materializationResult(PRIMARY_MISSION, 'Incompatible Physics'),
      );
    } catch (error) {
      conflictRejected = error instanceof B3PersistenceConflictError;
    }
    try {
      await repository.persistAuthoritatively(
        revisionOneIdentity,
        materializationResult(PRIMARY_MISSION, 'Physics', ['evidence_node_1'], true),
      );
    } catch (error) {
      scopeConflictRejected = error instanceof B3PersistenceConflictError;
    }
    try {
      await store.create(stagingProof.revisionRootPath, {
        ...sealedEnvelope,
        declaredCompletenessScope: {
          requiredEvidenceIds: ['evidence_node_1'],
          requireExactFiveLevelCoverage: false,
        },
      });
    } catch {
      scopeMutationRejected = true;
    }
    try {
      await store.create(
        b3CanonicalNodePath(PRIMARY_MISSION, 'revision_1', 'node_subject_physics'),
        canonicalNode(PRIMARY_MISSION, 'Mutated Physics'),
      );
    } catch {
      mutationRejected = true;
    }

    const revisionTwoIdentity = revisionIdentity(PRIMARY_MISSION, 'revision_2', 'revision_1');
    await repository.persistAuthoritatively(
      revisionTwoIdentity,
      materializationResult(PRIMARY_MISSION, 'Physics Revision 2'),
    );
    revisionOneAfterSupersession = await store.get(
      b3RevisionRootPath(PRIMARY_MISSION, 'revision_1'),
    ) as B3RevisionEnvelope;
    revisionTwoAfterSupersession = await store.get(
      b3RevisionRootPath(PRIMARY_MISSION, 'revision_2'),
    ) as B3RevisionEnvelope;
    pointerAfterSupersession = await store.get(
      b3CurrentAuthorityPointerPath(PRIMARY_MISSION),
    ) as B3CurrentAuthorityPointer;

    const rollbackRepo = new B3MaterializationRepository(store);
    const rollbackStage = await rollbackRepo.stage(
      revisionIdentity(ROLLBACK_MISSION, 'revision_rollback'),
      materializationResult(ROLLBACK_MISSION),
    );
    try {
      await store.runTransaction(async transaction => {
        const rootPath = b3RevisionRootPath(ROLLBACK_MISSION, 'revision_rollback');
        const envelope = await transaction.get(rootPath) as B3RevisionEnvelope;
        transaction.set(rootPath, { ...envelope, state: B3_REVISION_STATE_SEALED });
        transaction.set(b3CurrentAuthorityPointerPath(ROLLBACK_MISSION), {
          missionId: ROLLBACK_MISSION,
          revisionId: 'revision_rollback',
          idempotencyIdentity: envelope.idempotencyIdentity,
          contentIntegrityHash: envelope.contentIntegrityHash,
          revisionState: B3_REVISION_STATE_SEALED,
        });
        throw new Error('INJECTED_AFTER_BOTH_TRANSACTIONAL_WRITES');
      });
    } catch {
      // Expected: genuine Firestore transaction discards both queued writes.
    }
    rollbackEnvelope = await store.get(rollbackStage.revisionRootPath) as B3RevisionEnvelope;
    rollbackPointer = await store.get(b3CurrentAuthorityPointerPath(ROLLBACK_MISSION));

    const concurrentIdentity = revisionIdentity(CONCURRENT_MISSION, 'revision_concurrent');
    const attempts = await Promise.allSettled([
      new B3MaterializationRepository(store).persistAuthoritatively(
        concurrentIdentity,
        materializationResult(CONCURRENT_MISSION, 'Concurrent A'),
      ),
      new B3MaterializationRepository(store).persistAuthoritatively(
        concurrentIdentity,
        materializationResult(CONCURRENT_MISSION, 'Concurrent B'),
      ),
    ]);
    concurrencyFulfilled = attempts.filter(attempt => attempt.status === 'fulfilled').length;
    concurrencyRejected = attempts.filter(attempt => attempt.status === 'rejected').length;
    concurrencyPointer = await store.get(
      b3CurrentAuthorityPointerPath(CONCURRENT_MISSION),
    ) as B3CurrentAuthorityPointer;
    concurrencyPointedEnvelope = await store.get(
      b3RevisionRootPath(CONCURRENT_MISSION, concurrencyPointer.revisionId),
    ) as B3RevisionEnvelope;

    forbiddenProjectionEmpty = (await db.collection('mission_realms').doc(PRIMARY_MISSION)
      .collection('current_syllabus_projection').get()).empty;
    forbiddenStructuredEmpty = (await db.collection('mission_realms').doc(PRIMARY_MISSION)
      .collection('structured_nodes').get()).empty;
    forbiddenStudentMissing = !(await db.collection('student_mission_catalog')
      .doc(PRIMARY_MISSION).get()).exists;
  });

  afterAll(async () => {
    if (app) await app.delete();
  });

  test('F01 Firestore staging revision persists', () => {
    expect(stagingEnvelope.revisionId).toBe('revision_1');
  });

  test('F02 canonical nodes persist at exact canonical child path', () => {
    expect(stagingNode).toEqual(canonicalNode(PRIMARY_MISSION));
  });

  test('F03 unresolved evidence persists at exact canonical child path', () => {
    expect(stagingUnresolved.evidence.evidenceId).toBe('evidence_unresolved_1');
  });

  test('F04 staging revision is non-authoritative', () => {
    expect(stagingEnvelope.state).toBe(B3_REVISION_STATE_STAGING);
  });

  test('F05 current pointer cannot reference unsealed revision', () => {
    expect(pointerBeforeSeal).toBeUndefined();
  });

  test('F06 valid revision seal succeeds', () => {
    expect(sealedEnvelope.state).toBe(B3_REVISION_STATE_SEALED);
  });

  test('F07 seal and current-pointer advancement are atomically consistent', () => {
    expect(sealedPointer.revisionId).toBe(sealedEnvelope.revisionId);
    expect(sealedPointer.contentIntegrityHash).toBe(sealedEnvelope.contentIntegrityHash);
  });

  test('F08 failed authority transaction exposes no partial current authority', () => {
    expect(rollbackEnvelope.state).toBe(B3_REVISION_STATE_STAGING);
    expect(rollbackPointer).toBeUndefined();
  });

  test('F09 identical replay is idempotent', () => {
    expect(replayProofStatus).toBe('IDEMPOTENT_REUSE');
  });

  test('F10 identical replay creates no semantic duplicates', () => {
    expect(replayDocumentCount).toBe(2);
  });

  test('F11 same-revision incompatible content fails closed', () => {
    expect(conflictRejected).toBe(true);
  });

  test('F12 sealed revision academic mutation fails closed', () => {
    expect(mutationRejected).toBe(true);
    expect(revisionOneAfterSupersession.contentIntegrityHash).toBe(sealedEnvelope.contentIntegrityHash);
  });

  test('F13 unresolved evidence remains after seal', () => {
    expect(unresolvedAfterSeal).toEqual(stagingUnresolved);
  });

  test('F14 superseded sealed revision remains retained', () => {
    expect(revisionOneAfterSupersession.state).toBe(B3_REVISION_STATE_SEALED);
  });

  test('F15 new valid sealed revision advances current pointer', () => {
    expect(pointerAfterSupersession.revisionId).toBe('revision_2');
    expect(revisionTwoAfterSupersession.state).toBe(B3_REVISION_STATE_SEALED);
  });

  test('F16 previous revision remains historically readable', () => {
    expect(revisionOneAfterSupersession.revisionId).toBe('revision_1');
  });

  test('F17 source, document, version, and hash survive Firestore round trip', () => {
    expect(sealedEnvelope.revisionIdentity.orderedSources).toEqual(
      revisionIdentity(PRIMARY_MISSION, 'revision_1').orderedSources,
    );
  });

  test('F18 extraction identity survives Firestore round trip', () => {
    expect(sealedEnvelope.revisionIdentity.verifiedExtractionIds)
      .toEqual(['extraction_node_1', 'extraction_unresolved_1']);
  });

  test('F19 evidenceId and extractionId remain independent', () => {
    expect(stagingUnresolved.evidence.evidenceId).toBe('evidence_unresolved_1');
    expect(stagingUnresolved.evidence.lineage.extractionId).toBe('extraction_unresolved_1');
    expect(stagingUnresolved.evidence.evidenceId)
      .not.toBe(stagingUnresolved.evidence.lineage.extractionId);
  });

  test('F20 paper and location scope lineage survive round trip', () => {
    expect(stagingUnresolved.evidence.lineage).toMatchObject({
      paperId: 'PAPER_1',
      location: { pageNumber: 2, sectionId: 'physics', span: { start: 11, end: 30 } },
    });
  });

  test('F21 manifest and integrity binding survive round trip', () => {
    expect(sealedPointer.contentIntegrityHash).toBe(sealedEnvelope.contentIntegrityHash);
    expect(sealedEnvelope.canonicalNodeManifest).toHaveLength(1);
    expect(sealedEnvelope.unresolvedEvidenceManifest).toHaveLength(1);
  });

  test('F31 expanded envelope preserves exact declared scope through the adapter', () => {
    expect(sealedEnvelope.declaredCompletenessScope).toEqual({
      requiredEvidenceIds: ['evidence_node_1', 'evidence_unresolved_1'],
      requireExactFiveLevelCoverage: true,
    });
  });

  test('F32 sealed declared scope is immutable through create semantics', () => {
    expect(scopeMutationRejected).toBe(true);
  });

  test('F33 same revision with different valid declared scope fails closed', () => {
    expect(scopeConflictRejected).toBe(true);
  });

  test('F34 scope remains revision-level and child manifests remain unchanged', () => {
    expect(sealedEnvelope.canonicalNodeManifest).toHaveLength(1);
    expect(sealedEnvelope.unresolvedEvidenceManifest).toHaveLength(1);
    expect(JSON.stringify(sealedEnvelope.canonicalNodeManifest)).not.toContain('requiredEvidenceIds');
  });

  test('F22 Firestore transaction failure rolls back both authority writes', () => {
    expect(rollbackEnvelope.state).toBe(B3_REVISION_STATE_STAGING);
    expect(rollbackPointer).toBeUndefined();
  });

  test('F23 concurrent incompatible authority attempts cannot both succeed', () => {
    expect(concurrencyFulfilled).toBe(1);
    expect(concurrencyRejected).toBe(1);
  });

  test('F24 current pointer independently resolves to a sealed revision', () => {
    expect(concurrencyPointer.revisionState).toBe(B3_REVISION_STATE_SEALED);
    expect(concurrencyPointedEnvelope.state).toBe(B3_REVISION_STATE_SEALED);
    expect(concurrencyPointedEnvelope.contentIntegrityHash)
      .toBe(concurrencyPointer.contentIntegrityHash);
  });

  test('F25 adapter writes no B3_COMPLETE lifecycle state', () => {
    expect(JSON.stringify([
      sealedEnvelope,
      sealedPointer,
      revisionTwoAfterSupersession,
      pointerAfterSupersession,
    ])).not.toContain('B3_COMPLETE');
  });

  test('F26 adapter writes no current_syllabus_projection documents', () => {
    expect(forbiddenProjectionEmpty).toBe(true);
  });

  test('F27 adapter writes no structured_nodes documents', () => {
    expect(forbiddenStructuredEmpty).toBe(true);
  });

  test('F28 adapter publishes no Student data', () => {
    expect(forbiddenStudentMissing).toBe(true);
  });

  test('F29 revision identity is explicit and not generated from temporal or queue state', () => {
    expect(sealedEnvelope.revisionId).toBe('revision_1');
    expect(sealedEnvelope.revisionIdentity.revisionId).toBe('revision_1');
    expect(sealedEnvelope).not.toHaveProperty('attemptId');
    expect(sealedEnvelope).not.toHaveProperty('queueId');
    expect(sealedEnvelope).not.toHaveProperty('createdAt');
  });

  test('F30 proof uses genuine local Firestore emulator SDK and transactions', () => {
    expect(emulatorHost).toMatch(/^(127\.0\.0\.1|localhost|::1):\d+$/);
    expect(sealedEnvelope.state).toBe(B3_REVISION_STATE_SEALED);
    expect(rollbackEnvelope.state).toBe(B3_REVISION_STATE_STAGING);
    expect(concurrencyFulfilled).toBe(1);
  });
});
