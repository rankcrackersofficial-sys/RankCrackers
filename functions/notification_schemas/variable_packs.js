const VARIABLE_ITEM_CONTRACT = {
  key: 'string',
  label: 'string',
  value: 'any',
  normalized_value: 'any',
  source_page_number: 'number',
  source_text_excerpt: 'string',
  confidence: 'number',
  founder_verification_status: 'pending | approved | edited | sent_back',
  notes: 'string',
  source_proof_required: true,
};

function pack(name, label) {
  return {
    pack_key: name,
    label,
    source_proof_required: true,
    item_contract: { ...VARIABLE_ITEM_CONTRACT },
  };
}

const VARIABLE_PACKS = {
  vacancy_variables: pack('vacancy_variables', 'Vacancy Variables'),
  eligibility_variables: pack('eligibility_variables', 'Eligibility Variables'),
  paper_variables: pack('paper_variables', 'Paper Variables'),
  category_variables: pack('category_variables', 'Category Variables'),
  subject_variables: pack('subject_variables', 'Subject Variables'),
  department_variables: pack('department_variables', 'Department Variables'),
  fee_variables: pack('fee_variables', 'Fee Variables'),
  date_variables: pack('date_variables', 'Date Variables'),
  relaxation_variables: pack('relaxation_variables', 'Relaxation Variables'),
  link_variables: pack('link_variables', 'Link Variables'),
  amendment_variables: pack('amendment_variables', 'Amendment Variables'),
};

function validateVariablePacks(packs = VARIABLE_PACKS) {
  const blockers = [];
  for (const [key, packValue] of Object.entries(packs)) {
    if (packValue.source_proof_required !== true) blockers.push(`${key} missing source_proof_required: true`);
    const contract = packValue.item_contract || {};
    for (const requiredKey of Object.keys(VARIABLE_ITEM_CONTRACT)) {
      if (!(requiredKey in contract)) blockers.push(`${key} item contract missing ${requiredKey}`);
    }
  }
  return blockers;
}

module.exports = {
  VARIABLE_ITEM_CONTRACT,
  VARIABLE_PACKS,
  validateVariablePacks,
};
