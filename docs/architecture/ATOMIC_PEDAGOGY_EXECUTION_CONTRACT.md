# RANKCRACKERS — ATOMIC PEDAGOGY EXECUTION CONTRACT

Document ID: RC-ACADEMIC-APE-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Draft / Pending Retrospective Conflict Audit
Authority Level: Academic Constitutional Candidate
Scope: Teacher Interpretation -> Atomic Pedagogy -> DigiBook Production Specification
Depends On: RC-ACADEMIC-STR-001 Subject Teacher Resolution Constitution
Conflict Rule: Founder latest explicit locked decision and ratified higher constitutional authority prevail. Legacy conflicts are reconciled explicitly, never silently overwritten.

## 1. Purpose
This contract defines the smallest governable academic execution units by which a valid Subject Teacher Interpretation becomes bounded, reviewable, versioned and reconstructable teaching specification.

It is not a generic lesson-plan template. It is the academic execution constitution between teacher interpretation and DigiBook production.

## 2. Governing Laws
SYLLABUS = WHAT must be taught.
SUBJECT TEACHER = WHO owns subject-specific interpretation of HOW.
PEDAGOGY = HOW authorized knowledge is taught.
DIGIBOOK = actual taught-material artifact produced under approved pedagogy.

Pedagogy may optimize teaching. It may not silently expand, delete or mutate verified syllabus authority.

## 3. Precision Without Runtime Over-Engineering
Electron-level documentation does not require electron-level service/database fragmentation.

A micro-unit becomes a separately persisted first-class entity only when it has a real independent lifecycle requirement such as independent versioning, review, invalidation, provenance, reuse, querying, publication, or audit.

Otherwise it may remain a typed immutable sub-object inside its authoritative parent.

Mandatory implementation question:
WHY MUST THIS EXIST SEPARATELY?

Maximum precision in authority and evidence; minimum necessary runtime complexity.

## 4. Atomic Execution Identity
Canonical Pedagogy Execution Unit (PEU) identity:
MissionID x SyllabusVersion x AtomID x TeacherInterpretationVersion x PedagogyVersion

Every effective pedagogy must be reproducible from this authority context.

## 5. Five Truths Must Never Collapse
AUTHORIZED_TO_TEACH != CONTENT_CREATED
CONTENT_CREATED != CONTENT_PUBLISHED
CONTENT_PUBLISHED != ACTUALLY_TAUGHT
ACTUALLY_TAUGHT != STUDENT_MASTERED

No downstream system may infer one truth solely from another.

## 6. Micro-Atomic Governance Test
For every independently governed unit or dependency edge, the architecture must be able to answer:
1. What is it?
2. Which authority created/authorized it?
3. Which exact versions does it depend on?
4. What downstream object/state may it authorize?
5. What becomes stale or invalid if it changes?
6. How is its historical state reconstructed?

If these questions cannot be answered where materially necessary, provenance is incomplete.

## 7. Canonical Micro-Atomic Chain
Verified Atom
-> Teacher Resolution
-> Teacher Interpretation
-> Learning Objective
-> Prerequisite Edge
-> Concept Claim
-> Teaching Step
-> Explanation Unit
-> Representation
-> Example
-> Misconception
-> Repair Action
-> Practice Unit
-> Check Unit
-> Evidence Event
-> DigiBook Production Specification
-> DigiBook Block
-> Taught Manifest Entry
-> Knowledge Boundary

Not every node must be separately persisted. Every material dependency must remain reconstructable.

## 8. Learning Objective Law
A syllabus atom is not automatically a learning objective.

Every objective must include or inherit:
- learning_objective_id
- parent_atom_id
- teacher_interpretation_ref
- objective_type
- objective_statement
- required_depth
- scope_evidence
- prerequisite_refs
- status
- version/fingerprint

No orphan objective is permitted.
No objective may expand beyond verified syllabus authority without explicit upstream authority.

## 9. Objective Semantic Classes
Supported conceptual classes include:
KNOW, UNDERSTAND, REPRESENT, APPLY, REASON, DISCRIMINATE, PROCEDURAL, INTEGRATE.

Teacher plugins may define bounded subject-specific subtypes, but cannot create ungoverned syllabus expansion.

## 10. Prerequisite Graph
Prerequisites are explicit dependency edges, not silent assumptions.

Types:
HARD — execution cannot legitimately proceed without satisfied/remediated prerequisite.
SOFT — improves comprehension but does not block.
CONTEXT — may be activated/recalled within current execution.

Possible evidence states include:
PROVEN_TAUGHT
RECALL_REQUIRED
REMEDIATION_REQUIRED
NOT_YET_TAUGHT
UNKNOWN

SYLLABUS_EXISTS != TAUGHT != MASTERED.

## 11. Prerequisite Graph Validity
Compilation validates:
- missing hard prerequisite
- dependency cycles
- stale dependency version
- cross-mission leakage
- invalid cross-syllabus binding
- unreachable objective
- broken prerequisite evidence

Unresolvable hard dependency produces PEDAGOGY_GRAPH_INVALID and fails closed for affected execution.

## 12. Concept Claim
A Concept Claim is an academically material proposition needed to satisfy one or more learning objectives.

Material claims must remain traceable to atom/interpretation authority and supporting evidence where required.

This does not require every sentence to become a database row. Claims requiring independent review/invalidation/provenance may be first-class; others may remain typed content inside an Explanation Unit.

## 13. Teaching Strategy
There is no mandatory universal sequence such as Definition -> Example -> Question.

The resolved Subject Teacher capability determines legitimate strategies for the atom/domain.

Strategy identity records:
- strategy_type/version
- objective coverage
- prerequisite assumptions
- sequence constraints
- representation requirements
- misconception strategy
- allowed adaptations
- prohibited shortcuts

## 14. Teaching Execution Graph
Pedagogy may be linear or branching.

Nodes can include prior-knowledge activation, introduction, explanation, representation, worked example, misconception contrast, guided practice, independent check, remediation and closure.

Branches must be deterministic from defined evidence/conditions. Hidden model discretion cannot alter academic authority.

## 15. Teaching Step
Each material Teaching Step identifies:
- step_id
- purpose
- objective_refs
- required_inputs
- execution_order/graph position
- produced evidence or content
- next-edge conditions
- failure/remediation behavior

## 16. Explanation Unit
An Explanation Unit (EU) is the smallest governed explanatory content unit where independent traceability is materially useful.

It can include:
- explanation_unit_id
- learning_objective_refs
- concept_claim_refs
- prerequisite_refs
- required representations
- treatment depth
- sequence position
- evidence refs
- interpretation/pedagogy refs
- version/fingerprint

## 17. Representation Governance
Diagrams, equations, graphs, tables, timelines, maps, models, analogies and other representations are pedagogical objects, not decoration when required for meaning.

Representation specification can include:
- representation_id/type
- pedagogical purpose
- objective refs
- required/optional status
- semantic payload
- accuracy constraints
- accessibility alternative
- language dependency
- version

Missing required representation blocks publication of the affected pedagogy/content.

## 18. Example Governance
Examples must have an explicit pedagogical purpose such as:
INTRODUCTORY
WORKED
COUNTEREXAMPLE
BOUNDARY_CASE
TRANSFER
EXAM_STYLE
MISCONCEPTION_REPAIR

Every material example traces to authorized objective/concept scope. Example richness cannot become unauthorized syllabus expansion.

## 19. Misconception Registry
A misconception specification can record:
- misconception_id
- atom/objective refs
- trigger
- incorrect mental model
- correct model
- diagnostic signal
- repair strategy
- severity
- evidence origin

Evidence origin may include Subject Teacher, expert review, observed student errors, official/PYQ evidence, or validated analytics. PYQ absence never blocks legitimate pedagogy.

## 20. Repair Action
A Repair Action is a bounded pedagogical response to detected prerequisite or misconception failure.

It records trigger, target knowledge, remediation method, recheck requirement, exit condition and maximum scope.

Repair cannot silently introduce unrelated syllabus scope.

## 21. Practice Taxonomy
Pedagogical practice is distinct from formal assessment.

Types include:
WORKED_PRACTICE
GUIDED_PRACTICE
INDEPENDENT_CHECK
DIAGNOSTIC_PROBE
CLOSURE_CHECK

A practice unit records objective/dependency coverage, expected evidence, scaffolding policy and solution/hint authority where applicable.

## 22. Check Unit and Evidence Event
A Check Unit defines what is being checked and what evidence is acceptable.
An Evidence Event records an actual execution outcome.

Publishing content is not an Evidence Event proving teaching or mastery.

Evidence states and aggregation rules must remain typed and reconstructable.

## 23. Pedagogy Completion Is Not Knowledge Closure
A completed pedagogy plan does not prove all objectives are learned.
An executed lesson does not prove mastery.
Objective-level evidence remains separable.

Knowledge Closure is governed downstream by its own authority contract.

## 24. DigiBook Production Specification
Pedagogy hands DigiBook a bounded production specification, not a free-form request.

It may require:
- explanation units
- ordered/graph sequence
- examples
- diagrams/representations
- equations/derivations
- misconception treatment
- prerequisite recall/remediation
- guided practice
- checks
- depth constraints
- prohibited expansions
- required evidence/provenance

DigiBook generation must conform to this specification or return a typed exception.

## 25. AI Authoring Boundary
AI MAY express, transform or assemble authorized pedagogy within its granted scope.
AI MAY NOT silently invent academic authority.

AI cannot independently create canonical syllabus scope, authoritative objectives, prerequisite truth, teacher authority or unsupported academic claims.

Missing authority produces AUTHORING_BLOCKED_MISSING_AUTHORITY or equivalent fail-closed state.

## 26. Delivery Variants
Canonical academic authority is separate from delivery adaptation.

Variants such as NOVICE, MIDDLE and PRO may alter scaffolding, pacing, explanation density or practice support while preserving the same authorized atom/objective truth unless an explicitly versioned exception is approved.

Delivery adaptation cannot silently fork canonical academic truth.

## 27. Version Change Classification
Changes are classified at least as:
EDITORIAL
PRESENTATIONAL
PEDAGOGICAL_NON_SEMANTIC
PEDAGOGICAL_SEMANTIC
ACADEMIC_SEMANTIC

Impact evaluation is proportional. A spelling fix must not automatically invalidate unrelated questions; an objective semantic change may invalidate DigiBook, taught authority and dependent assessment eligibility.

## 28. Dependency and Invalidation
Material edges are first-class in the dependency graph even when child units are embedded.

Canonical trace:
SyllabusAtom -> TeacherResolution -> TeacherInterpretation -> LearningObjective -> PedagogyPlan -> Explanation/Representation/Practice -> DigiBook -> TaughtManifest -> KnowledgeBoundary -> Question -> Crucible/TestArena

Changes trigger deterministic descendant impact evaluation using the governing dependency/invalidation contract.

## 29. Fingerprints and Idempotency
Pedagogy has deterministic fingerprints over canonical authority-bearing inputs including atom authority, teacher interpretation, objectives, prerequisites, strategy, sequence, explanation requirements, representation requirements, misconception plan and practice/check plan.

Equivalent canonical input cannot create semantically duplicate effective versions merely because execution was repeated.

## 30. State Machine
Conceptual lifecycle:
DRAFT
-> COMPILED
-> REVIEW_PENDING
-> REVIEWED
-> APPROVED
-> EFFECTIVE

Exception/change states:
BLOCKED
INVALID
STALE
SUPERSEDED
REVALIDATION_REQUIRED

Only a current APPROVED/EFFECTIVE pedagogy with valid dependencies may authorize new DigiBook production.

## 31. Review Dimensions
Review cannot be an opaque Approve button alone.

Review dimensions include:
SCOPE_ACCURACY
SUBJECT_ACCURACY
PEDAGOGICAL_COHERENCE
PREREQUISITE_VALIDITY
REPRESENTATION_ACCURACY
MISCONCEPTION_COVERAGE
DEPTH_ALIGNMENT
ASSESSMENT_ALIGNMENT

Review decisions retain reviewer authority, evidence, version, timestamp and findings.

## 32. Concurrency
Multiple drafts may exist.
Exactly one effective active pedagogy may exist for the same effective authority context.

Concurrent publication must use transactional/conditional/unique/CAS-equivalent enforcement. Last-write-wins cannot silently redefine academic authority.

## 33. Fail-Closed Conditions
Affected pedagogy cannot become effective when:
- atom authority is missing/stale
- teacher resolution is unresolved/ambiguous/stale
- teacher interpretation is invalid/stale
- objective exceeds authorized scope
- hard prerequisite is unresolved
- dependency cycle exists
- required representation/evidence is missing
- mission/version binding is invalid
- fingerprint mismatch exists
- historical reconstruction is impossible
- required review gate has not passed

## 34. Crucible Boundary
QUESTION_EXISTS != CRUCIBLE_ELIGIBLE.

Crucible eligibility must trace question knowledge dependencies to valid taught/eligible knowledge authority according to Crucible governance.

A chapter-level DigiBook existence check is insufficient.

## 35. Test Arena Boundary
Test Arena may support broader exam simulation rules, but cannot erase provenance.

The system must be able to distinguish TAUGHT, NOT_YET_TAUGHT and OUTSIDE_CURRENT_BOUNDARY where relevant to the test mode.

## 36. Auditability
Audit events must reconstruct creation, compilation, review, approval, rejection, publication authority, invalidation, supersession, remediation and material manual override.

Historical pedagogy is immutable evidence; supersession creates a new current truth without rewriting the old record.

## 37. Legacy Migration
Legacy teaching/content lacking provable pedagogy authority cannot be silently certified.

Possible classification:
LEGACY_PEDAGOGY_AUTHORITY_UNPROVEN

Migration may map and reconcile evidence, but cannot manufacture historical proof.

## 38. Minimum Acceptance Tests
APE-001 valid teacher interpretation compiles pedagogy.
APE-002 missing teacher interpretation fails closed.
APE-003 objective outside atom scope is rejected.
APE-004 orphan objective is rejected.
APE-005 unresolved hard prerequisite blocks execution.
APE-006 soft prerequisite does not falsely block.
APE-007 prerequisite cycle is detected.
APE-008 cross-mission prerequisite leakage is rejected.
APE-009 required representation missing blocks approval.
APE-010 example cannot expand scope.
APE-011 misconception repair remains bounded.
APE-012 PYQ absence does not block pedagogy.
APE-013 content published does not mark taught.
APE-014 taught does not mark mastered.
APE-015 identical canonical input is idempotent.
APE-016 semantic pedagogy change triggers descendant impact.
APE-017 editorial change avoids unjustified broad invalidation.
APE-018 concurrency cannot create two effective active pedagogies.
APE-019 AI cannot invent missing authority.
APE-020 delivery variant preserves canonical truth.
APE-021 review evidence is reconstructable.
APE-022 superseded pedagogy remains historically reconstructable.
APE-023 legacy unproven content is not falsely certified.
APE-024 fingerprint mismatch blocks current-authority claim.
APE-025 question existence alone cannot establish Crucible eligibility.
APE-026 DigiBook production spec cannot bypass required pedagogy units.
APE-027 dependency edge provenance survives embedding/compression.
APE-028 complexity gate prevents unnecessary persisted micro-entities without losing traceability.

## 39. Acceptance Gates
SCHEMA/TYPE SAFETY PASS
AUTHORITY BOUNDARY PASS
OBJECTIVE TRACEABILITY PASS
PREREQUISITE GRAPH PASS
NO-SILENT-ASSUMPTION PASS
PEDAGOGY DETERMINISM PASS
REVIEW GOVERNANCE PASS
VERSION/FINGERPRINT PASS
INVALIDATION PASS
CONCURRENCY PASS
AI AUTHORITY BOUNDARY PASS
DELIVERY VARIANT ISOLATION PASS
DIGIBOOK HANDOFF PASS
DOWNSTREAM PROVENANCE PASS
LEGACY MIGRATION SAFETY PASS
COMPLEXITY GATE PASS

DOCUMENTED != IMPLEMENTED.

## 40. Constitutional Invariants
1. No pedagogy without valid Teacher Interpretation.
2. No objective without verified syllabus scope.
3. No silent prerequisite assumption.
4. No unresolved hard prerequisite execution.
5. No ungoverned one-size-fits-all pedagogy.
6. No AI-created academic authority.
7. No DigiBook production without pedagogy provenance.
8. Published does not mean taught.
9. Taught does not mean mastered.
10. Question existence does not establish assessment eligibility.
11. Semantic changes receive explicit impact classification.
12. Effective pedagogy is exactly versioned and fingerprinted.
13. Exactly one effective pedagogy exists per effective authority context.
14. Historical pedagogy remains reconstructable.
15. Delivery adaptation cannot silently mutate canonical academic truth.
16. PYQ absence does not block legitimate syllabus teaching.
17. Every downstream academic claim remains traceable to verified syllabus authority.
18. Precision requirements do not justify unnecessary runtime fragmentation.

## 41. Next Dependency
The next contract should define DigiBook Content Production:
approved pedagogy specification -> governed authoring -> content blocks -> evidence/provenance -> review-ready DigiBook artifact.

Current status: DOCUMENTED. IMPLEMENTATION NOT CLAIMED. RETROSPECTIVE LEGACY-CONFLICT AUDIT PENDING.
