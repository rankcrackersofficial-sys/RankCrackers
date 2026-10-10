'use strict';
const { crucibleEligibility } = require('./domain_c_taught_gate_r41');
function selectCrucibleContent(candidates, authorityById) {
  return (Array.isArray(candidates) ? candidates : []).filter((candidate) => crucibleEligibility(candidate, authorityById[candidate.authorityId]).ok);
}
module.exports = Object.freeze({ selectCrucibleContent });
