const crypto = require('crypto');
const { BASE_NOTIFICATION_SCHEMA } = require('./base_notification_schema');
const { EXAM_ARCHETYPE_SCHEMAS, getArchetypeFields } = require('./exam_archetype_schemas');
const { VARIABLE_PACKS } = require('./variable_packs');
const { hasCompleteSourceProof } = require('./notification_extraction_contract');

const LOW_CONFIDENCE_THRESHOLD = 0.75;

function nowIso() {
  return new Date().toISOString();
}

function draftId(missionId, sourceDocumentId, selectedArchetype) {
  const hash = crypto.createHash('sha1').update(`${missionId}:${sourceDocumentId}:${selectedArchetype}`).digest('hex').slice(0, 16);
  return `notification_form_draft_${hash}`;
}

function requiredFieldsFor(schemaSelection) {
  const selectedArchetype = schemaSelection?.selected_archetype || 'base_notification_only';
  const baseFields = BASE_NOTIFICATION_SCHEMA.fields || [];
  const archetypeFields = getArchetypeFields(selectedArchetype);
  return [...baseFields, ...archetypeFields].filter(field => field.required_level === 'required');
}

function allFieldsFor(schemaSelection) {
  const selectedArchetype = schemaSelection?.selected_archetype || 'base_notification_only';
  return [...(BASE_NOTIFICATION_SCHEMA.fields || []), ...getArchetypeFields(selectedArchetype)];
}

function buildFieldLookup(schemaSelection) {
  const lookup = new Map();
  for (const field of allFieldsFor(schemaSelection)) lookup.set(field.field_key, field);
  return lookup;
}

function normalizeCandidate(candidate, sourceDocumentId, fieldMeta = {}) {
  const sourceProof = {
    source_document_id: sourceDocumentId,
    source_page_number: candidate.source_page_number,
    source_text_excerpt: candidate.source_text_excerpt,
    extraction_confidence: candidate.confidence,
    page_extraction_id: candidate.page_extraction_id,
  };
  return {
    field_key: candidate.field_key,
    label: fieldMeta.label || candidate.field_key,
    value: candidate.value,
    normalized_value: candidate.normalized_value ?? candidate.value,
    data_type: fieldMeta.data_type || 'unknown',
    confidence: candidate.confidence ?? 0,
    founder_verification_status: 'pending',
    source_proof: sourceProof,
  };
}

function buildSourceCoverageSummary({ pageExtractions, extractedFields }) {
  const availablePages = [...new Set((pageExtractions || []).map(page => page.page_number).filter(Boolean))].sort((a, b) => a - b);
  const pagesUsed = [...new Set(extractedFields.map(field => field.source_proof?.source_page_number).filter(Boolean))].sort((a, b) => a - b);
  return {
    total_pages_available: availablePages.length,
    pages_used: pagesUsed,
    pages_not_used: availablePages.filter(page => !pagesUsed.includes(page)),
    fields_with_source_proof: extractedFields.filter(field => hasCompleteSourceProof(field.source_proof)).length,
    fields_missing_source_proof: extractedFields.filter(field => !hasCompleteSourceProof(field.source_proof)).length,
  };
}

function buildNotificationFormDraft({ missionId, sourceDocumentId, schemaSelection, pageExtractions = [], extractedFieldCandidates = [] }) {
  const selectedArchetype = schemaSelection?.selected_archetype || 'base_notification_only';
  const schemaVersion = schemaSelection?.schema_version || BASE_NOTIFICATION_SCHEMA.schema_version;
  const fieldLookup = buildFieldLookup(schemaSelection);
  const extractedFields = extractedFieldCandidates.map(candidate => normalizeCandidate(candidate, sourceDocumentId, fieldLookup.get(candidate.field_key)));
  const extractedKeys = new Set(extractedFields.map(field => field.field_key));
  const missingRequiredFields = requiredFieldsFor(schemaSelection)
    .filter(field => !extractedKeys.has(field.field_key))
    .map(field => ({ field_key: field.field_key, label: field.label, required_level: field.required_level, reason: 'required_field_not_found_in_candidates' }));
  const lowConfidenceFields = extractedFields
    .filter(field => field.confidence < LOW_CONFIDENCE_THRESHOLD || !hasCompleteSourceProof(field.source_proof))
    .map(field => ({ field_key: field.field_key, confidence: field.confidence, missing_source_proof: !hasCompleteSourceProof(field.source_proof) }));
  const timestamp = nowIso();
  return {
    notification_form_draft_id: draftId(missionId, sourceDocumentId, selectedArchetype),
    mission_id: missionId,
    source_document_id: sourceDocumentId,
    selected_archetype: selectedArchetype,
    schema_version: schemaVersion,
    form_status: 'draft_pending_founder_verification',
    extracted_fields: extractedFields,
    variable_packs: Object.keys(VARIABLE_PACKS).map(key => ({ pack_key: key, items: [] })),
    missing_required_fields: missingRequiredFields,
    low_confidence_fields: lowConfidenceFields,
    source_coverage_summary: buildSourceCoverageSummary({ pageExtractions, extractedFields }),
    founder_verification_status: 'pending',
    created_at: timestamp,
    updated_at: timestamp,
  };
}

module.exports = {
  LOW_CONFIDENCE_THRESHOLD,
  buildNotificationFormDraft,
};
