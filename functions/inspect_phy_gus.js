const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'digibook_authority_bridge_manifest.json'), 'utf8'));
const phyGUs = manifest.lessons.filter(l => l.subject === 'Physics');

console.log('Physics GUs count:', phyGUs.length);
phyGUs.forEach((g, idx) => {
  console.log(`GU ${idx}: ${g.guId} (Facts: ${g.atomicFactIds.length}) -> ${g.canonicalNodeId}`);
});
