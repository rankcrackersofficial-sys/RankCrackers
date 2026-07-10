const SCHEMA_VERSION = 'notification_schema_v1';

function field(fieldKey, label, dataType, requiredLevel = 'optional', allowedEmptyReason = 'not_present_in_notification') {
  return {
    field_key: fieldKey,
    label,
    data_type: dataType,
    required_level: requiredLevel,
    source_proof_required: true,
    allowed_empty_reason: allowedEmptyReason,
    verification_action: ['approve', 'edit', 'send_back'],
  };
}

const baseNotificationFields = [
  field('exam_title', 'Exam Title', 'string', 'required'),
  field('authority', 'Authority', 'string', 'required'),
  field('recruiting_body', 'Recruiting Body', 'string', 'conditional'),
  field('notification_number', 'Notification Number', 'string', 'conditional'),
  field('notification_release_date', 'Notification Release Date', 'date', 'conditional'),
  field('document_type', 'Document Type', 'enum', 'required'),
  field('official_website', 'Official Website', 'url', 'conditional'),
  field('application_start_date', 'Application Start Date', 'date', 'conditional'),
  field('application_end_date', 'Application End Date', 'date', 'conditional'),
  field('correction_window_start', 'Correction Window Start', 'date', 'optional'),
  field('correction_window_end', 'Correction Window End', 'date', 'optional'),
  field('admit_card_date', 'Admit Card Date', 'date', 'optional'),
  field('exam_date', 'Exam Date', 'date', 'conditional'),
  field('result_date', 'Result Date', 'date', 'optional'),
  field('important_links', 'Important Links', 'link_array', 'conditional'),
  field('source_document_id', 'Source Document ID', 'string', 'required'),
  field('source_pages', 'Source Pages', 'page_array', 'required'),
  field('extraction_confidence', 'Extraction Confidence', 'confidence', 'required'),
  field('founder_verification_status', 'Founder Verification Status', 'enum', 'required'),
];

const sourceProofContract = {
  source_document_id: 'string',
  source_page_number: 'number',
  source_text_excerpt: 'string',
  extraction_confidence: 'number',
  page_extraction_id: 'string',
};

function requireSourceProofForVerification(fieldValue) {
  return Boolean(
    fieldValue
    && fieldValue.source_proof
    && fieldValue.source_proof.source_document_id
    && fieldValue.source_proof.source_page_number
    && fieldValue.source_proof.source_text_excerpt
    && fieldValue.source_proof.page_extraction_id
  );
}

module.exports = {
  SCHEMA_VERSION,
  baseNotificationFields,
  field,
  requireSourceProofForVerification,
  sourceProofContract,
};
