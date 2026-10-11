const { BASE_NOTIFICATION_SCHEMA, SCHEMA_VERSION } = require('./base_notification_schema');
const { EXAM_ARCHETYPE_SCHEMAS } = require('./exam_archetype_schemas');
const { VARIABLE_PACKS } = require('./variable_packs');

function corpus(input = {}) {
  return [
    input.exam_name,
    input.authority,
    input.document_type,
    input.mission_category,
    input.existing_mission_id,
    ...(Array.isArray(input.detected_keywords) ? input.detected_keywords : []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasAny(text, patterns) {
  return patterns.some(pattern => text.includes(pattern));
}

function buildResult(selectedArchetype, reason, confidence = 0.9, fallbackUsed = false) {
  const archetypeSchema = EXAM_ARCHETYPE_SCHEMAS[selectedArchetype] || EXAM_ARCHETYPE_SCHEMAS.base_notification_only;
  return {
    selected_archetype: archetypeSchema.archetype,
    schema_version: SCHEMA_VERSION,
    schema: {
      base: BASE_NOTIFICATION_SCHEMA,
      archetype: archetypeSchema,
    },
    variable_packs: VARIABLE_PACKS,
    reason,
    confidence,
    fallback_used: fallbackUsed,
  };
}

function selectNotificationSchema(input = {}) {
  const text = corpus(input);
  const documentType = String(input.document_type || '').toLowerCase();
  const isRpsc = hasAny(text, ['rpsc', 'rajasthan public service commission']);
  const isSscCgl = hasAny(text, ['ssc cgl', 'combined graduate level examination', 'combined graduate level exam', 'cgle']);
  const amendment = hasAny(text, ['amendment', 'correction', 'corrigendum', 'revised']) || hasAny(documentType, ['amendment', 'correction']);
  const resultNotice = hasAny(text, ['result', 'cutoff', 'cut-off', 'answer key', 'answer-key']) || hasAny(documentType, ['result', 'cutoff', 'answer_key', 'answer key']);

  if (hasAny(text, ['jee', 'joint entrance', 'nta engineering'])) {
    return buildResult('entrance_exam_single', 'Matched JEE / Joint Entrance / NTA Engineering entrance keywords.', 0.96);
  }
  if (hasAny(text, ['neet', 'medical entrance', 'nta medical'])) {
    return buildResult('entrance_exam_single', 'Matched NEET / Medical entrance / NTA Medical keywords.', 0.96);
  }
  if (isSscCgl && amendment) {
    return buildResult('amendment_notice', 'Matched an SSC CGL amendment/corrigendum; preserve its parent-notice lineage.', 0.94);
  }
  if (isSscCgl && resultNotice) {
    return buildResult('result_cutoff_answer_key_notice', 'Matched an SSC CGL result/cutoff/answer-key notice.', 0.94);
  }
  if (isSscCgl) {
    return buildResult('ssc_cgl_recruitment', 'Matched SSC Combined Graduate Level recruitment notice.', 0.98);
  }
  if (isRpsc && amendment) {
    return buildResult('amendment_notice', 'Matched RPSC amendment/correction notice.', 0.94);
  }
  if (isRpsc && resultNotice) {
    return buildResult('result_cutoff_answer_key_notice', 'Matched RPSC result/cutoff/answer key notice.', 0.94);
  }
  if (isRpsc && hasAny(text, ['multi-post', 'multiple post', 'subject-wise', 'subject wise', 'department-wise', 'department wise', 'category breakup', 'category-wise', 'category wise'])) {
    return buildResult('recruitment_variable_heavy', 'Matched RPSC variable-heavy recruitment keywords.', 0.92);
  }
  if (isRpsc && hasAny(text, ['single recruitment', 'single exam', 'recruitment', 'vacancy', 'post'])) {
    return buildResult('recruitment_single_exam', 'Matched RPSC single recruitment/single exam keywords.', 0.86);
  }
  if (amendment) {
    return buildResult('amendment_notice', 'Matched generic amendment/correction document type.', 0.82);
  }
  if (resultNotice) {
    return buildResult('result_cutoff_answer_key_notice', 'Matched generic result/cutoff/answer key document type.', 0.82);
  }
  return buildResult('base_notification_only', 'No strong archetype signal found; using base notification schema only.', 0.55, true);
}

module.exports = {
  selectNotificationSchema,
};
