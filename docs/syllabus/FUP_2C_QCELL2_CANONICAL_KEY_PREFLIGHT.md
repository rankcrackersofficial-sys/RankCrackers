# FUP-2C-QCELL2 — CanonicalKey Write Preflight

Purpose: prepare a deterministic, read-only canonicalKey plan before PYQ/Sample atomic question cells are created.

Current coverage: 430 syllabus atoms, 206 with canonicalKey, 224 missing canonicalKey.

Candidate formula: `{missionId}|{subject}|{hierarchyPath or unit/chapter/topic}|{atomTitle}` after deterministic normalization. No timestamps, no review status, no random Firestore IDs.

Future target: `mission_realms/jee_main_2026/syllabus_atoms/{atomId}`.
Future operation: `UPDATE_CANONICAL_KEY_ONLY`.

Allowed future fields only: `canonicalKey`, `canonicalKeyGeneratedByPhase`, `canonicalKeyGeneratedAt`, `canonicalKeySource`, `updatedAt`.
Forbidden future fields: review/approval, student delivery, source content, title/hierarchy edits, publish, DigiBook, Crucible.

Hold policy: rejected atoms excluded; legacy/no-source atoms held; source-review atoms held; duplicate/missing title/hierarchy atoms held. QCELL2 writes nothing.

Impact: question mapping must not use atoms without canonicalKey unless a separately approved stable key alternative exists.

Safety: no Firestore write, no canonicalKey write, no question cell write, no mapping write, no question_bank migration, no topic_nodes publish, no student delivery change, no AI/OCR/Pro AI, no deploy.

## HOLD1 Follow-up

QCELL2 found only 1 immediately safe canonicalKey candidate and 223 held atoms. See `FUP_2C_QCELL2_HOLD1_CANONICAL_HOLD_RESOLUTION.md` for hold-resolution classification before any canonicalKey write is approved.
