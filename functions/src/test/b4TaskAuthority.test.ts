import { resolveB4TaskAuthority } from '../syllabus/b4TaskAuthority';

describe('B4 task authority binding', () => {
  const sourceSha256 = 'a'.repeat(64);

  test('reads the source digest separately from lifecycle document ID', () => {
    expect(resolveB4TaskAuthority({
      mission_id: 'mission-1',
      document_id: 'official-syllabus-1',
      source_document_id: 'official-syllabus-1',
      sourceSha256,
    })).toEqual({
      missionId: 'mission-1',
      documentId: 'official-syllabus-1',
      sourceSha256,
    });
  });

  test('accepts canonical camelCase payload identity', () => {
    expect(resolveB4TaskAuthority({
      missionId: 'mission-1',
      documentId: 'official-syllabus-1',
      sourceSha256,
    }).sourceSha256).toBe(sourceSha256);
  });

  test('accepts persisted snake_case source hash alias', () => {
    expect(resolveB4TaskAuthority({
      mission_id: 'mission-1',
      document_id: 'official-syllabus-1',
      source_sha256: sourceSha256,
    }).sourceSha256).toBe(sourceSha256);
  });

  test('never interprets source_document_id as a source digest', () => {
    expect(() => resolveB4TaskAuthority({
      mission_id: 'mission-1',
      document_id: 'official-syllabus-1',
      source_document_id: sourceSha256,
    })).toThrow('B4_TASK_AUTHORITY_MISSING_SOURCE_SHA256');
  });

  test('rejects malformed source digests', () => {
    expect(() => resolveB4TaskAuthority({
      mission_id: 'mission-1',
      document_id: 'official-syllabus-1',
      sourceSha256: 'official-syllabus-1',
    })).toThrow('B4_TASK_AUTHORITY_INVALID_SOURCE_SHA256');
  });

  test('requires mission and document identity', () => {
    expect(() => resolveB4TaskAuthority({ document_id: 'doc-1', sourceSha256 }))
      .toThrow('B4_TASK_AUTHORITY_MISSING_MISSION_ID');
    expect(() => resolveB4TaskAuthority({ mission_id: 'mission-1', sourceSha256 }))
      .toThrow('B4_TASK_AUTHORITY_MISSING_DOCUMENT_ID');
  });
});
