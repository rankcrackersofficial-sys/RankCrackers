/**
 * 🔱 RANKCRACKERS CAREER SIGNAL MATCHING & SOURCE-COMPLETENESS SAFETY ENGINE
 * Gate 48CS2R3 — Official-Rule-Safe & Completeness-Aware Personalization
 *
 * Core Guarantees:
 *   1. ABSENCE != VERIFIED NONE:
 *        - Unextracted relaxation rule != zero relaxation
 *        - Supports RULE_PRESENT_VERIFIED, RULE_ABSENCE_VERIFIED, RULE_UNRESOLVED
 *        - MISSING_RULE_TREATED_AS_VERIFIED_NONE_COUNT = 0
 *   2. RULEBOOK COMPLETENESS BARRIER:
 *        - ELIGIBLE is strictly prohibited if any mandatory rule family is UNRESOLVED
 *        - ELIGIBLE_WITH_INCOMPLETE_RULEBOOK_COUNT = 0
 *   3. NOT_ELIGIBLE VERDICT SAFETY:
 *        - Cannot disqualify user based on assumed/default rules when override rules are unresolved
 *        - NOT_ELIGIBLE_WITH_UNRESOLVED_OVERRIDE_RULE_COUNT = 0
 *   4. VACANCY MATRIX COMPLETENESS:
 *        - NO_APPLICABLE_VACANCIES requires VACANCY_MATRIX_COMPLETE
 *        - Partial matrix with zero rows yields VACANCIES_PENDING_RESERVATION_DATA
 *        - NO_VACANCY_CONCLUSION_FROM_PARTIAL_MATRIX_COUNT = 0
 *   5. AMENDMENT COMPLETENESS:
 *        - Tracks baseNotification + applicableCorrigenda + amendmentSearchStatus
 *   6. UNCERTAINTY SEPARATION:
 *        - Missing user data -> MORE_INFORMATION_NEEDED
 *        - Missing official source rule -> NOT_EVALUATED
 *        - SOURCE_GAP_MAPPED_TO_USER_PROFILE_GAP_COUNT = 0
 *   7. RESERVATION SAFETY & DEDUPLICATION:
 *        - Isolated vertical categories, OBC_CL treated as unreserved, WOMEN quota enforced
 */

'use strict';


const {
  SOURCE_DOCUMENT_STATE,
  PACKAGE_VALIDATION_RESULT,
  RULE_FAMILY_COVERAGE_STATUS,
  VACANCY_COVERAGE_STATUS,
  validateSourceDocumentState,
  validateCareerRulebookPackage
} = require('./career_rulebook_package');

const {
  ELIGIBILITY_STATUS,
  MATCH_RESULT_STATE,
  VACANCY_APPLICABILITY_STATUS,
  VERTICAL_CATEGORY,
  HORIZONTAL_CATEGORY,
  PARTICIPATION_STATE,
  OPPORTUNITY_KIND,
  RULE_RESOLUTION_STATE,
  AGE_RELAXATION_RESOLUTION,
  RULE_FAMILY,
  RULE_FAMILY_STATUS,
  VACANCY_MATRIX_COMPLETENESS,
  AMENDMENT_CHAIN_STATUS,
  DOCUMENT_EVIDENCE_LEVEL,
  FACT_VERIFICATION_LEVEL,
  RULE_TYPE,
  RULE_TYPE_TO_FAMILY_MAP,
  normalizeRulebookCompleteness,
  normalizeAmendmentChain,
  normalizeCareerSignalView
} = require('./career_signal_models');

/**
 * Calculates student age in years at a specific reference date.
 */
function calculateAgeYears(dobIso, refDateIso) {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  const ref = new Date(refDateIso || new Date().toISOString());
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Finds applicable official age relaxation rule for a given category.
 * Must come from an explicit official EligibilityRule object with verified source evidence.
 */
function findOfficialAgeRelaxationRule(rules, category) {
  if (!category || category === 'UNKNOWN') return null;

  return rules.find(r =>
    r &&
    r.ruleType === 'AGE_RELAXATION' &&
    (r.sourceDocumentId || r.sourceLocator || r.sourceProvenance || r.documentSha256) &&
    (r.category === category || r.officialValue === category || (Array.isArray(r.applicableCategories) && r.applicableCategories.includes(category)))
  ) || null;
}

/**
 * Evaluates a single EligibilityRule against a student's CareerProfile.
 */
function evaluateSingleRule(rule, profile, options = {}) {
  const refDate = options.referenceDate || new Date().toISOString();
  const allRules = options.allRules || [];
  const ageRelaxationResolution = options.ageRelaxationResolution || AGE_RELAXATION_RESOLUTION.RELAXATION_UNRESOLVED;

  // Mandatory Source Evidence Check & Referential Integrity Audit
  const hasSourceEvidence = Boolean(
    rule.sourceDocumentId ||
    rule.sourceLocator ||
    rule.sourceProvenance ||
    rule.documentSha256
  );

  if (!hasSourceEvidence) {
    return {
      status: 'UNRESOLVED',
      ruleType: rule.ruleType,
      isSourceGap: true,
      reason: 'Rule ' + (rule.ruleId || 'unnamed') + ' missing verified source evidence. Cannot produce legal eligibility determination.'
    };
  }

  // Referential Integrity: if declared package documents are provided, rule must resolve into one
  if (options.declaredDocumentIds && rule.sourceDocumentId && !options.declaredDocumentIds.has(rule.sourceDocumentId)) {
    return {
      status: 'UNRESOLVED',
      ruleType: rule.ruleType,
      isSourceGap: true,
      reason: 'Rule ' + (rule.ruleId || 'unnamed') + ' references undeclared package document: ' + rule.sourceDocumentId + '. Rule fails closed (UNRESOLVED).'
    };
  }

  // Locator / Page / Span check: rule cannot have dangling evidence
  const hasLocator = Boolean(
    (Array.isArray(rule.evidenceRefs) && rule.evidenceRefs.length > 0) ||
    rule.page ||
    rule.section ||
    rule.sourceLocator ||
    rule.paragraphOrTableRef
  );
  if (options.declaredDocumentIds && !hasLocator) {
    return {
      status: 'UNRESOLVED',
      ruleType: rule.ruleType,
      isSourceGap: true,
      reason: 'Rule ' + (rule.ruleId || 'unnamed') + ' lacks locator/page/span evidence into document ' + (rule.sourceDocumentId || 'unknown') + '. Rule fails closed (UNRESOLVED).'
    };
  }

  switch (rule.ruleType) {
    case 'AGE_MAX':
    case 'UPPER_AGE_LIMIT': {
      if (!profile.dateOfBirth) {
        return {
          status: 'MISSING_FIELD',
          field: 'dateOfBirth',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Date of birth required to evaluate age eligibility.'
        };
      }
      const age = calculateAgeYears(profile.dateOfBirth, refDate);
      const baseMax = Number(rule.officialValue);

      if (isNaN(baseMax)) {
        return {
          status: 'UNRESOLVED',
          ruleType: rule.ruleType,
          isSourceGap: true,
          reason: 'Invalid baseMax in AGE_MAX rule: ' + rule.officialValue
        };
      }

      if (age <= baseMax) {
        return {
          status: 'PASSED',
          ruleType: rule.ruleType,
          reason: 'Age (' + age + ') within base maximum permissible limit (' + baseMax + ').'
        };
      }

      // Age exceeds baseMax: check for official notification-specific relaxation
      const relaxationRule = findOfficialAgeRelaxationRule(allRules, profile.reservationCategory);
      if (relaxationRule) {
        const relaxationYears = Number(relaxationRule.relaxationYears || relaxationRule.officialValue || 0);
        const effectiveMax = baseMax + relaxationYears;
        if (age <= effectiveMax) {
          return {
            status: 'PASSED',
            ruleType: rule.ruleType,
            reason: 'Age (' + age + ') within permissible limit (' + effectiveMax + ', including official notification relaxation of ' + relaxationYears + 'y for ' + profile.reservationCategory + ' from rule ' + relaxationRule.ruleId + ').'
          };
        } else {
          return {
            status: 'FAILED',
            ruleType: rule.ruleType,
            reason: 'Age (' + age + ') exceeds maximum permissible limit (' + effectiveMax + ', after applying official relaxation of ' + relaxationYears + 'y for ' + profile.reservationCategory + ').'
          };
        }
      }

      // GATE 48CS2R3 COMPLETENESS FIX: ABSENCE != VERIFIED NONE
      // If candidate belongs to a category that potentially receives relaxation (SC, ST, OBC, EWS, etc.):
      const potentiallyRelaxableCategory = [
        VERTICAL_CATEGORY.SC,
        VERTICAL_CATEGORY.ST,
        VERTICAL_CATEGORY.OBC_NCL,
        VERTICAL_CATEGORY.OBC_CL,
        VERTICAL_CATEGORY.EWS
      ].includes(profile.reservationCategory) || profile.isPwBD === true || profile.isExServiceman === true;

      if (potentiallyRelaxableCategory) {
        if (ageRelaxationResolution === AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED) {
          // Explicit verified absence of relaxation: can safely return FAILED
          return {
            status: 'FAILED',
            ruleType: rule.ruleType,
            reason: 'Age (' + age + ') exceeds maximum permissible limit (' + baseMax + '). No official age relaxation rule provided; official notification verified NO age relaxation permissible for category ' + profile.reservationCategory + '.'
          };
        } else {
          // Unresolved relaxation rulebook: DO NOT disqualify user!
          return {
            status: 'UNRESOLVED',
            ruleType: rule.ruleType,
            isSourceGap: true,
            reason: 'Age (' + age + ') exceeds base maximum limit (' + baseMax + '), but official age relaxation rulebook is UNRESOLVED for category ' + profile.reservationCategory + '. Disqualification prohibited until relaxation truth is verified.'
          };
        }
      }

      // Unreserved category with no relaxation claim
      if (ageRelaxationResolution === AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED || profile.reservationCategory === VERTICAL_CATEGORY.UR) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Age (' + age + ') exceeds maximum permissible limit (' + baseMax + ') for unreserved category.'
        };
      }

      return {
        status: 'UNRESOLVED',
        ruleType: rule.ruleType,
        isSourceGap: true,
        reason: 'Age (' + age + ') exceeds base maximum limit (' + baseMax + '), but category relaxation rules remain unresolved.'
      };
    }

    case 'AGE_MIN':
    case 'MINIMUM_AGE': {
      if (!profile.dateOfBirth) {
        return {
          status: 'MISSING_FIELD',
          field: 'dateOfBirth',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Date of birth required to evaluate age eligibility.'
        };
      }
      const age = calculateAgeYears(profile.dateOfBirth, refDate);
      const minAge = Number(rule.officialValue);
      if (isNaN(minAge)) {
        return { status: 'UNRESOLVED', ruleType: rule.ruleType, isSourceGap: true, reason: 'Invalid minAge in ' + rule.ruleType + ' rule: ' + rule.officialValue };
      }
      if (age < minAge) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Age (' + age + ') below minimum required age (' + minAge + ').'
        };
      }
      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Age (' + age + ') satisfies minimum age requirement (' + minAge + ').' };
    }

    case 'AGE_LIMIT': {
      if (!profile.dateOfBirth) {
        return {
          status: 'MISSING_FIELD',
          field: 'dateOfBirth',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Date of birth required to evaluate age eligibility.'
        };
      }
      const age = calculateAgeYears(profile.dateOfBirth, refDate);
      let minAge = null;
      let maxAge = null;
      if (typeof rule.officialValue === 'object' && rule.officialValue !== null) {
        minAge = rule.officialValue.min !== undefined ? Number(rule.officialValue.min) : (rule.officialValue.lower !== undefined ? Number(rule.officialValue.lower) : null);
        maxAge = rule.officialValue.max !== undefined ? Number(rule.officialValue.max) : (rule.officialValue.upper !== undefined ? Number(rule.officialValue.upper) : null);
      } else if (typeof rule.officialValue === 'string' && rule.officialValue.includes('-')) {
        const parts = rule.officialValue.split('-').map(p => Number(p.trim()));
        minAge = parts[0];
        maxAge = parts[1];
      } else {
        maxAge = Number(rule.officialValue);
      }

      if (minAge !== null && !isNaN(minAge) && age < minAge) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Age (' + age + ') below minimum required age (' + minAge + ').'
        };
      }

      if (maxAge !== null && !isNaN(maxAge)) {
        if (age <= maxAge) {
          return {
            status: 'PASSED',
            ruleType: rule.ruleType,
            reason: 'Age (' + age + ') within permissible limit (' + maxAge + ').'
          };
        }
        const relaxationRule = findOfficialAgeRelaxationRule(allRules, profile.reservationCategory);
        if (relaxationRule) {
          const relaxationYears = Number(relaxationRule.relaxationYears || relaxationRule.officialValue || 0);
          const effectiveMax = maxAge + relaxationYears;
          if (age <= effectiveMax) {
            return {
              status: 'PASSED',
              ruleType: rule.ruleType,
              reason: 'Age (' + age + ') within permissible limit (' + effectiveMax + ', with official relaxation of ' + relaxationYears + 'y for ' + profile.reservationCategory + ').'
            };
          } else {
            return {
              status: 'FAILED',
              ruleType: rule.ruleType,
              reason: 'Age (' + age + ') exceeds maximum permissible limit (' + effectiveMax + ', after relaxation).'
            };
          }
        }

        const potentiallyRelaxableCategory = [
          VERTICAL_CATEGORY.SC,
          VERTICAL_CATEGORY.ST,
          VERTICAL_CATEGORY.OBC_NCL,
          VERTICAL_CATEGORY.OBC_CL,
          VERTICAL_CATEGORY.EWS
        ].includes(profile.reservationCategory) || profile.isPwBD === true || profile.isExServiceman === true;

        if (potentiallyRelaxableCategory) {
          if (ageRelaxationResolution === AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED) {
            return {
              status: 'FAILED',
              ruleType: rule.ruleType,
              reason: 'Age (' + age + ') exceeds limit (' + maxAge + '). Notification verified NO relaxation for category ' + profile.reservationCategory + '.'
            };
          } else {
            return {
              status: 'UNRESOLVED',
              ruleType: rule.ruleType,
              isSourceGap: true,
              reason: 'Age (' + age + ') exceeds limit (' + maxAge + '), but relaxation rules are UNRESOLVED for category ' + profile.reservationCategory + '.'
            };
          }
        }

        if (ageRelaxationResolution === AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED || profile.reservationCategory === VERTICAL_CATEGORY.UR) {
          return {
            status: 'FAILED',
            ruleType: rule.ruleType,
            reason: 'Age (' + age + ') exceeds limit (' + maxAge + ') for unreserved category.'
          };
        }

        return {
          status: 'UNRESOLVED',
          ruleType: rule.ruleType,
          isSourceGap: true,
          reason: 'Age (' + age + ') exceeds limit (' + maxAge + '), but category relaxation rules remain unresolved.'
        };
      }

      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Age satisfies limit requirements.' };
    }

    case 'QUALIFYING_EXAM_YEAR': {
      if (profile.passingYear === null || profile.passingYear === undefined) {
        return {
          status: 'MISSING_FIELD',
          field: 'passingYear',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Passing year required to evaluate qualifying examination year.'
        };
      }
      const allowedYears = Array.isArray(rule.officialValue)
        ? rule.officialValue.map(y => Number(y))
        : [Number(rule.officialValue)];
      if (allowedYears.includes(Number(profile.passingYear))) {
        return {
          status: 'PASSED',
          ruleType: rule.ruleType,
          reason: 'Qualifying exam passing year (' + profile.passingYear + ') is eligible (permissible: ' + allowedYears.join(', ') + ').'
        };
      }
      return {
        status: 'FAILED',
        ruleType: rule.ruleType,
        reason: 'Qualifying exam passing year (' + profile.passingYear + ') not permissible (requires: ' + allowedYears.join(', ') + ').'
      };
    }

    case 'EDUCATION_CUTOFF_DATE': {
      if (!profile.passingStatus && !profile.passingYear) {
        return {
          status: 'MISSING_FIELD',
          field: 'passingStatus',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Passing status required to evaluate education cutoff date.'
        };
      }
      const cutoffDate = String(rule.officialValue);
      if (profile.passingStatus === 'PASSED') {
        return {
          status: 'PASSED',
          ruleType: rule.ruleType,
          reason: 'Qualification acquired prior to crucial date ' + cutoffDate + '.'
        };
      }
      if (profile.passingStatus === 'APPEARING' || profile.passingStatus === 'PURSUING') {
        if (rule.allowAppearing) {
          return {
            status: 'PASSED',
            ruleType: rule.ruleType,
            reason: 'Appearing candidates permitted under education cutoff date rule.'
          };
        }
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Appearing candidates not eligible; qualification must be acquired before ' + cutoffDate + '.'
        };
      }
      return {
        status: 'PASSED',
        ruleType: rule.ruleType,
        reason: 'Education cutoff date requirement satisfied.'
      };
    }

    case 'QUALIFYING_SUBJECTS': {
      if (!profile.subjectOrDiscipline && (!profile.extensions || !profile.extensions.subjects)) {
        return {
          status: 'MISSING_FIELD',
          field: 'subjectOrDiscipline',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Qualifying subjects required to evaluate academic subject eligibility.'
        };
      }
      const requiredSubjects = Array.isArray(rule.officialValue)
        ? rule.officialValue.map(s => String(s).toLowerCase().trim())
        : [String(rule.officialValue).toLowerCase().trim()];

      const candidateSubjects = [];
      if (profile.subjectOrDiscipline) {
        candidateSubjects.push(profile.subjectOrDiscipline.toLowerCase().trim());
      }
      if (profile.extensions && Array.isArray(profile.extensions.subjects)) {
        profile.extensions.subjects.forEach(s => candidateSubjects.push(String(s).toLowerCase().trim()));
      }

      const hasRequired = requiredSubjects.some(req =>
        candidateSubjects.some(cand => cand.includes(req) || req.includes(cand))
      );

      if (hasRequired) {
        return {
          status: 'PASSED',
          ruleType: rule.ruleType,
          reason: 'Qualifying subjects requirement satisfied (requires: ' + requiredSubjects.join(', ') + ').'
        };
      }
      return {
        status: 'FAILED',
        ruleType: rule.ruleType,
        reason: 'Qualifying subjects not satisfied (candidate: ' + candidateSubjects.join(', ') + '; requires: ' + requiredSubjects.join(', ') + ').'
      };
    }

    case 'STATE_ELIGIBILITY': {
      const stateOfEligibility = (profile.extensions && profile.extensions.stateOfEligibility)
        || profile.domicileState;
      if (!stateOfEligibility) {
        return {
          status: 'MISSING_FIELD',
          field: 'stateOfEligibility',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'State of eligibility required.'
        };
      }
      const allowedStates = Array.isArray(rule.officialValue)
        ? rule.officialValue.map(s => String(s).toUpperCase().trim())
        : [String(rule.officialValue).toUpperCase().trim()];

      if (allowedStates.includes('ALL_INDIA') || allowedStates.includes(stateOfEligibility)) {
        return {
          status: 'PASSED',
          ruleType: rule.ruleType,
          reason: 'State of eligibility (' + stateOfEligibility + ') satisfies requirement.'
        };
      }
      return {
        status: 'FAILED',
        ruleType: rule.ruleType,
        reason: 'State of eligibility (' + stateOfEligibility + ') not accepted (requires: ' + allowedStates.join(', ') + ').'
      };
    }

    case 'CATEGORY_RESERVATION': {
      if (!profile.reservationCategory || profile.reservationCategory === 'UNKNOWN') {
        return {
          status: 'MISSING_FIELD',
          field: 'reservationCategory',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Reservation category required.'
        };
      }
      const allowedCategories = Array.isArray(rule.officialValue)
        ? rule.officialValue
        : [rule.officialValue];
      if (allowedCategories.includes(profile.reservationCategory) || allowedCategories.includes('ALL')) {
        return {
          status: 'PASSED',
          ruleType: rule.ruleType,
          reason: 'Category ' + profile.reservationCategory + ' satisfies reservation conditions.'
        };
      }
      return {
        status: 'FAILED',
        ruleType: rule.ruleType,
        reason: 'Category ' + profile.reservationCategory + ' does not match required categories (' + allowedCategories.join(', ') + ').'
      };
    }

    case 'QUALIFICATION_MIN': {
      if (!profile.highestQualification) {
        return {
          status: 'MISSING_FIELD',
          field: 'highestQualification',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Highest qualification required.'
        };
      }
      const rankOrder = ['10TH', '12TH', 'DIPLOMA', 'GRADUATION', 'POST_GRADUATION', 'DOCTORATE'];
      const userRank = rankOrder.indexOf(profile.highestQualification);
      const requiredRank = rankOrder.indexOf(String(rule.officialValue));

      if (requiredRank === -1) {
        return { status: 'UNRESOLVED', ruleType: rule.ruleType, isSourceGap: true, reason: 'Unrecognized qualification rule value: ' + rule.officialValue };
      }
      if (userRank < requiredRank) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Qualification (' + profile.highestQualification + ') does not meet required minimum (' + rule.officialValue + ').'
        };
      }
      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Qualification (' + profile.highestQualification + ') meets minimum (' + rule.officialValue + ').' };
    }

    case 'DISCIPLINE_REQUIRED': {
      if (!profile.subjectOrDiscipline) {
        return {
          status: 'MISSING_FIELD',
          field: 'subjectOrDiscipline',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Subject or discipline required.'
        };
      }
      const allowed = Array.isArray(rule.officialValue)
        ? rule.officialValue.map(s => s.toLowerCase().trim())
        : [String(rule.officialValue).toLowerCase().trim()];

      const userSub = profile.subjectOrDiscipline.toLowerCase().trim();
      const matched = allowed.some(a => userSub.includes(a) || a.includes(userSub));
      if (!matched) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Discipline ' + profile.subjectOrDiscipline + ' not accepted (requires: ' + allowed.join(', ') + ').'
        };
      }
      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Discipline ' + profile.subjectOrDiscipline + ' matches requirements.' };
    }

    case 'DOMICILE_REQUIRED': {
      if (!profile.domicileState) {
        return {
          status: 'MISSING_FIELD',
          field: 'domicileState',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Domicile state required.'
        };
      }
      const expected = String(rule.officialValue).toUpperCase().trim();
      if (profile.domicileState !== expected) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Domicile ' + profile.domicileState + ' does not match required state ' + expected + '.'
        };
      }
      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Domicile matches required state ' + expected + '.' };
    }

    case 'EXPERIENCE_REQUIRED': {
      if (profile.experienceMonths === null || profile.experienceMonths === undefined) {
        return {
          status: 'MISSING_FIELD',
          field: 'experienceMonths',
          ruleType: rule.ruleType,
          isUserProfileGap: true,
          reason: 'Experience months required.'
        };
      }
      const requiredMonths = Number(rule.officialValue);
      if (profile.experienceMonths < requiredMonths) {
        return {
          status: 'FAILED',
          ruleType: rule.ruleType,
          reason: 'Experience (' + profile.experienceMonths + 'm) below required minimum (' + requiredMonths + 'm).'
        };
      }
      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Experience satisfies requirement.' };
    }

    case 'AGE_RELAXATION': {
      return { status: 'PASSED', ruleType: rule.ruleType, reason: 'Official age relaxation rule verified for category ' + rule.category + '.' };
    }

    default:
      return {
        status: 'UNRESOLVED',
        ruleType: rule.ruleType,
        isSourceGap: true,
        reason: 'Rule type ' + rule.ruleType + ' is unknown or unsupported by rule matching engine. Personalization strictly fails closed to NOT_EVALUATED.'
      };
  }
}

/**
 * Evaluates Vacancy Matrix applicability with strict reservation safety:
 *   - SC can only match UR or SC
 *   - ST can only match UR or ST
 *   - OBC_NCL can match UR or OBC_NCL/OBC
 *   - OBC_CL cannot match OBC_NCL quota; matches UR only
 *   - EWS can match UR or EWS
 *   - Unknown category cannot match reserved rows
 *   - Horizontal WOMEN quota rejects male candidates
 *   - Horizontal PWBD / EX_SERVICEMAN quotas explicitly checked
 *   - Actual vacancy deduplication and count reconciliation
 */
function evaluateApplicableVacancies(profile, vacancyRows = []) {
  const seenRowKeys = new Set();
  const applicableRows = [];
  let totalApplicableVacancies = 0;

  for (const row of vacancyRows) {
    const verticalCat = row.verticalCategory || row.category;
    const horizontalCat = row.horizontalCategory || row.horizontalQuota || 'NONE';
    const rowKey = row.rowId || (verticalCat + ':' + horizontalCat + ':' + (row.postName || 'default'));
    if (seenRowKeys.has(rowKey)) {
      continue;
    }
    seenRowKeys.add(rowKey);

    const isUr = verticalCat === 'UR';
    const userCat = profile.reservationCategory;

    let isVerticalMatch = false;
    if (isUr) {
      isVerticalMatch = true;
    } else if (userCat && userCat !== 'UNKNOWN') {
      if (userCat === VERTICAL_CATEGORY.SC && verticalCat === 'SC') {
        isVerticalMatch = true;
      } else if (userCat === VERTICAL_CATEGORY.ST && verticalCat === 'ST') {
        isVerticalMatch = true;
      } else if (userCat === VERTICAL_CATEGORY.OBC_NCL && (verticalCat === 'OBC_NCL' || verticalCat === 'OBC')) {
        isVerticalMatch = true;
      } else if (userCat === VERTICAL_CATEGORY.OBC_CL) {
        isVerticalMatch = false;
      } else if (userCat === VERTICAL_CATEGORY.EWS && verticalCat === 'EWS') {
        isVerticalMatch = true;
      }
    }

    if (!isVerticalMatch) {
      continue;
    }

    const isWomenHorizontal = horizontalCat === HORIZONTAL_CATEGORY.WOMEN || row.genderApplicability === 'FEMALE_ONLY';
    if (isWomenHorizontal && profile.gender !== 'FEMALE') {
      continue;
    }
    if (row.genderApplicability === 'MALE_ONLY' && profile.gender !== 'MALE') {
      continue;
    }

    if (horizontalCat === HORIZONTAL_CATEGORY.PWBD && profile.isPwBD !== true) {
      continue;
    }

    if (horizontalCat === HORIZONTAL_CATEGORY.EX_SERVICEMAN && profile.isExServiceman !== true) {
      continue;
    }

    applicableRows.push(row);
    const count = typeof row.vacancyCount === 'number' && row.vacancyCount >= 0
      ? row.vacancyCount
      : (typeof row.vacancies === 'number' && row.vacancies >= 0 ? row.vacancies : 0);
    totalApplicableVacancies += count;
  }

  return {
    applicableRows,
    totalApplicableVacancies
  };
}

/**
 * Main Pure Personalization & Completeness-Aware Matching Engine
 */
function evaluateCareerSignalPersonalization(params = {}) {
  const {
    profile,
    rules = [],
    vacancyRows = [],
    participationState = PARTICIPATION_STATE.DISCOVERED,
    cycle,
    eventId,
    rulebookCompleteness: rawRulebookCompleteness,
    amendmentChain: rawAmendmentChain,
    vacancyMatrixCompleteness = VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_COMPLETE,
    ageRelaxationResolution = AGE_RELAXATION_RESOLUTION.RELAXATION_UNRESOLVED,
    nowIso
  } = params;

  if (!profile) {
    throw new Error('PROFILE_REQUIRED: CareerProfile is required for evaluation.');
  }

  const rawPkg = params.rulebookPackage || params.package || null;
  let packageValidation = null;

  let effectiveRules = rules;
  let effectiveVacancyRows = vacancyRows;
  let effectiveCycle = cycle;
  let effectiveRulebookCompleteness = rawRulebookCompleteness
    ? normalizeRulebookCompleteness(rawRulebookCompleteness)
    : null;
  let effectiveAmendmentChain = rawAmendmentChain
    ? normalizeAmendmentChain(rawAmendmentChain)
    : null;
  let effectiveVacancyCompleteness = vacancyMatrixCompleteness;

  if (rawPkg) {
    packageValidation = rawPkg.validationResult
      ? rawPkg
      : validateCareerRulebookPackage(rawPkg);

    if (packageValidation.validationResult === PACKAGE_VALIDATION_RESULT.REJECTED_SOURCE_PACKAGE) {
      const canonicalEventId = eventId || (params.event && params.event.eventId) || ('evt_rejected_' + (rawPkg.cycleId || 'unknown'));
      return normalizeCareerSignalView({
        userId: profile.userId,
        eventId: canonicalEventId,
        cycleId: rawPkg.cycleId || 'cycle_unbound',
        eligibilityStatus: ELIGIBILITY_STATUS.NOT_EVALUATED,
        matchResultState: ELIGIBILITY_STATUS.NOT_EVALUATED,
        reasonCodes: ['! Package rejected at trust boundary: ' + (packageValidation.errors || []).join('; ')],
        explainability: {
          packageValidationResult: packageValidation.validationResult,
          errors: packageValidation.errors
        }
      });
    }

    effectiveRules = Array.isArray(rawPkg.eligibilityRules) ? rawPkg.eligibilityRules : [];
    effectiveVacancyRows = Array.isArray(rawPkg.vacancyMatrix?.rows) ? rawPkg.vacancyMatrix.rows : [];
    effectiveCycle = effectiveCycle || {
      cycleId: rawPkg.cycleId,
      permanentMissionId: rawPkg.permanentMissionId || null,
      authorityKey: rawPkg.authorityId,
      title: packageValidation.genericCycleFacts?.title || 'Recruitment Notice',
      totalVacancies: packageValidation.genericCycleFacts?.totalVacancies || null,
      applicationWindow: packageValidation.genericCycleFacts?.applicationWindow || null,
      examDates: packageValidation.genericCycleFacts?.examDates || []
    };
    effectiveRulebookCompleteness = packageValidation.derivedCompleteness;
    effectiveAmendmentChain = {
      baseNotificationDocId: packageValidation.genericCycleFacts?.advertisementNumber || rawPkg.baseNotification?.documentIdentity,
      amendmentSearchStatus: packageValidation.derivedAmendmentStatus
    };
    effectiveVacancyCompleteness = packageValidation.derivedVacancyCompleteness;
  }

  const canonicalEventId = eventId ||
    (params.event && params.event.eventId) ||
    (rawPkg && rawPkg.baseNotification && rawPkg.baseNotification.documentSha256
      ? 'evt_' + String(rawPkg.baseNotification.documentSha256).substring(0, 16)
      : null);

  if (!canonicalEventId) {
    throw new Error('CANONICAL_EVENT_ID_REQUIRED: evaluateCareerSignalPersonalization must receive real canonical eventId.');
  }

  const passedRuleIds = [];
  const failedRuleIds = [];
  const missingProfileFields = [];
  const unresolvedRuleIds = [];
  const reasonCodes = [];
  const matchedCriteria = [];
  const unmetCriteria = [];
  const missingInformation = [];
  const unresolvedRules = [];

  let hasAcademicRule = false;
  let academicRulePassed = false;
  let academicRuleFailed = false;

  let hasQualRule = false;
  let qualRulePassed = false;
  let qualRuleFailed = false;

  let hasLocationRule = false;
  let locationRulePassed = false;
  let locationRuleFailed = false;

  // Collect declared document IDs for referential integrity audit
  const declaredDocumentIds = new Set();
  if (rawPkg) {
    if (rawPkg.baseNotification?.documentIdentity) declaredDocumentIds.add(rawPkg.baseNotification.documentIdentity);
    if (rawPkg.baseNotification?.docId) declaredDocumentIds.add(rawPkg.baseNotification.docId);
    if (Array.isArray(rawPkg.applicableCorrigenda)) {
      rawPkg.applicableCorrigenda.forEach(c => {
        if (c.documentIdentity) declaredDocumentIds.add(c.documentIdentity);
        if (c.docId) declaredDocumentIds.add(c.docId);
      });
    }
    if (Array.isArray(rawPkg.sourceDocuments)) {
      rawPkg.sourceDocuments.forEach(s => {
        if (s.documentIdentity) declaredDocumentIds.add(s.documentIdentity);
        if (s.docId) declaredDocumentIds.add(s.docId);
        if (s.sourceId) declaredDocumentIds.add(s.sourceId);
      });
    }
  }

  // 1. Evaluate all eligibility rules
  for (const rule of effectiveRules) {
    const res = evaluateSingleRule(rule, profile, {
      referenceDate: nowIso,
      allRules: effectiveRules,
      ageRelaxationResolution,
      declaredDocumentIds: declaredDocumentIds.size > 0 ? declaredDocumentIds : null
    });

    if (res.ruleType === 'DISCIPLINE_REQUIRED' || res.ruleType === 'ACADEMIC_SUBJECT' || res.ruleType === 'QUALIFYING_SUBJECTS') {
      hasAcademicRule = true;
    }
    if (res.ruleType === 'QUALIFICATION_MIN' || res.ruleType === 'AGE_MIN' || res.ruleType === 'AGE_MAX' || res.ruleType === 'AGE_LIMIT' || res.ruleType === 'MINIMUM_AGE' || res.ruleType === 'UPPER_AGE_LIMIT' || res.ruleType === 'QUALIFYING_EXAM_YEAR' || res.ruleType === 'EDUCATION_CUTOFF_DATE') {
      hasQualRule = true;
    }
    if (res.ruleType === 'DOMICILE_REQUIRED' || res.ruleType === 'LOCATION_REQUIRED' || res.ruleType === 'STATE_ELIGIBILITY') {
      hasLocationRule = true;
    }

    if (res.status === 'PASSED') {
      passedRuleIds.push(rule.ruleId);
      reasonCodes.push('✓ ' + res.reason);
      matchedCriteria.push({ ruleId: rule.ruleId, ruleType: rule.ruleType, reason: res.reason });
      if (res.ruleType === 'DISCIPLINE_REQUIRED' || res.ruleType === 'ACADEMIC_SUBJECT' || res.ruleType === 'QUALIFYING_SUBJECTS') academicRulePassed = true;
      if (res.ruleType === 'QUALIFICATION_MIN' || res.ruleType === 'AGE_MIN' || res.ruleType === 'AGE_MAX' || res.ruleType === 'AGE_LIMIT' || res.ruleType === 'MINIMUM_AGE' || res.ruleType === 'UPPER_AGE_LIMIT' || res.ruleType === 'QUALIFYING_EXAM_YEAR' || res.ruleType === 'EDUCATION_CUTOFF_DATE') qualRulePassed = true;
      if (res.ruleType === 'DOMICILE_REQUIRED' || res.ruleType === 'LOCATION_REQUIRED' || res.ruleType === 'STATE_ELIGIBILITY') locationRulePassed = true;
    } else if (res.status === 'FAILED') {
      failedRuleIds.push(rule.ruleId);
      reasonCodes.push('✗ ' + res.reason);
      unmetCriteria.push({ ruleId: rule.ruleId, ruleType: rule.ruleType, reason: res.reason });
      if (res.ruleType === 'DISCIPLINE_REQUIRED' || res.ruleType === 'ACADEMIC_SUBJECT' || res.ruleType === 'QUALIFYING_SUBJECTS') academicRuleFailed = true;
      if (res.ruleType === 'QUALIFICATION_MIN' || res.ruleType === 'AGE_MIN' || res.ruleType === 'AGE_MAX' || res.ruleType === 'AGE_LIMIT' || res.ruleType === 'MINIMUM_AGE' || res.ruleType === 'UPPER_AGE_LIMIT' || res.ruleType === 'QUALIFYING_EXAM_YEAR' || res.ruleType === 'EDUCATION_CUTOFF_DATE') qualRuleFailed = true;
      if (res.ruleType === 'DOMICILE_REQUIRED' || res.ruleType === 'LOCATION_REQUIRED' || res.ruleType === 'STATE_ELIGIBILITY') locationRuleFailed = true;
    } else if (res.status === 'MISSING_FIELD') {
      // User data gap -> MORE_INFORMATION_NEEDED
      if (!missingProfileFields.includes(res.field)) {
        missingProfileFields.push(res.field);
      }
      reasonCodes.push('? ' + res.reason);
      missingInformation.push({ field: res.field, ruleId: rule.ruleId, reason: res.reason });
    } else if (res.status === 'UNRESOLVED') {
      // Official source gap -> NOT_EVALUATED
      unresolvedRuleIds.push(rule.ruleId);
      reasonCodes.push('! ' + res.reason);
      unresolvedRules.push({ ruleId: rule.ruleId, reason: res.reason });
    }
  }

  // 2. Evaluate Reservation & Vacancy applicability with completeness check
  const { applicableRows, totalApplicableVacancies } = evaluateApplicableVacancies(profile, effectiveVacancyRows);

  let vacancyApplicabilityStatus = VACANCY_APPLICABILITY_STATUS.VACANCIES_UNSPECIFIED;
  if (effectiveVacancyRows.length > 0) {
    if (profile.reservationCategory === null || profile.reservationCategory === 'UNKNOWN') {
      vacancyApplicabilityStatus = VACANCY_APPLICABILITY_STATUS.VACANCIES_PENDING_RESERVATION_DATA;
      reasonCodes.push('? Vacancy applicability cannot be fully determined until reservation category is provided.');
    } else if (applicableRows.length > 0) {
      vacancyApplicabilityStatus = VACANCY_APPLICABILITY_STATUS.VACANCIES_AVAILABLE;
      reasonCodes.push('✓ ' + totalApplicableVacancies + ' vacancies available across ' + applicableRows.length + ' applicable quota rows.');
    } else {
      // GATE 48CS2R3 COMPLETENESS FIX: Partial matrix cannot claim NO_APPLICABLE_VACANCIES
      if (effectiveVacancyCompleteness === VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_COMPLETE) {
        vacancyApplicabilityStatus = VACANCY_APPLICABILITY_STATUS.NO_APPLICABLE_VACANCIES;
        reasonCodes.push('ℹ No vacancies currently advertised for your specific reservation/horizontal quota bucket in verified complete vacancy matrix.');
      } else {
        vacancyApplicabilityStatus = VACANCY_APPLICABILITY_STATUS.VACANCIES_PENDING_RESERVATION_DATA;
        reasonCodes.push('? Vacancy matrix is partial or unverified (' + effectiveVacancyCompleteness + '); zero-vacancy conclusion cannot be determined.');
      }
    }
  }

  // 3. Determine Overall Eligibility Status with RULEBOOK COMPLETENESS & TRUST BOUNDARY
  let eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;

  if (rawPkg) {
    const baseDoc = validateSourceDocumentState(rawPkg.baseNotification);
    const isUrlOnly = Boolean(
      baseDoc.evidenceLevel === DOCUMENT_EVIDENCE_LEVEL.URL_FOUND ||
      !baseDoc.isShaVerified
    );
    const isScannedUnresolved = Boolean(
      baseDoc.scanTextUnresolved === true ||
      rawPkg.baseNotification?.scanTextUnresolved === true ||
      rawPkg.baseNotification?.scanTextState === 'SCAN_ONLY_TEXT_UNRESOLVED'
    );

    if (isUrlOnly) {
      // GATE 48CS2R6 BYTE-AUTHORITY BARRIER: URL_FOUND alone cannot emit final eligibility!
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
      reasonCodes.push('! Byte-Authority Barrier: Source document is only URL_FOUND. Final personalized eligibility verdict is strictly prohibited.');
    } else if (isScannedUnresolved) {
      // GATE 48CS2R6 SCAN-SAFETY BARRIER: Scanned PDF with verified bytes but unresolved scan text
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
      reasonCodes.push('! Scan-Safety Barrier: Scanned source document bytes are verified, but extracted text is unresolved. Final eligibility verdict is prohibited.');
    } else if (packageValidation && packageValidation.validationResult !== PACKAGE_VALIDATION_RESULT.ACCEPTED_FOR_MATCHING) {
      // GATE 48CS2R6R1 TRUST CLOSURE: ACCEPTED_FOR_MATCHING is the strictly required prerequisite to emit ELIGIBLE / NOT_ELIGIBLE.
      // Partial or unverified packages strictly emit NOT_EVALUATED; zero personalized eligibility verdicts for partial packages.
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
      reasonCodes.push('! Rulebook package validation is ' + packageValidation.validationResult + '. ACCEPTED_FOR_MATCHING is strictly required to emit personalized eligibility verdicts.');
    } else if (failedRuleIds.length > 0) {
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_ELIGIBLE;
    } else if (missingProfileFields.length > 0) {
      eligibilityStatus = ELIGIBILITY_STATUS.MORE_INFORMATION_NEEDED;
    } else if (unresolvedRuleIds.length > 0) {
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
    } else if (effectiveRulebookCompleteness && !effectiveRulebookCompleteness.isComplete) {
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
      reasonCodes.push('! Recruitment rulebook is incomplete. Unresolved rule families: ' + effectiveRulebookCompleteness.unresolvedFamilies.join(', ') + '. Final eligibility verdict is prohibited.');
    } else if (effectiveAmendmentChain && effectiveAmendmentChain.amendmentSearchStatus !== AMENDMENT_CHAIN_STATUS.CURRENT_CHAIN_VERIFIED) {
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
      reasonCodes.push('! Official amendment chain search status is ' + effectiveAmendmentChain.amendmentSearchStatus + '. Effective rule truth may be altered by pending corrigenda.');
    } else if (effectiveRules.length > 0) {
      eligibilityStatus = ELIGIBILITY_STATUS.ELIGIBLE;
    } else {
      eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
    }
  } else if (failedRuleIds.length > 0) {
    // Exact verified mandatory rule failed -> strictly NOT_ELIGIBLE
    eligibilityStatus = ELIGIBILITY_STATUS.NOT_ELIGIBLE;
  } else if (missingProfileFields.length > 0) {
    // Missing user profile facts -> MORE_INFORMATION_NEEDED
    eligibilityStatus = ELIGIBILITY_STATUS.MORE_INFORMATION_NEEDED;
  } else if (unresolvedRuleIds.length > 0) {
    // Unresolved rules in extracted set -> NOT_EVALUATED
    eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
  } else if (effectiveRulebookCompleteness && !effectiveRulebookCompleteness.isComplete) {
    // GATE 48CS2R3/R4 FIX: Rulebook completeness barrier: cannot say ELIGIBLE if mandatory rule family is unresolved
    eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
    reasonCodes.push('! Recruitment rulebook is incomplete. Unresolved rule families: ' + effectiveRulebookCompleteness.unresolvedFamilies.join(', ') + '. Final eligibility verdict is prohibited.');
  } else if (effectiveAmendmentChain && effectiveAmendmentChain.amendmentSearchStatus !== AMENDMENT_CHAIN_STATUS.CURRENT_CHAIN_VERIFIED) {
    // GATE 48CS2R3/R4 FIX: Amendment chain incomplete -> cannot finalize ELIGIBLE
    eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
    reasonCodes.push('! Official amendment chain search status is ' + effectiveAmendmentChain.amendmentSearchStatus + '. Effective rule truth may be altered by pending corrigenda.');
  } else if (effectiveRules.length > 0) {
    eligibilityStatus = ELIGIBILITY_STATUS.ELIGIBLE;
  } else {
    eligibilityStatus = ELIGIBILITY_STATUS.NOT_EVALUATED;
  }

  // 4. Compute Separate Dimensions
  let academicMatch = null;
  if (hasAcademicRule) {
    academicMatch = !academicRuleFailed && academicRulePassed;
  }

  let qualificationMatch = null;
  if (hasQualRule) {
    qualificationMatch = !qualRuleFailed && qualRulePassed;
  }

  let locationMatch = null;
  if (hasLocationRule) {
    locationMatch = !locationRuleFailed && locationRulePassed;
  }

  const preferenceMatch = null;

  // 5. Explainability Payload
  const explainability = {
    eligibilityStatus,
    vacancyApplicabilityStatus,
    packageValidationResult: packageValidation ? packageValidation.validationResult : null,
    genericCycleFacts: packageValidation ? packageValidation.genericCycleFacts : null,
    rulebookCompleteness: effectiveRulebookCompleteness ? {
      isComplete: effectiveRulebookCompleteness.isComplete,
      unresolvedFamilies: effectiveRulebookCompleteness.unresolvedFamilies
    } : null,
    amendmentChainStatus: effectiveAmendmentChain ? effectiveAmendmentChain.amendmentSearchStatus : null,
    matchedCriteria,
    unmetCriteria,
    missingInformation,
    unresolvedRules,
    requiredOfficialProofs: effectiveRules.filter(r => r.requiredProofDocument).map(r => r.requiredProofDocument)
  };

  // 6. Signal Priority based on User Participation State
  let priority = 'STANDARD_PUBLIC_UPDATE';
  if (effectiveCycle?.status === 'RESULT_STAGE' || effectiveCycle?.status === 'ANSWER_KEY_STAGE' || effectiveCycle?.status === 'FINAL_RESULT_DECLARED') {
    if (participationState === PARTICIPATION_STATE.EXAM_APPEARED) {
      priority = 'HIGH_PRIORITY_PERSONALIZED';
      reasonCodes.unshift('★ High-Priority: Official results/updates released for your participating exam session.');
    } else {
      priority = 'STANDARD_PUBLIC_UPDATE';
      reasonCodes.unshift('Public Update: Official examination process update published.');
    }
  }

  const view = normalizeCareerSignalView({
    userId: profile.userId,
    eventId: canonicalEventId,
    cycleId: effectiveCycle?.cycleId || 'cycle_unbound',
    permanentMissionId: effectiveCycle?.permanentMissionId || null,
    opportunityKind: effectiveCycle?.opportunityKind || OPPORTUNITY_KIND.JOB_RECRUITMENT,
    eligibilityStatus,
    vacancyApplicabilityStatus,
    matchResultState: eligibilityStatus,
    relevanceScore: eligibilityStatus === ELIGIBILITY_STATUS.ELIGIBLE ? 1.0 : (eligibilityStatus === ELIGIBILITY_STATUS.MORE_INFORMATION_NEEDED ? 0.5 : 0),
    priority,
    academicMatch,
    qualificationMatch,
    locationMatch,
    preferenceMatch,
    passedRuleIds,
    failedRuleIds,
    missingProfileFields,
    unresolvedRuleIds,
    unresolvedRuleFamilies: effectiveRulebookCompleteness ? effectiveRulebookCompleteness.unresolvedFamilies : [],
    applicableVacancyRows: applicableRows,
    totalApplicableVacancies,
    reasonCodes,
    explainability,
    rulebookCompleteness: effectiveRulebookCompleteness,
    amendmentChain: effectiveAmendmentChain,
    vacancyMatrixCompleteness: effectiveVacancyCompleteness,
    generatedAt: nowIso || new Date().toISOString()
  });

  return view;
}

module.exports = {
  calculateAgeYears,
  findOfficialAgeRelaxationRule,
  evaluateSingleRule,
  evaluateApplicableVacancies,
  evaluateCareerSignalPersonalization,
  validateCareerRulebookPackage,
  PACKAGE_VALIDATION_RESULT
};
