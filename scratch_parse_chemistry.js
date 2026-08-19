const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.join(__dirname, 'docs', 'patch_safety', 'jee_syllabus_text.txt'), 'utf8');
const lines = text.split('\n');

lines.forEach((line, index) => {
  if (line.includes('CHEMISTRY') || line.includes('UNIT') || line.includes('Unit')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
