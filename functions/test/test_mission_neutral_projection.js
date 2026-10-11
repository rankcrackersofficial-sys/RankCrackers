'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMissionNeutralProjectionNode } =
  require('../services/mission_neutral_projection');

const sha = 'b'.repeat(64);
function request(missionId) {
  return { missionId, sourceVersionId: 'srcv_1', sourceSha256: sha, activationEpoch: 1 };
}
function node(extra = {}) {
  return {
    id: 'node_001', nodeType: 'topic', subjectId: 'Philosophy',
    runId: 'source_bound_run_1', canonicalTitle: 'Ethics', sourceOrder: 0,
    ...extra,
  };
}

test('any mission gets identical no-preference projection with optional paper scope', () => {
  for (const missionId of ['jee_main_2026', 'neet_(ug)-2027', 'ssc_cgl', 'future_exam']) {
    const row = buildMissionNeutralProjectionNode({
      node: node(), nodeId: 'node_001', request: request(missionId),
    });
    assert.equal(row.missionId, missionId);
    assert.equal(row.subjectId, 'Philosophy');
    assert.equal(row.paperId, null);
    assert.equal(row.runId, 'source_bound_run_1');
    assert.equal(row.canonicalTitle, 'Ethics');
  }
});

test('declared paper and subject always win over historical JEE defaults', () => {
  const row = buildMissionNeutralProjectionNode({
    node: node({ runId: 'any_authorized_run', subjectId: 'History', paperId: 'PAPER_B' }),
    nodeId: 'node_001',
    request: request('new_exam'),
  });
  assert.equal(row.runId, 'any_authorized_run');
  assert.equal(row.subjectId, 'History');
  assert.equal(row.paperId, 'PAPER_B');
});

test('missing or mismatched source-bound projection metadata fails closed', () => {
  const invalidNodes = [
    { runId: null },
    { subjectId: '' },
    { nodeType: '' },
    { canonicalTitle: '' },
    { sourceOrder: null },
    { missionId: 'other_exam' },
    { sourceVersionId: 'wrong_version' },
    { sourceSha256: '0'.repeat(64) },
    { paperId: '' },
  ];
  for (const change of invalidNodes) {
    assert.throws(() => buildMissionNeutralProjectionNode({
      node: node(change), nodeId: 'node_001', request: request('new_exam'),
    }), /MISSION_PROJECTION_/);
  }
});

test('projection cannot trust missing run and subject even for original JEE mission', () => {
  assert.throws(() => buildMissionNeutralProjectionNode({
    node: { id: 'node_001', nodeType: 'topic', canonicalTitle: 'Old Topic', sourceOrder: 0 },
    nodeId: 'node_001', request: request('jee_main_2026'),
  }), /MISSION_PROJECTION_RUN_ID_REQUIRED/);
});
