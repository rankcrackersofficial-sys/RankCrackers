const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('=== COMMITTING ALL CHANGES TO ESTABLISH PHYSICAL GIT LINEAGE ===');

try {
  execSync('git add lib/ docs/ functions/', { cwd: rootDir });
  const commitOutput = execSync('git commit -m "Execute Gate-13 canonical GU identity, fail-closed routing adapters, and 100-day Crucible constitution reconciliation"', { cwd: rootDir }).toString();
  console.log('Commit Output:\n', commitOutput);
  
  const headSha = execSync('git rev-parse HEAD', { cwd: rootDir }).toString().trim();
  const parentSha = execSync('git rev-parse HEAD~1', { cwd: rootDir }).toString().trim();
  const branch = execSync('git branch --show-current', { cwd: rootDir }).toString().trim();
  const status = execSync('git status --porcelain', { cwd: rootDir }).toString().trim();
  
  console.log('\n--- GIT PHYSICAL LINEAGE ---');
  console.log('ACTUAL_CURRENT_HEAD_FULL_SHA:', headSha);
  console.log('PARENT_SHA:', parentSha);
  console.log('CURRENT_BRANCH:', branch);
  console.log('WORKTREE_DIRTY_COUNT:', status ? status.split('\n').length : 0);
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
