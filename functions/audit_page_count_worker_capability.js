const fs = require('fs');
const path = require('path');

function assertPass(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

function main() {
  console.log('================================================================================');
  console.log('PATCH RC-X3W-FIX - PAGE COUNT WORKER CAPABILITY AUDIT');
  console.log('================================================================================');

  const workerPath = path.join(__dirname, 'process_page_count_detection_tasks.js');
  assertPass(fs.existsSync(workerPath), 'process_page_count_detection_tasks.js exists');
  const content = fs.readFileSync(workerPath, 'utf8');

  assertPass(/PROJECT_ID\s*=\s*['"]rankcrackers-55['"]/.test(content), 'PROJECT_ID exists');
  assertPass(/function\s+getAccessToken\s*\(/.test(content), 'getAccessToken exists');
  assertPass(/function\s+downloadFileBuffer\s*\(/.test(content), 'downloadFileBuffer exists');
  assertPass(/function\s+lower\s*\(/.test(content), 'lower exists');
  assertPass(/const\s+isApplyMode\s*=/.test(content) || /let\s+isApplyMode\s*=/.test(content), 'isApplyMode exists');
  assertPass(/--limit/.test(content) && /const\s+limit\s*=/.test(content), 'limit parsing exists');
  assertPass(/const\s*\{\s*Firestore\s*,\s*FieldValue\s*\}\s*=\s*require\(['"]@google-cloud\/firestore['"]\)/.test(content), 'FieldValue imported safely');
  assertPass(/FieldValue\.serverTimestamp\(\)/.test(content), 'FieldValue.serverTimestamp used safely');
  assertPass(!/Firestore\.FieldValue\.serverTimestamp\(\)/.test(content), 'Firestore.FieldValue.serverTimestamp not used');

  const forbiddenAiPatterns = ['gemini', 'vertexai', 'generativeai', 'callLlm', '@google/generative-ai', '@google-cloud/vertexai'];
  for (const pattern of forbiddenAiPatterns) {
    assertPass(!content.toLowerCase().includes(pattern.toLowerCase()), `No AI model call pattern: ${pattern}`);
  }

  const executableOcrPattern = /(tesseract|vision\(|documentai|ocr\(|performOcr|runOcr)/i;
  assertPass(!executableOcrPattern.test(content), 'No OCR execution calls');
  assertPass(!/collection\(['"]page_extractions['"]\)\.(add|set|doc)/.test(content), 'No page_extractions write');

  const forbiddenWriteCollections = ['syllabus_atoms', 'notification_facts', 'verified_notification_facts', 'question_bank', 'questions', 'atoms'];
  for (const collectionName of forbiddenWriteCollections) {
    const pattern = new RegExp(`collection\\(['\"]${collectionName}['\"]\\)`, 'i');
    assertPass(!pattern.test(content), `No atoms/facts/questions writes: ${collectionName}`);
  }

  assertPass(/selectedTasks\s*=\s*activeTasks\.slice\(0,\s*limit\)/.test(content), 'limit applies to task count only');
  assertPass(/task_limit_is_not_page_limit:\s*true/.test(content), 'TASK_LIMIT_IS_NOT_PAGE_LIMIT = true');
  assertPass(/all_pages_required:\s*true/.test(content), 'all_pages_required policy present');
  assertPass(/fixed_page_limit_allowed:\s*false/.test(content), 'fixed_page_limit_allowed policy present');
  assertPass(/batch_size_is_not_page_limit:\s*true/.test(content), 'batch_size_is_not_page_limit policy present');
  assertPass(/source_resolution/.test(content), 'source_resolution reporting present');
  assertPass(/SOURCE_RECORD_NOT_RESOLVED/.test(content), 'SOURCE_RECORD_NOT_RESOLVED safe skip present');
  assertPass(/CONFIRM_PROCESS_PAGE_COUNT_DETECTION/.test(content), 'apply confirmation phrase present');
  assertPass(/exact command/.test(content) || /exactApply/.test(content), 'apply mode exact-command lock present');

  console.log('\nRC_X3W_FIX_PAGE_COUNT_WORKER_CAPABILITY_READY');
}

main();
