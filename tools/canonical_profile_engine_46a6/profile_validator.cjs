'use strict';

const {
  AUTHORITY_TAGS,
  EVIDENCE_CLASSES,
  PROFILE_STATUSES
} = require('./profile_schema.cjs');

const SYNTHETIC_HASH_PATTERNS = [
  /^0{16,}$/i,
  /^1{16,}$/i,
  /^f{16,}$/i,
  /^123456/i,
  /^abcdef/i,
  /mock/i,
  /dummy/i,
  /fake/i,
  /test/i
];

const GUESSED_URL_PATTERNS = [
  /example\.com/i,
  /placeholder/i,
  /todo/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /dummy/i
];

/**
 * Validates whether a string is a legitimate SHA-256 hash and not synthetic.
 */
function isValidSha256(sha) {
  if (typeof sha !== 'string') return false;
  const clean = sha.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(clean)) return false;
  for (const pattern of SYNTHETIC_HASH_PATTERNS) {
    if (pattern.test(clean)) return false;
  }
  return true;
}

/**
 * Validates whether a URL is a syntactically valid external URL and not guessed.
 */
function isValidPortalUrl(urlStr) {
  if (typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    for (const pattern of GUESSED_URL_PATTERNS) {
      if (pattern.test(parsed.hostname) || pattern.test(parsed.pathname)) {
        return false;
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Strict canonical profile validator.
 * Fail closed on any structural, evidence, or mapping inconsistency.
 */
function validateProfile(profile) {
  const errors = [];
  const warnings = [];

  if (!profile || typeof profile !== 'object') {
    return {
      valid: false,
      canMaterialize: false,
      errors: ['PROFILE_OBJECT_REQUIRED: Profile must be a non-null object.'],
      warnings: []
    };
  }

  // 1. Mission Identity
  const missionId = profile.identity?.missionId || profile.missionId;
  if (!missionId || typeof missionId !== 'string' || missionId.trim().length === 0) {
    errors.push('MISSION_ID_REQUIRED: Missing or empty identity.missionId.');
  }

  const examName = profile.identity?.canonicalExamName || profile.canonicalExamName;
  if (!examName || typeof examName !== 'string' || examName.trim().length === 0) {
    errors.push('EXAM_NAME_REQUIRED: Missing canonicalExamName.');
  }

  // 2. Target Year and Baseline Year
  const targetYear = profile.missionTargetYear;
  if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2100) {
    errors.push(`INVALID_TARGET_YEAR: missionTargetYear must be integer 2000-2100 (got ${targetYear}).`);
  }

  const baselineYear = profile.sourceBaselineYear;
  if (!Number.isInteger(baselineYear) || baselineYear < 2000 || baselineYear > 2100) {
    errors.push(`INVALID_BASELINE_YEAR: sourceBaselineYear must be integer 2000-2100 (got ${baselineYear}).`);
  }

  // 3. Cycle Relation
  const allowedCycleRelations = [
    'SAME_YEAR_OFFICIAL_CYCLE',
    'PRIOR_OFFICIAL_BASELINE',
    'SUBSEQUENT_OFFICIAL_CYCLE',
    'INTERIM_AMENDMENT'
  ];
  if (!allowedCycleRelations.includes(profile.cycleRelation)) {
    errors.push(`INVALID_CYCLE_RELATION: Unsupported cycleRelation '${profile.cycleRelation}'.`);
  }

  // 4. Authority and Evidence Class Validation
  const auth = profile.authority;
  if (!auth || typeof auth !== 'object') {
    errors.push('AUTHORITY_SECTION_REQUIRED: Missing authority section.');
  } else {
    if (!auth.organization || typeof auth.organization !== 'string') {
      errors.push('ORGANIZATION_REQUIRED: Authority must specify organization.');
    }

    if (auth.provenanceTag && !AUTHORITY_TAGS.includes(auth.provenanceTag)) {
      errors.push(`INVALID_PROVENANCE_TAG: Unsupported provenanceTag '${auth.provenanceTag}'.`);
    }

    // SOURCE_VERIFIED requires explicit evidenceClass
    if (auth.provenanceTag === 'SOURCE_VERIFIED' && !auth.evidenceClass) {
      errors.push('EVIDENCE_CLASS_REQUIRED: authority.provenanceTag=SOURCE_VERIFIED requires evidenceClass.');
    }

    if (auth.evidenceClass) {
      if (!EVIDENCE_CLASSES.includes(auth.evidenceClass)) {
        errors.push(`UNSUPPORTED_EVIDENCE_CLASS: Unsupported evidenceClass '${auth.evidenceClass}'.`);
      }

      // BYTE_VERIFIED requires valid 64-char SHA-256
      if (auth.evidenceClass === 'BYTE_VERIFIED') {
        if (!auth.sha256) {
          errors.push('BYTE_VERIFIED_SHA_REQUIRED: evidenceClass=BYTE_VERIFIED requires sha256.');
        } else if (!isValidSha256(auth.sha256)) {
          errors.push(`SYNTHETIC_OR_INVALID_SHA: sha256 '${auth.sha256}' is invalid or synthetic.`);
        }
      }

      // PORTAL_REGISTRY_VERIFIED permits null SHA, but requires valid portal URLs
      if (auth.evidenceClass === 'PORTAL_REGISTRY_VERIFIED' || auth.evidenceClass === 'PORTAL_TEXT_VERIFIED') {
        if (auth.sha256 !== undefined && auth.sha256 !== null && !isValidSha256(auth.sha256)) {
          errors.push(`SYNTHETIC_OR_INVALID_SHA: sha256 '${auth.sha256}' is invalid or synthetic.`);
        }
      }

      // Guessed URL detection
      if (Array.isArray(auth.officialPortals)) {
        for (const portal of auth.officialPortals) {
          if (!isValidPortalUrl(portal)) {
            errors.push(`GUESSED_OR_INVALID_PORTAL_URL: '${portal}' is not an authorized portal URL.`);
          }
        }
      }
      if (auth.officialPdfUrl && !isValidPortalUrl(auth.officialPdfUrl)) {
        errors.push(`GUESSED_OR_INVALID_PDF_URL: officialPdfUrl '${auth.officialPdfUrl}' is not a valid URL.`);
      }
    }
  }

  // 5. Paper Model & Duplicate Paper ID Check
  const paperModel = profile.paperModel;
  const knownPaperIds = new Set();
  if (!paperModel || !Array.isArray(paperModel.papers) || paperModel.papers.length === 0) {
    errors.push('PAPERS_REQUIRED: paperModel.papers must contain at least one paper.');
  } else {
    for (const paper of paperModel.papers) {
      if (!paper.paperId || typeof paper.paperId !== 'string') {
        errors.push('PAPER_ID_REQUIRED: Paper missing paperId.');
        continue;
      }
      if (knownPaperIds.has(paper.paperId)) {
        errors.push(`DUPLICATE_PAPER_ID: Duplicate paperId '${paper.paperId}'.`);
      }
      knownPaperIds.add(paper.paperId);

      if (!paper.paperName) {
        errors.push(`PAPER_NAME_REQUIRED: Paper '${paper.paperId}' missing paperName.`);
      }
      if (!Number.isInteger(paper.durationMinutes) || paper.durationMinutes <= 0) {
        errors.push(`INVALID_PAPER_DURATION: Paper '${paper.paperId}' durationMinutes must be > 0.`);
      }
      if (!Number.isInteger(paper.totalQuestions) || paper.totalQuestions <= 0) {
        errors.push(`INVALID_TOTAL_QUESTIONS: Paper '${paper.paperId}' totalQuestions must be > 0.`);
      }
    }
  }

  // 6. Paper Family Validation
  const knownFamilyIds = new Set();
  if (Array.isArray(paperModel?.paperFamilies)) {
    for (const family of paperModel.paperFamilies) {
      if (!family.familyId) {
        errors.push('FAMILY_ID_REQUIRED: Paper family missing familyId.');
        continue;
      }
      if (knownFamilyIds.has(family.familyId)) {
        errors.push(`DUPLICATE_FAMILY_ID: Duplicate familyId '${family.familyId}'.`);
      }
      knownFamilyIds.add(family.familyId);

      if (!Array.isArray(family.paperIds) || family.paperIds.length === 0) {
        errors.push(`FAMILY_PAPERS_EMPTY: Family '${family.familyId}' must specify at least one paperId.`);
      } else {
        for (const pid of family.paperIds) {
          if (!knownPaperIds.has(pid)) {
            errors.push(`FAMILY_REFERENCES_UNKNOWN_PAPER: Family '${family.familyId}' references unknown paper '${pid}'.`);
          }
        }
      }
    }
  }

  // 7. Variant Model & Duplicate Variant ID Check
  const variantModel = profile.variantModel;
  const knownVariantIds = new Set();
  if (variantModel && variantModel.hasVariants === true) {
    if (!Array.isArray(variantModel.variants) || variantModel.variants.length === 0) {
      errors.push('VARIANTS_REQUIRED: hasVariants=true requires non-empty variantModel.variants.');
    } else {
      for (const variant of variantModel.variants) {
        if (!variant.variantId) {
          errors.push('VARIANT_ID_REQUIRED: Variant missing variantId.');
          continue;
        }
        if (knownVariantIds.has(variant.variantId)) {
          errors.push(`DUPLICATE_VARIANT_ID: Duplicate variantId '${variant.variantId}'.`);
        }
        knownVariantIds.add(variant.variantId);

        // Nested subvariants validation
        if (Array.isArray(variant.subvariants)) {
          for (const sub of variant.subvariants) {
            if (!sub.subvariantId) {
              errors.push(`SUBVARIANT_ID_REQUIRED: Subvariant in '${variant.variantId}' missing subvariantId.`);
            } else if (knownVariantIds.has(sub.subvariantId)) {
              errors.push(`DUPLICATE_SUBVARIANT_ID: Subvariant ID '${sub.subvariantId}' already exists.`);
            } else {
              knownVariantIds.add(sub.subvariantId);
            }
          }
        }

        // Multi-paper family mapping validation
        if (knownFamilyIds.size > 0) {
          const familyId = variant.applicablePaperFamilyId;
          if (familyId && !knownFamilyIds.has(familyId)) {
            errors.push(`UNMAPPED_VARIANT_PAPER_FAMILY: Variant '${variant.variantId}' maps to unknown family '${familyId}'.`);
          }
        }
      }
    }

    // Paper-variant mappings validation
    if (Array.isArray(variantModel.paperVariantMappings)) {
      for (const mapping of variantModel.paperVariantMappings) {
        if (!knownVariantIds.has(mapping.variantId)) {
          errors.push(`MAPPING_UNKNOWN_VARIANT: paperVariantMappings references unknown variant '${mapping.variantId}'.`);
        }
        if (mapping.paperFamilyId && !knownFamilyIds.has(mapping.paperFamilyId)) {
          errors.push(`MAPPING_UNKNOWN_FAMILY: paperVariantMappings references unknown family '${mapping.paperFamilyId}'.`);
        }
        if (Array.isArray(mapping.paperIds)) {
          for (const pid of mapping.paperIds) {
            if (!knownPaperIds.has(pid)) {
              errors.push(`MAPPING_UNKNOWN_PAPER: Variant '${mapping.variantId}' references unknown paper '${pid}'.`);
            }
          }
        }
      }
    }
  }

  // 8. Subject Model Validation
  const subjectModel = profile.subjectModel;
  const knownSubjectIds = new Set();
  if (!subjectModel || !Array.isArray(subjectModel.subjects) || subjectModel.subjects.length === 0) {
    errors.push('SUBJECTS_REQUIRED: subjectModel.subjects must contain at least one subject.');
  } else {
    for (const subject of subjectModel.subjects) {
      if (!subject.subjectId) {
        errors.push('SUBJECT_ID_REQUIRED: Subject missing subjectId.');
        continue;
      }
      if (knownSubjectIds.has(subject.subjectId)) {
        errors.push(`DUPLICATE_SUBJECT_ID: Duplicate subjectId '${subject.subjectId}'.`);
      }
      knownSubjectIds.add(subject.subjectId);
    }
  }

  // 9. S2 Document Profile Validation
  const s2 = profile.s2DocumentProfile;
  if (!s2 || typeof s2 !== 'object') {
    errors.push('S2_PROFILE_REQUIRED: s2DocumentProfile section is required.');
  } else {
    if (!Array.isArray(s2.expectedPapers) || s2.expectedPapers.length === 0) {
      errors.push('S2_EXPECTED_PAPERS_REQUIRED: s2DocumentProfile.expectedPapers must be non-empty.');
    }
    if (!Array.isArray(s2.expectedSubjects) || s2.expectedSubjects.length === 0) {
      errors.push('S2_EXPECTED_SUBJECTS_REQUIRED: s2DocumentProfile.expectedSubjects must be non-empty.');
    }
    if (!Array.isArray(s2.languageScripts) || s2.languageScripts.length === 0) {
      errors.push('S2_LANGUAGE_SCRIPTS_REQUIRED: s2DocumentProfile.languageScripts must be non-empty.');
    }
    if (!Array.isArray(s2.preferredOcrLanguages) || s2.preferredOcrLanguages.length === 0) {
      errors.push('S2_OCR_LANGUAGES_REQUIRED: s2DocumentProfile.preferredOcrLanguages must be non-empty.');
    }
  }

  // 10. Profile Status Gate
  const status = profile.profileStatus;
  let canMaterialize = true;

  if (!PROFILE_STATUSES.includes(status)) {
    errors.push(`INVALID_PROFILE_STATUS: Unsupported profileStatus '${status}'.`);
    canMaterialize = false;
  } else if (status === 'HOLD_FOR_REVIEW') {
    warnings.push('MATERIALIZATION_BLOCKED: profileStatus is HOLD_FOR_REVIEW.');
    canMaterialize = false;
  } else if (status === 'DRAFT' || status === 'READY_FOR_REVIEW') {
    warnings.push(`PRE_MATERIALIZATION_STATE: Profile is in '${status}' status; review required before production.`);
  }

  if (errors.length > 0) {
    canMaterialize = false;
  }

  return {
    valid: errors.length === 0,
    canMaterialize,
    missionId,
    profileStatus: status,
    paperCount: knownPaperIds.size,
    variantCount: knownVariantIds.size,
    subjectCount: knownSubjectIds.size,
    errors,
    warnings
  };
}

module.exports = {
  validateProfile,
  isValidSha256,
  isValidPortalUrl
};
