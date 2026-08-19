const fs = require('fs');
const path = require('path');

const tree = JSON.parse(fs.readFileSync('assets/data/preview/jee_main_2027/syllabus_preview_tree.json', 'utf8'));

function flattenAtoms(node) {
  const atoms = [];
  const walk = (item) => {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item.atoms)) {
      for (const atom of item.atoms) atoms.push(atom);
    }
    if (Array.isArray(item.children)) {
      for (const child of item.children) walk(child);
    }
    if (Array.isArray(item.subjects)) {
      for (const subject of item.subjects) walk(subject);
    }
  };
  walk(node);
  const seen = new Set();
  return atoms.filter((atom) => {
    if (!atom.atomId || seen.has(atom.atomId)) return false;
    seen.add(atom.atomId);
    return atom.previewOnly === true && atom.studentPublishReady === false;
  });
}

const atoms = flattenAtoms(tree);
console.log("Total filtered atoms:", atoms.length);

const subjectCounts = {};
for (const atom of atoms) {
  const key = `${atom.subject || 'UNKNOWN'}_${atom.sourceTraceStatus || 'MISSING'}`;
  subjectCounts[key] = (subjectCounts[key] || 0) + 1;
}
console.log("Counts:", subjectCounts);
