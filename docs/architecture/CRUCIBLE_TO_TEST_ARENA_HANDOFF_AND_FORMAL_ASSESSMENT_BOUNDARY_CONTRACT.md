# RANKCRACKERS — CRUCIBLE TO TEST ARENA HANDOFF AND FORMAL ASSESSMENT BOUNDARY CONTRACT

Document ID: RC-ASSESSMENT-CTA-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Architecture / Runtime Not Yet Claimed
Authority Level: Subordinate cross-engine assessment contract
Extends:
- TEST_ARENA_EXECUTION_CONTRACT.md
- CRUCIBLE_ASSESSMENT_EXECUTION_CONTRACT.md
- CRUCIBLE_98_DAY_DAY_BY_DAY_CORE_OPERATING_SPECIFICATION.md
- CRUCIBLE_EXECUTABLE_COMPILER_AND_STATE_MACHINE_CONTRACT.md
Depends On:
- UNIVERSAL_MISSION_EXAMINATION_BLUEPRINT_AND_STUDENT_PROJECTION_CONTRACT.md
- TEACHING_EXECUTION_AND_TAUGHT_MANIFEST_EVIDENCE_CONTRACT.md
- QUESTION_REPOSITORY_AND_KNOWLEDGE_CLOSURE_CONTRACT.md
Conflict Rule: higher verified examination, syllabus, taught-authority and question-closure contracts win. This bridge creates no duplicate authority.

## 1. Purpose
Define the exact boundary, shared authority, evidence handoff and feedback relationship between Crucible mastery execution and Test Arena formal assessment.

## 2. Constitutional Separation
Crucible = learning-cycle assessment for diagnosis, repair, retention and integration.
Test Arena = formal exam-oriented testing/simulation.

Crucible owns:
Micro
Day-13 Rebuild evidence
Macro
phase diagnostic/mastery evidence.

Test Arena owns:
Sectional Test
Major Test
Full-Length Mock
Stage/Component simulation
Historical Paper mode
other explicitly versioned formal test forms.

Major Test MUST NOT execute as a Crucible construct.

## 3. Shared Authority, Separate Engines
Both engines consume the same canonical:
MissionID
CycleID
ExamBlueprintID/version
StageID
ComponentID
Track/applicability
verified syllabus/DSD/atoms
QuestionID/QuestionVersion
scoring-rule authority.

Neither engine copies or forks canonical exam truth.

## 4. Handoff Is Evidence, Not Authority Transfer
Crucible does not grant Test Arena new syllabus/exam authority.
It exports versioned learner evidence:
current valid Knowledge Boundary reference
PhaseState refs
Micro/Macro diagnostics
weakness/retention state
question exposure history
attempt evidence refs
confidence/evidence sufficiency
staleness state.

Test Arena independently re-evaluates its own eligibility and blueprint fidelity at test compilation time.

## 5. Taught Authority Boundary
For current scored Test Arena forms, applicable Taught Authority is required where governing Test Arena policy says so.
A Crucible score or Macro completion alone cannot substitute for Taught Authority.
Historical Paper mode may preserve historical out-of-current-scope content only under its explicitly labelled historical rules and must not leak that content into current mastery authority.

## 6. Major Test Definition
Major Test is a Test Arena formal checkpoint over a policy-defined accumulated eligible preparation boundary larger/broader than a Crucible Macro.

Major Test:
- is not tied to the 14-day Macro role;
- may span multiple Crucible phases;
- is mission/stage/component specific;
- uses formal Test Arena scoring and attempt evidence;
- remains bounded by its eligibility policy;
- does not automatically equal a complete official-paper simulation.

Its trigger/cadence must be separately versioned and cannot be inferred merely from Day 14/28/etc.

## 7. Full-Length Mock Definition
Full-Length Mock is the closest current-pattern RankCrackers simulation of the complete applicable official Stage/Component assessment surface.

Where official facts are verified, it reproduces applicable:
question/item count or governed task structure
duration
marks
negative marking
sections/components
choice/optionality
language/medium rules
section timing
scoring/qualifying mechanics.

Unknown official facts block an unqualified official-pattern claim.

## 8. Major vs Full-Length
Major Test answers: "How is the learner performing across a broad accumulated eligible preparation boundary?"
Full-Length Mock answers: "How does the learner perform under the complete applicable official exam shape?"

A Major may be smaller or otherwise bounded by its policy.
A Full-Length Mock is blueprint-fidelity driven.
They MUST NOT be aliases unless an explicit policy intentionally makes a particular Major a full-length simulation and records both semantics.

## 9. Sectional Test
Sectional Test isolates an officially meaningful section/subject/component boundary for formal testing.
It must preserve relevant official scoring/format constraints where claimed.
A convenience topic quiz is not automatically a Test Arena Sectional Test.

## 10. Stage/Component Simulation
Preliminary, Mains, Paper-I, Paper-II or other official stages/components retain independent identities.
No cross-paper averaging.
Simulation binds exact StageID + ComponentID + BlueprintVersion.

## 11. Historical Paper Mode
Historical Paper mode preserves proven historical event/shift/paper evidence.
It may include knowledge not in the current effective syllabus but must be labelled historical and excluded from current-scope mastery inference unless independently applicable.
Official question/key claims require official evidence; RankCrackers solutions remain separately typed.

## 12. Test Arena Input Contract
Formal test compilation receives:
student/context ID
Mission/Cycle
Effective Blueprint
Stage/Component/applicability
testForm
testPolicyVersion
current eligibility boundary where required
Question Repository snapshot/fingerprint
prior exposure/security context
CrucibleEvidenceSnapshotRef? as optional diagnostic input.

Crucible evidence may influence selection inside policy; it cannot change official blueprint rules.

## 13. Test Arena Output Contract
Every formal test produces immutable:
TestDefinitionID/version
TestInstanceID
StudentAttemptID
raw responses
QuestionID/QuestionVersion appearances
bound scoring-rule version
score/regrade evidence
section/component diagnostics
atom/DSD diagnostics where valid
time evidence where captured
coverage/confidence metadata
blueprint/policy fingerprints.

## 14. Feedback to Crucible
Test Arena may export diagnostic evidence back to the learner model:
persistent weakness
retention failure
timing pressure
section imbalance
exam-condition error patterns
question-level evidence.

This is evidence input, not a command to rewrite Crucible authority.
Crucible may use it for future bounded repair/retention planning only if the referenced knowledge remains valid and applicable.

## 15. No Reverse Taught Inference
Correct performance in Test Arena does not automatically create TAUGHT authority.
A learner may know material from elsewhere; assessment evidence and teaching evidence remain distinct.
Test Arena evidence may inform mastery/competence models under their own policy but cannot fabricate DigiBook teaching execution.

## 16. Question Exposure and Security
Crucible and Test Arena share exposure/family history sufficient to prevent accidental leakage/repetition where security policy requires.
Use of a QuestionID in Crucible may make it ineligible for a secure Test Arena instance according to versioned exposure policy.
Equivalent family members require family-level leakage controls where applicable.

## 17. Current vs Historical Analytics
Current formal assessment analytics and historical-paper analytics remain distinguishable by blueprint/event context.
Empirical QuestionID statistics must not conflate materially different QuestionVersions or incompatible contexts without validated equivalence.

## 18. Regrade / Defect Handling
Question defect, key revision or scoring-rule correction appends regrade/reconciliation evidence.
Original raw response and original test-definition binding remain immutable.
Future eligibility may invalidate a question without deleting historical appearance.

## 19. Staleness
Before publication/start, Test Arena revalidates:
effective blueprint
component applicability
syllabus/eligibility where required
question versions
scoring rules
test policy.

A corrigendum can stale future unstarted tests.
Started/submitted attempts retain historical binding and are reconciled rather than rewritten.

## 20. Fail-Closed Codes
BLUEPRINT_NOT_VERIFIED_EFFECTIVE
OFFICIAL_PATTERN_INCOMPLETE
AMBIGUOUS_APPLICABILITY
TAUGHT_BOUNDARY_REQUIRED
INSUFFICIENT_ELIGIBLE_QUESTIONS
QUESTION_VERSION_INVALID
SCORING_RULE_UNRESOLVED
HISTORICAL_EVIDENCE_INCOMPLETE
SECURITY_EXPOSURE_CONFLICT
STALE_TEST_DEFINITION
POLICY_CONFLICT.

No formal test is silently padded with untaught/out-of-scope/unreviewed items.

## 21. Cross-Engine Identity Trace
Required trace:
StudentAttemptID
-> TestInstanceID
-> TestDefinitionID/version
-> TestForm
-> QuestionID/QuestionVersion
-> KnowledgeDependencyID
-> AtomID/DSD
-> ComponentID
-> StageID
-> MissionID
-> ExamBlueprintVersion.

For Crucible-origin diagnostic evidence, PhaseState/Micro/Macro refs are additive lineage, not replacements.

## 22. Student Progress Law
Crucible evidence and Test Arena evidence may contribute to a higher learner-state model, but source semantics remain visible.
A Macro score and Full-Length Mock score are not interchangeable measurements.
Rollups must preserve test form, blueprint, coverage and confidence.

## 23. Runtime Reuse
Shared modules SHOULD be reused for:
blueprint resolution
QuestionID repository access
knowledge closure
scoring primitives
attempt evidence
version fingerprints
analytics lineage.

Crucible-specific scheduling/diagnostics and Test-Arena-specific formal simulation remain separate modules.
Do not implement two competing scoring or blueprint authorities.

## 24. Acceptance Tests
- Major exists only in Test Arena.
- Macro cannot be relabelled Major.
- Major and Full-Length remain distinct.
- Full-Length respects exact verified official duration/count/marks/negative marking.
- Pre and Mains never average.
- current test blocks ineligible knowledge.
- historical mode may preserve labelled historical-only knowledge without contaminating current mastery.
- Crucible evidence can influence bounded selection but not official rules.
- Test Arena result can inform repair but cannot grant TAUGHT.
- Crucible-used secure question can be blocked from Test Arena by exposure policy.
- corrigendum stales future test without rewriting completed attempt.
- regrade preserves raw response/history.
- shared QuestionID lineage reaches canonical Component/Stage/Mission.

## 25. Final Boundary Law
Crucible BUILDS and DIAGNOSES preparation.
Test Arena PROVES preparation under formal assessment conditions.
Both share official truth and canonical questions.
Neither owns the other's semantics.
Evidence may cross the boundary; authority may not be fabricated across it.
