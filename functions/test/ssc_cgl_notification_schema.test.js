'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { selectNotificationSchema } = require('../notification_schemas/schema_selector');
const { getArchetypeFields } = require('../notification_schemas/exam_archetype_schemas');

test('SSC CGL official base notice selects the dedicated CGL schema', () => {
  const result = selectNotificationSchema({
    exam_name: 'Combined Graduate Level Examination, 2026',
    authority: 'Staff Selection Commission',
    document_type: 'recruitment_notification',
  });
  assert.equal(result.selected_archetype, 'ssc_cgl_recruitment');
  assert.equal(result.fallback_used, false);
  assert.equal(result.confidence, 0.98);

  const keys = new Set(getArchetypeFields('ssc_cgl_recruitment').map(field => field.field_key));
  for (const requiredKey of [
    'post_wise_age_limits',
    'age_reference_date',
    'post_wise_educational_qualifications',
    'tier_scheme',
    'paper_eligibility_gates',
    'tier_i_syllabus',
    'tier_ii_paper_ii_statistics_syllabus',
    'tier_ii_paper_iii_finance_economics_syllabus',
    'amendment_lineage',
  ]) assert.ok(keys.has(requiredKey), `missing CGL field: ${requiredKey}`);
});

test('SSC CGL amendment routes to amendment schema before base CGL schema', () => {
  const result = selectNotificationSchema({
    exam_name: 'Combined Graduate Level Examination, 2026',
    authority: 'Staff Selection Commission',
    document_type: 'corrigendum',
  });
  assert.equal(result.selected_archetype, 'amendment_notice');
  assert.equal(result.fallback_used, false);
});

test('unrelated unknown notice still fails closed to base fallback', () => {
  const result = selectNotificationSchema({
    exam_name: 'Unknown Board Examination',
    authority: 'Unknown Board',
    document_type: 'notification',
  });
  assert.equal(result.selected_archetype, 'base_notification_only');
  assert.equal(result.fallback_used, true);
});
