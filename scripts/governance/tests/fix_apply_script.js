const fs = require('fs');

const targetPath = 'C:/RankCrackers/RankCrackers-55.worktrees/governance-living-checklist/scripts/governance/apply_checklist_mutation.js';
let content = fs.readFileSync(targetPath, 'utf8');

const regex = /const itemsStr = JSON\.stringify\(master\.items\);\s*master\.current_ledger_hash = crypto\.createHash\('sha256'\)\.update\(itemsStr\)\.digest\('hex'\);/;
const replacement = "const { computeLedgerHash } = require('./canonical_serializer');\n  master.current_ledger_hash = computeLedgerHash(master);";

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully updated apply_checklist_mutation.js with regex.');
} else {
  console.log('Regex match failed.');
}
