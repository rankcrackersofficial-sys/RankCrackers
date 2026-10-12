'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PAIR_CONTRACT_VERSION } = require('../services/mission_official_source_pair');
const { isQueueWorkerOwnedMissionTask } = require('../services/sentinel_queue_ownership');

test('legacy Sentinel cannot compete for governed mission source-pair jobs', () => {
  assert.equal(isQueueWorkerOwnedMissionTask({
    type: 'MISSION_SOURCE_PAIR', queueContract: PAIR_CONTRACT_VERSION, status: 'received',
  }), true);
  assert.equal(isQueueWorkerOwnedMissionTask({
    type: 'UNRECOGNIZED', queueContract: PAIR_CONTRACT_VERSION, status: 'received',
  }), true);
  assert.equal(isQueueWorkerOwnedMissionTask({ task_type: 'MISSION_SOURCE_PAIR', status: 'received' }), true);
});

test('legacy Sentinel cannot consume pagewise jobs owned by governed queueWorker', () => {
  assert.equal(isQueueWorkerOwnedMissionTask({ type: 'pagewise_text_extraction_batch' }), true);
  assert.equal(isQueueWorkerOwnedMissionTask({ task_type: 'pagewise_text_extraction_batch' }), true);
});

test('mission ownership guard does not globally disable legacy Sentinel tasks', () => {
  assert.equal(isQueueWorkerOwnedMissionTask({ type: 'recruitment', status: 'received' }), false);
  assert.equal(isQueueWorkerOwnedMissionTask({ type: 'pdfParse', status: 'received' }), false);
  assert.equal(isQueueWorkerOwnedMissionTask(null), false);
});
