# FUP-2C-QCELL1 — PYQ / Sample Atomic Cell Mapping

PYQ and Sample Questions must not be stored randomly. They will map to syllabus atomic-topic cells after extraction and Founder review.

Target backend shape: `mission_realms/{missionId}/atomic_question_cells/{canonicalKey}`.

Current status: architecture/audit only. No Firestore writes, no question migration, no topic_nodes publish, no student delivery change.

## Schema Reconciliation Required

QCELL1-FIX0 found that atomic question cells cannot be safely written until atom identity is stable.

Required before QCELL write:
- all target syllabus atoms must have `canonicalKey`
- rejected atoms must stay excluded
- old `question_bank` records without atom mapping/source proof must remain legacy/unmapped
- PYQ/Sample extraction must attach `atomId`, `canonicalKey`, `questionSourceKind`, source document proof, and mapping confidence

## QCELL2-HOLD1 Cross-Reference

PYQ/Sample atomic cells must wait for canonicalKey hold resolution. HOLD1 confirms duplicate/title/source/rejected policies before any question-cell write or mapping write.

