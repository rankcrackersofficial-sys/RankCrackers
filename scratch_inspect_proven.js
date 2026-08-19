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
    return true;
  });
}

const atoms = flattenAtoms(tree);
console.log("Total atoms:", atoms.length);

let verifiedCount = 0;
let pendingCount = 0;

for (const atom of atoms) {
  const unitTrusted = atom.unit && !/^General Unit$/i.test(atom.unit);
  const chapterTrusted = atom.chapter && !/^General Chapter$/i.test(atom.chapter);
  if (unitTrusted && chapterTrusted) {
    verifiedCount++;
  } else {
    pendingCount++;
  }
}

console.log("Verified (Trusted Unit/Chapter):", verifiedCount);
console.log("Pending (General Unit/Chapter):", pendingCount);
