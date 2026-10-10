const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'academic_review', 'digibook_authority_bridge_manifest.json'), 'utf8'));
const phyGUs = manifest.lessons.filter(l => l.subject === 'Physics');

console.log('Sample nodeIds:', phyGUs.map(g => g.canonicalNodeId));
console.log('Testing filter for U02:');
const u02 = phyGUs.filter(g => g.canonicalNodeId.toLowerCase().includes('u02'));
console.log('U02 matches:', u02.map(g => g.canonicalNodeId));
