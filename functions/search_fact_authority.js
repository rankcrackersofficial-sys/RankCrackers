const fs = require('fs');
const path = require('path');

console.log('=== SEARCHING FOR AUTHENTIC ATOMICFACT 28 / 381 JSON/TSV FILES ===');

const searchDirs = [
  'C:\\RankCrackers\\RankCrackers-55\\docs',
  'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base'
];

function findFiles(dir, matchName) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    try {
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        results = results.concat(findFiles(full, matchName));
      } else if (item.toLowerCase().includes(matchName.toLowerCase()) || item.endsWith('.json') || item.endsWith('.tsv')) {
        results.push(full);
      }
    } catch (e) {}
  }
  return results;
}

searchDirs.forEach(d => {
  console.log(`Searching in ${d}...`);
  const files = findFiles(d, 'fact');
  files.forEach(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      if (content.includes('GU_JEEMAIN2027_PHY_REM_0001') || content.includes('FFBCADBA') || content.includes('2F036D79')) {
        console.log(`MATCH in file: ${f}`);
        // print a sample
        const lines = content.split('\n');
        lines.filter(l => l.includes('GU_JEEMAIN2027_PHY_REM_')).slice(0, 10).forEach(l => console.log('  ', l.trim().substring(0, 150)));
      }
    } catch (e) {}
  });
});
