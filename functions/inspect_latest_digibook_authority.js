const fs = require('fs');
const path = require('path');

const digibookWorktree = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base';

console.log('=== INSPECTING LATEST DIGIBOOK WORKTREE VIA FS ===');

// Check patch_safety directory in digibook worktree
const patchSafetyDir = path.join(digibookWorktree, 'docs', 'patch_safety');
if (fs.existsSync(patchSafetyDir)) {
  const dirs = fs.readdirSync(patchSafetyDir);
  console.log('Patch safety directories:', dirs);
  
  dirs.forEach(d => {
    const full = path.join(patchSafetyDir, d);
    if (fs.statSync(full).isDirectory()) {
      const files = fs.readdirSync(full);
      console.log(`Contents of ${d} (${files.length} files):`, files.slice(0, 10));
    }
  });
}
