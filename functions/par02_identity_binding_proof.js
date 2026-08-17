const fs = require('fs');

const ledger = JSON.parse(fs.readFileSync('docs/patch_safety/aaf_006n_r1_real_wave1_552_claim_primary_independent_verification_20260817/real_wave1_primary_verification_ledger.json', 'utf8'));
const inventory = JSON.parse(fs.readFileSync('docs/patch_safety/aaf_006n_par01_chatgpt_wave1_552_cross_audit_harness_20260817/wave1_552_input_inventory.json', 'utf8'));

const inventoryMap = {};
inventory.claims.forEach(c => inventoryMap[c.claimId] = c);

let bound = 0;
let missing = 0;

ledger.entries.forEach(e => {
    const inv = inventoryMap[e.claimId];
    if (inv) {
        // Prove binding of missing fields
        const matchesOriginalAmtn = inv.originalAmtnId === e.originalAmtnId;
        const matchesSemanticTopic = inv.canonicalSemanticTopicId === e.canonicalSemanticTopicId;
        const matchesClaimHash = inv.claimContentHash === e.claimHash;

        if (matchesOriginalAmtn && matchesSemanticTopic && matchesClaimHash) {
            bound++;
        } else {
            console.log('Mismatch for:', e.claimId);
            missing++;
        }
    } else {
        missing++;
    }
});

console.log('Bound:', bound);
console.log('Missing:', missing);
console.log('Total Ledger Entries:', ledger.entries.length);
