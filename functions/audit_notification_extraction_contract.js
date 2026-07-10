const { selectNotificationSchema } = require('./notification_schemas/schema_selector');
const { buildNotificationFormDraft } = require('./notification_schemas/notification_form_draft_builder');
const { validateNotificationFormDraft } = require('./notification_schemas/notification_extraction_contract');

function page(pageNumber, text) {
  return {
    page_number: pageNumber,
    page_extraction_id: `page_extract_${pageNumber}`,
    raw_text: text,
    markdown_text: text,
    extraction_confidence: 0.91,
    extraction_status: 'complete',
  };
}

function candidate(fieldKey, value, pageNumber, confidence = 0.9) {
  return {
    field_key: fieldKey,
    value,
    normalized_value: value,
    confidence,
    source_page_number: pageNumber,
    source_text_excerpt: `${fieldKey}: ${value}`,
    page_extraction_id: `page_extract_${pageNumber}`,
  };
}

function commonCandidates(title, authority) {
  return [
    candidate('exam_title', title, 1, 0.94),
    candidate('authority', authority, 1, 0.94),
    candidate('document_type', 'notification', 1, 0.9),
    candidate('source_document_id', 'doc_sample', 1, 0.99),
    candidate('source_pages', [1, 2], 1, 0.9),
    candidate('extraction_confidence', 0.91, 1, 0.91),
    candidate('founder_verification_status', 'pending', 1, 0.99),
  ];
}

const CASES = [
  {
    name: 'JEE Main notification page excerpts',
    expected: 'entrance_exam_single',
    input: { exam_name: 'JEE Main 2026', authority: 'NTA Engineering', document_type: 'notification', detected_keywords: ['joint entrance'] },
    candidates: [...commonCandidates('JEE Main 2026', 'NTA'), candidate('exam_mode', 'Computer Based Test', 2), candidate('subjects', ['Physics', 'Chemistry', 'Mathematics'], 2), candidate('paper_pattern', { sections: 3 }, 2), candidate('marking_scheme', '+4/-1', 2)],
  },
  {
    name: 'NEET UG notification page excerpts',
    expected: 'entrance_exam_single',
    input: { exam_name: 'NEET UG 2027', authority: 'NTA Medical', document_type: 'notification', detected_keywords: ['medical entrance'] },
    candidates: [...commonCandidates('NEET UG 2027', 'NTA'), candidate('exam_mode', 'Offline', 2), candidate('subjects', ['Physics', 'Chemistry', 'Biology'], 2), candidate('paper_pattern', { questions: 180 }, 2), candidate('marking_scheme', '+4/-1', 2)],
  },
  {
    name: 'RPSC 1st Grade single recruitment page excerpts',
    expected: 'recruitment_single_exam',
    input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'notification', detected_keywords: ['single recruitment', 'post'] },
    candidates: [...commonCandidates('RPSC 1st Grade', 'RPSC'), candidate('post_name', 'School Lecturer', 1), candidate('qualification', 'Post Graduation', 2), candidate('selection_process', ['Written Exam'], 2)],
  },
  {
    name: 'RPSC variable-heavy recruitment page excerpts',
    expected: 'recruitment_variable_heavy',
    input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'notification', detected_keywords: ['subject-wise', 'department-wise', 'category breakup'] },
    candidates: [...commonCandidates('RPSC 1st Grade', 'RPSC'), candidate('subject_wise_posts', [{ subject: 'Hindi', posts: 100 }], 3), candidate('department_wise_posts', [{ department: 'Education', posts: 100 }], 3), candidate('category_wise_breakup', [{ category: 'GEN', posts: 50 }], 4)],
  },
  {
    name: 'RPSC amendment notice page excerpts',
    expected: 'amendment_notice',
    input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'amendment', detected_keywords: ['correction'] },
    candidates: [...commonCandidates('RPSC 1st Grade Amendment', 'RPSC'), candidate('amendment_type', 'date_correction', 1), candidate('amended_fields', ['application_end_date'], 1), candidate('new_value', '2026-02-01', 1), candidate('source_pages', [1], 1)],
  },
  {
    name: 'RPSC result/cutoff/answer key notice page excerpts',
    expected: 'result_cutoff_answer_key_notice',
    input: { exam_name: 'RPSC 1st Grade', authority: 'RPSC', document_type: 'answer_key', detected_keywords: ['result', 'cutoff'] },
    candidates: [...commonCandidates('RPSC 1st Grade Answer Key', 'RPSC'), candidate('answer_key_status', 'provisional', 1), candidate('cutoff_details', [{ category: 'GEN', marks: 120 }], 2)],
  },
  {
    name: 'Unknown notification',
    expected: 'base_notification_only',
    input: { exam_name: 'Unknown Exam', authority: 'Unknown Authority', document_type: 'notification', detected_keywords: [] },
    candidates: commonCandidates('Unknown Exam', 'Unknown Authority'),
  },
];

function auditCase(testCase) {
  const schemaSelection = selectNotificationSchema(testCase.input);
  const pageExtractions = [page(1, `${testCase.name} page 1`), page(2, `${testCase.name} page 2`), page(3, `${testCase.name} page 3`)];
  const draft = buildNotificationFormDraft({
    missionId: 'sample_mission',
    sourceDocumentId: 'doc_sample',
    schemaSelection,
    pageExtractions,
    extractedFieldCandidates: testCase.candidates,
  });
  const validation = validateNotificationFormDraft(draft);
  const everyFieldHasSourceProof = draft.extracted_fields.every(field => field.source_proof && field.source_proof.source_document_id && field.source_proof.source_page_number && field.source_proof.source_text_excerpt && field.source_proof.page_extraction_id);
  const noApprovedFields = draft.extracted_fields.every(field => field.founder_verification_status === 'pending' && field.verified !== true);
  const noSummaryOnlyOutput = !draft.summary && Array.isArray(draft.extracted_fields) && draft.extracted_fields.length > 0;
  return {
    name: testCase.name,
    expected_archetype: testCase.expected,
    actual_archetype: schemaSelection.selected_archetype,
    selector_pass: schemaSelection.selected_archetype === testCase.expected,
    draft_valid: validation.valid,
    validation_blockers: validation.blockers,
    validation_warnings: validation.warnings,
    every_field_has_source_proof: everyFieldHasSourceProof,
    no_field_approved: noApprovedFields,
    founder_verification_status: draft.founder_verification_status,
    no_summary_only_output: noSummaryOnlyOutput,
    source_coverage_summary: draft.source_coverage_summary,
  };
}

function main() {
  console.log('==============================================');
  console.log('RC-N1 NOTIFICATION EXTRACTION CONTRACT AUDIT');
  console.log('==============================================');
  console.log('Mode: dry-run contract only - no AI extraction, no Firestore writes');

  const results = CASES.map(auditCase);
  const blockers = [];
  for (const result of results) {
    if (!result.selector_pass) blockers.push(`${result.name}: selector expected ${result.expected_archetype}, got ${result.actual_archetype}`);
    if (!result.draft_valid) blockers.push(`${result.name}: draft invalid ${result.validation_blockers.join('; ')}`);
    if (!result.every_field_has_source_proof) blockers.push(`${result.name}: field missing source proof`);
    if (!result.no_field_approved) blockers.push(`${result.name}: field was approved at draft stage`);
    if (result.founder_verification_status !== 'pending') blockers.push(`${result.name}: founder verification not pending`);
    if (!result.no_summary_only_output) blockers.push(`${result.name}: summary-only output detected`);
  }

  console.log('\nDry-run sample results:');
  console.log(JSON.stringify(results, null, 2));
  console.log('\nConfirmations:');
  console.log('- no AI extraction run');
  console.log('- no Firestore writes');
  console.log('- every extracted field requires source proof');
  console.log('- every draft field remains founder_verification_status=pending');
  console.log('- no summary-only output');

  if (blockers.length > 0) {
    console.error('\nRC_N1_BLOCKED');
    blockers.forEach(blocker => console.error(`- ${blocker}`));
    process.exit(1);
  }

  console.log('\nRC_N1_NOTIFICATION_EXTRACTION_CONTRACT_READY');
}

main();
