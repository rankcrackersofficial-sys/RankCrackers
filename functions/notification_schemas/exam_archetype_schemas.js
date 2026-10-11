const { field } = require('./base_notification_schema');

function section(name, label, fields) {
  return { name, label, fields };
}

const EXAM_ARCHETYPE_SCHEMAS = {
  entrance_exam_single: {
    archetype: 'entrance_exam_single',
    label: 'Entrance Exam - Single Exam',
    use_cases: ['JEE', 'NEET'],
    sections: [
      section('eligibility', 'Eligibility', [field('eligibility', 'Eligibility', 'structured_text', 'required')]),
      section('age_or_attempt_rules', 'Age / Attempt Rules', [field('age_or_attempt_rules', 'Age / Attempt Rules', 'structured_text', 'conditional')]),
      section('exam_mode', 'Exam Mode', [field('exam_mode', 'Exam Mode', 'string', 'required')]),
      section('subjects', 'Subjects', [field('subjects', 'Subjects', 'array', 'required')]),
      section('paper_pattern', 'Paper Pattern', [field('paper_pattern', 'Paper Pattern', 'structured_object', 'required')]),
      section('marking_scheme', 'Marking Scheme', [field('marking_scheme', 'Marking Scheme', 'structured_object', 'required')]),
      section('negative_marking', 'Negative Marking', [field('negative_marking', 'Negative Marking', 'string', 'conditional')]),
      section('application_fee', 'Application Fee', [field('application_fee', 'Application Fee', 'structured_object', 'conditional')]),
      section('reservation_rules', 'Reservation Rules', [field('reservation_rules', 'Reservation Rules', 'structured_text', 'conditional')]),
      section('counselling_relation', 'Counselling Relation', [field('counselling_relation', 'Counselling Relation', 'structured_text', 'conditional')]),
    ],
  },
  recruitment_single_exam: {
    archetype: 'recruitment_single_exam',
    label: 'Recruitment - Single Exam',
    use_cases: ['simple RPSC single recruitment'],
    sections: [
      section('post_name', 'Post Name', [field('post_name', 'Post Name', 'string', 'required')]),
      section('total_vacancies', 'Total Vacancies', [field('total_vacancies', 'Total Vacancies', 'number', 'conditional')]),
      section('qualification', 'Qualification', [field('qualification', 'Qualification', 'structured_text', 'required')]),
      section('age_limit', 'Age Limit', [field('age_limit', 'Age Limit', 'structured_object', 'conditional')]),
      section('age_relaxation', 'Age Relaxation', [field('age_relaxation', 'Age Relaxation', 'structured_object', 'conditional')]),
      section('selection_process', 'Selection Process', [field('selection_process', 'Selection Process', 'array', 'required')]),
      section('paper_pattern', 'Paper Pattern', [field('paper_pattern', 'Paper Pattern', 'structured_object', 'conditional')]),
      section('syllabus_reference', 'Syllabus Reference', [field('syllabus_reference', 'Syllabus Reference', 'structured_text', 'conditional')]),
      section('reservation_rules', 'Reservation Rules', [field('reservation_rules', 'Reservation Rules', 'structured_text', 'conditional')]),
    ],
  },
  recruitment_variable_heavy: {
    archetype: 'recruitment_variable_heavy',
    label: 'Recruitment - Variable Heavy',
    use_cases: ['RPSC multi-post', 'subject-wise recruitment', 'department-wise recruitment', 'category-wise breakup recruitment'],
    sections: [
      section('post_wise_vacancies', 'Post-wise Vacancies', [field('post_wise_vacancies', 'Post-wise Vacancies', 'array', 'conditional')]),
      section('subject_wise_posts', 'Subject-wise Posts', [field('subject_wise_posts', 'Subject-wise Posts', 'array', 'conditional')]),
      section('department_wise_posts', 'Department-wise Posts', [field('department_wise_posts', 'Department-wise Posts', 'array', 'conditional')]),
      section('category_wise_breakup', 'Category-wise Breakup', [field('category_wise_breakup', 'Category-wise Breakup', 'array', 'conditional')]),
      section('multiple_qualification_rules', 'Multiple Qualification Rules', [field('multiple_qualification_rules', 'Multiple Qualification Rules', 'array', 'conditional')]),
      section('multiple_paper_structures', 'Multiple Paper Structures', [field('multiple_paper_structures', 'Multiple Paper Structures', 'array', 'conditional')]),
      section('special_eligibility_conditions', 'Special Eligibility Conditions', [field('special_eligibility_conditions', 'Special Eligibility Conditions', 'array', 'conditional')]),
      section('pay_scale', 'Pay Scale', [field('pay_scale', 'Pay Scale', 'structured_text', 'conditional')]),
      section('service_rules', 'Service Rules', [field('service_rules', 'Service Rules', 'structured_text', 'conditional')]),
    ],
  },
  ssc_cgl_recruitment: {
    archetype: 'ssc_cgl_recruitment',
    label: 'SSC Combined Graduate Level Recruitment',
    use_cases: ['SSC CGL', 'Combined Graduate Level Examination'],
    sections: [
      section('recruitment_identity', 'Recruitment Identity', [
        field('notification_number', 'Notification Number', 'string', 'conditional'),
        field('notification_release_date', 'Notification Release Date', 'date', 'conditional'),
        field('recruitment_cycle', 'Recruitment Cycle', 'string', 'conditional'),
      ]),
      section('vacancy', 'Vacancy', [
        field('vacancy_status', 'Vacancy Status', 'enum', 'conditional'),
        field('total_vacancies', 'Tentative Total Vacancies', 'number', 'conditional'),
        field('post_wise_vacancies', 'Post-wise Vacancies', 'array', 'conditional'),
        field('vacancy_breakup_status', 'Post/category Breakup Status', 'string', 'conditional'),
      ]),
      section('post_eligibility', 'Post-specific Eligibility', [
        field('post_wise_age_limits', 'Post-wise Age Limits', 'array', 'conditional'),
        field('age_reference_date', 'Age Reference Date', 'date', 'conditional'),
        field('age_relaxation_rules', 'Age Relaxation Rules', 'array', 'conditional'),
        field('post_wise_educational_qualifications', 'Post-wise Educational Qualifications', 'array', 'conditional'),
        field('special_eligibility_conditions', 'Special Eligibility Conditions', 'array', 'conditional'),
        field('physical_medical_requirements', 'Physical / Medical Requirements', 'array', 'conditional'),
      ]),
      section('examination_scheme', 'Tier and Paper Scheme', [
        field('tier_scheme', 'Tier Scheme', 'array', 'conditional'),
        field('paper_eligibility_gates', 'Post-dependent Paper Eligibility', 'array', 'conditional'),
        field('sectional_timers', 'Sectional Timers', 'array', 'conditional'),
        field('negative_marking_rules', 'Negative Marking Rules', 'array', 'conditional'),
      ]),
      section('official_syllabus', 'Official Syllabus', [
        field('tier_i_syllabus', 'Tier-I Syllabus', 'structured_text', 'conditional'),
        field('tier_ii_paper_i_syllabus', 'Tier-II Paper-I Syllabus', 'structured_text', 'conditional'),
        field('tier_ii_paper_ii_statistics_syllabus', 'Tier-II Paper-II Statistics Syllabus', 'structured_text', 'conditional'),
        field('tier_ii_paper_iii_finance_economics_syllabus', 'Tier-II Paper-III Finance and Economics Syllabus', 'structured_text', 'conditional'),
        field('syllabus_status', 'Syllabus Status / Indicative Label', 'string', 'conditional'),
      ]),
      section('application_and_amendments', 'Application and Amendment Lineage', [
        field('application_windows', 'Application Windows', 'array', 'conditional'),
        field('correction_windows', 'Correction Windows', 'array', 'conditional'),
        field('amendment_lineage', 'Amendment Lineage', 'array', 'conditional'),
      ]),
    ],
  },
  amendment_notice: {
    archetype: 'amendment_notice',
    label: 'Amendment / Correction Notice',
    use_cases: ['amendment notice', 'correction notice'],
    sections: [
      section('parent_notification_id', 'Parent Notification ID', [field('parent_notification_id', 'Parent Notification ID', 'string', 'conditional')]),
      section('amendment_type', 'Amendment Type', [field('amendment_type', 'Amendment Type', 'string', 'required')]),
      section('amended_fields', 'Amended Fields', [field('amended_fields', 'Amended Fields', 'array', 'required')]),
      section('old_value', 'Old Value', [field('old_value', 'Old Value', 'structured_text', 'conditional')]),
      section('new_value', 'New Value', [field('new_value', 'New Value', 'structured_text', 'required')]),
      section('effective_date', 'Effective Date', [field('effective_date', 'Effective Date', 'date', 'conditional')]),
      section('source_pages', 'Source Pages', [field('source_pages', 'Source Pages', 'page_array', 'required')]),
    ],
  },
  result_cutoff_answer_key_notice: {
    archetype: 'result_cutoff_answer_key_notice',
    label: 'Result / Cutoff / Answer Key Notice',
    use_cases: ['result notice', 'cutoff notice', 'answer key notice'],
    sections: [
      section('result_date', 'Result Date', [field('result_date', 'Result Date', 'date', 'conditional')]),
      section('cutoff_details', 'Cutoff Details', [field('cutoff_details', 'Cutoff Details', 'array', 'conditional')]),
      section('answer_key_status', 'Answer Key Status', [field('answer_key_status', 'Answer Key Status', 'string', 'conditional')]),
      section('objection_window', 'Objection Window', [field('objection_window', 'Objection Window', 'structured_object', 'conditional')]),
      section('selected_candidates_info', 'Selected Candidates Info', [field('selected_candidates_info', 'Selected Candidates Info', 'structured_text', 'conditional')]),
      section('next_stage_info', 'Next Stage Info', [field('next_stage_info', 'Next Stage Info', 'structured_text', 'conditional')]),
    ],
  },
  base_notification_only: {
    archetype: 'base_notification_only',
    label: 'Base Notification Only',
    use_cases: ['unknown official notification'],
    sections: [],
    variable_packs_allowed: true,
  },
};

function getArchetypeFields(archetype) {
  const schema = EXAM_ARCHETYPE_SCHEMAS[archetype];
  if (!schema) return [];
  return schema.sections.flatMap(sectionItem => sectionItem.fields || []);
}

module.exports = {
  EXAM_ARCHETYPE_SCHEMAS,
  archetypeSchemas: EXAM_ARCHETYPE_SCHEMAS,
  getArchetypeFields,
};
