const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base\\docs\\patch_safety\\rc_digibook_automated_private_scale_25_to_51_20260902';
const factTsvPath = path.join(baseDir, '17_353_FACT_COVERAGE.tsv');
const shaIndexTsvPath = path.join(baseDir, '20_FIFTY_ONE_SHA256_INDEX.tsv');
const accepted51TsvPath = path.join(baseDir, '02_ACCEPTED_51_DENOMINATOR.tsv');

if (fs.existsSync(factTsvPath)) {
  const factLines = fs.readFileSync(factTsvPath, 'utf8').trim().split('\n');
  console.log(`17_353_FACT_COVERAGE.tsv has ${factLines.length} lines. Header: ${factLines[0]}`);
  console.log(`First 3 data lines:`, factLines.slice(1, 4));
}

if (fs.existsSync(shaIndexTsvPath)) {
  const shaLines = fs.readFileSync(shaIndexTsvPath, 'utf8').trim().split('\n');
  console.log(`20_FIFTY_ONE_SHA256_INDEX.tsv has ${shaLines.length} lines. Header: ${shaLines[0]}`);
  console.log(`First 3 data lines:`, shaLines.slice(1, 4));
}

if (fs.existsSync(accepted51TsvPath)) {
  const acceptedLines = fs.readFileSync(accepted51TsvPath, 'utf8').trim().split('\n');
  console.log(`02_ACCEPTED_51_DENOMINATOR.tsv has ${acceptedLines.length} lines. Header: ${acceptedLines[0]}`);
  console.log(`First 3 data lines:`, acceptedLines.slice(1, 4));
}
