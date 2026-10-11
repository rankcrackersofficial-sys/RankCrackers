'use strict';

/** Skip Firebase queue side effects only inside Jest workers. */
function shouldBypassQueueForTest(jestWorkerId) {
  return typeof jestWorkerId === 'string' && jestWorkerId.length > 0;
}

module.exports = { shouldBypassQueueForTest };
