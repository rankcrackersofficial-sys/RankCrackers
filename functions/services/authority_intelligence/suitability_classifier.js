/**
 * 🔱 PURE SUITABILITY CLASSIFICATION CONTRACT
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-R1-AG2-CANONICAL-REGION-ENDPOINT-AND-SUITABILITY-HARDENING-20260912
 *
 * Implements multi-factor conservative suitability evaluation:
 * Classes:
 *   - BROAD_ELIGIBILITY: Open degree / general competitive cohort (e.g. CGL, RAS, IAS, School Teacher)
 *   - MODERATE_SPECIALIZATION: Professional / technical degree cohort (e.g. Engineering, Law, Nursing, CA)
 *   - NICHE_SPECIALIST: Narrow vocational trade, rare craft, or non-academic administrative notice
 *
 * Decisions:
 *   - CREATE_CANDIDATE: Eligible for mission candidate creation (requires broad eligibility + recurring written exam,
 *     OR recognized professional degree with independently established high recurrence & high preparation value)
 *   - REVIEW: Default for technical/professional qualifications lacking scale evidence, or unknown eligibility
 *   - SKIP: Ineligible, non-academic noise, non-competitive selections, or rare trade certificates
 *
 * CONSTITUTIONAL LAW:
 * Zero arbitrary applicant-number thresholds. Evaluation is grounded in multi-factor
 * academic eligibility breadth, recurrence, participation scale, and preparation value.
 * Technical qualification alone NEVER automatically creates a mission candidate.
 */

'use strict';

const {
  SUITABILITY_CLASSES,
  SUITABILITY_DECISIONS,
  SUITABILITY_REASON_CODES,
  QUALIFICATION_BREADTH,
  QUALITATIVE_SCALE,
  deepFreeze,
} = require('./registry_schema');

// Known mappings from qualificationType strings to controlled QUALIFICATION_BREADTH
const BREADTH_MAPPING = {
  // Common school level
  'SECONDARY_10TH': QUALIFICATION_BREADTH.COMMON_SCHOOL_LEVEL,
  'SENIOR_SECONDARY_10_PLUS_2': QUALIFICATION_BREADTH.COMMON_SCHOOL_LEVEL,
  '10_PLUS_2': QUALIFICATION_BREADTH.COMMON_SCHOOL_LEVEL,
  '10TH': QUALIFICATION_BREADTH.COMMON_SCHOOL_LEVEL,
  '12TH': QUALIFICATION_BREADTH.COMMON_SCHOOL_LEVEL,

  // Common graduate
  'ANY_GRADUATE': QUALIFICATION_BREADTH.COMMON_GRADUATE,
  'GRADUATION_ANY_DISCIPLINE': QUALIFICATION_BREADTH.COMMON_GRADUATE,
  'BACHELORS_DEGREE': QUALIFICATION_BREADTH.COMMON_GRADUATE,
  'DEGREE_ANY_DISCIPLINE': QUALIFICATION_BREADTH.COMMON_GRADUATE,

  // Common post graduate
  'POST_GRADUATION_ANY_DISCIPLINE': QUALIFICATION_BREADTH.COMMON_POST_GRADUATE,
  'ANY_POST_GRADUATE': QUALIFICATION_BREADTH.COMMON_POST_GRADUATE,

  // Teacher qualifications
  'BACHELOR_OF_EDUCATION_COMMON': QUALIFICATION_BREADTH.COMMON_TEACHER_QUALIFICATION,
  'B_ED': QUALIFICATION_BREADTH.COMMON_TEACHER_QUALIFICATION,
  'D_EL_ED': QUALIFICATION_BREADTH.COMMON_TEACHER_QUALIFICATION,

  // Mainstream technical
  'ENGINEERING_DEGREE': QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL,
  'B_TECH': QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL,
  'BE': QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL,
  'POLYTECHNIC_DIPLOMA': QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL,
  'DIPLOMA_ENGINEERING': QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL,

  // Mainstream professional
  'LAW_LLB': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'LLB': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'COMMERCE_CA_CS': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'CA': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'NURSING_BSC': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'BSC_NURSING': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'PHARMACY_BPHARM': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,
  'MBBS': QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL,

  // Specialized / Advanced
  'PHD': QUALIFICATION_BREADTH.SPECIALIZED,
  'SPECIFIC_SUBJECT_POST_GRADUATE': QUALIFICATION_BREADTH.SPECIALIZED,

  // Rare specialist / Narrow trade
  'NARROW_VOCATIONAL_TRADE': QUALIFICATION_BREADTH.RARE_SPECIALIST,
  'SUPER_SPECIALITY_EXPERIENCE_ONLY': QUALIFICATION_BREADTH.RARE_SPECIALIST,
  'SINGLE_EQUIPMENT_OPERATOR': QUALIFICATION_BREADTH.RARE_SPECIALIST,
  'ARTISAN_CRAFT_CERTIFICATE': QUALIFICATION_BREADTH.RARE_SPECIALIST,
  'RARE_TRADE_CERTIFICATE': QUALIFICATION_BREADTH.RARE_SPECIALIST,
};

/**
 * Resolves the effective qualification breadth category.
 */
function resolveBreadth(inputBreadth, inputQualType) {
  if (inputBreadth && Object.values(QUALIFICATION_BREADTH).includes(inputBreadth)) {
    return inputBreadth;
  }
  const cleanType = String(inputQualType || '').toUpperCase().trim();
  if (BREADTH_MAPPING[cleanType]) {
    return BREADTH_MAPPING[cleanType];
  }
  return QUALIFICATION_BREADTH.UNKNOWN;
}

/**
 * Evaluates the mission suitability of an official recruitment or update.
 * Multi-factor evaluation:
 * - qualificationBreadth
 * - recruitmentRecurrence
 * - participationScale
 * - vacancyScale
 * - preparationValue
 * - writtenCompetitiveExamPresent
 * - specializationRarity
 */
function evaluateMissionSuitability(notice = {}) {
  // 1. Non-academic / Administrative noise filtering
  if (notice.isAdministrativeNotice === true || notice.isProcurementOrTender === true) {
    return deepFreeze({
      suitabilityClass: SUITABILITY_CLASSES.NICHE_SPECIALIST,
      decision: SUITABILITY_DECISIONS.SKIP,
      confidence: 1.0,
      reason: 'NON_ACADEMIC_ADMINISTRATIVE_NOTICE: Pure administrative or procurement circular; zero curriculum relevance.',
      reasons: [SUITABILITY_REASON_CODES.NON_ACADEMIC_ADMINISTRATIVE_NOTICE],
    });
  }

  // 2. Extract multi-factor dimensions
  const qualificationType = String(notice.qualificationType || '').toUpperCase().trim();
  const rawBreadth = String(notice.qualificationBreadth || '').toUpperCase().trim();
  const breadth = resolveBreadth(rawBreadth, qualificationType);
  const syllabusScope = String(notice.syllabusScope || '').toUpperCase().trim();
  const selectionMode = String(notice.selectionMode || '').toUpperCase().trim();

  // Determine written exam presence: explicit boolean or inferred from selectionMode
  let writtenExamPresent = true;
  if (notice.writtenCompetitiveExamPresent === false) {
    writtenExamPresent = false;
  } else if (selectionMode === 'DIRECT_PROMOTION' || selectionMode === 'INTERVIEW_ONLY_NO_WRITTEN') {
    writtenExamPresent = false;
  }

  // If selection involves NO competitive written exam -> strictly SKIP
  if (!writtenExamPresent) {
    return deepFreeze({
      suitabilityClass: SUITABILITY_CLASSES.NICHE_SPECIALIST,
      decision: SUITABILITY_DECISIONS.SKIP,
      confidence: 0.95,
      reason: 'NO_WRITTEN_COMPETITIVE_EXAM: Selection does not involve structured written competitive examination.',
      reasons: [SUITABILITY_REASON_CODES.NO_WRITTEN_COMPETITIVE_EXAM],
    });
  }

  // 3. Rare Specialist / Narrow Craft filtering
  const specializationRarity = String(notice.specializationRarity || '').toUpperCase().trim();
  if (
    breadth === QUALIFICATION_BREADTH.RARE_SPECIALIST ||
    specializationRarity === 'HIGH' ||
    syllabusScope === 'NARROW_TRADE_TASK'
  ) {
    return deepFreeze({
      suitabilityClass: SUITABILITY_CLASSES.NICHE_SPECIALIST,
      decision: SUITABILITY_DECISIONS.SKIP,
      confidence: 0.92,
      reason: 'RARE_QUALIFICATION: Hyper-narrow vocational trade or equipment operator credential outside canonical curriculum.',
      reasons: [SUITABILITY_REASON_CODES.RARE_QUALIFICATION],
    });
  }

  // 4. Unknown Eligibility Breadth -> strictly fails to REVIEW
  if (breadth === QUALIFICATION_BREADTH.UNKNOWN) {
    return deepFreeze({
      suitabilityClass: SUITABILITY_CLASSES.MODERATE_SPECIALIZATION,
      decision: SUITABILITY_DECISIONS.REVIEW,
      confidence: 0.60,
      reason: 'UNKNOWN_ELIGIBILITY: Qualification requirements not deterministically resolved; human review required.',
      reasons: [SUITABILITY_REASON_CODES.UNKNOWN_ELIGIBILITY],
    });
  }

  // 5. Broad Eligibility (Common School Level, Common Graduate, Teacher Qualification)
  const isBroadCategory =
    breadth === QUALIFICATION_BREADTH.COMMON_GRADUATE ||
    breadth === QUALIFICATION_BREADTH.COMMON_SCHOOL_LEVEL ||
    breadth === QUALIFICATION_BREADTH.COMMON_TEACHER_QUALIFICATION ||
    breadth === QUALIFICATION_BREADTH.COMMON_POST_GRADUATE ||
    syllabusScope === 'BROAD_CIVIL_OR_ACADEMIC';

  const recurrence = String(notice.recruitmentRecurrence || QUALITATIVE_SCALE.UNKNOWN).toUpperCase().trim();
  const participation = String(notice.participationScale || QUALITATIVE_SCALE.UNKNOWN).toUpperCase().trim();
  const vacancy = String(notice.vacancyScale || QUALITATIVE_SCALE.UNKNOWN).toUpperCase().trim();
  const preparation = String(notice.preparationValue || QUALITATIVE_SCALE.UNKNOWN).toUpperCase().trim();

  if (isBroadCategory) {
    // If explicitly low recurrence and low scale, send to review; otherwise broad competitive exam can create candidate
    if (recurrence === QUALITATIVE_SCALE.LOW && vacancy === QUALITATIVE_SCALE.LOW) {
      return deepFreeze({
        suitabilityClass: SUITABILITY_CLASSES.BROAD_ELIGIBILITY,
        decision: SUITABILITY_DECISIONS.REVIEW,
        confidence: 0.85,
        reason: 'BROAD_ELIGIBILITY_LOW_SCALE: Common qualification but minimal recurrence/vacancy scale; review recommended.',
        reasons: [
          SUITABILITY_REASON_CODES.COMMON_QUALIFICATION,
          SUITABILITY_REASON_CODES.INSUFFICIENT_SCALE_EVIDENCE,
        ],
      });
    }

    return deepFreeze({
      suitabilityClass: SUITABILITY_CLASSES.BROAD_ELIGIBILITY,
      decision: SUITABILITY_DECISIONS.CREATE_CANDIDATE,
      confidence: 0.98,
      reason: 'BROAD_ELIGIBILITY_MATCH: High academic breadth with standardized competitive written examination.',
      reasons: [
        SUITABILITY_REASON_CODES.COMMON_QUALIFICATION,
        SUITABILITY_REASON_CODES.RECURRING_MAJOR_EXAM,
        SUITABILITY_REASON_CODES.HIGH_PREPARATION_VALUE,
      ],
    });
  }

  // 6. Mainstream Technical, Mainstream Professional, & Specialized Qualifications
  // CONSERVATIVE LAW: Technical/professional qualifications alone do NOT auto-create.
  // They default to REVIEW unless independently established recurring major written exam & high preparation value.
  const isTechnicalOrProfessional =
    breadth === QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL ||
    breadth === QUALIFICATION_BREADTH.MAINSTREAM_PROFESSIONAL ||
    breadth === QUALIFICATION_BREADTH.SPECIALIZED ||
    syllabusScope === 'PROFESSIONAL_TECHNICAL_CURRICULUM';

  if (isTechnicalOrProfessional) {
    // Check if independent evidence satisfies the high recurrence & preparation bar (e.g. UPSC ESE or major state AE)
    const hasMajorScaleEvidence =
      (recurrence === QUALITATIVE_SCALE.HIGH || participation === QUALITATIVE_SCALE.HIGH) &&
      (preparation === QUALITATIVE_SCALE.HIGH || syllabusScope === 'PROFESSIONAL_TECHNICAL_CURRICULUM') &&
      breadth !== QUALIFICATION_BREADTH.SPECIALIZED; // PhD/specialized stays REVIEW

    if (hasMajorScaleEvidence && notice.hasEstablishedExamKey === true) {
      return deepFreeze({
        suitabilityClass: SUITABILITY_CLASSES.MODERATE_SPECIALIZATION,
        decision: SUITABILITY_DECISIONS.CREATE_CANDIDATE,
        confidence: 0.90,
        reason: 'MODERATE_SPECIALIZATION_ESTABLISHED_EXAM: Recognized professional qualification backed by recurring major exam and high preparation value.',
        reasons: [
          SUITABILITY_REASON_CODES.SPECIALIZED_QUALIFICATION,
          SUITABILITY_REASON_CODES.RECURRING_MAJOR_EXAM,
          SUITABILITY_REASON_CODES.HIGH_PREPARATION_VALUE,
        ],
      });
    }

    // Default for technical / professional qualifications without established recurring exam proof -> REVIEW
    return deepFreeze({
      suitabilityClass: SUITABILITY_CLASSES.MODERATE_SPECIALIZATION,
      decision: SUITABILITY_DECISIONS.REVIEW,
      confidence: 0.75,
      reason: 'SPECIALIZED_QUALIFICATION_NEEDS_REVIEW: Technical/professional degree requires independent scale/recurrence review.',
      reasons: [
        SUITABILITY_REASON_CODES.SPECIALIZED_QUALIFICATION,
        SUITABILITY_REASON_CODES.INSUFFICIENT_SCALE_EVIDENCE,
      ],
    });
  }

  // 7. Fallback Boundary Case -> REVIEW
  return deepFreeze({
    suitabilityClass: SUITABILITY_CLASSES.MODERATE_SPECIALIZATION,
    decision: SUITABILITY_DECISIONS.REVIEW,
    confidence: 0.60,
    reason: 'AMBIGUOUS_ELIGIBILITY_REQUIRES_REVIEW: Qualification requirements not deterministically resolved; human review required.',
    reasons: [SUITABILITY_REASON_CODES.UNKNOWN_ELIGIBILITY],
  });
}

module.exports = {
  BREADTH_MAPPING,
  resolveBreadth,
  evaluateMissionSuitability,
};
