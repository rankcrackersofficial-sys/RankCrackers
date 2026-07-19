# RC-WORKER-TRAINING-6 Baseline Alignment

## Purpose

Align worker-training baseline audits to the current accepted Post-P14 pagewise reality before a clean RX6C retry.

## Why RX6C Retry Was Blocked

RX6C-FIX0 showed that worker-training validation still expected the old WT4 baseline while the live pagewise state had advanced through P14/R13. RX6C retry must wait until baseline dependency audits agree with the current state.

## Old WT4 Baseline

- Total: 104
- Active: 67
- Completed: 34
- Failed: 3
- Processing: 0
- Page Extractions: 105

## Current Post-P14 Baseline

- Total: 104
- Active: 64
- Completed: 37
- Failed: 3
- Processing: 0
- Page Extractions: 118

## Stale Audits

- `audit:worker-training:post-wt4-result` remains historical/stale and is no longer the active gate.
- `audit:worker-training:post-p14-result` is the active worker baseline audit.

## What Was Aligned

- Added `functions/audit_worker_training_post_p14_result.js`.
- Added `audit:worker-training:post-p14-result` package command.
- Aligned autonomous readiness expected baseline to Post-P14.
- Aligned safe-auto dry-run expected baseline to Post-P14.

## Safety Confirmations

- No extraction apply was run.
- No Firestore writes were run.
- SAFE_AUTO was not enabled.
- No live scheduler was started.
- No syllabus_atoms, topic_nodes, student_mission_catalog, Crucible, DigiBook, PYQ, or Downloads flow was touched.

## Next Phase Recommendation

If this phase is accepted, the next phase is `FUP-2C-RX6C-RETRY — Clean Expansion Write Dry-Run`.