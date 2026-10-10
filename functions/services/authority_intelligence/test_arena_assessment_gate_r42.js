'use strict';
const { testArenaEligibility } = require('./domain_c_taught_gate_r41');
function selectTestArenaContent(candidates, authorityById) {
  return (Array.isArray(candidates) ? candidates : []).filter((candidate) => testArenaEligibility(candidate, authorityById[candidate.authorityId]).ok);
}
module.exports = Object.freeze({ selectTestArenaContent });
