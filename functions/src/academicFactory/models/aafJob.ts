import * as admin from 'firebase-admin';

export type AafJobState =
  | 'PLANNED'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'HOLD'
  | 'REPAIR_PENDING';

/**
 * 🔱 AAF JOB METADATA CONTRACT (academic_factory_v1)
 * Physical implementation of AAF-004B Persistent Transaction Core.
 * No academic payloads or student data allowed here.
 */
export interface AafJobMetadata {
  // 🛡️ Contract Boundary
  queueContract: 'academic_factory_v1';

  // 🛡️ Identity
  runId: string;        // Batch run identifier
  jobId: string;        // Unique job within run
  missionId: string;    // Related mission (e.g. JEE-MAIN-2026)
  canonicalTargetId: string; // The AMTN or Target atom
  idempotencyKey: string;    // Stable key for document ID: RUN_ID:JOB_ID

  // 🛡️ State Machine
  state: AafJobState;

  // 🛡️ Reliability & Lease
  attempts: number;
  maxAttempts: number;

  leaseOwner: string | null;  // Current active worker instance ID
  leaseExpiresAtUtc: admin.firestore.Timestamp | null;

  nextRetryAt: admin.firestore.Timestamp | null;

  // 🛡️ Integrity
  inputHash: string;          // Hash of input parameters
  outputHash: string | null;  // Hash of generated artifact

  // 🛡️ Temporal Logs
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  startedAt: admin.firestore.Timestamp | null;
  finishedAt: admin.firestore.Timestamp | null;

  // 🛡️ Failure Propagation
  lastError: string | null;

  // 🛡️ Orchestration Payload (Reference IDs only)
  taskType: string;
  payload: {
    targetId: string;
    sourceDocumentIds?: string[];
    [key: string]: any;
  };
}
