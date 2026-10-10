const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allLibFiles = getFilesRecursively(path.join(rootDir, 'lib'));
console.log(`Total Dart files in lib/: ${allLibFiles.length}`);

const crucibleFiles = allLibFiles.filter(f => f.includes('crucible'));
const testArenaFiles = allLibFiles.filter(f => f.includes('test_arena') || f.includes('test_engine') || f.includes('test_analysis'));
const diagnosticFiles = allLibFiles.filter(f => f.includes('diagnostic') || f.includes('smart_entry') || f.includes('placement') || f.includes('baseline'));
const digibookFiles = allLibFiles.filter(f => f.includes('digibook'));
const syllabusFiles = allLibFiles.filter(f => f.includes('syllabus'));
const personalizationFiles = allLibFiles.filter(f => f.includes('personalization'));
const masteryFiles = allLibFiles.filter(f => f.includes('mastery') || f.includes('risk') || f.includes('knowledge'));

console.log(`\n--- CRUCIBLE FILES (${crucibleFiles.length}) ---`);
crucibleFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));

console.log(`\n--- TEST ARENA FILES (${testArenaFiles.length}) ---`);
testArenaFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));

console.log(`\n--- DIAGNOSTIC FILES (${diagnosticFiles.length}) ---`);
diagnosticFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));

console.log(`\n--- DIGIBOOK FILES (${digibookFiles.length}) ---`);
digibookFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));

console.log(`\n--- SYLLABUS FILES (${syllabusFiles.length}) ---`);
syllabusFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));

console.log(`\n--- PERSONALIZATION FILES (${personalizationFiles.length}) ---`);
personalizationFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));

console.log(`\n--- MASTERY / RISK / KNOWLEDGE FILES (${masteryFiles.length}) ---`);
masteryFiles.forEach(f => console.log('  -', path.relative(rootDir, f)));
