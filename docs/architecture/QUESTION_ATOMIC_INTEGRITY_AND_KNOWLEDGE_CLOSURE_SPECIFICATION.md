# RANKCRACKERS — QUESTION ATOMIC INTEGRITY AND KNOWLEDGE CLOSURE SPECIFICATION

Document ID: RC-ASSESSMENT-QAI-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Draft / Pending Retrospective Conflict Audit
Authority Level: Subordinate Assessment Integrity Contract
Extends: QUESTION_REPOSITORY_AND_KNOWLEDGE_CLOSURE_CONTRACT.md
Depends On:
- CANONICAL_SYLLABUS_AND_DERIVED_DECOMPOSITION_CONTRACT.md
- DIGIBOOK_AND_TAUGHT_CONTENT_AUTHORITY_CONTRACT.md
- RC-ACADEMIC-STR-001
- RC-ACADEMIC-APE-001
- RC-ACADEMIC-DCP-001
- RC-ACADEMIC-TEM-001
Conflict Rule: This specification deepens question integrity and closure. It does not silently supersede the existing Question Repository & Knowledge Closure Constitution. Higher authority prevails.

## 1. Purpose
Make every assessment item independently reconstructable, academically bounded, answerable, reviewable, versioned, secure and eligible only under explicit knowledge-closure and delivery policy.

Question quality is not inferred from fluent wording, model confidence, answer presence, syllabus label, or successful rendering.

## 2. Core Constitutional Laws
QUESTION_EXISTS != QUESTION_VALID
QUESTION_VALID != KNOWLEDGE_CLOSED
KNOWLEDGE_CLOSED != REVIEWED
REVIEWED != PUBLICATION_ELIGIBLE
PUBLICATION_ELIGIBLE != CRUCIBLE_ELIGIBLE
PUBLICATION_ELIGIBLE != TEST_ARENA_ELIGIBLE
DIFFICULT != OUT_OF_SCOPE
NOVEL_REASONING != UNTaught_SUBSTANTIVE_KNOWLEDGE

## 3. Repository Identity
Maintain one Central Question Repository with immutable class identity:
PYQ
RANKCRACKERS_AUTHORED

Internal content can never become PYQ by relabeling.
PYQ historical truth remains distinct from current delivery eligibility.

## 4. Canonical Question Identity
CanonicalQuestion represents semantic item identity.
QuestionVersion represents a material semantic version.
QuestionAppearance represents rendering/ordering/language/official appearance where applicable.

Never overwrite historical semantic versions in place.

## 5. Atomic Question Composition
A question may contain:
- instruction
- stem
- stimulus/context
- data/table/graph/media
- subparts
- response schema
- options/choices
- answer specification
- scoring specification
- solution paths
- knowledge dependencies
- reasoning transformations
- assumptions
- units/tolerances
- metadata
- provenance
- review evidence
- eligibility state

Material components remain independently traceable where lifecycle needs justify it.

## 6. Complexity Gate
Electron-level integrity does not require every token to be a database row.
Persist separately only where independent review, versioning, reuse, invalidation, provenance, security, statistics or query lifecycle requires it.
Structured immutable embedding is preferred otherwise.

## 7. Mission and Applicability Binding
Every delivery candidate binds exact mission, blueprint applicability, stage/component/track/subject where applicable, syllabus version and target context.
Text similarity or subject label cannot authorize cross-mission reuse.

## 8. Knowledge Dependency
Every substantive fact, concept, method, formula, convention, representation literacy or domain rule required to solve the item must be represented as a Knowledge Dependency.

Dependency fields include:
dependency_id/type
required knowledge statement
atom/objective/prerequisite authority
depth
necessity
solution-path refs
taught-authority requirement
version/fingerprint
validation state

## 9. Dependency Types
Conceptual types can include:
FACT
CONCEPT
DEFINITION
FORMULA
METHOD
PROCEDURE
REPRESENTATION_LITERACY
CONVENTION
PREREQUISITE
DOMAIN_RULE

Reasoning transformations are separately classified so novel reasoning is not falsely treated as untaught substantive knowledge.

## 10. Necessity
Dependencies distinguish:
REQUIRED_ALL_PATHS
REQUIRED_FOR_PATH
OPTIONAL_HELPER
DERIVABLE_FROM_PROVIDED_INFORMATION

Optional/helper knowledge cannot be used to conceal a missing required dependency.

## 11. Solution Path
A Solution Path is a valid route from provided information plus authorized knowledge to an accepted answer.

Each path records:
inputs
knowledge dependencies
reasoning transformations
intermediate claims
assumptions
calculations/derivations
terminal answer
validity constraints

At least one fully valid intended path is required unless item type defines another scoring model.

## 12. Path-Level Closure
Knowledge closure is evaluated per valid solution path.

A question may be target-context eligible if at least one policy-accepted solution path is fully closed and alternate paths do not create ambiguity/unfairness under the item type.

If the only valid path requires unauthorized/untaught substantive knowledge, closure fails.

## 13. Reasoning Versus Knowledge
Reasoning may be novel, multi-step and difficult.
The system must distinguish transformations possible from provided + authorized knowledge from substantive facts/methods the learner could not derive.

"Reasoning" cannot be used as a label to smuggle in untaught knowledge.

## 14. Scope Closure
Each required dependency must be:
inside applicable verified scope
mapped to valid atom/prerequisite authority
within allowed depth
current/not stale
applicable to target mission/context

Any required out-of-scope dependency => SCOPE_LEAK.

## 15. Taught Closure
Where delivery policy requires taught authority, each required dependency must resolve into the target learner/context's current Knowledge Boundary derived from Taught Manifest evidence.

Syllabus presence, DigiBook presence, or released content is insufficient.

## 16. Closure Proof
QUESTION_KNOWLEDGE_CLOSED stores a reconstructable proof:
question version
accepted solution path(s)
dependency set
scope/depth validations
Taught Manifest/Knowledge Boundary refs where required
closure policy version
closure fingerprint
evaluated_at
validity state

Closure is a versioned decision, not a boolean detached from evidence.

## 17. Closure Invalidation
Changes to question semantics, accepted answer, solution path, dependency, syllabus authority, taught boundary, depth/applicability or closure policy trigger bounded reevaluation.

Historical closure evidence remains preserved.

## 18. Stem Integrity
Stem must be:
semantically complete for item type
free of unintended contradictions
bounded to intended interpretation
not dependent on hidden information
consistent with stimulus/options/response schema
linguistically appropriate for target variant

Ambiguity that changes valid answer set blocks publication.

## 19. Instruction Integrity
Instructions define what the learner must do, expected response form, selection count where relevant, rounding/unit rules where relevant and scoring-sensitive constraints.

The system cannot rely on unstated UI convention when the convention materially changes correctness.

## 20. Stimulus Integrity
Passages, caselets, graphs, maps, tables, images, diagrams, equations and data are first-class assessment inputs when answerability depends on them.

Stimulus records provenance, semantic version, rendering requirements, accessibility/alternative representation where applicable and question dependencies.

Missing/corrupted stimulus => item invalid for delivery.

## 21. Provided Information Boundary
Facts explicitly provided in the question/stimulus may be used without prior teaching if the intended skill is reasoning from provided information and policy permits it.

The distinction between GIVEN_INFORMATION and REQUIRED_PRIOR_KNOWLEDGE must be explicit.

## 22. Option Integrity
For option-based items, every option has semantic identity independent of display order.

Option ordering can vary without changing semantic answer authority when policy allows.
Option text changes that alter meaning create a new question semantic version or reviewed appearance as appropriate.

## 23. Distractor Governance
Distractors must be:
plausible enough for diagnostic value
unambiguously incorrect under the intended interpretation
not correct under an overlooked assumption
not trivially invalid solely due to formatting unless intended
not dependent on unauthorized knowledge to reject

Where useful, distractors can bind misconception/reason codes.

## 24. Answer Authority
Answer specification is typed:
SINGLE_CORRECT
MULTIPLE_CORRECT
NUMERIC_EXACT
NUMERIC_TOLERANCE
TEXT_NORMALIZED
ORDERED_SEQUENCE
MATCHING
ASSERTION_RELATION
SUBJECTIVE_RUBRIC
OTHER_EXPLICIT_SCHEMA

Answer authority records source/reviewer/provenance and exact question version.

## 25. Single-Correct Uniqueness
SINGLE_CORRECT items require proof/review that exactly one option is correct under stated assumptions.

zero correct => ANSWER_CONFLICT
multiple correct => AMBIGUOUS_ITEM

No delivery because an answer key merely says one option.

## 26. Multiple-Correct Completeness
MULTIPLE_CORRECT requires the complete accepted option set and scoring rule.
An omitted correct option or wrongly accepted distractor blocks publication.

## 27. Numeric Answers
Numeric specifications define:
canonical value/expression
accepted units
unit conversion policy
absolute/relative tolerance
rounding rule
significant-figure rule where relevant
format normalization
boundary inclusivity

Tolerance must reflect academic/scoring intent, not arbitrary implementation convenience.

## 28. Text Answers
Normalized-text answers define allowed normalization explicitly: case, whitespace, punctuation, Unicode, equivalent notation, spelling variants, aliases, language variants.

Normalization cannot turn semantically different answers into matches.

## 29. Subjective/Rubric Items
Subjective items require versioned rubric dimensions, required concepts, acceptable alternatives, partial-credit rules, prohibited misconceptions where relevant and reviewer/scorer policy.

Model-based scoring cannot silently become ground truth without validated scoring authority.

## 30. Solution Integrity
A solution is not merely an answer explanation.
It must:
use a valid path
expose required knowledge versus reasoning
preserve assumptions/conditions
arrive at accepted answer
avoid unauthorized shortcuts presented as canonical
remain within applicable scope/depth

Multiple materially distinct valid paths may coexist.

## 31. Solution Independence From Answer Key
Solution verification must not reduce to "solution ends at stored key."
It must independently validate reasoning/derivation consistency and answer correspondence.

Circular verification is insufficient.

## 32. Calculation Integrity
Numerical/derivation questions validate:
input transcription
units
formula conditions
intermediate arithmetic/algebra
rounding
terminal value
answer-option correspondence

Machine verification should be used where deterministic without replacing required academic review.

## 33. Media Integrity
Question media records content hash/version, semantic purpose, accessibility requirements, crop/resolution constraints where meaning-sensitive and rendering validation.

Media replacement that changes semantic information creates a reviewed semantic change.

## 34. Language Equivalence
Translations/variants preserve question intent, difficulty-relevant semantics, answer set and stimulus meaning.

Literal translation is insufficient if it changes ambiguity or clues the answer.
Semantic divergence requires independent reviewed version/appearance.

## 35. Difficulty
Difficulty is separate from scope/depth.

Maintain:
estimated difficulty before sufficient response data
empirical difficulty after validated data
calibration population/context
confidence/sample size
version/time window

Difficulty updates from statistics do not change semantic question identity by themselves.

## 36. Cognitive Demand
Cognitive demand records the kind/complexity of processing required independently from empirical difficulty.

Hard because of poor wording is a defect, not legitimate cognitive demand.

## 37. Discrimination and Item Statistics
Where sufficient valid response data exists, maintain version/context-aware statistics such as facility/difficulty, discrimination, option selection distribution, omission rate and time metrics.

Statistics bind exact semantic version and relevant delivery population; they cannot be blindly transferred across changed versions.

## 38. Calibration Safety
Small/noisy samples do not become authoritative calibration.
Statistical thresholds and confidence policy are versioned.
Outlier/anomaly/fraud-affected attempts can be excluded only under explicit rules.

## 39. Exposure and Security
Question repository distinguishes academic validity from exposure/security eligibility.

Track policy-relevant exposure, compromise reports, repeated delivery, embargo/secure pools where applicable.

A valid question may be temporarily ineligible because of security/exposure policy without losing academic validity.

## 40. Question Families
Templates, parameterized variants and near-duplicate families require family identity.

Sibling questions must not accidentally leak answers, duplicate assessment weight or create false bank diversity.

Parameter generation must preserve solvability, answer validity, scope and difficulty constraints for every instantiated version.

## 41. Parameterized Item Verification
Every generated parameter instance must satisfy domain constraints and recompute answer/solution.

A valid template does not prove every random instance valid.

Invalid parameter combinations must be impossible or rejected before publication.

## 42. Deduplication
Never merge solely on fuzzy text similarity.

Use semantic/provenance evidence and reviewed equivalence.
PYQ official appearances, translations, option orders and media lineage remain preserved.
Near-duplicates can be clustered without destructive merge.

## 43. Leakage Across Products
DigiBook, Crucible and Test Arena reference canonical question versions; they do not create divergent copies.

Product-specific presentation metadata is separate from canonical academic content.

## 44. Attempt Separation
Question identity/content is immutable relative to learner attempts.
Attempts/results are separate immutable events binding exact delivered question version/appearance and scoring policy.

Never rewrite a historical attempt as if a corrected future question version had been delivered.

## 45. Post-Release Defect Handling
If a released question is found defective:
classify defect
stop new delivery when severity requires
preserve affected attempts
create corrected version
determine rescoring/voiding policy
audit downstream impact

Silent answer-key mutation is forbidden.

## 46. Rescoring
Rescoring is explicit and versioned.
It records old/new scoring authority, affected attempts, reason, policy, timestamp and resulting score impact.

Historical raw response remains immutable.

## 47. Review Dimensions
Minimum review dimensions:
MISSION_APPLICABILITY
SCOPE/DEPTH
KNOWLEDGE_DEPENDENCY_COMPLETENESS
STEM/INSTRUCTION
STIMULUS/MEDIA
ANSWER_AUTHORITY
DISTRACTOR/OPTION_INTEGRITY
SOLUTION_VALIDITY
LANGUAGE_EQUIVALENCE
DIFFICULTY/COGNITIVE_ALIGNMENT
SCORING/RUBRIC
SECURITY/EXPOSURE where relevant

Review is evidence by dimension, not an opaque approved flag.

## 48. Separation of Duties
Generation, answer verification, solution verification and final review remain distinguishable roles/evidence even if automation assists multiple stages.

AI confidence cannot self-certify publication.
Policy determines where independent human/expert review is mandatory.

## 49. Lifecycle
Preserve constitutional lifecycle:
DRAFT
-> ATOM_MAPPED
-> ANSWER_VERIFIED
-> SOLUTION_VERIFIED
-> KNOWLEDGE_CLOSED
-> REVIEWED
-> PUBLICATION_ELIGIBLE

Refined hold/failure states include:
SCOPE_LEAK
DEPTH_LEAK
UNTAUGHT_DEPENDENCY
DEPENDENCY_UNRESOLVED
ANSWER_CONFLICT
AMBIGUOUS_ITEM
STIMULUS_INVALID
DISTRACTOR_INVALID
SOLUTION_INVALID
SCORING_INVALID
REVIEW_INCOMPLETE
SECURITY_HOLD
DUPLICATE_REVIEW
STALE_UPSTREAM
CLOSURE_STALE

## 50. Publication Eligibility
Requires:
exact semantic version frozen
mission/applicability valid
scope/depth valid
answer authority valid
solution valid
knowledge closure current
required media valid
required review dimensions pass
scoring policy valid
no blocking defect/security hold
review fingerprint matches candidate fingerprint

## 51. Target-Context Eligibility
Publication eligibility is global item readiness.
Delivery eligibility is contextual.

For a learner/cohort/session, re-evaluate:
mission/track applicability
current taught boundary where required
delivery mode
security/exposure
recent repetition
question-family constraints
test blueprint constraints

A globally valid question can be contextually ineligible.

## 52. Crucible Eligibility
Crucible consumes target-context eligibility plus Crucible execution rules.

It must not use chapter membership, question existence or generic REVIEWED state as a substitute for current Knowledge Closure/Taught Boundary requirements.

## 53. Test Arena Eligibility
Test Arena consumes global validity plus mode-specific blueprint/coverage rules.

If a Test Arena mode intentionally includes not-yet-taught syllabus content, that is an explicit mode policy; it never rewrites Taught Manifest truth.

## 54. PYQ Rules
PYQ provenance and official answer authority follow PYQ contracts.

Historical PYQ can remain in repository even when outside current scope.
Current scored use requires current applicability/closure/delivery rules.
RankCrackers-derived answer must never be labeled official.

## 55. Version Fingerprints
Maintain fingerprints for semantic question payload, answer specification, solution set, dependency closure, review candidate and media where relevant.

Fingerprint mismatch invalidates stale approvals/closure claims according to impact rules.

## 56. Invalidation
Changes propagate precisely:
question semantic change -> answer/solution/dependency/review reevaluation
answer change -> solution/scoring/review reevaluation
dependency change -> closure/delivery reevaluation
upstream syllabus/taught boundary change -> closure reevaluation
media semantic change -> answer/solution/review reevaluation as affected
editorial-only change -> bounded equivalence review

Avoid both silent grandfathering and unnecessary global invalidation.

## 57. Concurrency
Concurrent reviewers/workers cannot publish conflicting effective semantic versions or answers under the same authority context.

Use transactional/conditional/unique/CAS-equivalent publication controls.
Draft alternatives may coexist; effective authority cannot be ambiguous.

## 58. Audit Ledger
Reconstruct:
creation/import
class/provenance
semantic versions/appearances
atom/dependency mapping
answer changes
solution verification
closure decisions
review findings
publication eligibility
delivery holds
security events
defects
rescoring
supersession/withdrawal

History is append-preserving.

## 59. Legacy Migration
Legacy questions lacking proven provenance, answer authority, solution verification, dependency closure or review cannot be silently marked production-ready.

Typed states may include:
LEGACY_PROVENANCE_UNPROVEN
LEGACY_ANSWER_UNPROVEN
LEGACY_SOLUTION_UNPROVEN
LEGACY_CLOSURE_UNPROVEN
LEGACY_REVIEW_UNPROVEN

Migration can prove evidence; it cannot invent it.

## 60. Observability
Track:
bank size by immutable class
items by lifecycle/hold state
dependency closure failures
untaught/scope/depth leaks
answer conflicts
ambiguous items
solution failures
media failures
review backlog
security holds
defect/rescore counts
family/duplicate clusters
calibration confidence
legacy-unproven inventory

Production/live counters must distinguish reviewed/eligible items from raw bank volume.

## 61. Minimum Acceptance Tests
QAI-001 internal question cannot become PYQ by relabel.
QAI-002 wrong mission/track blocks delivery.
QAI-003 required dependency outside scope blocks closure.
QAI-004 required dependency outside depth blocks closure.
QAI-005 taught-required dependency absent from Knowledge Boundary blocks closure.
QAI-006 syllabus presence alone cannot satisfy taught closure.
QAI-007 released DigiBook alone cannot satisfy taught closure.
QAI-008 novel reasoning is allowed when substantive dependencies are closed.
QAI-009 reasoning label cannot hide untaught knowledge.
QAI-010 closure proof binds exact question/dependency/policy versions.
QAI-011 dependency change stales closure.
QAI-012 single-correct zero-answer item fails.
QAI-013 single-correct multi-answer item fails.
QAI-014 multiple-correct set must be complete.
QAI-015 distractor correct under valid interpretation blocks item.
QAI-016 hidden assumption causing answer ambiguity blocks item.
QAI-017 missing stimulus blocks delivery.
QAI-018 semantically changed media requires reevaluation.
QAI-019 numeric tolerance follows explicit scoring policy.
QAI-020 unit conversion follows explicit scoring policy.
QAI-021 text normalization cannot merge different meanings.
QAI-022 subjective scoring requires versioned rubric.
QAI-023 model scoring cannot self-authorize ground truth.
QAI-024 solution must independently support answer.
QAI-025 circular key-only solution verification fails.
QAI-026 deterministic calculation inconsistency blocks item.
QAI-027 translation cannot change accepted answer set silently.
QAI-028 wording-induced difficulty is not accepted as cognitive rigor.
QAI-029 empirical stats bind exact semantic version/context.
QAI-030 small sample cannot silently become authoritative calibration.
QAI-031 security hold can block delivery without erasing academic validity.
QAI-032 family siblings cannot masquerade as independent diversity.
QAI-033 every parameterized instance must validate.
QAI-034 fuzzy similarity alone cannot merge questions.
QAI-035 product delivery cannot create divergent canonical copies.
QAI-036 historical attempt retains delivered version after correction.
QAI-037 silent answer-key mutation is impossible.
QAI-038 rescoring preserves raw response and audit.
QAI-039 review dimensions bind exact candidate fingerprint.
QAI-040 AI confidence cannot bypass required review.
QAI-041 globally publication-eligible item may still be target-ineligible.
QAI-042 Crucible cannot use question existence as eligibility.
QAI-043 Test Arena mode cannot falsify taught status.
QAI-044 PYQ outside current scope remains historical evidence but not automatic scored content.
QAI-045 RankCrackers answer cannot be labeled official PYQ answer.
QAI-046 semantic fingerprint mismatch stales relevant approvals.
QAI-047 editorial-only change avoids unjustified full invalidation when equivalence proven.
QAI-048 concurrency cannot publish conflicting effective answers.
QAI-049 legacy question is not falsely certified.
QAI-050 every delivered scored item reconstructs to scope, answer, solution, closure, review and delivery authority.
QAI-051 provided-information fact need not be previously taught when policy allows reasoning from given data.
QAI-052 provided information cannot conceal a required prior-knowledge dependency.
QAI-053 alternate valid solution path cannot create unreviewed answer ambiguity.
QAI-054 optional helper dependency cannot block otherwise valid closed path.
QAI-055 required-all-path dependency omission is detected.
QAI-056 option shuffle preserves semantic answer identity.
QAI-057 semantic option edit triggers proper version impact.
QAI-058 incomplete rubric partial-credit rule blocks subjective publication.
QAI-059 invalid random parameter combination never reaches publication.
QAI-060 question-family exposure rules can make valid item contextually ineligible.

## 62. Acceptance Gates
REPOSITORY CLASS INTEGRITY PASS
MISSION/APPLICABILITY PASS
ATOMIC DEPENDENCY PASS
PATH-LEVEL KNOWLEDGE CLOSURE PASS
TAUGHT-BOUNDARY PASS
SCOPE/DEPTH PASS
STEM/INSTRUCTION PASS
STIMULUS/MEDIA PASS
OPTION/DISTRACTOR PASS
ANSWER UNIQUENESS/COMPLETENESS PASS
NUMERIC/TEXT/RUBRIC SCORING PASS
SOLUTION INDEPENDENT VERIFICATION PASS
LANGUAGE EQUIVALENCE PASS
DIFFICULTY/COGNITIVE PASS
CALIBRATION SAFETY PASS
FAMILY/DEDUP PASS
SECURITY/EXPOSURE PASS
REVIEW GOVERNANCE PASS
PUBLICATION ELIGIBILITY PASS
TARGET-CONTEXT ELIGIBILITY PASS
CRUCIBLE/TEST ARENA BOUNDARY PASS
VERSION/FINGERPRINT PASS
INVALIDATION PASS
CONCURRENCY PASS
LEGACY MIGRATION SAFETY PASS
AUDITABILITY PASS

DOCUMENTED != IMPLEMENTED.

## 63. Non-Negotiable Invariants
1. Question existence never proves validity.
2. Validity never proves knowledge closure.
3. Knowledge closure is dependency- and path-evidence based.
4. Required substantive knowledge cannot be smuggled in as reasoning.
5. Taught-required closure uses current Taught Manifest-derived Knowledge Boundary.
6. Difficulty never authorizes scope/depth expansion.
7. Answer key alone never proves correctness.
8. Single-correct means exactly one correct under stated assumptions.
9. Distractors cannot be secretly correct.
10. Missing/corrupt answer-bearing stimulus invalidates delivery.
11. Scoring tolerance/normalization is explicit, never accidental.
12. Solutions are independently verified against reasoning and answer authority.
13. AI cannot self-certify answer, solution, closure or publication.
14. Translation cannot silently change semantics or answer set.
15. Parameterized templates do not guarantee valid instances.
16. Fuzzy similarity cannot destructively merge provenance.
17. Attempts retain exact delivered version forever.
18. Answer corrections never rewrite historical raw responses.
19. Publication eligibility and target-context eligibility are separate.
20. Crucible eligibility is not inferred from bank membership.
21. Test Arena modes cannot rewrite taught truth.
22. PYQ historical authority and current eligibility are separate.
23. Every semantic version has exact fingerprints and lineage.
24. Legacy items are never falsely certified.
25. Every scored delivery reconstructs to verified academic and delivery authority.
26. Precision does not require unnecessary runtime fragmentation.

## 64. Next Reconciliation
Audit CRUCIBLE_ASSESSMENT_EXECUTION_CONTRACT.md and TEST_ARENA_EXECUTION_CONTRACT.md against:
Taught Manifest -> Knowledge Boundary -> Question Closure Proof -> Publication Eligibility -> Target-Context Eligibility.

Do not duplicate their constitutional contracts; patch only proven gaps.

Current status: DOCUMENTED. IMPLEMENTATION NOT CLAIMED. RETROSPECTIVE LEGACY-CONFLICT AUDIT PENDING.
