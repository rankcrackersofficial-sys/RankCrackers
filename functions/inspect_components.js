const fs = require('fs');
const path = require('path');

const lessonsDir = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base\\docs\\patch_safety\\rc_digibook_automated_private_scale_25_to_51_20260902\\lessons';
const file = fs.readdirSync(lessonsDir).find(f => f.endsWith('.json'));
const sample = JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf8'));

console.log('Components keys:', Object.keys(sample.components));
Object.entries(sample.components).forEach(([k, v]) => {
  console.log(`Component [${k}] is Array? ${Array.isArray(v)}, type: ${typeof v}, keys: ${v ? Object.keys(v) : null}`);
});
