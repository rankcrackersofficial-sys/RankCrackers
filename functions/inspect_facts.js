const fs = require('fs');
const path = require('path');

const worktreeDocs = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base\\docs';

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    try {
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        scanDir(full);
      } else {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('FFBCADBA') || text.includes('2F036D79') || text.includes('30B893F7')) {
          console.log('FOUND EXACT CANARY FILE:', full);
          const lines = text.split('\n');
          lines.forEach((l, i) => {
            if (l.includes('AF_GU_JEEMAIN2027_PHY_REM_') || l.includes('FFBCADBA') || l.includes('2F036D79')) {
              console.log(`L${i+1}: ${l.trim().substring(0, 160)}`);
            }
          });
        }
      }
    } catch(e) {}
  }
}

console.log('Scanning worktree docs...');
scanDir(worktreeDocs);

const mainDocs = 'C:\\RankCrackers\\RankCrackers-55\\docs';
console.log('Scanning main repo docs...');
scanDir(mainDocs);
