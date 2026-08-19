const fs = require('fs');
const path = require('path');

const treePath = path.join(__dirname, 'assets', 'data', 'preview', 'jee_main_2027', 'syllabus_preview_tree.json');
const treeData = JSON.parse(fs.readFileSync(treePath, 'utf8'));

const syllabusTextPath = path.join(__dirname, 'docs', 'patch_safety', 'jee_syllabus_text.txt');
const syllabusText = fs.readFileSync(syllabusTextPath, 'utf8');

const heldIds = [
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U11_T_0DB42BEA_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_C9AC8CA6_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_1206BA8A_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_1206BA8A_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_BCA9920C_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_B270826F_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_B270826F_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_D8B93C4B_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U18_T_19C1F7E4_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U18_T_19C1F7E4_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_97ACB2E0_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U13_T_0B6FC591_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U19_T_69EF29B0_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U19_T_69EF29B0_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U17_T_3944DA40_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_FE6942BA_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_FE6942BA_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_7CAF568B_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_7CAF568B_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U15_T_671F479D_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U14_T_E3BD6323_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U14_T_0D2707C4_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U14_T_0D2707C4_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U03_T_36668546_CH001",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U03_T_36668546_CH002",
  "DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U20_T_281FD2A4_CH001"
];

const atomDetails = {};
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.atomId && heldIds.includes(node.atomId)) {
    atomDetails[node.atomId] = node;
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) walk(c);
  }
  if (Array.isArray(node.subjects)) {
    for (const s of node.subjects) walk(s);
  }
  if (Array.isArray(node.atoms)) {
    for (const a of node.atoms) walk(a);
  }
}
walk(treeData);

const cleanSyllabus = syllabusText.replace(/\t/g, ' ').replace(/\n/g, ' ');
const normSyllabus = cleanSyllabus.toLowerCase().replace(/\s+/g, ' ');

heldIds.forEach(id => {
  const detail = atomDetails[id];
  if (!detail) return;
  const topic = detail.topic || '';
  const normTopic = topic.toLowerCase().replace(/\s+/g, ' ').trim();

  // Find in entire syllabus to see all matches (there might be multiple due to duplicates, let's find the one under CHEMISTRY)
  let index = normSyllabus.indexOf(normTopic);
  if (index >= 0) {
    // If the first match is before CHEMISTRY, check if there's another match after CHEMISTRY
    const chemIndex = normSyllabus.indexOf('physical chemistry');
    if (index < chemIndex) {
      const secondIndex = normSyllabus.indexOf(normTopic, chemIndex);
      if (secondIndex >= 0) {
        index = secondIndex;
      }
    }

    console.log(`\n=========================================`);
    console.log(`AtomId: ${id}`);
    console.log(`Matched topic: ${topic}`);
    console.log(`-----------------------------------------`);
    // Print 300 characters before and 200 characters after the index
    const startPos = Math.max(0, index - 300);
    const endPos = Math.min(cleanSyllabus.length, index + normTopic.length + 300);
    const snippet = cleanSyllabus.slice(startPos, endPos);
    console.log(`Snippet: ... ${snippet} ...`);
  } else {
    // Try a fuzzy search using the first 30 characters of the topic
    const fuzzyTopic = normTopic.slice(0, 50);
    let indexFuzzy = normSyllabus.indexOf(fuzzyTopic);
    const chemIndex = normSyllabus.indexOf('physical chemistry');
    if (indexFuzzy < chemIndex) {
      const secondIndex = normSyllabus.indexOf(fuzzyTopic, chemIndex);
      if (secondIndex >= 0) {
        indexFuzzy = secondIndex;
      }
    }
    if (indexFuzzy >= 0) {
      console.log(`\n=========================================`);
      console.log(`AtomId (FUZZY): ${id}`);
      console.log(`Topic: ${topic}`);
      console.log(`-----------------------------------------`);
      const startPos = Math.max(0, indexFuzzy - 300);
      const endPos = Math.min(cleanSyllabus.length, indexFuzzy + fuzzyTopic.length + 300);
      const snippet = cleanSyllabus.slice(startPos, endPos);
      console.log(`Snippet: ... ${snippet} ...`);
    } else {
      console.log(`\n=========================================`);
      console.log(`AtomId (NOT FOUND): ${id}`);
      console.log(`Topic: ${topic}`);
    }
  }
});
