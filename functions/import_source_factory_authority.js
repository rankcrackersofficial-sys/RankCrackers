const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== RC_CRUCIBLE_SOURCE_FACTORY_EXACT_AUTHORITY_IMPORT_AND_675_QUESTION_REBIND_AUDIT_05 ===');

const sourceFactoryWorktree = 'C:\\RankCrackers\\RankCrackers-55.worktrees\\digibook-real-factory-base';
const canaryDir = path.join(sourceFactoryWorktree, 'docs', 'patch_safety', 'rc_digibook_source_to_atomicfact_first_5_canonical_gu_canary_20260902');

const new28JsonPath = path.join(canaryDir, 'NEW_VERIFIED_FACTS_28.json');
const total381JsonPath = path.join(canaryDir, 'TOTAL_VERIFIED_FACTS_381.json');

console.log('Checking existence of canary JSON files:');
console.log('NEW_VERIFIED_FACTS_28.json exists:', fs.existsSync(new28JsonPath));
console.log('TOTAL_VERIFIED_FACTS_381.json exists:', fs.existsSync(total381JsonPath));

let new28Content = '';
let total381Content = '';
let new28Sha256 = '';
let total381Sha256 = '';
let facts28 = [];
let facts381 = [];

if (fs.existsSync(new28JsonPath)) {
  new28Content = fs.readFileSync(new28JsonPath, 'utf8');
  new28Sha256 = crypto.createHash('sha256').update(new28Content).digest('hex');
  facts28 = JSON.parse(new28Content);
} else {
  // If in main repo or relative path, check alternate locations
  console.log('Searching alternate paths...');
}

if (fs.existsSync(total381JsonPath)) {
  total381Content = fs.readFileSync(total381JsonPath, 'utf8');
  total381Sha256 = crypto.createHash('sha256').update(total381Content).digest('hex');
  facts381 = JSON.parse(total381Content);
}

console.log('Computed Hashes:');
console.log('NEW_28_JSON_SHA256:', new28Sha256);
console.log('TOTAL_381_JSON_SHA256:', total381Sha256);
console.log('Facts 28 parsed length:', facts28.length);
console.log('Facts 381 parsed length:', facts381.length);
