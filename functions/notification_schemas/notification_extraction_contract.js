const NOTIFICATION_FORM_EXTRACTION_CONTRACT = {
  input: {
    mission_id: 'string',
    source_document_id: 'string',
    document_type: 'string',
    selected_archetype: 'string',
    schema_version: 'string',
    page_extractions: [
      {
        page_number: 'number',
        page_extraction_id: 'string',
        raw_text: 'string',
        markdown_text: 'string',
        extraction_confidence: 'number',
        extraction_status: 'complete | partial | failed | empty',
      },
    ],
  },
  output: {
    notification_form_draft_id: 'string',
    mission_id: 'string',
    source_document_id: 'string',
    selected_archetype: 'string',
    schema_version: 'string',
    form_status: 'draft_pending_founder_verification',
    extracted_fields: [],
    variable_packs: [],
    missing_required_fields: [],
    low_confidence_fields: [],
    source_coverage_summary: {},
    founder_verification_status: 'pending',
    created_at: 'timestamp | iso_string',
    updated_at: 'timestamp | iso_string',
  },
  rules: [
    'verified=true is not allowed at draft stage',
    'founder_verification_status cannot be approved unless source_proof is complete',
    'if source_proof is missing, field must go to low_confidence_fields or missing_required_fields',
    'no field may be silently accepted',
    'no summary-only output allowed',
  ],
};

const REQUIRED_SOURCE_PROOF_KEYS = [
  'source_document_id',
  'source_page_number',
  'source_text_excerpt',
  'extraction_confidence',
  'page_extraction_id',
];

function hasCompleteSourceProof(sourceProof) {
  if (!sourceProof || typeof sourceProof !== 'object') return false;
  return REQUIRED_SOURCE_PROOF_KEYS.every(key => sourceProof[key] !== undefined && sourceProof[key] !== null && sourceProof[key] !== '');
}

function isSummaryOnlyOutput(draft) {
  return Boolean(draft && draft.summary && (!Array.isArray(draft.extracted_fields) || draft.extracted_fields.length === 0));
}

function validateNotificationFormDraft(draft) {
  const blockers = [];
  const warnings = [];

  if (!draft || typeof draft !== 'object') {
    return { valid: false, blockers: ['draft missing or invalid'], warnings };
  }
  if (!draft.source_document_id) blockers.push('missing source_document_id');
  if (!draft.selected_archetype) blockers.push('selected_archetype missing');
  if (!draft.schema_version) blockers.push('schema_version missing');
  if (draft.form_status !== 'draft_pending_founder_verification') blockers.push('form_status must be draft_pending_founder_verification');
  if (draft.founder_verification_status !== 'pending') blockers.push('founder_verification_status must be pending');
  if (isSummaryOnlyOutput(draft)) blockers.push('output is summary-only');
  if (!Array.isArray(draft.extracted_fields)) blockers.push('extracted_fields must be an array');

  const fields = Array.isArray(draft.extracted_fields) ? draft.extracted_fields : [];
  for (const field of fields) {
    const label = field.field_key || field.label || 'unknown_field';
    const sourceProof = field.source_proof;
    if (!sourceProof) blockers.push(`${label}: missing source_proof`);
    if (sourceProof) {
      for (const key of REQUIRED_SOURCE_PROOF_KEYS) {
        if (sourceProof[key] === undefined || sourceProof[key] === null || sourceProof[key] === '') {
          blockers.push(`${label}: missing ${key}`);
        }
      }
    }
    if (field.verified === true) blockers.push(`${label}: verified=true is not allowed at draft stage`);
    if (field.founder_verification_status === 'approved' && !hasCompleteSourceProof(sourceProof)) {
      blockers.push(`${label}: approved field without complete source_proof`);
    }
    if (field.founder_verification_status !== 'pending') {
      warnings.push(`${label}: draft field founder_verification_status should normally be pending`);
    }
  }

  return { valid: blockers.length === 0, blockers, warnings };
}

module.exports = {
  NOTIFICATION_FORM_EXTRACTION_CONTRACT,
  REQUIRED_SOURCE_PROOF_KEYS,
  hasCompleteSourceProof,
  validateNotificationFormDraft,
};
