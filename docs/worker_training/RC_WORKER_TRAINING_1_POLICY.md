# RC-WORKER-TRAINING-1 Policy

## 1. Purpose

This policy establishes the first official operating contract for RankCrackers AI workers. It defines worker modes, safety requirements, Pro verification expectations, and the boundary between manual calibration and future autonomous processing.

## 2. Manual P-Batches Are Calibration Only

Current controlled pagewise batches are not the final production workflow. They exist to prove safe task selection, source proof creation, review locks, duplicate prevention, parent side-effect blocking, student delivery isolation, and baseline drift detection.

Manual P-batches remain available only as MANUAL_DEBUG mode for calibration, incident review, and narrowly supervised recovery.

## 3. Future Production Uses SAFE_AUTO

SAFE_AUTO is the intended production mode, but it is not enabled by this phase. Future SAFE_AUTO work must keep small batches, readiness audits, post-run audits, no silent AUTO_DETECT processing, no student publishing, and Founder approval before any delivery change.

## 4. Worker Modes

- SAFE_AUTO: guarded automatic processing with strict limits and no student publish.
- MANUAL_DEBUG: human-triggered calibration/debug mode, currently limited to 3 tasks.
- RETRY_FAILED: controlled retry mode for failed or stuck tasks only.
- PRO_VERIFY: verification-only mode for quality/risk review.
- DISABLED: worker stopped.

The default mode is MANUAL_DEBUG until a later phase explicitly enables SAFE_AUTO.

## 5. AUTO_DETECT Policy

AUTO_DETECT is disabled by default. It requires separate approval, must never be mixed silently with normal pagewise batches, and must have explicit audit evidence before it can run.

## 6. Batch Policy

Manual debug limit is 3. SAFE_AUTO initial limit is also 3. Retry attempts are limited to 2. Readiness audit and post-run audit are mandatory.

## 7. Safety Requirements

Every worker path must require duplicate page checks, source proof, review locks, empty text detection, parent side-effect blocking, student delivery blocking, baseline drift detection, and Founder approval before publish.

## 8. Pro Verifier Policy

Pro verification is mandatory for syllabus, PYQ, notification, answer key, cutoff, result, exam rules, low-confidence output, weak or empty text, duplicate risk, and a random sample from every extraction run.

The Pro verifier can block unsafe output. It cannot publish. Founder final approval remains required.

## 9. Founder Approval Gate

No extraction, structured output, or Pro verification result is publishable by itself. Founder approval is the final gate before any student-visible destination can change.

## 10. Student Delivery Isolation

Student delivery remains separate from extraction and verification. Page extractions, structured outputs, and review queues must not write to student_mission_catalog or topic_nodes unless a later publish-gate contract allows it.

## 11. Future Phases

- RC-WORKER-TRAINING-2: read-only autonomous readiness audit.
- RC-WORKER-TRAINING-3: SAFE_AUTO dry-run scheduler.
- RC-WORKER-TRAINING-4: SAFE_AUTO controlled apply with batch limit 3.
- RC-WORKER-TRAINING-5: document progress dashboard.
- RC-WORKER-TRAINING-6: failed/stuck retry policy.
- RC-WORKER-TRAINING-7: Pro verification queue design.
- RC-WORKER-TRAINING-8: Pro verification dry-run.
- RC-WORKER-TRAINING-9: Founder review queue integration.
- RC-WORKER-TRAINING-10: publish gate contract.