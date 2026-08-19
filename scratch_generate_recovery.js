const fs = require('fs');
const path = require('path');

const DOC_NAME = 'JEE main Syllabus 2026.pdf';
const DOC_HASH = '7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';

const mappings = {
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U11_T_0DB42BEA_CH001": {
    verifiedUnit: "UNIT 11",
    verifiedChapter: "d - and f- BLOCK ELEMENTS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_C9AC8CA6_CH001": {
    verifiedUnit: "UNIT 17",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING OXYGEN",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_1206BA8A_CH001": {
    verifiedUnit: "UNIT 17",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING OXYGEN",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_1206BA8A_CH002": {
    verifiedUnit: "UNIT 17",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING OXYGEN",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_BCA9920C_CH001": {
    verifiedUnit: "UNIT 15",
    verifiedChapter: "HYDROCARBONS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_B270826F_CH001": {
    verifiedUnit: "UNIT 15",
    verifiedChapter: "HYDROCARBONS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_B270826F_CH002": {
    verifiedUnit: "UNIT 15",
    verifiedChapter: "HYDROCARBONS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_D8B93C4B_CH001": {
    verifiedUnit: "UNIT 15",
    verifiedChapter: "HYDROCARBONS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U18_T_19C1F7E4_CH001": {
    verifiedUnit: "UNIT 18",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING NITROGEN",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U18_T_19C1F7E4_CH002": {
    verifiedUnit: "UNIT 18",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING NITROGEN",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_97ACB2E0_CH001": {
    verifiedUnit: "UNIT 15",
    verifiedChapter: "HYDROCARBONS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U13_T_0B6FC591_CH001": {
    verifiedUnit: "UNIT 13",
    verifiedChapter: "PURIFICATION AND CHARACTERISATION OF ORGANIC COMPOUNDS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U19_T_69EF29B0_CH001": {
    verifiedUnit: "UNIT 19",
    verifiedChapter: "BIOMOLECULES",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U19_T_69EF29B0_CH002": {
    verifiedUnit: "UNIT 19",
    verifiedChapter: "BIOMOLECULES",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_3944DA40_CH001": {
    verifiedUnit: "UNIT 17",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING OXYGEN",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_FE6942BA_CH001": {
    verifiedUnit: "UNIT 20",
    verifiedChapter: "PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    page: "11"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_FE6942BA_CH002": {
    verifiedUnit: "UNIT 20",
    verifiedChapter: "PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    page: "11"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_7CAF568B_CH001": {
    verifiedUnit: "UNIT 20",
    verifiedChapter: "PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_7CAF568B_CH002": {
    verifiedUnit: "UNIT 20",
    verifiedChapter: "PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    page: "10"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_671F479D_CH001": {
    verifiedUnit: "UNIT 16",
    verifiedChapter: "ORGANIC COMPOUNDS CONTAINING HALOGENS",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U14_T_E3BD6323_CH001": {
    verifiedUnit: "UNIT 14",
    verifiedChapter: "SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U14_T_0D2707C4_CH001": {
    verifiedUnit: "UNIT 14",
    verifiedChapter: "SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U14_T_0D2707C4_CH002": {
    verifiedUnit: "UNIT 14",
    verifiedChapter: "SOME BASIC PRINCIPLES OF ORGANIC CHEMISTRY",
    page: "9"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U03_T_36668546_CH001": {
    verifiedUnit: "UNIT 3",
    verifiedChapter: "CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    page: "7"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U03_T_36668546_CH002": {
    verifiedUnit: "UNIT 3",
    verifiedChapter: "CHEMICAL BONDING AND MOLECULAR STRUCTURE",
    page: "7"
  },
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_281FD2A4_CH001": {
    verifiedUnit: "UNIT 20",
    verifiedChapter: "PRINCIPLES RELATED TO PRACTICAL CHEMISTRY",
    page: "10"
  }
};

const items = Object.keys(mappings).map(atomId => {
  const m = mappings[atomId];
  return {
    atomId,
    sourceStatus: "SOURCE_PROVEN",
    verifiedUnit: m.verifiedUnit,
    verifiedChapter: m.verifiedChapter,
    unitSource: {
      sourceClass: "OFFICIAL_SOURCE",
      document: DOC_NAME,
      locator: `page ${m.page}`,
      sourceHash: DOC_HASH
    },
    chapterSource: {
      sourceClass: "OFFICIAL_SOURCE",
      document: DOC_NAME,
      locator: `page ${m.page}`,
      sourceHash: DOC_HASH
    },
    modelOnlyProof: false
  };
});

const recoveryData = {
  items
};

fs.writeFileSync(
  path.join(__dirname, 'docs', 'patch_safety', 'syllabus_source_recovery.json'),
  JSON.stringify(recoveryData, null, 2) + '\n',
  'utf8'
);
console.log('Generated updated docs/patch_safety/syllabus_source_recovery.json successfully!');
