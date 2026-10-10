'use strict';

const { validateTaughtContentEligibility } = require('./taught_content_eligibility_r40');

function check(domain, request, authority) {
  const result = validateTaughtContentEligibility(request, authority);
  return Object.freeze({ ...result, domain });
}
function assertEligible(domain, request, authority) {
  const result = check(domain, request, authority);
  if (!result.ok) throw new Error(`${domain}_TAUGHT_AUTHORITY_DENIED:${result.code}`);
  return result;
}
module.exports = Object.freeze({
  questionFactoryEligibility: (request, authority) => check('QUESTION_FACTORY', request, authority),
  crucibleEligibility: (request, authority) => check('CRUCIBLE', request, authority),
  testArenaEligibility: (request, authority) => check('TEST_ARENA', request, authority),
  assertEligible
});
