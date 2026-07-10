const { field } = require('./base_notification_schema');

function section(name, label, fields) {
  return { name, label, fields };
}

const archetypeSchemas = {
  base_notification_only: {
    archetype: 'base_notification_only',
    label: 'Base Notification Only',
    example_use: ['unknown official notification'],
    sections: [],
  },
  entrance_exam_single: {
    archetype: 'entrance_exam_single',
    label: 'Entrance Exam - Single Exam',
    example_use: ['JEE', 'NEET'],
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
    example_use: ['simple RPSC single exam'],
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
    example_use: ['RPSC multi-post', 'subject-wise recruitment', 'department-wise recruitment'],
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
  amendment_notice: {
    archetype: 'amendment_notice',
    label: 'Amendment / Correction Notice',
    example_use: ['amendment notice', 'correction notice'],
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
    example_use: ['result notice', 'cutoff notice', 'answer key notice'],
    sections: [
      section('result_date', 'Result Date', [field('result_date', 'Result Date', 'date', 'conditional')]),
      section('cutoff_details', 'Cutoff Details', [field('cutoff_details', 'Cutoff Details', 'array', 'conditional')]),
      section('answer_key_status', 'Answer Key Status', [field('answer_key_status', 'Answer Key Status', 'string', 'conditional')]),
      section('objection_window', 'Objection Window', [field('objection_window', 'Objection Window', 'structured_object', 'conditional')]),
      section('selected_candidates_info', 'Selected Candidates Info', [field('selected_candidates_info', 'Selected Candidates Info', 'structured_text', 'conditional')]),
      section('next_stage_info', 'Next Stage Info', [field('next_stage_info', 'Next Stage Info', 'structured_text', 'conditional')]),
    ],
  },
};

module.exports = { archetypeSchemas };
