# RANKCRACKERS — CRUCIBLE MICRO/MACRO EXAM-BLUEPRINT DERIVATION SPECIFICATION

Document ID: RC-CRUCIBLE-MMS-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Draft / Founder Direction Incorporated
Authority Level: Subordinate Crucible sizing and composition contract
Extends:
- CRUCIBLE_98_DAY_DAY_BY_DAY_CORE_OPERATING_SPECIFICATION.md
- CRUCIBLE_ASSESSMENT_EXECUTION_CONTRACT.md
Depends On:
- UNIVERSAL_MISSION_EXAMINATION_BLUEPRINT_AND_STUDENT_PROJECTION_CONTRACT.md
- DIGIBOOK_AND_TAUGHT_CONTENT_AUTHORITY_CONTRACT.md
- QUESTION_ATOMIC_INTEGRITY_AND_KNOWLEDGE_CLOSURE_SPECIFICATION.md
Conflict Rule: official examination truth and higher constitutional contracts win. This document never invents exam structure.

## 1. Founder Law
Micro/Macro size, duration and composition are not universal hard-coded numbers.
They are deterministically derived from the latest VERIFIED_EFFECTIVE official examination blueprint for the exact Mission + Stage + Paper, then constrained by valid Taught Authority and Crucible purpose.

## 2. Authority Chain
Official Notification/Scheme/Corrigendum
-> Verified Mission Blueprint Version
-> Stage Blueprint
-> Paper Blueprint
-> Section/Component Blueprint
-> Crucible Derivation Policy Version
-> Micro/Macro Instance Blueprint
-> Question Selection
-> Attempt Evidence.

No AI guess, historical convention, coaching pattern or previous recruitment silently overrides verified official authority.

## 3. Multi-Stage / Multi-Paper Identity
Every assessment surface is independently identified:
MissionID
ExamBlueprintVersion
StageID
PaperID
SectionID/ComponentID where applicable.

Preliminary, Mains, Paper-I, Paper-II, language papers, qualifying papers and merit papers must not be averaged into one synthetic paper.
Each paper derives its own Crucible sizing/composition policy.

## 4. Required Official Inputs
For each paper capture, where officially defined:
total questions/items
total marks
official duration
question/item types
section/subject distribution
section question counts/marks
compulsory/optional rules
negative marking
qualifying/merit role
sectional timing
minimum/maximum attempt rules
choice structure
medium/translation rules
other official constraints.

Unknown official facts remain UNKNOWN; they are never guessed.

## 5. Blueprint Readiness Gate
Sizing state:
NOT_DERIVABLE if the official scheme is insufficient to establish the paper's assessable structure.
DERIVABLE_PARTIAL if some dimensions can be safely derived but others remain unknown.
DERIVABLE_COMPLETE only when all dimensions needed by the applicable derivation mode are verified.

Student-facing Crucible must fail closed for any dimension whose safe derivation is impossible.

## 6. Derivation Modes
A paper is classified from verified official structure:
A. COUNT_TIMED — objective/countable items with total item count and duration.
B. MARK_TIMED — descriptive/constructed response where marks and duration are the reliable scale.
C. MIXED — multiple item families requiring component-wise derivation.
D. SPECIAL — practical/interview/skill/physical/oral or other format requiring an explicitly approved specialist policy.

No COUNT_TIMED formula may be forced onto a non-count paper.

## 7. Official Density
For COUNT_TIMED paper p:
official_item_rate(p) = official_question_count(p) / official_duration_minutes(p).
official_seconds_per_item(p) = 60 / official_item_rate(p).

For MARK_TIMED paper p:
official_mark_rate(p) = official_total_marks(p) / official_duration_minutes(p).

For MIXED papers, density is computed separately per governed component when official evidence supports it.

These are reference densities, not claims that every question has equal difficulty or time cost.

## 8. Crucible Calendar Is Fixed
Within every 14-day phase:
Micro: relative Days 2,4,6,8,10,12.
Day 13: Rebuild; no new scheduled syllabus allocation and no seventh Micro.
Day 14: Macro integration.
Across 98 days: 42 Micro + 7 Rebuild + 7 Macro.
Major Test remains in Test Arena, not Crucible.

## 9. Taught-Boundary Law
Official blueprint defines exam shape and ceiling.
Taught Authority defines current assessment eligibility.
Therefore:
EligibleKnowledge = EffectivePaperScope ∩ ValidTaughtKnowledgeBoundary ∩ QuestionKnowledgeClosed.

Planned, released, opened or merely viewed content is not automatically testable.
No sizing formula may compensate for insufficient eligible knowledge by widening scope.

## 10. Assessment Budget Policy
The exact scale is produced by a versioned Crucible Derivation Policy, not by AI discretion.
For each StageID + PaperID, the policy contains:
micro_time_fraction
macro_time_fraction
micro_min_minutes / micro_max_minutes
macro_min_minutes / macro_max_minutes
rounding rule
minimum viable item count/marks
section representation rules
coverage floors
difficulty/cognitive envelopes
retention/weakness allocation bounds
security/repetition rules.

These coefficients are governance parameters. They are derived/approved once against the verified paper type and remain immutable for that policy version. Runtime adaptation cannot change them.

## 11. Deterministic Duration Formula
For paper duration T:
MicroTargetMinutes = CLAMP(T × micro_time_fraction, micro_min_minutes, micro_max_minutes).
MacroTargetMinutes = CLAMP(T × macro_time_fraction, macro_min_minutes, macro_max_minutes).

If official sectional timing exists, component budgets are derived from those official timings rather than an invented whole-paper average.

## 12. Deterministic Count Formula — COUNT_TIMED
RawMicroCount = official_item_rate × MicroTargetMinutes.
RawMacroCount = official_item_rate × MacroTargetMinutes.

MicroQuestionCount = APPLY_APPROVED_ROUNDING(RawMicroCount).
MacroQuestionCount = APPLY_APPROVED_ROUNDING(RawMacroCount).

Counts are then checked against:
eligible question availability
section/component constraints
minimum coverage
knowledge-closure validity
repetition/security constraints.

If constraints cannot be met, result is COVERAGE_GAP or POLICY_CONFLICT; the system does not silently resize outside policy.

## 13. Deterministic Scale — MARK_TIMED
RawMicroMarks = official_mark_rate × MicroTargetMinutes.
RawMacroMarks = official_mark_rate × MacroTargetMinutes.

The system builds an item/task set whose governed marks/time envelope approximates the derived budget while preserving official response character and taught scope.
Question-count parity is not required for descriptive papers.

## 14. Mixed Paper Law
For MIXED papers:
derive each component independently using its official count/marks/time evidence;
preserve mandatory component rules;
combine only after component validity passes.

A dominant easy component may not consume another component's required representation merely to hit a global count.

## 15. Micro Purpose and Composition
Micro is a diagnostic pulse, not a miniature Major Test.
It samples only eligible knowledge from:
recent taught frontier
unresolved weakness
retention-due knowledge
exam-relevant reasoning/cognitive demand.

Every selected item retains QuestionID + QuestionVersion + KnowledgeDependency + Atom/DSD lineage.
Adaptive weighting may alter WHICH eligible questions are selected inside the approved envelope; it may not alter the envelope or syllabus authority.

## 16. Six-Micro Progression
Micro 1-6 are not six unrelated tests.
Each consumes previous Diagnostic Delta and current Taught Boundary.
Later Micros may carry bounded repair/retention probes from earlier Micros.
A failed Micro never authorizes untaught content.

## 17. Day 13 Rebuild
Day 13 consumes:
six Micro attempt sets
Days 1-12 teaching/taught evidence
atom/micro-topic weakness
misconception recurrence
retention debt
repair history
difficulty-band behavior.

It produces a personalized Rebuild Plan from already authorized/released material.
Verification probes are repair evidence, not Micro 7.

## 18. Macro Purpose and Composition
Macro is phase-level integration/retention assessment.
It must represent the phase's eligible taught knowledge broadly enough to test integration while preserving the exact paper's relevant official character.
It is not six Micros concatenated.
It cannot test a planned-but-untaught atom.

## 19. Coverage-Limited Macro
When derived Macro size exceeds what can be validly populated from eligible taught knowledge:
1. do not widen syllabus;
2. do not use unclosed questions;
3. do not duplicate items merely to fill quota;
4. emit COVERAGE_LIMITED;
5. build the largest policy-valid Macro only if the approved policy explicitly permits bounded reduction;
6. otherwise fail closed and surface the coverage gap.

## 20. Official Change / Corrigendum
Any effective official change affecting stage, paper, questions, marks, duration, sections, marking or rules creates/requires a new ExamBlueprintVersion.
The system re-derives future Crucible policy applicability.
Historical tests and attempts remain bound to their original:
ExamBlueprintVersion
DerivationPolicyVersion
QuestionVersions
TaughtBoundary fingerprint.

No historical rewrite.

## 21. Question/Progress Identity
Required analytics lineage:
StudentAttemptID
-> TestInstanceID
-> TestBlueprintID
-> QuestionID
-> QuestionVersion
-> KnowledgeDependencyID
-> AtomID/DSD node
-> MicroTopic/Topic where defined
-> Subject/Component
-> PaperID
-> StageID
-> MissionID
-> ExamBlueprintVersion.

Student progress and empirical question hardness are derived from this lineage, never from fragile text matching.

## 22. Test Arena Boundary
Crucible Micro/Macro and Test Arena Major/full simulations share Mission/Stage/Paper/Question authority but have different purposes.
Major/full exam simulation belongs to Test Arena.
Crucible Macro must not silently become a full Major merely because sufficient questions exist.

## 23. Notification-Pending Missions
Before a current verified official blueprint exists, the system may preserve historical/reference structures as non-authoritative evidence, but must label them accordingly.
A future recruitment's exact Micro/Macro sizing is not FINAL until the applicable official examination structure is verified.
Once verified, the derivation is reproducible from blueprint + policy version.

## 24. Anti-Overengineering Rule
Independent runtime entities are required only where identity/version/review/invalidation/audit lifecycle is independent.
Fine-grained traceability does not require one database document/service per micro-unit.
Logical precision and runtime decomposition are separate decisions.

## 25. Acceptance Tests
Must prove:
- one-stage one-paper derivation;
- Pre + Mains remain separate;
- Paper-I + Paper-II remain separate;
- different durations produce different bounded sizes under the same policy;
- official sectional timing is respected;
- objective vs descriptive derivation mode differs correctly;
- mixed paper preserves component rules;
- untaught knowledge is blocked;
- insufficient eligible questions fail closed;
- Day 13 never becomes Micro 7;
- Day 14 Macro remains Crucible, not Major;
- corrigendum creates new blueprint applicability without rewriting history;
- QuestionID lineage reaches exact atom/DSD and paper/stage/mission;
- historical attempts remain reproducible.

## 26. Final Constitutional Statement
CALENDAR is globally deterministic.
EXAM SHAPE is official-blueprint authoritative.
SIZE/DURATION are blueprint-derived through a versioned deterministic policy.
CONTENT is adaptively selected only inside that envelope.
ELIGIBILITY is constrained by valid Taught Authority + Question Knowledge Closure.
HISTORY is immutable and version-bound.
AI may select within authority; AI may not invent authority.
