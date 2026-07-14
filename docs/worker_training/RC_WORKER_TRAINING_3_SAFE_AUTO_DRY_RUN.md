# RC-WORKER-TRAINING-3 SAFE_AUTO Dry-Run Scheduler

## 1. Purpose

This phase simulates how SAFE_AUTO would select the next pagewise extraction tasks without enabling automation, applying extraction, writing Firestore data, or touching student delivery.

## 2. Why Dry-Run Exists Before Real SAFE_AUTO

SAFE_AUTO must be rehearsed before it can run. The dry-run proves that the scheduler can choose safe tasks, avoid AUTO_DETECT, respect batch limits, avoid duplicates, and produce a reviewable run plan.

## 3. Selection Rules

The scheduler requires active non-AUTO_DETECT tasks, no processing tasks on the document, no failed tasks unless RETRY_FAILED mode is used, no duplicate page extraction risk, valid document and page range metadata, no student delivery side-effect risk, and a maximum batch size of 3.

Continuation of an already partially completed safe document is preferred over starting a new large document when risk is otherwise low.

## 4. Eligibility Rules

A candidate task must be active, non-AUTO_DETECT, not completed, not failed, not processing, have a document ID, have a valid page range, and have no existing page_extractions for the selected pages.

## 5. Risk Scoring

Risk considers AUTO_DETECT, duplicate page risk, failed task risk, missing document ID, invalid page range, processing state, missing metadata, student delivery risk, and a continuation bonus for safe partially completed documents.

## 6. Expected Run Plan Format

The dry-run emits a console-only plan with mode, selected document, selected tasks, expected new page records, AUTO_DETECT inclusion, Firestore write flag, student delivery flag, Pro verification requirement, Founder review requirement, and the next phase.

## 7. Why No Runtime Automation Is Enabled

This phase is only a scheduler audit. SAFE_AUTO remains defined but disabled. No scheduler runtime is created, no worker is enabled, and no extraction is run.

## 8. Recommended Next Phase

If this dry-run remains stable, RC-WORKER-TRAINING-4 may introduce a controlled SAFE_AUTO apply path with the same limit of 3 and the same safety checks.