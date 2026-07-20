# FUP-2C-QCELL2-HOLD1 — Canonical Hold Resolution

Purpose: resolve canonicalKey hold buckets so future PYQ/Sample atomic question cells can safely feed DigiBook pattern evidence and The Crucible practice planning.

QCELL2 found 430 atoms, 206 canonicalKey-present atoms, and 224 missing canonicalKey atoms. HOLD1 classifies title recovery, weak source review, duplicate disambiguation, and rejected exclusion.

Deterministic recovery policy: `jee_main_2026|{subject_norm}|{path_norm}|{title_norm}`. AtomId fallback is allowed only for duplicate disambiguation after Founder approval. Random suffixes, timestamps, and Firestore random IDs are forbidden.

Rejected atoms are excluded from atomic_question_cells, PYQ/Sample mapping, DigiBook pattern usage, Crucible practice usage, topic_nodes, and student publish until explicitly restored.

Question cells do not mean student publish. DigiBook and Crucible usage need later Founder approval.

Recommended next phase: FUP-2C-QCELL2-HOLD2 Founder Hold Decision / Policy Approval, then retry canonicalKey write preflight.

Safety locks: no Firestore write, no canonicalKey write, no question cell write, no mapping write, no question_bank migration, no topic_nodes publish, no student delivery change, no AI/OCR/Pro AI, no DigiBook/Crucible generation, no deploy.

## QCELL2-DECISION1 Cross-reference

Founder decision locked: `APPROVE_210_CONCEPT_READY_CANONICAL_WRITE_AND_HOLD_12_DUPLICATES`. Future QCELL3 preflight count is 211 candidates: 210 concept-ready plus 1 direct safe candidate. 12 duplicate Physics atoms remain held and 1 rejected atom remains excluded. No write was authorized by DECISION1.

