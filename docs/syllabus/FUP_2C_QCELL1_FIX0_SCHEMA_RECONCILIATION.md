# FUP-2C-QCELL1-FIX0 — Schema Reconciliation

Mode: read-only audit and documentation fix only.

## Canonical Key Readiness

Atomic question cells require stable syllabus atom identity. Atoms missing `canonicalKey` need a separate preflight/write authorization.

## Existing Question Bank Policy

Existing `question_bank` records are legacy/unmapped unless they already contain atom mapping, canonical key, source proof, source kind, and confidence. No migration happens in FIX0.

## Pagewise Baseline Drift

Pagewise extraction state moved independently from QCELL work. FIX0 captures current baseline only and does not align pagewise baselines.

## Confirmed Non-Actions

No Firestore write, no syllabus atom mutation, no question bank mutation, no atomic question cell write, no topic_nodes write, no student delivery change, no AI/OCR/Pro AI call, no deploy.
