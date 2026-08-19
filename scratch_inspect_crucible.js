const fs = require('fs');
const plan = JSON.parse(fs.readFileSync('assets/data/preview/jee_main_2027/crucible_preview_plan.json', 'utf8'));

console.log("=== MACRO TEST SLOTS ===");
console.log(JSON.stringify(plan.macroTestSlots, null, 2));
