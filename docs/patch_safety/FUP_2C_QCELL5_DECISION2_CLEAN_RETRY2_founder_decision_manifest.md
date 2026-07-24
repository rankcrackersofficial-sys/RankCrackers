# FUP-2C-QCELL5-DECISION2-CLEAN-RETRY2
# Founder Decision Manifest for 8 Legacy Duplicate Pairs

## Current Accepted Baseline

Mission: jee_main_2026  
Current safe HEAD: 28ca7e2a8f6955ff7857c06df02776dadb51a8f5  
Academic/QCELL base: db07c05f1f474e6e8340c5ce8407cd2d1bf4544e  

QCELL5 evidence:
- Total syllabus atoms: 430
- canonicalKey present: 417
- canonicalKey missing: 13
- existing atomic_question_cells: 0
- proposed empty question cells: 417

Missing canonicalKey breakdown:
- Rejected excluded: 1
- Legacy duplicate of canonical atom: 4
- Legacy duplicate but no canonical pair: 8

## Founder Decision Required

The 8 legacy duplicate-but-no-canonical-pair atoms must be excluded from QCELL6 unless Founder chooses a separate canonicalKey repair phase.

## Recommended Founder Decision

APPROVE_EXCLUDE_8_LEGACY_DUPLICATE_PAIRS_FROM_QCELL6

## Reason

These 8 atoms are old Physics legacy duplicate pairs. They have duplicate semantic identity, verified/founder-approved legacy fields, but no canonicalKey and no clean source/canonical lineage. Including them in QCELL6 would create duplicate/ambiguous question cells.

The accepted question-cell preflight remains:
- 417 canonical-key atoms become proposed empty atomic question cells.
- 12 legacy missing atoms excluded from QCELL6.
- 1 rejected atom excluded from QCELL6.

## Strict Boundary

This decision does NOT:
- write Firestore
- create atomic_question_cells
- write canonicalKey
- mutate syllabus_atoms
- publish topic_nodes
- touch student delivery
- run QCELL6
- generate DigiBook/Crucible
- deploy

## Founder Approval Phrase

APPROVE_EXCLUDE_8_LEGACY_DUPLICATE_PAIRS_FROM_QCELL6

## Final Decision Status

PENDING_FOUNDER_APPROVAL
