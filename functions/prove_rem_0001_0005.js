const fs = require('fs');
const path = require('path');

const digibookWorktree = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base';

console.log('=== FORENSIC PROOF OF REM_0001..0005 IN DIGIBOOK WORKTREE ===');

function searchInDir(dir, filterStr) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      searchInDir(full, filterStr);
    } else if (item.endsWith('.tsv') || item.endsWith('.json') || item.endsWith('.md')) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(filterStr)) {
          console.log(`Found "${filterStr}" in: ${path.relative(digibookWorktree, full)}`);
          // print matching lines
          const lines = content.split('\n');
          lines.forEach((l, idx) => {
            if (l.includes(filterStr)) {
              console.log(`  Line ${idx + 1}: ${l.trim().substring(0, 160)}`);
            }
          });
        }
      } catch (e) {}
    }
  }
}

console.log('\n--- Searching for REM_0001 ---');
searchInDir(path.join(digibookWorktree, 'docs'), 'GU_JEEMAIN2027_PHY_REM_0001');

console.log('\n--- Searching for REM_0002 ---');
searchInDir(path.join(digibookWorktree, 'docs'), 'GU_JEEMAIN2027_PHY_REM_0002');
