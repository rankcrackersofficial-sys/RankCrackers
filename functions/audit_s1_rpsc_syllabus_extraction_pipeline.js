const fs = require('fs');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'RPSC_FIRST_GRADE2026_2026_1782713222215';

function getAccessToken() {
  try {
    return cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Authentication Error: Could not get gcloud access token. Ensure gcloud is logged in.', e.message);
    process.exit(1);
  }
}

function textExists(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function getField(data, keys, fallback = null) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
  }
  return fallback;
}

function normalizeDoc(doc) {
  const d = doc.data ? doc.data() : doc;
  return { id: doc.id || d.id || d.documentId || d.docId || '', ...d };
}

function isSyllabusDoc(data) {
  const hay = [
    data.document_role, data.documentRole, data.syllabus_role, data.syllabusRole,
    data.document_type, data.documentType, data.type, data.category, data.intent,
    data.file_name, data.fileName, data.title, data.name
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes('syllabus') || hay.includes('paper 1') || hay.includes('paper 2') || hay.includes('atomic json');
}

function isPdfDoc(data) {
  const ext = String(getField(data, ['fileType', 'extension'], '')).toLowerCase();
  const name = String(getField(data, ['file_name', 'fileName', 'name', 'title'], '')).toLowerCase();
  const mime = String(getField(data, ['mimeType', 'contentType'], '')).toLowerCase();
  return ext === 'pdf' || name.endsWith('.pdf') || mime.includes('pdf');
}

function extractionStatus(data) {
  return getField(data, [
    'extraction_status', 'extractionStatus', 'status', 'documentStatus',
    'aiQueueStatus', 'syllabusAtomStatus', 'last_successful_stage'
  ], 'unknown');
}

function pageArrayCandidates(data) {
  const candidates = [];
  for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages', 'pageWiseExtraction']) {
    if (Array.isArray(data[key])) candidates.push({ key, pages: data[key] });
  }
  if (data.aiResult && typeof data.aiResult === 'object') {
    for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages']) {
      if (Array.isArray(data.aiResult[key])) candidates.push({ key: `aiResult.${key}`, pages: data.aiResult[key] });
    }
  }
  if (data.rawData && typeof data.rawData === 'object') {
    for (const key of ['pages', 'pageResults', 'page_extractions', 'pageExtractions', 'parsedPages', 'extractedPages']) {
      if (Array.isArray(data.rawData[key])) candidates.push({ key: `rawData.${key}`, pages: data.rawData[key] });
    }
  }
  return candidates;
}

function pageWiseSummary(records) {
  const allPages = [];
  const sourceKeys = [];
  for (const rec of records) {
    for (const candidate of pageArrayCandidates(rec)) {
      sourceKeys.push(`${rec.__source || 'record'}:${candidate.key}`);
      for (const page of candidate.pages) allPages.push(page);
    }
  }
  const pageNumbers = allPages
    .map(p => Number(getField(p, ['page_number', 'pageNumber', 'page', 'number'], NaN)))
    .filter(n => Number.isFinite(n));
  const uniquePages = [...new Set(pageNumbers)].sort((a, b) => a - b);
  const pageTextCount = allPages.filter(p => textExists(getField(p, ['page_text', 'pageText', 'text', 'content', 'markdown', 'page_markdown', 'pageMarkdown', 'page_explanation', 'pageExplanation']))).length;
  const totalPages = Math.max(
    0,
    ...records.map(r => Number(getField(r, ['page_count', 'pageCount', 'totalPages', 'total_pages'], 0))).filter(n => Number.isFinite(n)),
    ...uniquePages
  );
  const missingPages = totalPages > 0
    ? Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => !uniquePages.includes(n))
    : [];
  return {
    total_pages: totalPages || 'unknown',
    extracted_pages_count: uniquePages.length || pageTextCount,
    missing_pages: missingPages,
    first_page_only_extracted: uniquePages.length === 1 && uniquePages[0] === 1,
    page_wise_preview_available: uniquePages.length > 1 || pageTextCount > 1,
    page_source_keys: sourceKeys,
  };
}

async function getDocIfExists(ref, source) {
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, __source: source, ...snap.data() };
}

async function findCollectionMatches(db, collectionName, missionId, docIds) {
  const snap = await db.collection(collectionName).get();
  const matches = [];
  snap.forEach(doc => {
    const data = doc.data();
    const hay = [doc.id, data.id, data.docId, data.documentId, data.sourceId, data.missionId, data.mission_id, data.realmId, data.recruitmentId]
      .filter(Boolean).join(' ');
    const directMission = [data.missionId, data.mission_id, data.realmId, data.recruitmentId].filter(Boolean).includes(missionId);
    const directDoc = docIds.some(id => id && hay.includes(id));
    if (directMission || directDoc) matches.push({ id: doc.id, __source: collectionName, ...data });
  });
  return matches;
}

function inspectUiCapability() {
  const root = path.join(__dirname, '..');
  const files = [
    'lib/web/founder/mission_control/mission_documents_tab.dart',
    'lib/web/founder/mission_control/mission_document_detail_dialog.dart',
    'lib/web/founder/mission_control/syllabus_atom_verification_tab.dart',
    'lib/web/founder/mission_control/syllabus_atom_bulk_review_panel.dart',
    'lib/web/founder/ingestion/unified_document_registry.dart',
    'lib/web/founder/ingestion/review_board.dart',
    'lib/web/founder/ingestion/review_dialog.dart',
  ];
  const evidence = [];
  let corpus = '';
  for (const rel of files) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      const text = fs.readFileSync(full, 'utf8');
      corpus += `\n// ${rel}\n${text}`;
      evidence.push(rel);
    }
  }
  return {
    files_checked: evidence,
    full_document_preview_supported: /extractedText|extractedMarkdown|AI Extraction Preview|SelectableText/.test(corpus),
    page_wise_terms_present: /page_number|pageNumber|source_page_number|sourcePageNumber|page_text|pageText|Page /.test(corpus),
    atom_source_page_present: /source_page_number|sourcePageNumber|source_text_excerpt|sourceTextExcerpt/.test(corpus),
    approve_send_back_present: /send back|SEND_BACK|needs_review|verify|approved|rejected/i.test(corpus),
    first_page_specific_code_present: /firstPage|page\s*==\s*1|take\(1\)|\.first\b/.test(corpus),
  };
}

async function main() {
  console.log('================================================================================');
  console.log('PATCH S1 — RPSC SYLLABUS AI WORKER EXTRACTION PIPELINE AUDIT');
  console.log('================================================================================');
  console.log(`Mission: ${MISSION_ID}`);
  console.log('Mode: READ ONLY — no writes, no publish, no approval, no generation');

  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: getAccessToken() });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });

  const missionRef = db.collection('mission_realms').doc(MISSION_ID);
  const missionSnap = await missionRef.get();
  if (!missionSnap.exists) throw new Error(`Mission not found: ${MISSION_ID}`);
  const missionData = missionSnap.data();

  const rootOfficial = Array.isArray(missionData.officialDocuments)
    ? missionData.officialDocuments.map((d, idx) => ({ id: d.id || d.documentId || `root_${idx}`, __source: 'mission_root.officialDocuments', ...d }))
    : [];
  const subSnap = await missionRef.collection('official_documents').get();
  const subDocs = [];
  subSnap.forEach(d => subDocs.push({ id: d.id, __source: 'mission_realms.official_documents', ...d.data() }));

  const byId = new Map();
  for (const doc of [...rootOfficial, ...subDocs]) {
    if (isSyllabusDoc(doc)) byId.set(doc.id, { ...(byId.get(doc.id) || {}), ...doc });
  }
  const syllabusDocs = [...byId.values()];
  const docIds = syllabusDocs.map(d => d.id);

  const ingestionMatches = await findCollectionMatches(db, 'ingestion_refinery', MISSION_ID, docIds);
  const aiQueueMatches = await findCollectionMatches(db, 'ai_queue', MISSION_ID, docIds);
  const sourceDocMatches = await findCollectionMatches(db, 'source_documents', MISSION_ID, docIds);

  const documentReports = [];
  for (const doc of syllabusDocs) {
    const ids = [doc.id, doc.documentId, doc.docId, doc.sourceId].filter(Boolean);
    const relatedIngestion = ingestionMatches.filter(r => ids.some(id => [r.id, r.sourceId, r.documentId, r.docId].filter(Boolean).join(' ').includes(id)) || r.missionId === MISSION_ID || r.mission_id === MISSION_ID);
    const relatedAi = aiQueueMatches.filter(r => ids.some(id => [r.id, r.sourceId, r.documentId, r.docId].filter(Boolean).join(' ').includes(id)));
    const relatedSource = sourceDocMatches.filter(r => ids.some(id => [r.id, r.sourceId, r.documentId, r.docId].filter(Boolean).join(' ').includes(id)));
    const combined = [doc, ...relatedIngestion, ...relatedSource, ...relatedAi];
    const hasExtractedText = combined.some(r => textExists(getField(r, ['extractedText', 'parsedText', 'text', 'rawText', 'searchableText'])));
    const hasExtractedMarkdown = combined.some(r => textExists(getField(r, ['extractedMarkdown', 'markdown'])));
    const hasStructuredJson = combined.some(r => textExists(getField(r, ['structuredJson', 'structured_json', 'rawData', 'aiResult', 'atomic_topics'])));
    const pageSummary = pageWiseSummary(combined);
    const needsTextExtraction = getField(doc, ['needs_text_extraction', 'needsTextExtraction'], false) === true || !hasExtractedText;
    const readyForAtoms = getField(doc, ['ready_for_syllabus_atom_extraction', 'readyForSyllabusAtomExtraction'], false) === true || (hasStructuredJson && !needsTextExtraction);
    documentReports.push({
      document_id: doc.id,
      file_name: getField(doc, ['file_name', 'fileName', 'name', 'title'], 'N/A'),
      document_type: getField(doc, ['document_type', 'documentType', 'type', 'category'], 'N/A'),
      syllabus_role: getField(doc, ['syllabus_role', 'syllabusRole'], 'N/A'),
      variable_id: getField(doc, ['variable_id', 'variableId', 'subjectCode'], 'N/A'),
      storage_path_or_source_url: getField(doc, ['storagePath', 'storageRawPath', 'sourceUrl', 'downloadUrl', 'filePath'], 'N/A'),
      extraction_status: extractionStatus(doc),
      needs_text_extraction: needsTextExtraction,
      ready_for_syllabus_atom_extraction: readyForAtoms,
      next_pipeline_step: getField(doc, ['next_pipeline_step', 'nextPipelineStep'], needsTextExtraction ? 'text_extraction' : (readyForAtoms ? 'syllabus_atom_extraction' : 'unknown')),
      ai_queue_task_exists: relatedAi.length > 0,
      ai_queue_status: relatedAi.map(r => getField(r, ['status', 'aiQueueStatus'], 'unknown')).join(', ') || 'N/A',
      extracted_text_exists: hasExtractedText,
      extracted_markdown_exists: hasExtractedMarkdown,
      structured_json_exists: hasStructuredJson,
      page_count: pageSummary.total_pages,
      processed_page_count: pageSummary.extracted_pages_count,
      page_wise: pageSummary,
      related_records: {
        ingestion_refinery: relatedIngestion.map(r => r.id),
        ai_queue: relatedAi.map(r => r.id),
        source_documents: relatedSource.map(r => r.id),
      },
    });
  }

  const atomsSnap = await missionRef.collection('syllabus_atoms').get();
  const atomDocs = [];
  atomsSnap.forEach(d => atomDocs.push({ id: d.id, ...d.data() }));
  let verifiedAtoms = 0;
  let draftAtoms = 0;
  let atomsWithSourcePage = 0;
  let atomsWithSourceExcerpt = 0;
  let atomsMissingProof = 0;
  for (const atom of atomDocs) {
    const status = String(getField(atom, ['verification_status', 'verificationStatus', 'status', 'reviewStatus'], '')).toLowerCase();
    if (status.includes('verified') || atom.verified === true || atom.founderApproved === true) verifiedAtoms++;
    if (!status || status.includes('draft') || status.includes('extracted') || status.includes('review')) draftAtoms++;
    const hasPage = getField(atom, ['source_page_number', 'sourcePageNumber', 'page_number', 'pageNumber'], null) != null;
    const hasExcerpt = textExists(getField(atom, ['source_text_excerpt', 'sourceTextExcerpt', 'sourceExcerpt', 'source_text'], null));
    if (hasPage) atomsWithSourcePage++;
    if (hasExcerpt) atomsWithSourceExcerpt++;
    if (!hasPage || !hasExcerpt) atomsMissingProof++;
  }

  const collectionGroupAtoms = await db.collectionGroup('syllabus_atoms').get();
  let collectionGroupLinkedCount = 0;
  collectionGroupAtoms.forEach(d => {
    const data = d.data();
    if (data.missionId === MISSION_ID || data.mission_id === MISSION_ID || d.ref.path.includes(`/mission_realms/${MISSION_ID}/`)) collectionGroupLinkedCount++;
  });

  const ui = inspectUiCapability();

  console.log('\nPART A — Document-wise extraction status');
  for (const report of documentReports) {
    console.log('\n---');
    console.log(JSON.stringify(report, null, 2));
  }

  console.log('\nPART C — Syllabus atom output audit');
  console.log(JSON.stringify({
    syllabus_atoms_count: atomDocs.length,
    verified_atoms_count: verifiedAtoms,
    draft_atoms_count: draftAtoms,
    atoms_with_source_page_number: atomsWithSourcePage,
    atoms_with_source_text_excerpt: atomsWithSourceExcerpt,
    atoms_missing_source_proof: atomsMissingProof,
    collection_group_syllabus_atoms_linked_to_mission: collectionGroupLinkedCount,
  }, null, 2));

  console.log('\nPART D — Founder verification UI static audit');
  console.log(JSON.stringify({
    current_ui_supports_full_document_preview: ui.full_document_preview_supported,
    current_ui_only_shows_first_page: ui.first_page_specific_code_present && !ui.page_wise_terms_present,
    current_ui_supports_page_wise_verification: ui.page_wise_terms_present && ui.approve_send_back_present,
    atom_source_proof_terms_present: ui.atom_source_page_present,
    files_checked: ui.files_checked,
  }, null, 2));

  const pdfReports = documentReports.filter(r => String(r.file_name).toLowerCase().endsWith('.pdf') || String(r.document_type).toLowerCase().includes('pdf'));
  const noQueueDocs = documentReports.filter(r => !r.ai_queue_task_exists);
  const pendingTextDocs = documentReports.filter(r => r.needs_text_extraction);
  const atomReadyButNoAtoms = documentReports.filter(r => r.ready_for_syllabus_atom_extraction).length > 0 && atomDocs.length === 0;
  const firstPageOnly = pdfReports.some(r => r.page_wise.first_page_only_extracted);
  const pageWiseMissing = pdfReports.some(r => !r.page_wise.page_wise_preview_available);

  let classification = 'EXTRACTION_PIPELINE_READY';
  const blockers = [];
  if (noQueueDocs.length === documentReports.length) {
    classification = 'PIPELINE_DISCONNECTED';
    blockers.push('No related ai_queue task found for any syllabus document.');
  } else if (pendingTextDocs.length > 0) {
    classification = 'TEXT_EXTRACTION_PENDING';
    blockers.push(`${pendingTextDocs.length} syllabus document(s) still need text extraction or have no extracted text.`);
  } else if (atomReadyButNoAtoms) {
    classification = 'ATOM_EXTRACTION_PENDING';
    blockers.push('Text/structured source appears ready for atom extraction but mission syllabus_atoms count is 0.');
  }
  if (firstPageOnly) {
    classification = 'BLOCKED_FIRST_PAGE_ONLY_PREVIEW';
    blockers.push('At least one PDF appears to have only first-page extraction evidence.');
  } else if (pageWiseMissing) {
    if (classification === 'EXTRACTION_PIPELINE_READY') classification = 'VERIFICATION_UI_INCOMPLETE';
    blockers.push('PDF page-wise extraction preview is missing or unavailable.');
  }
  if (!ui.page_wise_terms_present || !ui.atom_source_page_present) {
    if (classification === 'EXTRACTION_PIPELINE_READY') classification = 'VERIFICATION_UI_INCOMPLETE';
    blockers.push('Founder UI/static code does not clearly expose page-wise atom proof for every page/section.');
  }

  console.log('\nPART E — Decision classification');
  console.log(JSON.stringify({
    classification,
    blockers,
    smallest_next_patch_recommendation: classification === 'TEXT_EXTRACTION_PENDING'
      ? 'PATCH S2 — Page-wise Text Extraction Queue for pending PDFs'
      : classification === 'ATOM_EXTRACTION_PENDING'
        ? 'PATCH S4 — AI Syllabus Atom Extraction from page-wise text'
        : 'PATCH S3 — Page-wise Extraction Preview UI / pipeline linkage repair',
  }, null, 2));

  console.log('\nFinal verdict: PATCH_S1_SYLLABUS_EXTRACTION_PIPELINE_AUDIT_READY');
}

main().catch((e) => {
  console.error('PATCH_S1_BLOCKED');
  console.error(e);
  process.exit(1);
});