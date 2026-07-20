# FUP-2C-QCELL2-DECISION1 — Founder CanonicalKey Hold Decision Policy

Purpose: lock the Founder governance decision after QCELL2-HOLD1 before any canonicalKey controlled write preflight.

HOLD1 input summary: 430 total syllabus atoms, 206 already have canonicalKey, 224 are missing canonicalKey. Missing bucket split: 1 direct safe candidate, 210 concept-ready Founder-decision candidates, 12 duplicate Physics atoms, and 1 rejected atom.

Founder decision applied: `APPROVE_210_CONCEPT_READY_CANONICAL_WRITE_AND_HOLD_12_DUPLICATES`.

Counting interpretation: the direct safe candidate is separate from the 210 Founder-approval-needed candidates. Future QCELL3 preflight should therefore plan 211 canonicalKey candidates, while holding 12 duplicates and excluding 1 rejected atom.

Approved canonical preflight group: 210 concept-ready atoms plus 1 direct safe candidate. This is schema/cell-readiness approval only, not academic approval and not student visibility.

Duplicate hold group: 12 Physics duplicate title/hierarchy atoms remain held. Deterministic disambiguation is required. Random suffixes and timestamp suffixes are forbidden. AtomId fallback is not allowed now and requires a future Founder approval phase.

Rejected exclusion policy: the rejected atom remains excluded from canonicalKey write, atomic question cells, PYQ/sample mapping, DigiBook usage, and Crucible usage. It can return only through an explicit Founder restore/review phase.

No-write safety lock: this phase writes no Firestore data, no canonicalKey, no question cells, no question mappings, and no syllabus atom mutations.

DigiBook usage policy: canonicalKey is infrastructure, not content approval. DigiBook may use mapped PYQ/sample questions only after atom canonicalKey exists, question cell exists, mapped questions are approved/safe evidence, and student publish locks remain intact.

Crucible usage policy: Crucible may use cells for practice load only after canonicalKey exists, cell exists, question counts are verified, and the practice plan is Founder approved.

Student publish lock: question cells and canonicalKey infrastructure must never auto-publish to students.

Recommended next phase: `READY_FOR_QCELL3_CANONICAL_WRITE_PREFLIGHT`.

Exact Founder decision phrase: `APPROVE_210_CONCEPT_READY_CANONICAL_WRITE_AND_HOLD_12_DUPLICATES`.
