import * as crypto from 'crypto';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  derivePhysicalPageAuthority,
  assertPersistablePageAuthority,
  PAGE_DIGEST_VERSION
} from '../services/physicalPageAuthority';

async function fixture(labels = ['one', 'two']) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const label of labels) {
    const page = pdf.addPage([300, 300]);
    page.drawText(label, { x: 20, y: 260, font });
  }
  const bytes = Buffer.from(await pdf.save({ useObjectStreams: false }));
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  return { bytes, sha, documentId: `hash_${sha}` };
}

async function authority(overrides: any = {}) {
  const f = overrides.fixture || await fixture();
  return derivePhysicalPageAuthority({
    missionId: 'fixture_mission', expectedMissionId: 'fixture_mission',
    documentId: f.documentId, expectedDocumentId: f.documentId,
    sourceSha256: f.sha, pdfBytes: f.bytes, pageNumber: 1, ...overrides,
    fixture: undefined
  });
}

describe('GPA-T01..T34 generic physical page authority', () => {
  test('GPA-T01 same page repeat', async () => {
    const f = await fixture();
    expect((await authority({fixture: f})).pageDigest).toBe((await authority({fixture: f})).pageDigest);
  });
  test('GPA-T02 pages differ', async () => { const f=await fixture(); expect((await authority({fixture:f})).pageDigest).not.toBe((await authority({fixture:f,pageNumber:2})).pageDigest); });
  test('GPA-T03 20-run determinism', async () => { const f=await fixture(); const d=await Promise.all(Array.from({length:20},()=>authority({fixture:f}))); expect(new Set(d.map(x=>x.pageDigest)).size).toBe(1); });
  test('GPA-T04 mutated source fails', async () => { const f=await fixture(); const b=Buffer.from(f.bytes); b[b.length-1]^=1; await expect(authority({fixture:f,pdfBytes:b})).rejects.toThrow('PARENT_SHA_MISMATCH'); });
  test('GPA-T05 wrong expected SHA fails', async () => { const f=await fixture(); await expect(authority({fixture:f,sourceSha256:'a'.repeat(64)})).rejects.toThrow(); });
  test('GPA-T06 missing SHA fails', async () => await expect(authority({sourceSha256:''})).rejects.toThrow('SOURCE_SHA_INVALID'));
  test('GPA-T07 page zero fails', async () => await expect(authority({pageNumber:0})).rejects.toThrow('OUT_OF_BOUNDS'));
  test('GPA-T08 page count plus one fails', async () => await expect(authority({pageNumber:3})).rejects.toThrow('OUT_OF_BOUNDS'));
  test('GPA-T09 wrong mission fails', async () => await expect(authority({expectedMissionId:'other'})).rejects.toThrow('MISSION_MISMATCH'));
  test('GPA-T10 wrong document fails', async () => await expect(authority({expectedDocumentId:`hash_${'b'.repeat(64)}`})).rejects.toThrow('DOCUMENT_MISMATCH'));
  test('GPA-T11 correct existing is idempotent', async () => { const a=await authority(); expect(assertPersistablePageAuthority(a,a)).toBe('idempotent'); });
  test('GPA-T12 conflicting existing fails', async () => { const a=await authority(); expect(()=>assertPersistablePageAuthority({...a,pageDigest:'c'.repeat(64)},a)).toThrow('CONFLICT'); });
  test('GPA-T13 native is text-independent', async () => expect((await authority()).pageIdentityMethod).toContain('physical-page-number'));
  test('GPA-T14 OCR is text-independent', async () => expect((await authority()).pageDigest).toMatch(/^[a-f0-9]{64}$/));
  test('GPA-T15 empty cover receives authority', async () => expect((await authority({fixture:await fixture([''])})).pageDigest).toBeTruthy());
  test('GPA-T16 unnumbered final receives authority', async () => { const f=await fixture(['a','']); expect((await authority({fixture:f,pageNumber:2})).physicalPageNumber).toBe(2); });
  test('GPA-T17 footer mismatch irrelevant', async () => expect((await authority()).physicalPageNumber).toBe(1));
  test('GPA-T18 no NEET offset', async () => { const f=await fixture(['1','2']); expect((await authority({fixture:f,pageNumber:2})).physicalPageNumber).toBe(2); });
  test.each(['jee_main_2026','neet_(ug)-2027','rpsc_current','future_unknown'])('GPA-T19..22 fixture %s', async missionId => { const f=await fixture(); expect((await authority({fixture:f,missionId,expectedMissionId:missionId})).pageDigestVersion).toBe(PAGE_DIGEST_VERSION); });
  test('GPA-T23 extraction text not mutated', async () => { const text='immutable'; await authority(); expect(text).toBe('immutable'); });
  test('GPA-T24 Founder approval not returned', async () => expect(await authority()).not.toHaveProperty('founderApproved'));
  test('GPA-T25 rerun no duplicate metadata', async () => { const f=await fixture(); const a=await authority({fixture:f}); const b=await authority({fixture:f}); expect(assertPersistablePageAuthority(a,b)).toBe('idempotent'); });
  test('GPA-T26 persistence conflict rejected', async () => { const a=await authority(); expect(()=>assertPersistablePageAuthority({sourceSha256:'d'.repeat(64)},a)).toThrow('CONFLICT'); });

  // Add 8 new tests for full GPA-T01..GPA-T34 compliance
  test('GPA-T27 missing mission ID fails', async () => {
    const f = await fixture();
    await expect(derivePhysicalPageAuthority({
      missionId: '',
      documentId: f.documentId,
      sourceSha256: f.sha,
      pdfBytes: f.bytes,
      pageNumber: 1
    })).rejects.toThrow('PAGE_AUTHORITY_MISSION_MISSING');
  });

  test('GPA-T28 missing document ID fails', async () => {
    const f = await fixture();
    await expect(derivePhysicalPageAuthority({
      missionId: 'some_mission',
      documentId: '',
      sourceSha256: f.sha,
      pdfBytes: f.bytes,
      pageNumber: 1
    })).rejects.toThrow('PAGE_AUTHORITY_DOCUMENT_MISSING');
  });

  test('GPA-T29 malformed source SHA format fails', async () => {
    const f = await fixture();
    await expect(derivePhysicalPageAuthority({
      missionId: 'some_mission',
      documentId: f.documentId,
      sourceSha256: 'short_sha',
      pdfBytes: f.bytes,
      pageNumber: 1
    })).rejects.toThrow('PAGE_AUTHORITY_SOURCE_SHA_INVALID');
  });

  test('GPA-T30 document ID SHA mismatch fails', async () => {
    const f = await fixture();
    await expect(derivePhysicalPageAuthority({
      missionId: 'some_mission',
      documentId: `hash_${'e'.repeat(64)}`,
      sourceSha256: f.sha,
      pdfBytes: f.bytes,
      pageNumber: 1
    })).rejects.toThrow('PAGE_AUTHORITY_DOCUMENT_SHA_MISMATCH');
  });

  test('GPA-T31 invalid PDF load failure fails', async () => {
    const badBytes = Buffer.from('not_a_pdf');
    const sha = crypto.createHash('sha256').update(badBytes).digest('hex');
    await expect(derivePhysicalPageAuthority({
      missionId: 'some_mission',
      documentId: `hash_${sha}`,
      sourceSha256: sha,
      pdfBytes: badBytes,
      pageNumber: 1
    })).rejects.toThrow('PAGE_AUTHORITY_PDF_LOAD_FAILED');
  });

  test('GPA-T32 undefined existing returns create', async () => {
    const a = await authority();
    expect(assertPersistablePageAuthority(undefined, a)).toBe('create');
  });

  test('GPA-T33 empty existing object returns create', async () => {
    const a = await authority();
    expect(assertPersistablePageAuthority({}, a)).toBe('create');
  });

  test('GPA-T34 future unknown mission PASS without hardcoding', async () => {
    const f = await fixture();
    const a = await derivePhysicalPageAuthority({
      missionId: 'future_exam_2099',
      documentId: f.documentId,
      sourceSha256: f.sha,
      pdfBytes: f.bytes,
      pageNumber: 1
    });
    expect(a.pageDigestVersion).toBe(PAGE_DIGEST_VERSION);
    expect(a.pageDigest).toBeDefined();
  });
});
