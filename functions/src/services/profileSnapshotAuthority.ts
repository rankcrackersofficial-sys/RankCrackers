import { createHash } from 'crypto';
import * as admin from 'firebase-admin';

export const PROFILE_SNAPSHOT_SCHEMA_VERSION = 'profile_snapshot_material_v1';

type AnyRecord = Record<string, unknown>;

/** Stable JSON for authority fingerprints; keys are sorted recursively. */
export function stableSerialize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as AnyRecord;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

/** Explicitly selected current profile facts; no contact/display/academic-state fields. */
export function extractMaterialFacts(profile: AnyRecord): AnyRecord {
  const facts: AnyRecord = {
    dateOfBirth: profile.dateOfBirth ?? null,
    category: profile.category ?? null,
    subCategory: profile.subCategory ?? null,
    domicileState: profile.domicileState ?? null,
    state: profile.state ?? null,
    isSAP: profile.isSAP ?? null,
    sapCategory: profile.sapCategory ?? null,
    gender: profile.gender ?? null,
    isWidow: profile.isWidow ?? null,
    isDivorcee: profile.isDivorcee ?? null,
    isSeparatedWoman: profile.isSeparatedWoman ?? null,
    educationLevel: profile.educationLevel ?? null,
    graduationDegree: profile.graduationDegree ?? null,
    graduationStream: profile.graduationStream ?? null,
    isGraduationCompleted: profile.isGraduationCompleted ?? null,
    subjects: profile.subjects ?? [],
    graduationSubjects: profile.graduationSubjects ?? [],
    isPostGraduationCompleted: profile.isPostGraduationCompleted ?? null,
    postGraduationDegree: profile.postGraduationDegree ?? null,
    postGraduationStream: profile.postGraduationStream ?? null,
    postGraduationSubjects: profile.postGraduationSubjects ?? [],
    professionalCredentialIds: profile.professionalCredentialIds ?? [],
    educationRecords: profile.educationRecords ?? [],
  };
  return facts;
}

export function materialFactsFingerprint(facts: AnyRecord): string {
  const canonical = stableSerialize({
    schemaVersion: PROFILE_SNAPSHOT_SCHEMA_VERSION,
    materialFacts: facts,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export interface ProfileSnapshotAuthority {
  snapshotId: string;
  studentId: string;
  schemaVersion: string;
  materialFactsFingerprint: string;
  capturedMaterialFacts: AnyRecord;
  capturedAt: FirebaseFirestore.FieldValue;
}

export function snapshotIdentity(studentId: string, fingerprint: string): string {
  return `${studentId}_${fingerprint}`;
}

export async function getOrCreateProfileSnapshot(studentId: string): Promise<ProfileSnapshotAuthority> {
  const db = admin.firestore();
  const profileRef = db.collection('warrior_profiles').doc(studentId);
  const profileSnap = await profileRef.get();
  if (!profileSnap.exists) throw new Error('PROFILE_NOT_FOUND');
  const profile = profileSnap.data() as AnyRecord;
  if (profile.uid !== studentId) throw new Error('PROFILE_UID_BINDING_MISMATCH');

  const facts = extractMaterialFacts(profile);
  const fingerprint = materialFactsFingerprint(facts);
  const snapshotId = snapshotIdentity(studentId, fingerprint);
  const snapshotRef = db.collection('profile_snapshots').doc(snapshotId);

  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(snapshotRef);
    if (existing.exists) return;
    transaction.create(snapshotRef, {
      studentId,
      schemaVersion: PROFILE_SNAPSHOT_SCHEMA_VERSION,
      materialFactsFingerprint: fingerprint,
      capturedMaterialFacts: facts,
      capturedAt: admin.firestore.FieldValue.serverTimestamp(),
      immutable: true,
    });
  });

  return {
    snapshotId,
    studentId,
    schemaVersion: PROFILE_SNAPSHOT_SCHEMA_VERSION,
    materialFactsFingerprint: fingerprint,
    capturedMaterialFacts: facts,
    capturedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}
