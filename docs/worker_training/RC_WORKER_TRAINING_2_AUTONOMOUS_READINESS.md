# RC-WORKER-TRAINING-2 Autonomous Readiness

## 1. Purpose

This phase provides a read-only audit for future SAFE_AUTO processing. It does not enable automation, run extraction, write Firestore data, or publish student content.

## 2. Current Policy State

RC-WORKER-TRAINING-1 defined worker modes, AUTO_DETECT restrictions, batch limits, safety requirements, and Pro verification policy. SAFE_AUTO exists as a future production mode but is not enabled.

## 3. Current Baseline

The accepted Post-P13 baseline is 104 total pagewise tasks, 70 active, 31 completed, 3 failed, 0 processing, and 96 page extraction records.

## 4. Document Readiness Model

Documents are evaluated by task state, page extraction coverage, duplicate risk, source proof coverage, review lock coverage, empty text risk, AUTO_DETECT policy, failed tasks, and student delivery side-effect risk.

Readiness status is for future SAFE_AUTO dry-run evaluation only. It is not approval for real autonomous execution.

## 5. Queue Readiness Model

The audit previews up to three active tasks using policy constraints. A candidate must be active, non-AUTO_DETECT, non-failed, non-processing, have a valid document ID, have a valid page range, and avoid duplicate page extraction writes.

## 6. Pro Verification Readiness Model

The audit checks whether policy categories exist and whether top-level queue/report collections are already present. Missing collections are reported as schema gaps only; this phase does not create them.

## 7. SAFE_AUTO Dry-Run Prerequisites

SAFE_AUTO dry-run requires policy prerequisites, clean baseline, non-AUTO_DETECT candidate selection, duplicate prevention, valid page ranges, source proof expectations, review lock expectations, and no student delivery writes.

## 8. Why Runtime Automation Is Not Enabled Yet

The system must first prove read-only readiness, then scheduler dry-run, then controlled SAFE_AUTO apply. This avoids accidental page extraction writes, AUTO_DETECT mixing, or student delivery side effects.

## 9. Recommended Next Phase

RC-WORKER-TRAINING-3 should add a SAFE_AUTO dry-run scheduler that selects tasks and emits a plan without writing Firestore data.