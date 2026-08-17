import * as admin from 'firebase-admin';

export type AafJobStatus =
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'hold'
  | 'retry_pending';

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
  idempotencyKey: string;    // RunId + JobId + InputHash stable key

  // 🛡️ State Machine
  status: AafJobStatus;

  // 🛡️ Reliability & Lease
  attempts: number;
  maxAttempts: number;

  leaseOwner: string | null;  // Current active worker/instance
  leaseExpiry: admin.firestore.Timestamp | null;

  nextRetryAt: admin.firestore.Timestamp | null;

  // 🛡️ Integrity
  inputHash: string;          // Hash of input parameters
  outputHash: string | null;  // Hash of generated artifact (stored elsewhere)

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
