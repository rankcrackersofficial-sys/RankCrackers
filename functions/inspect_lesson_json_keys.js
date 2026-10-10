const fs = require('fs');
const path = require('path');

const lessonsDir = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base\\docs\\patch_safety\\rc_digibook_automated_private_scale_25_to_51_20260902\\lessons';
const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));

console.log('Sample file:', files[0]);
const sample = JSON.parse(fs.readFileSync(path.join(lessonsDir, files[0]), 'utf8'));
console.log('Sample keys:', Object.keys(sample));
console.log('Sample payload snapshot:', JSON.stringify(sample, null, 2).slice(0, 1000));
