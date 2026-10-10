import * as admin from 'firebase-admin';

/**
 * AAF DOMAIN LIFECYCLE STATES
 * Exact 13 states from AAF-003B contract.
 */
export type AafJobState =
  | 'planned'
  | 'waitingDependency'
  | 'ready'
  | 'leased'
  | 'running'
  | 'reviewing'
  | 'repairRequired'
  | 'retryWait'
  | 'hardHold'
  | 'approved'
  | 'materializing'
  | 'published'
  | 'failedTerminal';

/**
 * AAF JOB METADATA CONTRACT (academic_factory_v1)
 * Physical implementation of AAF-004B Persistent Transaction Core.
 * No academic payloads allowed. Flat metadata only.
 */
export interface AafJobMetadata {
  // 🛡️ Contract Authority
  queueContract: 'academic_factory_v1';
  schemaVersion: number;

  // 🛡️ Identity (Flattened)
  runId: string;
  jobId: string;
  missionId: string;
  canonicalTargetId: string;
  idempotencyKey: string;    // Stabilized in AAF-002 Planner

  // 🛡️ State Machine
  state: AafJobState;

  // 🛡️ Reliability & Lease
  attempts: number;
  maxAttempts: number;
  leaseOwner: string | null;
  leaseExpiresAtUtc: admin.firestore.Timestamp | null;
  nextRetryAtUtc: admin.firestore.Timestamp | null;

  // 🛡️ Dependencies
  dependencyJobIds: string[]; // List of idempotencyKeys this job waits for

  // 🛡️ Integrity
  inputHash: string;
  outputHash: string | null;

  // 🛡️ Temporal Logs
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  startedAt: admin.firestore.Timestamp | null;
  finishedAt: admin.firestore.Timestamp | null;

  // 🛡️ Failure Trace
  lastError: string | null;

  // 🛡️ Orchestration (Flattened)
  type: string;        // e.g. 'digibookDraft', 'digibookValidation'
  targetId: string;    // Local reference ID
  sourceDocumentIds: string[];
}
