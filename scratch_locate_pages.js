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

// Split syllabusText into pages
const pages = [];
const pageRegex = /--- PAGE (\d+) ---/g;
let match;
let lastIndex = 0;
let lastPageNum = null;

while ((match = pageRegex.exec(syllabusText)) !== null) {
  if (lastPageNum !== null) {
    pages.push({
      pageNum: lastPageNum,
      text: syllabusText.slice(lastIndex, match.index)
    });
  }
  lastPageNum = match[1];
  lastIndex = pageRegex.lastIndex;
}
if (lastPageNum !== null) {
  pages.push({
    pageNum: lastPageNum,
    text: syllabusText.slice(lastIndex)
  });
}

// Map each held atom to its page
heldIds.forEach(id => {
  const detail = atomDetails[id];
  if (!detail) return;
  const topic = detail.topic || '';
  const normTopic = topic.toLowerCase().replace(/\s+/g, ' ').replace(/\u2013/g, '-').replace(/\u2014/g, '-').trim();

  let matchedPage = null;
  let score = 0;

  for (const page of pages) {
    const cleanText = page.text.replace(/\t/g, ' ').replace(/\n/g, ' ');
    const normText = cleanText.toLowerCase().replace(/\s+/g, ' ').replace(/\u2013/g, '-').replace(/\u2014/g, '-');
    
    // Check for exact substring match
    if (normText.includes(normTopic)) {
      matchedPage = page.pageNum;
      break;
    }
  }

  // If exact match fails, try fuzzy word checking (percentage of words in topic that are present in the page text)
  if (!matchedPage) {
    const topicWords = normTopic.split(/[^a-z0-9]+/i).filter(w => w.length > 2);
    let bestPage = null;
    let bestScore = 0;

    for (const page of pages) {
      const normText = page.text.toLowerCase();
      let matchCount = 0;
      topicWords.forEach(w => {
        if (normText.includes(w)) matchCount++;
      });
      const pct = matchCount / topicWords.length;
      if (pct > bestScore) {
        bestScore = pct;
        bestPage = page.pageNum;
      }
    }
    if (bestScore > 0.7) {
      matchedPage = bestPage;
      score = bestScore;
    }
  }

  console.log(`\nAtomId: ${id}`);
  console.log(`  Topic: ${topic}`);
  if (matchedPage) {
    console.log(`  Matched Page: ${matchedPage} ${score > 0 ? `(Fuzzy Score: ${score.toFixed(2)})` : '(Exact Match)'}`);
    // Print all UNIT headers in this page and the previous 2 pages to help us assign
    const pgNum = Number(matchedPage);
    let contextHeader = '';
    for (let p = Math.max(1, pgNum - 1); p <= pgNum; p++) {
      const pageData = pages.find(pd => Number(pd.pageNum) === p);
      if (pageData) {
        const unitsOnPage = [...pageData.text.matchAll(/(UNIT|UNITS)\s+([IV\d\-\s]+):?\s+([A-Z\s\-\,]+)/gi)];
        unitsOnPage.forEach(um => {
          contextHeader += `[Page ${p}] ${um[0].replace(/\s+/g, ' ').trim()} | `;
        });
      }
    }
    console.log(`  Context Units: ${contextHeader || 'None found on this or previous page'}`);
  } else {
    console.log(`  [NOT FOUND ON ANY PAGE]`);
  }
});
