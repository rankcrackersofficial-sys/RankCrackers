const PAGE_BATCH_SIZE_DEFAULT = 5;
const PAGE_BATCH_SIZE_LARGE_DOC = 3;
const MAX_PAGES_PER_TASK = 5;
const MAX_RETRY_PER_BATCH = 3;
const LARGE_DOCUMENT_PAGE_THRESHOLD = 51;
const PRIMARY_EXTRACTION_LANGUAGE = 'en';

function normalizePageCount(pageCount) {
  const count = Number(pageCount);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : null;
}

function pageBatchSizeFor(pageCount) {
  const count = normalizePageCount(pageCount);
  if (!count) return PAGE_BATCH_SIZE_DEFAULT;
  return count >= LARGE_DOCUMENT_PAGE_THRESHOLD
    ? PAGE_BATCH_SIZE_LARGE_DOC
    : PAGE_BATCH_SIZE_DEFAULT;
}

function buildPageBatches(pageCount) {
  const count = normalizePageCount(pageCount);
  if (!count) return [];
  const batchSize = pageBatchSizeFor(count);
  const batches = [];
  for (let start = 1; start <= count; start += batchSize) {
    batches.push({
      page_start: start,
      page_end: Math.min(start + batchSize - 1, count),
      page_batch_index: batches.length + 1,
    });
  }
  return batches.map(batch => ({ ...batch, total_batches: batches.length }));
}

function queueTaskContract({
  missionId,
  documentId,
  documentType,
  language,
  sourcePath,
  pageStart,
  pageEnd,
  pageBatchIndex,
  totalBatches,
  priority = 'normal',
}) {
  return {
    task_type: 'pagewise_text_extraction_batch',
    mission_id: missionId,
    document_id: documentId,
    document_type: documentType,
    language,
    source_path: sourcePath,
    page_start: pageStart,
    page_end: pageEnd,
    page_batch_index: pageBatchIndex,
    total_batches: totalBatches,
    status: 'queued',
    priority,
    retry_count: 0,
    max_retry: MAX_RETRY_PER_BATCH,
    expected_output: 'page_extractions',
    created_at: 'serverTimestamp()',
    updated_at: 'serverTimestamp()',
  };
}

function pageExtractionRecordContract() {
  return {
    page_number: 'number',
    batch_index: 'number',
    source_document_id: 'string',
    mission_id: 'string',
    document_type: 'string',
    language: 'string',
    raw_text: 'string',
    markdown_text: 'string',
    page_explanation: 'string',
    extraction_confidence: 'number',
    extraction_status: 'complete | failed | empty | warning',
    is_empty_page: 'boolean',
    warnings: 'array',
    token_usage_estimate: 'number?',
    created_at: 'serverTimestamp()',
    updated_at: 'serverTimestamp()',
  };
}

function extractionSummaryContract() {
  return {
    total_pages: 'number',
    extracted_pages: 'number',
    missing_pages: 'array<number>',
    failed_pages: 'array<number>',
    completed_batches: 'number',
    total_batches: 'number',
    combined_markdown_path: 'string?',
    combined_text_path: 'string?',
    extraction_complete: 'boolean',
    extraction_status: 'complete | partial | failed | pending',
    last_batch_completed_at: 'timestamp?',
    warnings: 'array',
  };
}

function languagePolicyFor(language, isExistingDocument = true) {
  const normalized = String(language || '').trim().toLowerCase();
  const isEnglish = ['en', 'eng', 'english'].includes(normalized);
  const isHindi = ['hi', 'hin', 'hindi'].includes(normalized);
  if (isEnglish) {
    return {
      language_policy_status: 'primary_extraction_allowed',
      extraction_blocked_reason: null,
    };
  }
  if (isHindi) {
    return {
      language_policy_status: isExistingDocument
        ? 'legacy_hindi_document_warning'
        : 'requires_english_source_or_translation_workflow',
      extraction_blocked_reason: isExistingDocument
        ? 'existing_hindi_document_requires_founder_legacy_exception'
        : 'primary_extraction_requires_english_source',
    };
  }
  return {
    language_policy_status: 'language_unknown_review_required',
    extraction_blocked_reason: null,
  };
}

module.exports = {
  PAGE_BATCH_SIZE_DEFAULT,
  PAGE_BATCH_SIZE_LARGE_DOC,
  MAX_PAGES_PER_TASK,
  MAX_RETRY_PER_BATCH,
  LARGE_DOCUMENT_PAGE_THRESHOLD,
  PRIMARY_EXTRACTION_LANGUAGE,
  buildPageBatches,
  extractionSummaryContract,
  languagePolicyFor,
  normalizePageCount,
  pageBatchSizeFor,
  pageExtractionRecordContract,
  queueTaskContract,
};
