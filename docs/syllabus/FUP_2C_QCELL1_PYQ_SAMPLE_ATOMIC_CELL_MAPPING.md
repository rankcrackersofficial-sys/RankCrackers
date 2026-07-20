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


## QCELL2-DECISION1 Cross-reference

Founder decision locked: `APPROVE_210_CONCEPT_READY_CANONICAL_WRITE_AND_HOLD_12_DUPLICATES`. Future QCELL3 preflight count is 211 candidates: 210 concept-ready plus 1 direct safe candidate. 12 duplicate Physics atoms remain held and 1 rejected atom remains excluded. No write was authorized by DECISION1.

