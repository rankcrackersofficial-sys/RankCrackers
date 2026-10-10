const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== FORENSIC WORKSPACE SCAN INITIALIZATION ===');

// 0. GIT PREFLIGHT
const rootDir = path.join(__dirname, '..');
let headSha = '', parentSha = '', currentBranch = '', gitStatus = '';
try {
  headSha = execSync('git rev-parse HEAD', { cwd: rootDir }).toString().trim();
  parentSha = execSync('git rev-parse HEAD~1', { cwd: rootDir }).toString().trim();
  currentBranch = execSync('git branch --show-current', { cwd: rootDir }).toString().trim();
  gitStatus = execSync('git status --short', { cwd: rootDir }).toString().trim();
} catch (e) {
  console.error('Git preflight error:', e.message);
}

console.log('WORKSPACE_PATH:', rootDir);
console.log('CURRENT_BRANCH:', currentBranch);
console.log('CURRENT_HEAD_FULL_SHA:', headSha);
console.log('PARENT_SHA:', parentSha);
console.log('UNCOMMITTED_FILES_COUNT:', gitStatus ? gitStatus.split('\n').length : 0);

// 1. SCAN DIRECTORIES IN LIB/FEATURES
const featuresDir = path.join(rootDir, 'lib', 'features');
const features = fs.existsSync(featuresDir) ? fs.readdirSync(featuresDir) : [];

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
console.log(`Total files in lib/: ${allLibFiles.length}`);

// Look for specific modules
const crucibleFiles = allLibFiles.filter(f => f.includes('crucible'));
const testArenaFiles = allLibFiles.filter(f => f.includes('test_arena') || f.includes('test_engine') || f.includes('test_analysis'));
const diagnosticFiles = allLibFiles.filter(f => f.includes('diagnostic') || f.includes('smart_entry') || f.includes('placement') || f.includes('baseline'));
const syllabusFiles = allLibFiles.filter(f => f.includes('syllabus'));
const digibookFiles = allLibFiles.filter(f => f.includes('digibook'));
const personalizationFiles = allLibFiles.filter(f => f.includes('personalization'));

console.log(`Crucible files (${crucibleFiles.length}):`, crucibleFiles.map(f => path.relative(rootDir, f)));
console.log(`Test Arena files (${testArenaFiles.length}):`, testArenaFiles.map(f => path.relative(rootDir, f)));
console.log(`Diagnostic files (${diagnosticFiles.length}):`, diagnosticFiles.map(f => path.relative(rootDir, f)));
console.log(`DigiBook files (${digibookFiles.length}):`, digibookFiles.map(f => path.relative(rootDir, f)));
console.log(`Syllabus files (${syllabusFiles.length}):`, syllabusFiles.map(f => path.relative(rootDir, f)));
console.log(`Personalization files (${personalizationFiles.length}):`, personalizationFiles.map(f => path.relative(rootDir, f)));
