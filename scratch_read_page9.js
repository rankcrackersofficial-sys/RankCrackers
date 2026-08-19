const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.join(__dirname, 'docs', 'patch_safety', 'jee_syllabus_text.txt'), 'utf8');
const pages = text.split(/--- PAGE \d+ ---/);

console.log('=== PAGE 9 FULL ===');
console.log(pages[9]);
