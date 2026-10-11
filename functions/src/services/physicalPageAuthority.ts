import * as crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

export const PAGE_DIGEST_ALGORITHM = 'sha256';
export const PAGE_DIGEST_VERSION = 'rc-physical-page-authority-v1';
export const PAGE_IDENTITY_METHOD = 'verified-parent-sha256+physical-page-number+page-count';

export type PhysicalPageAuthorityInput = {
  missionId: string;
  expectedMissionId?: string;
  documentId: string;
  expectedDocumentId?: string;
  sourceSha256: string;
  pdfBytes: Buffer | Uint8Array;
  pageNumber: number;
};

export type PersistedPageAuthority = {
  sourceSha256?: string;
  physicalPageNumber?: number;
  pageDigest?: string;
  pageDigestAlgorithm?: string;
  pageDigestVersion?: string;
  pageIdentityMethod?: string;
};

function normalizeSha(value: string): string {
  const normalized = String(value || '').trim().toLowerCase().replace(/^hash_/, '');
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error('PAGE_AUTHORITY_SOURCE_SHA_INVALID');
  return normalized;
}

function assertBinding(input: PhysicalPageAuthorityInput, sourceSha256: string): void {
  if (!input.missionId) throw new Error('PAGE_AUTHORITY_MISSION_MISSING');
  if (input.expectedMissionId && input.missionId !== input.expectedMissionId) {
    throw new Error('PAGE_AUTHORITY_MISSION_MISMATCH');
  }
  if (!input.documentId) throw new Error('PAGE_AUTHORITY_DOCUMENT_MISSING');
  if (input.expectedDocumentId && input.documentId !== input.expectedDocumentId) {
    throw new Error('PAGE_AUTHORITY_DOCUMENT_MISMATCH');
  }
  // Official source documents use role-addressed IDs while EMBEDDED mode
  // deliberately shares one verified physical PDF across two logical roles.
  // Normalize ONLY the recognized role prefixes; keep the parent source SHA
  // independent from the logical document identity.
  const documentSha = normalizeSha(
    String(input.documentId).replace(/^(notification_|syllabus_)/, '')
  );
  if (documentSha !== sourceSha256) throw new Error('PAGE_AUTHORITY_DOCUMENT_SHA_MISMATCH');
}

export async function derivePhysicalPageAuthority(input: PhysicalPageAuthorityInput) {
  const sourceSha256 = normalizeSha(input.sourceSha256);
  assertBinding(input, sourceSha256);
  if (!Number.isInteger(input.pageNumber) || input.pageNumber < 1) {
    throw new Error('PAGE_AUTHORITY_PAGE_OUT_OF_BOUNDS');
  }
  const bytes = Buffer.from(input.pdfBytes || []);
  const actualSha = crypto.createHash('sha256').update(bytes).digest('hex');
  if (actualSha !== sourceSha256) throw new Error('PAGE_AUTHORITY_PARENT_SHA_MISMATCH');

  let pageCount: number;
  try {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    pageCount = pdf.getPageCount();
  } catch (error: any) {
    throw new Error(`PAGE_AUTHORITY_PDF_LOAD_FAILED: ${error?.message || 'unknown'}`);
  }
  if (input.pageNumber > pageCount) throw new Error('PAGE_AUTHORITY_PAGE_OUT_OF_BOUNDS');

  const canonical = Buffer.from(
    `${PAGE_DIGEST_VERSION}\u0000${sourceSha256}\u0000${input.pageNumber}\u0000${pageCount}`,
    'utf8'
  );
  const pageDigest = crypto.createHash(PAGE_DIGEST_ALGORITHM).update(canonical).digest('hex');
  if (!pageDigest) throw new Error('PAGE_AUTHORITY_DIGEST_COMPUTATION_FAILED');
  return {
    sourceSha256,
    physicalPageNumber: input.pageNumber,
    pageCount,
    pageDigest,
    pageDigestAlgorithm: PAGE_DIGEST_ALGORITHM,
    pageDigestVersion: PAGE_DIGEST_VERSION,
    parentDocumentDigestVerified: true,
    pageIdentityMethod: PAGE_IDENTITY_METHOD,
    pageAuthorityState: 'machine_verified'
  } as const;
}

export function assertPersistablePageAuthority(
  existing: PersistedPageAuthority | undefined,
  authority: Awaited<ReturnType<typeof derivePhysicalPageAuthority>>
): 'create' | 'idempotent' {
  if (!existing) return 'create';
  const fields: (keyof PersistedPageAuthority)[] = [
    'sourceSha256', 'physicalPageNumber', 'pageDigest', 'pageDigestAlgorithm',
    'pageDigestVersion', 'pageIdentityMethod'
  ];
  const hasAuthority = fields.some((field) => existing[field] !== undefined);
  if (!hasAuthority) return 'create';
  for (const field of fields) {
    if (existing[field] !== (authority as any)[field]) throw new Error('PAGE_AUTHORITY_CONFLICT');
  }
  return 'idempotent';
}
