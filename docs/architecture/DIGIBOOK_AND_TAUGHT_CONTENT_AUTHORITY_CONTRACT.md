# RankCrackers — DigiBook & Taught Content Authority Contract v1.0

## 1. Purpose
Govern transformation of verified syllabus atoms into teachable material and establish exactly when knowledge becomes eligible for assessment.

## 2. Constitutional laws
- Syllabus/OSA/DSD defines WHAT; Pedagogy/Subject Teacher defines HOW; DigiBook is the actual taught material.
- DigiBook cannot create, enlarge or repair syllabus authority.
- PYQ is optional enrichment, never a DigiBook prerequisite.
- Content authored ≠ reviewed ≠ released ≠ taught.
- Assessment authority arises only from verified scope plus applicable Taught Content Authority.
- AI may propose content; deterministic authority/review gates authorize states.

## 3. Required input identity
Mission, Cycle/Blueprint version, Stage/Component/Track applicability, OSA version, DSD/Atom version, mission academic boundary profile.

## 4. Teaching Unit
A Teaching Unit binds one or more verified atoms to a pedagogical execution. Required fields include teachingUnitId, missionId, blueprintVersion, syllabusVersion, atomRefs, applicabilityRefs, subjectTeacherPolicyVersion, pedagogyVersion, materialVersion, language, prerequisites, depthCeiling, learningObjectives, explanationBlocks, workedExamples, misconceptions, practiceRefs, sourceRefs, reviewState and supersession lineage.

## 5. Scope containment
Every substantive claim, fact, method, formula, exception and worked-example dependency must be attributable to an in-scope verified atom or explicitly allowed prerequisite/general reasoning rule. Extra helpful exposition may clarify; it may not introduce examinable substantive knowledge outside authority.

## 6. Depth and difficulty
Depth ceiling derives from Mission Academic Boundary Profile and blueprint/syllabus evidence. Pedagogy may increase clarity and reasoning challenge without silently increasing substantive scope/depth.

## 7. Shared vs specialized teaching
Shared Teaching Units may be reused only when scope, depth, meaning and applicability are equivalent. Track/subject/optional-specific content must remain conditionally projected. Reuse is by canonical reference, not copy divergence.

## 8. Material lifecycle
DRAFT → SOURCE_BOUND → PEDAGOGY_REVIEWED → ACADEMIC_REVIEWED → RELEASE_ELIGIBLE → RELEASED.
Invalidation states: STALE, SUPERSEDED, BLOCKED, WITHDRAWN.
No state transition may erase evidence lineage.

## 9. Teaching Execution
Material availability does not prove teaching. A Teaching Execution records learner/cohort/context, exact material version, atom coverage, start/completion evidence, required interactions and completion policy.

## 10. Taught Content Authority
Taught authority is granular and versioned. It is granted only when:
Mission active; Blueprint applicable; OSA/DSD/Atom valid; material RELEASED; Teaching Execution satisfies completion policy; no upstream invalidation is open.
Authority binds learner/context + atom + materialVersion + teachingExecutionId + grantedAt + validity state.

## 11. Partial teaching
Partial lesson completion grants only the deterministically proven taught subset. A parent atom is not automatically taught because one child was completed, and child completion is not inferred from parent exposure.

## 12. Revision
Editorial change with no semantic effect may preserve authority only after classified non-substantive equivalence. Any substantive change creates a new material version and impact analysis. Upstream syllabus/blueprint changes trigger re-evaluation.

## 13. PYQ enrichment
Verified PYQs may inform examples, emphasis, style and historical context within existing scope. PYQ absence never blocks teaching. PYQ discovery after release may enrich a future material version without invalidating correct existing teaching unless it reveals an authority conflict.

## 14. Failure states
ATOM_UNVERIFIED; APPLICABILITY_UNRESOLVED; DEPTH_UNRESOLVED; MATERIAL_SCOPE_LEAK; SOURCE_GAP; REVIEW_INCOMPLETE; MATERIAL_STALE; TEACHING_NOT_PROVEN; UPSTREAM_INVALIDATED.

## 15. Assessment handoff
Only valid taught atoms/dependencies are exported to Question Knowledge Closure. DigiBook never directly publishes a scored assessment.

## 16. Student projection
Student sees coherent lessons, progress and contextual practice—not OSA/DSD IDs, authority graphs or review machinery. Track/subject-specific material appears only when applicable.

## 17. Acceptance tests
1. zero-PYQ mission can build DigiBook;
2. unverified atom cannot enter released material;
3. out-of-scope fact blocks release;
4. wrong-track unit is not projected;
5. draft/reviewed material does not create taught authority;
6. released-but-unopened material is not taught;
7. partial completion grants only proven subset;
8. substantive revision versions material;
9. upstream invalidation propagates;
10. PYQ later discovered enriches without becoming syllabus authority;
11. AI confidence cannot bypass review;
12. shared content reuse cannot merge non-equivalent depth;
13. stale material cannot grant new authority;
14. exact material version is retained in teaching evidence;
15. Student UI hides backend normalization.
