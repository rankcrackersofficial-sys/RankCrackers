# FUP-2C-QCELL3 — CanonicalKey Controlled Write Preflight

Purpose: prepare the exact future canonicalKey update manifest after Founder decision policy lock, without writing Firestore.

DECISION1 input: `APPROVE_210_CONCEPT_READY_CANONICAL_WRITE_AND_HOLD_12_DUPLICATES` approved 210 concept-ready atoms plus 1 direct safe candidate for future canonicalKey write preflight. 12 duplicate Physics atoms stay held and 1 rejected atom stays excluded.

211 update manifest summary: future target is `mission_realms/jee_main_2026/syllabus_atoms/{atomId}`. Future operation is `UPDATE_CANONICAL_KEY_ONLY`. Manifest count is exactly 211. Write allowed now is false.

CanonicalKey formula: `jee_main_2026|{subject_norm}|{path_norm}|{title_norm}`. It is deterministic, lowercase, punctuation-normalized, subject-bounded, and uses no timestamps, random suffixes, Firestore random IDs, review status, or UI labels.

Collision gate: proposed vs existing collisions 0, proposed internal collisions 0, malformed proposed keys 0, missing atomId 0, missing subject 0, missing title/derivedTitle 0, missing hierarchy/path 0, duplicate-held atoms included 0, rejected atoms included 0. Verdict: `COLLISION_GATE_PASS`.

Field gate: future QCELL4 may update only canonicalKey-related fields: `canonicalKey`, `canonicalKeyGeneratedByPhase`, `canonicalKeySource`, `canonicalKeyDecisionSource`, `canonicalKeyDecisionPhrase`, `canonicalKeyGeneratedAt`, and `updatedAt`. Review, approval, title/source, question-cell, and student-delivery fields are forbidden. Verdict: `FIELD_GATE_PASS`.

Held duplicate policy: 12 duplicate Physics atoms remain outside this manifest. Random suffix and timestamp suffix are forbidden. AtomId fallback is not allowed in QCELL3 and requires a future Founder-approved disambiguation phase.

Rejected exclusion policy: 1 rejected atom remains excluded from canonicalKey write, atomic question cells, PYQ/sample mapping, DigiBook usage, and Crucible usage unless Founder explicitly restores it later.

Future QCELL4 write plan: QCELL4 must be a separate approved live write phase. It may update only allowed canonicalKey fields for the 211 manifest atoms and must include a write runId, before/after evidence, post-write audit, and rollback plan.

Future rollback plan: rollback must not delete atoms. It may only clear generated canonicalKey fields for docs where `canonicalKeyGeneratedByPhase = FUP_2C_QCELL4_CANONICAL_KEY_WRITE`, the future runId matches, and atomId is in the manifest. It must not touch topic_nodes, student delivery, question cells, DigiBook, or Crucible.

Atomic question cell impact: current canonicalKey cells 206; future canonicalKey updates 211; projected possible cells after QCELL4 417; held duplicate cells 12; excluded rejected cells 1. Question mapping still requires a later cell-write and mapping-worker phase.

DigiBook/Crucible impact: DigiBook may later use cells as pattern containers only after cell creation, PYQ/sample mapping, and approval. Crucible may later use verified cell counts for practice load only after planning approval. QCELL3 generates nothing.

Student publish lock: canonicalKey preflight and future canonicalKey write must not publish student content.

Recommended next phase: `READY_FOR_QCELL4_CANONICAL_KEY_CONTROLLED_WRITE`.
