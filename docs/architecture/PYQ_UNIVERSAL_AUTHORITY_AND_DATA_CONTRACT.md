# RankCrackers — Universal PYQ Authority & Data Contract v1.0

## Constitutional purpose
This contract governs acquisition, identity, provenance, answer authority, canonicalization, syllabus linkage and safe reuse of Previous Year Questions (PYQs) across heterogeneous examination authorities.

## Prime laws
1. Question authority and answer authority are independent.
2. No source is called official unless issued or hosted by the competent examination authority or otherwise cryptographically/provenance-bound to it.
3. Latest effective Final/Revised Final official answer key is authoritative when available.
4. Provisional/challenge-stage keys are not operational answer authority.
5. Missing official final answer never permits an AI/coaching/publisher answer to be labelled official.
6. Commercial/coaching compilations are recovery/discovery evidence, never official authority by themselves.
7. No artificial historical-year limit applies to official PYQ discovery.
8. PYQs are evidence of past examinations; they never expand current syllabus authority.

## Canonical identity
Authority → Mission → Recruitment/Examination Cycle → Exam Event → Stage → Component/Paper → Track/Applicability → Language → Shift/Session (when applicable) → Booklet/Series/Set (when applicable) → Question Appearance.

Fields that an authority does not use MUST remain null/not-applicable; they MUST NOT be fabricated.

## Canonical Question vs Question Appearance
A Canonical Question represents proven semantic identity. A Question Appearance preserves the exact authority-facing occurrence: wording, option order, question number/ID, diagrams, language, booklet/set, date and shift.
Two appearances MUST NOT be merged by fuzzy similarity alone. Equivalence requires deterministic evidence or human review.

## Evidence objects
Official Question Paper Evidence and Official Answer Key Evidence are separate immutable evidence objects, each retaining authority, source URI/location, acquisition time, document hash, page/section locator, publication/effective metadata and lineage.

## Answer authority states
- OFFICIAL_FINAL_VERIFIED
- OFFICIAL_REVISED_FINAL_VERIFIED
- OFFICIALLY_DROPPED_OR_DELETED
- OFFICIAL_KEY_RELEASED_NOT_ACQUIRED
- OFFICIAL_ANSWER_NOT_ESTABLISHED
- RANKCRACKERS_VERIFIED_NONOFFICIAL
- ANSWER_CONFLICT_REVIEW_REQUIRED

A later valid Revised Final Key supersedes the earlier Final Key operationally; superseded evidence remains auditable.

## Answer representation
Answers support: option label, authority option ID, numeric/integer/decimal value, multiple accepted answers where explicitly official, dropped/deleted/cancelled status, and authority-specific scoring treatment. Mapping MUST bind to the exact Question Appearance.

## Historical recovery
If an official paper is unavailable but a reputable publication contains a purported PYQ, ingest only as HISTORICAL_PYQ_SOURCE_UNVERIFIED. Preserve publisher/source provenance. Never promote to OFFICIAL_PYQ without independent official evidence.

## Repository model
Central Question Repository:
A. PYQ Bank — historical examination questions with explicit provenance.
B. RankCrackers Question Bank — internally authored/generated questions, separately reviewed.
No item may silently cross classes.

## Syllabus linkage
Every usable PYQ may map to historical syllabus/DSD atoms and separately to current effective syllabus status:
CURRENT_SCOPE / HISTORICAL_SCOPE_ONLY / UNMAPPED_REVIEW_REQUIRED.
Historical frequency or popularity cannot authorize out-of-syllabus teaching.

## Fail-closed laws
Ambiguous event, paper, shift, set, question identity, key version or mapping blocks official-answer promotion. Evidence conflicts block publication of an official answer until resolved.
