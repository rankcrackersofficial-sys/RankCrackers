import * as admin from 'firebase-admin';

/**
 * 🔱 AAF DOMAIN LIFECYCLE STATES
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
 * 🔱 AAF JOB METADATA CONTRACT (academic_factory_v1)
 * Physical implementation of AAF-004B Persistent Transaction Core.
 * No academic payloads allowed. Flat metadata only.
 */
export interface AafJobMetadata {
  // 🛡️ Contract Authority
  queueContract: 'academic_factory_v1';

  // 🛡️ Identity (Flattened)
  runId: string;
  jobId: string;
  missionId: string;
  canonicalTargetId: string;
  idempotencyKey: string;    // RUN_ID:JOB_ID

  // 🛡️ State Machine
  state: AafJobState;

  // 🛡️ Reliability & Lease
  attempts: number;
  maxAttempts: number;
  leaseOwner: string | null;
  leaseExpiresAtUtc: admin.firestore.Timestamp | null;
  nextRetryAtUtc: admin.firestore.Timestamp | null;

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
  taskType: string;
  targetId: string;
  sourceDocumentIds: string[];
}
