export interface B4TaskAuthority {
  missionId: string;
  documentId: string;
  sourceSha256: string;
  sourceVersionId?: string;
}

type B4TaskRecord = Record<string, unknown>;

function firstNonEmptyString(record: B4TaskRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

/**
 * Resolve B4 task identity from the persisted lifecycle task shape.
 * source_document_id is deliberately not a SHA alias: it is a document ID.
 */
export function resolveB4TaskAuthority(payload: B4TaskRecord): B4TaskAuthority {
  const missionId = firstNonEmptyString(payload, ['missionId', 'mission_id']);
  const documentId = firstNonEmptyString(payload, ['documentId', 'document_id']);
  const sourceSha256 = firstNonEmptyString(payload, ['sourceSha256', 'source_sha256']);
  const sourceVersionId = firstNonEmptyString(payload, ['sourceVersionId', 'source_version_id']);

  if (!missionId) throw new Error('B4_TASK_AUTHORITY_MISSING_MISSION_ID');
  if (!documentId) throw new Error('B4_TASK_AUTHORITY_MISSING_DOCUMENT_ID');
  if (!sourceSha256) throw new Error('B4_TASK_AUTHORITY_MISSING_SOURCE_SHA256');
  if (!/^[a-f0-9]{64}$/.test(sourceSha256)) {
    throw new Error('B4_TASK_AUTHORITY_INVALID_SOURCE_SHA256');
  }

  return { missionId, documentId, sourceSha256, ...(sourceVersionId ? { sourceVersionId } : {}) };
}
