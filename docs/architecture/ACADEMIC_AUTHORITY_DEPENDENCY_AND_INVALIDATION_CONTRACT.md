# RankCrackers — Academic Authority Dependency & Invalidation Contract v1.0

## Purpose
Define deterministic propagation when upstream official truth or internal academic authority changes.

## Dependency graph
Official Evidence → Mission/Cycle → Effective Blueprint → OSA → DSD/Atoms → DigiBook Material → Teaching Execution → Taught Content Authority → Question Knowledge Dependencies → Question Publication Eligibility → Crucible/Test Arena eligibility → Student Projection.

PYQ is a parallel evidence/enrichment graph attached to Mission/Cycle/Event/Atoms/Questions; its absence is non-blocking.

## Change classes
EDITORIAL_NON_SEMANTIC; CLARIFICATION; APPLICABILITY_CHANGE; SCOPE_ADD; SCOPE_REMOVE; DEPTH_CHANGE; BLUEPRINT_CHANGE; ANSWER_AUTHORITY_CHANGE; EVIDENCE_WITHDRAWAL; CONFLICT_DISCOVERED.

## Impact principle
Invalidate the smallest provably affected downstream set. Never global-reset a Mission when deterministic dependency edges identify a narrower impact.

## States
VALID; IMPACT_REVIEW_REQUIRED; STALE; BLOCKED; SUPERSEDED; REVALIDATED; WITHDRAWN.

## Propagation
A new official version is ingested immutably, diffed against effective authority, classified, then traverses dependency edges. Each downstream object records reason, upstream source/version, impact timestamp and required repair/review.

## Learner history
Past teaching, attempts and results remain historical facts. Invalidation changes future authority/eligibility; it does not erase what occurred. Materially wrong prior scoring/content may create explicit correction/regrade/remediation events.

## PYQ changes
New PYQ alone normally enriches. A newly acquired final/revised final key can change answer authority and trigger question/solution/regrade impact. A PYQ exposing apparent syllabus anomaly opens controlled boundary review; it never silently expands OSA.

## Recovery
Revalidation requires the affected authority gates to pass against current upstream versions. No manual “green” flag may bypass evidence.

## Acceptance tests
syllabus scope removal invalidates dependent material/questions; unrelated atoms remain valid; blueprint track change affects only applicable track; revised final key triggers answer impact; new ordinary PYQ does not invalidate DigiBook; editorial typo can preserve semantic authority after classification; historical learner events remain; repaired objects reference new versions; unresolved conflict fails closed.
