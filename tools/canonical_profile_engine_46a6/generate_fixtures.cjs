'use strict';

const fs = require('fs');
const path = require('path');
const { computeProfileHash } = require('./profile_schema.cjs');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

function makeBase(id, examName, targetYear, baselineYear) {
  return {
    schemaVersion: '1.0.0',
    profileStatus: 'MATERIALIZATION_READY',
    identity: {
      missionId: id,
      canonicalExamName: examName,
      canonicalDisplayName: examName + ' ' + targetYear
    },
    missionTargetYear: targetYear,
    sourceBaselineYear: baselineYear,
    cycleRelation: 'PRIOR_OFFICIAL_BASELINE',
    authority: {
      organization: 'National Authority',
      officialPortals: ['https://authority.gov.in'],
      sourceDocumentType: 'Official Notification',
      officialNotificationTitle: examName + ' Official Notification',
      officialPdfUrl: 'https://authority.gov.in/docs/notification.pdf',
      sha256: '7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905',
      evidenceClass: 'BYTE_VERIFIED',
      provenanceTag: 'SOURCE_VERIFIED'
    },
    paperModel: {
      paperCount: 1,
      papers: [
        {
          paperId: 'paper_1',
          paperNumber: 1,
          paperName: 'General Paper',
          isCommonPaper: true,
          isVariantSpecific: false,
          mode: 'CBT',
          durationMinutes: 180,
          totalQuestions: 75,
          totalMarks: 300
        }
      ]
    },
    variantModel: {
      hasVariants: false,
      variants: []
    },
    subjectModel: {
      subjects: [
        { subjectId: 'subj_1', subjectName: 'Subject 1', canonicalKey: 'key_1' }
      ]
    },
    languageModel: {
      defaultLanguage: 'en',
      supportedLanguages: ['English', 'Hindi'],
      mediumPolicy: 'BILINGUAL'
    },
    s2DocumentProfile: {
      expectedPapers: ['General Paper'],
      paperAliases: { 'General Paper': ['Paper 1'] },
      expectedSubjects: ['Subject 1'],
      subjectAliases: { 'Subject 1': ['Subj 1'] },
      languageScripts: ['Latin', 'Devanagari'],
      preferredOcrLanguages: ['eng', 'hin'],
      sourceYearPolicy: 'USE_' + baselineYear + '_BASELINE',
      cycleRelation: 'PRIOR_OFFICIAL_BASELINE'
    },
    fieldAuthorityMap: {
      paperStructure: 'SOURCE_VERIFIED',
      subjectModel: 'SOURCE_VERIFIED'
    }
  };
}

// A. Single Paper
const fixA = makeBase('mock_single_paper', 'Single Paper Exam', 2027, 2026);
fixA.profileHash = computeProfileHash(fixA);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_a_single_paper.json'), JSON.stringify(fixA, null, 2) + '\n');

// B. Multi Paper
const fixB = makeBase('mock_multi_paper', 'Multi Paper Exam', 2026, 2025);
fixB.paperModel = {
  paperCount: 2,
  papers: [
    { paperId: 'paper_1', paperNumber: 1, paperName: 'Paper 1 General', isCommonPaper: true, isVariantSpecific: false, mode: 'Offline', durationMinutes: 90, totalQuestions: 75, totalMarks: 150 },
    { paperId: 'paper_2', paperNumber: 2, paperName: 'Paper 2 Subject', isCommonPaper: false, isVariantSpecific: true, mode: 'Offline', durationMinutes: 180, totalQuestions: 150, totalMarks: 300 }
  ]
};
fixB.s2DocumentProfile.expectedPapers = ['Paper 1 General', 'Paper 2 Subject'];
fixB.profileHash = computeProfileHash(fixB);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_b_multi_paper.json'), JSON.stringify(fixB, null, 2) + '\n');

// C. No Variants
const fixC = makeBase('mock_no_variants', 'Standard Mission', 2027, 2027);
fixC.cycleRelation = 'SAME_YEAR_OFFICIAL_CYCLE';
fixC.variantModel = { hasVariants: false, variants: [] };
fixC.profileHash = computeProfileHash(fixC);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_c_no_variants.json'), JSON.stringify(fixC, null, 2) + '\n');

// D. Flat Variants
const fixD = makeBase('mock_flat_variants', 'Discipline Exam', 2026, 2025);
fixD.variantModel = {
  hasVariants: true,
  variantDimension: 'academic_discipline',
  variants: [
    { variantId: 'var_english', variantName: 'English', code: 'ENG', status: 'ACTIVE' },
    { variantId: 'var_hindi', variantName: 'Hindi', code: 'HIN', status: 'ACTIVE' },
    { variantId: 'var_math', variantName: 'Mathematics', code: 'MAT', status: 'ACTIVE' }
  ]
};
fixD.profileHash = computeProfileHash(fixD);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_d_flat_variants.json'), JSON.stringify(fixD, null, 2) + '\n');

// E. Nested Parent/Subvariants
const fixE = makeBase('mock_nested_variants', 'Coaching & Sports Exam', 2026, 2025);
fixE.variantModel = {
  hasVariants: true,
  variantDimension: 'post_and_sport',
  variants: [
    { variantId: 'var_academic_english', variantName: 'Lecturer English', code: 'LEC_ENG', parentVariantId: null },
    {
      variantId: 'var_coach_parent',
      variantName: 'Coach Discipline',
      code: 'COACH',
      parentVariantId: null,
      subvariants: [
        { subvariantId: 'sub_coach_athletics', subvariantName: 'Coach Athletics', code: 'ATH' },
        { subvariantId: 'sub_coach_basketball', subvariantName: 'Coach Basketball', code: 'BB' },
        { subvariantId: 'sub_coach_football', subvariantName: 'Coach Football', code: 'FB' }
      ]
    }
  ]
};
fixE.profileHash = computeProfileHash(fixE);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_e_nested_variants.json'), JSON.stringify(fixE, null, 2) + '\n');

// F. Multi Paper Family
const fixF = makeBase('mock_multi_family', 'Technical & General Service', 2026, 2025);
fixF.paperModel = {
  paperCount: 3,
  paperFamilies: [
    { familyId: 'fam_general', familyName: 'General Cadre', applicableVariants: ['var_admin'], paperIds: ['paper_general_1', 'paper_general_2'] },
    { familyId: 'fam_engineering', familyName: 'Engineering Cadre', applicableVariants: ['var_civil', 'var_mech'], paperIds: ['paper_general_1', 'paper_tech'] }
  ],
  papers: [
    { paperId: 'paper_general_1', paperNumber: 1, paperName: 'General Studies', isCommonPaper: true, isVariantSpecific: false, mode: 'CBT', durationMinutes: 120, totalQuestions: 100, totalMarks: 200 },
    { paperId: 'paper_general_2', paperNumber: 2, paperName: 'Public Administration', isCommonPaper: false, isVariantSpecific: true, mode: 'CBT', durationMinutes: 180, totalQuestions: 120, totalMarks: 300 },
    { paperId: 'paper_tech', paperNumber: 2, paperName: 'Engineering Disciplines', isCommonPaper: false, isVariantSpecific: true, mode: 'CBT', durationMinutes: 180, totalQuestions: 120, totalMarks: 300 }
  ]
};
fixF.variantModel = {
  hasVariants: true,
  variants: [
    { variantId: 'var_admin', variantName: 'Administrative Service', applicablePaperFamilyId: 'fam_general' },
    { variantId: 'var_civil', variantName: 'Civil Engineering', applicablePaperFamilyId: 'fam_engineering' },
    { variantId: 'var_mech', variantName: 'Mechanical Engineering', applicablePaperFamilyId: 'fam_engineering' }
  ]
};
fixF.profileHash = computeProfileHash(fixF);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_f_multi_paper_family.json'), JSON.stringify(fixF, null, 2) + '\n');

// G. Portal Registry Source (No SHA)
const fixG = makeBase('mock_portal_registry', 'Portal Registry Exam', 2026, 2025);
fixG.authority = {
  organization: 'State Commission',
  officialPortals: ['https://commission.gov.in', 'https://portal.commission.gov.in'],
  sourceDocumentType: 'Official Web Portal Advertisement Table',
  officialAdvertisementReference: 'Advt. 01/2025',
  officialNotificationTitle: 'Recruitment Portal Listing',
  sha256: null,
  evidenceClass: 'PORTAL_REGISTRY_VERIFIED',
  provenanceTag: 'SOURCE_VERIFIED'
};
fixG.profileHash = computeProfileHash(fixG);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_g_portal_registry_no_sha.json'), JSON.stringify(fixG, null, 2) + '\n');

// H. Byte-Verified Source (With SHA)
const fixH = makeBase('mock_byte_verified', 'Byte Verified Official Bulletin', 2027, 2026);
fixH.authority = {
  organization: 'National Testing Agency',
  officialPortals: ['https://nta.ac.in'],
  sourceDocumentType: 'Information Bulletin PDF',
  officialNotificationTitle: 'National Exam Bulletin 2026',
  officialPdfUrl: 'https://nta.ac.in/assets/bulletin.pdf',
  sha256: 'a461e1f65845dd0acb452cf52a0a2df39da63914e6b52758156dbd5138133ba5',
  evidenceClass: 'BYTE_VERIFIED',
  provenanceTag: 'SOURCE_VERIFIED'
};
fixH.profileHash = computeProfileHash(fixH);
fs.writeFileSync(path.join(FIXTURES_DIR, 'fixture_h_byte_verified_with_sha.json'), JSON.stringify(fixH, null, 2) + '\n');

console.log('Successfully created all 8 fixtures in fixtures/');
