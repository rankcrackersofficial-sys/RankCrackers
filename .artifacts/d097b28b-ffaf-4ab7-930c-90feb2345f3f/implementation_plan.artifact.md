# PERS-REV-01 Revision Closed-Loop Implementation

This plan implements the governed revision closed-loop logic in the personalization feature, as requested by the user. It involves updating the revision queue models and implementing the closed-loop engine based on the frozen contract.

## User Review Required

> [!IMPORTANT]
> The `StudentRevisionQueueState` enum will be expanded to include contract-mandated states: `completed`, `rescheduled`, and `blockedByStaleAafVersion`. This might affect existing UI components that switch over this enum.

## Proposed Changes

### Personalization Feature

#### [MODIFY] [student_revision_queue.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/personalization/domain/models/student_revision_queue.dart)
- Update `StudentRevisionQueueState` to match the contract:
    - `overdue`
    - `dueToday`
    - `evidenceNeeded`
    - `completed`
    - `rescheduled`
    - `maintenance`
    - `blockedByStaleAafVersion`
    - `upcoming`

#### [MODIFY] [student_revision_queue_engine.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/personalization/domain/engines/student_revision_queue_engine.dart)
- Add `RevisionTriggerType` and `RevisionItemPriority` enums.
- Add `StudentRevisionClosedLoopCandidate` model.
- Implement `StudentRevisionClosedLoopEngine` with:
    - `filterAndDeduplicate`
    - `computePriority`
    - `isDue`
    - `shouldInvalidate`
    - `processCompletionEvidence`

### Documentation & Governance

#### [NEW] [docs/patch_safety/pers_rev_01_android_studio_implementation_20260818/](file:///C:/RankCrackers/RankCrackers-55/docs/patch_safety/pers_rev_01_android_studio_implementation_20260818/)
Create all required JSON and Markdown reports as specified in the request, including:
- `authority_precheck.json`
- `changed_paths.json`
- `preimage_postimage_hashes.json`
- `revision_trigger_validation.json`
- `revision_deduplication_validation.json`
- `revision_version_binding_validation.json`
- `revision_completion_evidence_validation.json`
- `revision_requeue_validation.json`
- `test_denominators.json`
- `analyze_result.json`
- `runtime_validation.json`
- `governance_counters.json`
- `PERS_REV_01_REPORT.json`
- `PERS_REV_01_REPORT.md`

## Verification Plan

### Automated Tests
- Create a new test file `test/features/personalization/pers_rev_01_closed_loop_test.dart` incorporating the tests from the contract test file.
- Run `flutter test test/features/personalization/pers_rev_01_closed_loop_test.dart`.

### Manual Verification
- Review the generated reports for consistency with the implementation.
