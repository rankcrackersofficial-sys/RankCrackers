import * as admin from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';
import * as crypto from 'crypto';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55',
    storageBucket: 'rankcrackers-55.firebasestorage.app'
  });
}
const db = admin.firestore();

// 1. Stub/Mock external dependencies before importing queueWorker
let mockPdfBytes = Buffer.from('mock-pdf-bytes-content-for-testing-sha');
let mockPdfTotalPages = 10;
let mockPdfPagesText: {[key: number]: string} = {
  1: 'Page 1 Text layer content matching neet guidelines. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
  2: 'Page 2 Text layer content matching neet guidelines. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
  5: 'Page 5 Text layer. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
  6: 'Page 6 Text layer\n1\nPrinted footer. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.'
};

jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => {
      return {
        getText: async (options: any) => {
          const partial = options.partial || [];
          const pages = partial.map((pNum: number) => ({
            num: pNum,
            text: mockPdfPagesText[pNum] || ''
          }));
          return {
            total: mockPdfTotalPages,
            pages: pages
          };
        },
        destroy: async () => {}
      };
    })
  };
});

let mockOcrText = 'OCR Extracted Page Text\n1\nPrinted footer';
jest.mock('@google-cloud/vision', () => {
  return {
    ImageAnnotatorClient: jest.fn().mockImplementation(() => {
      return {
        batchAnnotateFiles: async () => {
          return [{
            responses: [{
              responses: [{
                fullTextAnnotation: { text: mockOcrText }
              }]
            }]
          }];
        }
      };
    })
  };
});

// Import queueWorker
import { queueWorker } from '../workers/queueWorker';

const fft = firebaseFunctionsTest({ projectId: 'rankcrackers-55' });
const wrapped = fft.wrap(queueWorker);

jest.setTimeout(60000);

// Robust helper to clear Firestore collections in emulator using REST API
async function clearDb() {
  try {
    await axios.delete('http://127.0.0.1:8188/emulator/v1/projects/rankcrackers-55/databases/(default)/documents');
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (err: any) {
    console.error('Failed to clear database via REST:', err.message);
  }
}

describe('🔱 B1 PAGEWISE GENERIC AUTOMATION TEST SUITE (G01-G18)', () => {
  const targetNeetDoc = 'hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925';
  const targetJeeDoc = 'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b';
  const targetRpscDoc = 'hash_a461e1f65845dd0a';

  beforeAll(() => {
    // Mock admin.storage bucket
    jest.spyOn(admin.storage(), 'bucket').mockImplementation((bucketName?: string) => {
      return {
        file: (path: string) => ({
          download: async () => [mockPdfBytes],
          exists: async () => [true]
        })
      } as any;
    });

    // Mock axios.get for external URLs
    jest.spyOn(axios, 'get').mockImplementation(async (url: string) => {
      return { data: mockPdfBytes } as any;
    });

    // Mock PDFDocument load/create to avoid binary loading issues
    jest.spyOn(PDFDocument, 'load').mockImplementation(async () => {
      return {
        getPageCount: () => mockPdfTotalPages,
      } as any;
    });

    jest.spyOn(PDFDocument, 'create').mockImplementation(async () => {
      return {
        copyPages: async () => [{}],
        addPage: () => {},
        save: async () => Buffer.from('mock-sliced-page-bytes')
      } as any;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    // Clear Firestore database
    await clearDb();

    // Reset default mock states
    mockPdfBytes = Buffer.from('mock-pdf-bytes-content-for-testing-sha');
    mockPdfTotalPages = 10;
    mockPdfPagesText = {
      1: 'Page 1 Text layer content matching neet guidelines. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
      2: 'Page 2 Text layer content matching neet guidelines. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
      5: 'Page 5 Text layer. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
      6: 'Page 6 Text layer\n1\nPrinted footer. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.'
    };
    mockOcrText = 'OCR Extracted Page Text\n1\nPrinted footer. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.';
  });

  // Base payload factory
  function createBaseTask(taskId: string, missionId?: string, docId?: string) {
    const finalMissionId = missionId || `mission_${taskId}`;
    const finalDocId = docId || `hash_${crypto.createHash('sha256').update(taskId).digest('hex')}`;
    const sha = finalDocId.startsWith('hash_') ? finalDocId.substring(5) : finalDocId;
    return {
      task_type: 'pagewise_text_extraction_batch',
      mission_id: finalMissionId,
      document_id: finalDocId,
      source_document_id: finalDocId,
      document_type: 'syllabus',
      source_path: `gs://rankcrackers-55.firebasestorage.app/syllabus/${sha}.pdf`,
      page_start: 1,
      page_end: 2,
      page_batch_index: 0,
      total_batches: 1,
      status: 'completed',
      bypassClaimCheck: true,
      expected_output: 'page_extractions',
      createdAt: new Date().toISOString()
    };
  }

  test('G01 & G17: valid NEET task dispatch (no hardcoded NEET blocker)', async () => {
    // Generate valid NEET bytes hash
    mockPdfBytes = Buffer.from('neet-bytes-contents-2.5-flash-g01');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g01';

    const taskId = 'test_neet_g01';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('completed');
    console.log('G01 PASS');
    console.log('G17 PASS');
  });

  test('G02: valid JEE task dispatch', async () => {
    mockPdfBytes = Buffer.from('jee-bytes-contents-governed-g02');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'jee_main_2026_g02';

    const taskId = 'test_jee_g02';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('completed');

    const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
    expect(pageSnap.exists).toBe(true);
    console.log('G02 PASS');
  });

  test('G03: valid RPSC task dispatch', async () => {
    mockPdfBytes = Buffer.from('rpsc-bytes-contents-governed-officials-g03');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'RPSC_FIRST_GRADE2026_2026_1782713222215_g03';

    const taskId = 'test_rpsc_g03';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('completed');
    console.log('G03 PASS');
  });

  test('G04: mission isolation check', async () => {
    mockPdfBytes = Buffer.from('isolation-testing-bytes-g04');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'jee_main_2026_g04';

    const taskId = 'test_isolation_g04';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    // Extraction should exist in JEE
    const jeePage = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
    expect(jeePage.exists).toBe(true);

    // Extraction should NOT exist in NEET or RPSC
    const neetPage = await db.collection(`mission_realms/neet_(ug)-2027_g04/official_documents/${docId}/page_extractions`).doc('1').get();
    expect(neetPage.exists).toBe(false);
    console.log('G04 PASS');
  });

  test('G05: wrong source SHA block', async () => {
    const taskId = 'test_wrong_sha_g05';
    const missionId = 'neet_(ug)-2027_g05';
    const taskData = createBaseTask(taskId, missionId, 'hash_abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('failed');
    expect(taskSnap.data()?.failure_reason).toBe('RC_SYLLABUS_P06_BLOCKED_SOURCE_SHA_MISMATCH');
    console.log('G05 PASS');
  });

  test('G06: unsupported task type block', async () => {
    const taskId = 'test_unsupported_type_g06';
    const taskData = {
      type: 'unsupported_task_type_here_non_existent_g06',
      status: 'completed',
      bypassClaimCheck: true
    };
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('failed');
    expect(taskSnap.data()?.error).toContain('Unknown or unauthorized task type');
    console.log('G06 PASS');
  });

  test('G07: unsupported status block', async () => {
    mockPdfBytes = Buffer.from('unsupported-status-bytes-g07');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g07';

    const taskId = 'test_unsupported_status_g07';
    const taskData = createBaseTask(taskId, missionId, docId);
    taskData.status = 'processing';
    delete (taskData as any).bypassClaimCheck;
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('processing');
    console.log('G07 PASS');
  });

  test('G08: duplicate claim prevention', async () => {
    mockPdfBytes = Buffer.from('claim-bytes-g08');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g08';

    const taskId = 'test_duplicate_claim_g08';
    const taskData = createBaseTask(taskId, missionId, docId);
    delete (taskData as any).bypassClaimCheck;
    await db.collection('ai_queue').doc(taskId).set(taskData);

    await db.collection('ai_queue').doc(taskId).update({ status: 'processing' });

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('processing');
    console.log('G08 PASS');
  });

  test('G09: completed task not reprocessed', async () => {
    mockPdfBytes = Buffer.from('completed-reprocess-bytes-g09');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g09';

    const taskId = 'test_completed_reprocess_g09';
    const taskData = createBaseTask(taskId, missionId, docId);
    taskData.status = 'completed';
    delete (taskData as any).bypassClaimCheck;
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('completed');
    console.log('G09 PASS');
  });

  test('G10: retry safety', async () => {
    mockPdfBytes = Buffer.from('retry-bytes-g10');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g10';

    const taskId = 'test_retry_safety_g10';
    const taskData = createBaseTask(taskId, missionId, docId);
    
    await db.collection('ai_queue').doc(taskId).set({ ...taskData, status: 'failed', failure_reason: 'EXTRACTION_ERROR' });
    await db.collection('ai_queue').doc(taskId).update({ status: 'queued' });

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('completed');
    console.log('G10 PASS');
  });

  test('G11: native path routing', async () => {
    mockPdfBytes = Buffer.from('native-path-bytes-neet-g11');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g11';

    const taskId = 'test_native_path_g11';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
    expect(pageSnap.data()?.extraction_method).toBe('native_pdf_text');
    console.log('G11 PASS');
  });

  test('G12: scanned path routing (Vision OCR)', async () => {
    mockPdfBytes = Buffer.from('scanned-path-bytes-neet-g12');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g12';

    mockPdfPagesText = {
      1: '',
      2: ''
    };

    const taskId = 'test_scanned_path_g12';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
    expect(pageSnap.data()?.extraction_method).toBe('VISION_OCR_PAGEWISE');
    console.log('G12 PASS');
  });

  test('G13: ambiguous hold routing', async () => {
    mockPdfBytes = Buffer.from('ambiguous-path-bytes-neet-g13');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g13';

    mockPdfPagesText = {
      1: 'short',
      2: 'short'
    };

    const taskId = 'test_ambiguous_hold_g13';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('failed');
    expect(taskSnap.data()?.failure_reason).toBe('RC_SYLLABUS_P1_BLOCKED_ROUTING_AMBIGUOUS');
    console.log('G13 PASS');
  });

  test('G14: simulation block', async () => {
    mockPdfBytes = Buffer.from('simulated-wrapper-block-g14');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g14';

    mockPdfPagesText = {
      1: 'Simulated text representation for testing. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
      2: 'Page text content longer. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.'
    };

    const taskId = 'test_simulation_g14';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const taskSnap = await db.collection('ai_queue').doc(taskId).get();
    expect(taskSnap.data()?.status).toBe('failed');
    expect(taskSnap.data()?.failure_reason).toBe('NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED');
    console.log('G14 PASS');
  });

  test('G15: page identity check failure and success', async () => {
    mockPdfBytes = Buffer.from('page-identity-check-bytes-g15');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g15';

    mockPdfPagesText = {
      5: '',
      6: ''
    };

    // 1. Mismatch check
    mockOcrText = 'OCR text page 6. Contains no footer printed number.';

    const taskIdFail = 'test_identity_fail_g15';
    const taskDataFail = createBaseTask(taskIdFail, missionId, docId);
    taskDataFail.page_start = 5;
    taskDataFail.page_end = 6;
    await db.collection('ai_queue').doc(taskIdFail).set(taskDataFail);

    const snapFail = fft.firestore.makeDocumentSnapshot(taskDataFail, `ai_queue/${taskIdFail}`);
    await wrapped(snapFail, { params: { taskId: taskIdFail } });

    const taskSnapFail = await db.collection('ai_queue').doc(taskIdFail).get();
    expect(taskSnapFail.data()?.status).toBe('failed');
    expect(taskSnapFail.data()?.error_message).toContain('RC_SYLLABUS_P1_BLOCKED_PAGE_IDENTITY_MISMATCH');

    // 2. Success check
    mockOcrText = 'OCR text page 6.\n1\nPrinted footer';

    const taskIdSuccess = 'test_identity_success_g15';
    const taskDataSuccess = createBaseTask(taskIdSuccess, missionId, docId);
    taskDataSuccess.page_start = 5;
    taskDataSuccess.page_end = 6;
    await db.collection('ai_queue').doc(taskIdSuccess).set(taskDataSuccess);

    const snapSuccess = fft.firestore.makeDocumentSnapshot(taskDataSuccess, `ai_queue/${taskIdSuccess}`);
    await wrapped(snapSuccess, { params: { taskId: taskIdSuccess } });

    const taskSnapSuccess = await db.collection('ai_queue').doc(taskIdSuccess).get();
    expect(taskSnapSuccess.data()?.status).toBe('completed');
    console.log('G15 PASS');
  });

  test('G16: provenance audit details check', async () => {
    mockPdfBytes = Buffer.from('provenance-check-bytes-g16');
    const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
    const docId = `hash_${validSha}`;
    const missionId = 'neet_(ug)-2027_g16';

    const taskId = 'test_provenance_g16';
    const taskData = createBaseTask(taskId, missionId, docId);
    await db.collection('ai_queue').doc(taskId).set(taskData);

    const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
    await wrapped(snap, { params: { taskId } });

    const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
    const pageData = pageSnap.data();

    expect(pageData?.extracted_by_task_id).toBe(taskId);
    expect(pageData?.source_proof?.task_id).toBe(taskId);
    expect(pageData?.source_proof?.source_path).toBe(taskData.source_path);
    expect(pageData?.created_by_patch).toBe('RC-AUTO-B1-GENERIC');
    console.log('G16 PASS');
  });

  test('G18: canonical worker reuse verification', () => {
    const { classifyRouting: testClassify } = require('../../services/routing_classifier');
    expect(testClassify(1, 'Long valid text for page. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.', 10)).toBe('NATIVE');
    console.log('G18 PASS');
  });

  describe('🔱 GPA/PAI INTEGRATION TESTS (PAI-T01 to PAI-T14)', () => {
    test('PAI-T01: native persists authority', async () => {
      mockPdfBytes = Buffer.from('native-path-bytes-neet-authority-pai01');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai01';

      const taskId = 'test_pai_t01';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      const pData = pageSnap.data();
      expect(pData?.pageAuthorityDigest).toBeDefined();
      expect(pData?.pageAuthorityVersion).toBeDefined();
      expect(pData?.parentSourceVerified).toBe(true);
    });

    test('PAI-T02: OCR persists authority', async () => {
      mockPdfBytes = Buffer.from('scanned-path-bytes-neet-authority-pai02');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai02';

      mockPdfPagesText = { 1: '', 2: '' };

      const taskId = 'test_pai_t02';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      const pData = pageSnap.data();
      expect(pData?.pageAuthorityDigest).toBeDefined();
      expect(pData?.pageAuthorityVersion).toBeDefined();
      expect(pData?.parentSourceVerified).toBe(true);
    });

    test('PAI-T03: wrong SHA blocks before write', async () => {
      const taskId = 'test_pai_t03';
      const missionId = 'neet_(ug)-2027_pai03';
      const docId = 'hash_abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789_pai03';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const peSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).get();
      expect(peSnap.empty).toBe(true);
    });

    test('PAI-T04: matching authority idempotent', async () => {
      mockPdfBytes = Buffer.from('idempotent-matching-bytes-pai04');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai04';

      const taskId1 = 'test_pai_t04_1';
      const taskData1 = createBaseTask(taskId1, missionId, docId);
      await db.collection('ai_queue').doc(taskId1).set(taskData1);
      let snap = fft.firestore.makeDocumentSnapshot(taskData1, `ai_queue/${taskId1}`);
      await wrapped(snap, { params: { taskId: taskId1 } });

      const taskId2 = 'test_pai_t04_2';
      const taskData2 = createBaseTask(taskId2, missionId, docId);
      await db.collection('ai_queue').doc(taskId2).set(taskData2);
      snap = fft.firestore.makeDocumentSnapshot(taskData2, `ai_queue/${taskId2}`);
      await wrapped(snap, { params: { taskId: taskId2 } });

      const taskSnap = await db.collection('ai_queue').doc(taskId2).get();
      expect(taskSnap.data()?.status).toBe('completed');
    });

    test('PAI-T05: conflicting authority blocks', async () => {
      mockPdfBytes = Buffer.from('conflict-bytes-1-pai05');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai05';

      const taskId1 = 'test_pai_t05_1';
      const taskData1 = createBaseTask(taskId1, missionId, docId);
      await db.collection('ai_queue').doc(taskId1).set(taskData1);
      let snap = fft.firestore.makeDocumentSnapshot(taskData1, `ai_queue/${taskId1}`);
      await wrapped(snap, { params: { taskId: taskId1 } });

      // Create conflict manually
      const pageRef = db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1');
      await pageRef.set({ pageAuthorityDigest: 'conflicting_digest_value_here_to_force_failure' }, { merge: true });

      const taskId2 = 'test_pai_t05_2';
      const taskData2 = createBaseTask(taskId2, missionId, docId);
      await db.collection('ai_queue').doc(taskId2).set(taskData2);
      snap = fft.firestore.makeDocumentSnapshot(taskData2, `ai_queue/${taskId2}`);
      await wrapped(snap, { params: { taskId: taskId2 } });

      const taskSnap = await db.collection('ai_queue').doc(taskId2).get();
      expect(taskSnap.data()?.status).toBe('failed');
      expect(taskSnap.data()?.failure_reason).toBe('PAGE_EXTRACTION_ALREADY_EXISTS');
    });

    test('PAI-T06: retry safe', async () => {
      mockPdfBytes = Buffer.from('retry-bytes-safe-pai06');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai06';

      const taskId = 'test_pai_t06';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set({ ...taskData, status: 'failed', failure_reason: 'EXTRACTION_ERROR' });
      await db.collection('ai_queue').doc(taskId).update({ status: 'queued' });

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const taskSnap = await db.collection('ai_queue').doc(taskId).get();
      expect(taskSnap.data()?.status).toBe('completed');
    });

    test('PAI-T07: ambiguous HOLD safe', async () => {
      mockPdfBytes = Buffer.from('ambiguous-hold-bytes-pai-pai07');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai07';
      mockPdfPagesText = { 1: 'short', 2: 'short' };

      const taskId = 'test_pai_t07';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const taskSnap = await db.collection('ai_queue').doc(taskId).get();
      expect(taskSnap.data()?.status).toBe('failed');
      expect(taskSnap.data()?.failure_reason).toBe('RC_SYLLABUS_P1_BLOCKED_ROUTING_AMBIGUOUS');
    });

    test('PAI-T08: simulated content blocked', async () => {
      mockPdfBytes = Buffer.from('simulated-bytes-pai-pai08');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai08';
      mockPdfPagesText = {
        1: 'Simulated text payload. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.',
        2: 'Simulated text payload. This is a very long text to ensure that the body length exceeds 100 characters and avoids the AMBIGUOUS classification.'
      };

      const taskId = 'test_pai_t08';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const taskSnap = await db.collection('ai_queue').doc(taskId).get();
      expect(taskSnap.data()?.status).toBe('failed');
      expect(taskSnap.data()?.failure_reason).toBe('NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED');
    });

    test('PAI-T09: JEE fixture', async () => {
      mockPdfBytes = Buffer.from('jee-fixture-bytes-pai-pai09');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'jee_main_2026_pai09';

      const taskId = 'test_pai_t09';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnap.exists).toBe(true);
    });

    test('PAI-T10: NEET fixture', async () => {
      mockPdfBytes = Buffer.from('neet-fixture-bytes-pai-pai10');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai10';

      const taskId = 'test_pai_t10';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnap.exists).toBe(true);
    });

    test('PAI-T11: canonical RPSC fixture', async () => {
      mockPdfBytes = Buffer.from('rpsc-fixture-bytes-pai-pai11');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'RPSC_FIRST_GRADE2026_2026_1782713222215_pai11';

      const taskId = 'test_pai_t11';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnap.exists).toBe(true);
    });

    test('PAI-T12: unknown future mission', async () => {
      mockPdfBytes = Buffer.from('future-fixture-bytes-pai-pai12');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'future_exam_2099_pai12';

      const taskId = 'test_pai_t12';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnap.exists).toBe(true);
    });

    test('PAI-T13: Founder approval untouched', async () => {
      mockPdfBytes = Buffer.from('founder-untouched-bytes-pai-pai13');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionId = 'neet_(ug)-2027_pai13';

      const taskId = 'test_pai_t13';
      const taskData = createBaseTask(taskId, missionId, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnap = await db.collection(`mission_realms/${missionId}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnap.data()?.review_status).toBe('pending_ai_verification');
    });

    test('PAI-T14: cross-mission leakage zero', async () => {
      mockPdfBytes = Buffer.from('leakage-zero-bytes-pai-pai14');
      const validSha = crypto.createHash('sha256').update(mockPdfBytes).digest('hex');
      const docId = `hash_${validSha}`;
      const missionIdJee = 'jee_main_2026_pai14';
      const missionIdNeet = 'neet_(ug)-2027_pai14';

      const taskId = 'test_pai_t14';
      const taskData = createBaseTask(taskId, missionIdJee, docId);
      await db.collection('ai_queue').doc(taskId).set(taskData);

      const snap = fft.firestore.makeDocumentSnapshot(taskData, `ai_queue/${taskId}`);
      await wrapped(snap, { params: { taskId } });

      const pageSnapJee = await db.collection(`mission_realms/${missionIdJee}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnapJee.exists).toBe(true);

      const pageSnapNeet = await db.collection(`mission_realms/${missionIdNeet}/official_documents/${docId}/page_extractions`).doc('1').get();
      expect(pageSnapNeet.exists).toBe(false);
    });
  });
});
