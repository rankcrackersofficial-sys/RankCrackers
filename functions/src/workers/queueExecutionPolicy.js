'use strict';

const PAGE_EXTRACTION_TASK = 'pagewise_text_extraction_batch';

/** Skip Firebase queue side effects only inside Jest workers. */
function shouldBypassQueueForTest(jestWorkerId) {
  return typeof jestWorkerId === 'string' && jestWorkerId.length > 0;
}

/** Production quarantine remains in force for every legacy queue task. */
function shouldQuarantineLegacyQueueInProduction(taskType, jestWorkerId) {
  return !shouldBypassQueueForTest(jestWorkerId) && taskType !== PAGE_EXTRACTION_TASK;
}

module.exports = {
  PAGE_EXTRACTION_TASK,
  shouldBypassQueueForTest,
  shouldQuarantineLegacyQueueInProduction,
};
