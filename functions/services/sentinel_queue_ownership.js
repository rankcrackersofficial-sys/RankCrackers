'use strict';

// Only the governed queueWorker consumes these contracts. The legacy
// Sentinel listener must not race it on the shared ai_queue collection.
const { PAIR_CONTRACT_VERSION } = require('./mission_official_source_pair');

function isQueueWorkerOwnedMissionTask(task) {
  if (!task || typeof task !== 'object') return false;
  return task.queueContract === PAIR_CONTRACT_VERSION
    || task.type === 'MISSION_SOURCE_PAIR'
    || task.task_type === 'MISSION_SOURCE_PAIR'
    || task.type === 'pagewise_text_extraction_batch'
    || task.task_type === 'pagewise_text_extraction_batch';
}

module.exports = { isQueueWorkerOwnedMissionTask };
