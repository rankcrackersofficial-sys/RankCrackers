const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base\\docs\\patch_safety\\rc_digibook_automated_private_scale_25_to_51_20260902';
const tsv = fs.readFileSync(path.join(baseDir, '02_ACCEPTED_51_DENOMINATOR.tsv'), 'utf8');
const lines = tsv.trim().split('\n');
const header = lines[0].split('\t');

console.log('--- ALL 51 DIGIBOOK GUS ---');
lines.slice(1).forEach((l, idx) => {
  const parts = l.split('\t');
  console.log(`${idx + 1}. [${parts[1]}] ${parts[2]} (${parts[4]}) -> Facts: ${parts[5]}, Source: ${parts[6]}`);
});
