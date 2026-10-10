# RANKCRACKERS — DIGIBOOK CONTENT PRODUCTION AND PUBLICATION CONTRACT

Document ID: RC-ACADEMIC-DCP-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Draft / Pending Retrospective Conflict Audit
Authority Level: Subordinate Academic Production Contract
Depends On:
- DIGIBOOK_AND_TAUGHT_CONTENT_AUTHORITY_CONTRACT.md
- RC-ACADEMIC-STR-001 Subject Teacher Resolution Constitution
- RC-ACADEMIC-APE-001 Atomic Pedagogy Execution Contract
Conflict Rule: This contract refines DigiBook production. It does not silently supersede the existing DigiBook & Taught Content Authority Constitution. Higher constitutional authority prevails.

## 1. Purpose
Define how an approved Atomic Pedagogy specification becomes a source-bound, reviewable, immutable and publishable DigiBook material version while preserving exact academic provenance and downstream taught-authority safety.

## 2. Boundary
This contract owns CONTENT PRODUCTION and PUBLICATION mechanics.
It does not redefine verified syllabus truth, Subject Teacher resolution, canonical pedagogy authority, Teaching Execution proof, Taught Content Authority, Question Knowledge Closure, Crucible eligibility or Test Arena governance.

## 3. Constitutional Production Chain
Verified Syllabus Atom
-> Teacher Resolution
-> Teacher Interpretation
-> Approved Pedagogy
-> DigiBook Production Specification
-> Authoring Plan
-> Content Units
-> Claim/Representation/Example Bindings
-> Source/Evidence Binding
-> Academic Review
-> Pedagogy-Conformance Review
-> Publication Candidate
-> Immutable Released Material Version
-> Teaching Execution
-> Taught Content Authority

No production shortcut may skip an upstream authority required by the governing contracts.

## 4. Production Identity
A DigiBook production context is identified by:
MissionID x SyllabusVersion x Atom/TeachingUnitScope x TeacherInterpretationVersion x PedagogyVersion x MaterialVersion x Language/DeliveryVariant

Every released material version must reconstruct this context.

## 5. Precision/Complexity Gate
Micro-level traceability does not require every sentence or UI fragment to become a database entity.

Persist a unit separately only when it needs independent lifecycle behavior: review, versioning, invalidation, reuse, provenance, query, publication or audit.
Otherwise preserve it as typed immutable structure within its authoritative parent.

No runtime fragmentation without a concrete lifecycle reason.

## 6. Authoring Plan
Before content generation, create a bounded Authoring Plan from the approved DigiBook Production Specification.

It identifies:
- required objectives
- required explanation units
- required representations
- required examples
- misconception treatments
- prerequisite recall/remediation
- practice/check requirements
- depth ceiling
- ordering/graph constraints
- prohibited expansion
- source/evidence requirements
- delivery variant constraints
- language constraints

Authoring cannot silently omit mandatory production requirements.

## 7. Content Unit
A Content Unit is the smallest independently governable published-content component where separate lifecycle behavior is materially required.

Possible semantic types:
EXPLANATION
DEFINITION
DERIVATION
PROCEDURE
REPRESENTATION
WORKED_EXAMPLE
COUNTEREXAMPLE
MISCONCEPTION_REPAIR
PREREQUISITE_RECALL
GUIDED_PRACTICE
INDEPENDENT_CHECK
SUMMARY
TRANSITION

Each material unit records/inherits exact atom/objective/pedagogy authority.

## 8. Material Academic Claim
Every academically material claim must be attributable to:
- in-scope verified atom/objective authority, or
- explicitly authorized prerequisite/general reasoning rule,
with evidence/source binding where required.

A claim that cannot be placed inside authorized scope is MATERIAL_SCOPE_LEAK and blocks release.

Not every sentence is a separate Claim entity. The claim boundary follows independent review/provenance/invalidation need.

## 9. Scope Containment
DigiBook may explain more clearly, not teach unauthorized examinable knowledge.

Helpful exposition may:
- simplify language
- add analogy
- add bounded context
- improve sequencing
- improve representation

It may not silently:
- create a new syllabus requirement
- raise depth beyond mission authority
- introduce an examinable dependency outside scope
- convert enrichment into canonical syllabus truth
- repair upstream syllabus authority locally

## 10. Depth Ceiling
Every material version inherits a depth ceiling from verified mission/blueprint/syllabus authority and approved pedagogy.

Depth is evaluated separately from difficulty.
Harder reasoning inside authorized knowledge can be valid; additional substantive knowledge outside authority is not.

Unresolved depth => DEPTH_UNRESOLVED => release blocked.

## 11. Source and Evidence Binding
Evidence requirements are typed.

Possible evidence roles:
AUTHORITY_SOURCE
ACADEMIC_SUPPORT
DEFINITION_SUPPORT
FACT_SUPPORT
REPRESENTATION_SUPPORT
EXAMPLE_SUPPORT
ENRICHMENT
PYQ_CONTEXT

Evidence provenance records source identity/version or retrieval identity, authority class, supported claim/unit, review status and evidence fingerprint where applicable.

PYQ is optional enrichment and never substitutes for syllabus authority.

## 12. Source Gap Law
A material claim requiring external/official/expert support cannot be published merely because an AI model is confident.

Missing required evidence => SOURCE_GAP.

Claims not requiring external citation still retain upstream academic authority provenance.

## 13. AI Authoring Boundary
AI is an authoring instrument, not an academic sovereign.

AI MAY:
- draft explanations within authorized scope
- transform approved pedagogy into prose
- produce bounded examples/representations
- improve language/readability
- propose alternatives for review

AI MAY NOT:
- invent syllabus authority
- invent teacher authority
- silently add learning objectives
- silently add hard prerequisites
- exceed depth ceiling
- fabricate evidence/provenance
- self-approve academic truth
- mark content taught/mastered

## 14. Generation Reproducibility
Where generated content is materially AI-derived, retain enough generation lineage to reproduce/audit the academic decision path without requiring private chain-of-thought.

Lineage may include model/tool identity class, generation policy/template version, authoritative inputs, content fingerprint, generation timestamp, deterministic constraints and review decisions.

Private model reasoning is never required as provenance.

## 15. Representation Production
Required diagrams, equations, tables, maps, graphs, timelines or other representations must satisfy the Pedagogy representation specification.

Each material representation preserves:
- semantic purpose
- objective/claim refs
- accuracy constraints
- accessibility alternative where applicable
- language dependency
- version/fingerprint

A visually attractive but semantically inaccurate representation fails review.

## 16. Example Production
Every material example remains bounded to its authorized pedagogical purpose.

Worked examples must retain:
- target objective
- assumptions
- required prior knowledge
- solution/reasoning authority
- answer/derivation correctness evidence
- difficulty/depth classification

An example that introduces unauthorized knowledge fails scope containment.

## 17. Formula/Derivation/Procedure Integrity
For formulae, derivations and procedures, production must preserve:
- symbols/terms definitions
- assumptions/conditions
- valid domain
- ordered steps where order matters
- exception/boundary conditions where pedagogically required
- final result consistency

Presentation compression cannot remove academically necessary conditions.

## 18. Language Variants
Translation/localization is a presentation transformation only while academic semantics remain equivalent.

Material language variants bind to the same canonical academic authority but have independent content fingerprints/review where translation can alter meaning.

Semantic divergence requires a new reviewed material version, not a silent translation edit.

## 19. Delivery Variants
NOVICE/MIDDLE/PRO or future delivery variants may alter scaffolding, pacing, density, examples or practice support within approved Pedagogy variant rules.

They cannot silently fork syllabus truth or objective truth.

Variant equivalence and differences must be reconstructable.

## 20. Composition
A released DigiBook material version is an immutable composition manifest over content units and required dependencies.

Composition records:
- material_version_id
- ordered/graph content-unit refs
- authority refs
- pedagogy refs
- source/evidence refs
- review refs
- language/variant
- fingerprints
- release status
- supersession lineage

## 21. Completeness Compilation
Before review/release, a compiler/validator checks approved pedagogy requirements against authored content.

It detects:
- missing objective coverage
- missing explanation unit
- missing representation
- missing misconception repair
- missing prerequisite treatment
- missing required practice/check
- ordering violation
- scope leak
- depth violation
- evidence gap
- stale upstream binding

No human reviewer should need to discover machine-detectable completeness failures manually.

## 22. Review Layers
Minimum review dimensions:
PEDAGOGY_CONFORMANCE
ACADEMIC_ACCURACY
SCOPE_CONTAINMENT
DEPTH_ALIGNMENT
SOURCE/EVIDENCE_VALIDITY
REPRESENTATION_ACCURACY
EXAMPLE/DERIVATION_CORRECTNESS
LANGUAGE_SEMANTIC_EQUIVALENCE where applicable
PRODUCTION_COMPLETENESS

Review status is dimensioned evidence, not a single opaque boolean.

## 23. Review Decision
A review decision retains:
- reviewer identity/authority
- material candidate fingerprint
- review dimension
- decision
- findings
- evidence
- timestamp
- policy/version
- expiry/revalidation trigger if applicable

A changed candidate fingerprint cannot reuse approval without equivalence/revalidation rules.

## 24. Separation of Duties
AI generation cannot self-certify release.
Where policy requires independent academic review, author and final academic approver roles must remain distinguishable.

Automation may perform deterministic validation but cannot impersonate human/expert authority where such authority is required.

## 25. Material Lifecycle
Preserve governing lifecycle:
DRAFT -> SOURCE_BOUND -> PEDAGOGY_REVIEWED -> ACADEMIC_REVIEWED -> RELEASE_ELIGIBLE -> RELEASED

Invalidation/change states:
STALE
SUPERSEDED
BLOCKED
WITHDRAWN

Substates may refine this lifecycle but cannot weaken its gates.

## 26. Release Eligibility
A candidate becomes RELEASE_ELIGIBLE only when:
- all required upstream authority is current
- approved pedagogy binding is current
- completeness validation passes
- scope/depth validation passes
- required evidence is bound
- required reviews pass
- candidate fingerprint equals reviewed fingerprint
- no blocking invalidation exists

## 27. Atomic Publication
Release is an atomic authority transition.

A partially written composition cannot appear RELEASED.
Concurrent releases cannot create two effective current material versions for the same exact publication authority context unless governance explicitly permits parallel variants.

Use transactional/conditional/unique/CAS-equivalent enforcement.

## 28. Immutable Release
A RELEASED material version is immutable academic evidence.

Corrections create a new version.
Historical released content is retained according to evidence/retention policy and marked SUPERSEDED/WITHDRAWN when appropriate; it is not rewritten in place.

## 29. Change Classification
Changes are classified:
EDITORIAL
PRESENTATIONAL
TRANSLATION_NON_SEMANTIC
PEDAGOGICAL_NON_SEMANTIC
PEDAGOGICAL_SEMANTIC
ACADEMIC_SEMANTIC
EVIDENCE_CORRECTION

Classification determines review and downstream impact.

## 30. Partial Invalidation
A change to one content unit does not automatically invalidate unrelated units, but released material composition must not falsely claim a mixed stale/current authority state.

Impact analysis identifies:
UNAFFECTED
REVALIDATION_REQUIRED
REVIEW_REQUIRED
REGENERATION_REQUIRED
INVALID
SUPERSEDED

New release composition is required when immutable released content changes.

## 31. Upstream Invalidation
Changes in syllabus, atom, teacher resolution, teacher interpretation, pedagogy, blueprint/applicability or authoritative evidence trigger deterministic impact analysis under the dependency/invalidation contract.

STALE material cannot grant new Taught Content Authority.

## 32. Shared Content Reuse
Reuse is canonical-reference based, not uncontrolled copy/paste.

Shared units are reusable only where scope, semantics, depth, prerequisites, language requirements and applicability are equivalent.

Non-equivalent contexts require specialization/versioning.

A shared-unit update must identify every dependent material composition before activation.

## 33. Teaching Execution Boundary
RELEASED != TAUGHT.

DigiBook production ends at released material authority.
Teaching Execution separately proves learner/cohort exposure/completion according to the existing DigiBook & Taught Content Authority Contract.

Production code cannot mark Taught Content Authority merely because release succeeded.

## 34. Partial Teaching Safety
Content-unit granularity may support precise teaching evidence, but parent/child teaching inference follows governing Taught Content Authority rules.

Exposure to one block cannot automatically mark its entire atom/unit taught unless the completion policy proves the full authorized boundary.

## 35. Assessment Boundary
DigiBook never directly makes a question assessment-eligible.

Assessment handoff occurs through valid Taught Content Authority and Question Knowledge Closure.

CONTENT_EXISTS != QUESTION_ELIGIBLE.

## 36. Student Projection
Student UI receives coherent pedagogical material, not internal authority machinery.

Backend IDs, review graphs and invalidation metadata remain hidden unless a product requirement explicitly exposes a safe derivative.

Student projection must not alter academic scope.

## 37. Failure Taxonomy
Minimum typed failures:
UPSTREAM_AUTHORITY_MISSING
UPSTREAM_AUTHORITY_STALE
PEDAGOGY_NOT_EFFECTIVE
AUTHORING_SPEC_INCOMPLETE
MATERIAL_SCOPE_LEAK
DEPTH_UNRESOLVED
SOURCE_GAP
REPRESENTATION_MISSING
REPRESENTATION_INACCURATE
OBJECTIVE_COVERAGE_GAP
PREREQUISITE_TREATMENT_GAP
MISCONCEPTION_TREATMENT_GAP
REVIEW_INCOMPLETE
REVIEW_FINGERPRINT_MISMATCH
MATERIAL_STALE
PUBLICATION_CONFLICT
LEGACY_PROVENANCE_UNPROVEN

Failures are explicit operational states, not hidden log-only warnings.

## 38. Audit Ledger
Reconstruct:
- production initiation
- authoring-plan compilation
- AI/human authoring events at policy-relevant granularity
- source/evidence binding
- validator results
- review decisions
- release eligibility
- publication
- supersession/withdrawal
- invalidation and descendant impact
- material manual overrides

Historical evidence cannot be erased to make current content appear retroactively compliant.

## 39. Legacy Migration
Legacy DigiBook/content without provable current authority must not be silently certified.

Classify unresolved legacy material as LEGACY_PROVENANCE_UNPROVEN or equivalent until reconciled.

Migration may prove equivalence from evidence; it may not manufacture historical review or source provenance.

## 40. Observability
Operational metrics should include:
- production candidates by state
- scope/depth failures
- evidence gaps
- objective coverage gaps
- review backlog
- stale/superseded material
- current material versions by mission/atom
- publication conflicts
- legacy-unproven material
- invalidation backlog

These metrics are operational/academic governance signals, not student mastery metrics.

## 41. Minimum Acceptance Tests
DCP-001 valid approved pedagogy can compile an authoring plan.
DCP-002 missing effective pedagogy blocks production.
DCP-003 mandatory pedagogy requirement cannot be silently omitted.
DCP-004 out-of-scope material claim blocks release.
DCP-005 depth violation blocks release.
DCP-006 required evidence gap blocks release.
DCP-007 AI confidence cannot replace required evidence.
DCP-008 AI cannot create syllabus authority.
DCP-009 required representation missing blocks release.
DCP-010 inaccurate representation fails review.
DCP-011 example cannot introduce unauthorized dependency.
DCP-012 formula/derivation preserves required conditions.
DCP-013 semantic translation change requires review/versioning.
DCP-014 delivery variant cannot fork canonical objective truth.
DCP-015 completeness compiler detects missing objective coverage.
DCP-016 candidate fingerprint change invalidates stale approval.
DCP-017 deterministic validator cannot impersonate required academic reviewer.
DCP-018 release eligibility requires all mandatory gates.
DCP-019 publication is atomic.
DCP-020 concurrency cannot silently create competing current versions.
DCP-021 released version is immutable.
DCP-022 editorial change does not trigger unjustified academic invalidation.
DCP-023 semantic change triggers appropriate descendant impact.
DCP-024 stale material cannot grant new taught authority.
DCP-025 shared content cannot cross non-equivalent scope/depth.
DCP-026 shared-unit change identifies dependents.
DCP-027 released material does not mark taught.
DCP-028 partial exposure does not falsely mark full atom taught.
DCP-029 content existence does not establish question eligibility.
DCP-030 PYQ absence does not block valid production.
DCP-031 PYQ enrichment cannot become syllabus authority.
DCP-032 student projection hides internal authority machinery without altering scope.
DCP-033 legacy unproven content is not falsely certified.
DCP-034 audit survives supersession/withdrawal.
DCP-035 embedded micro-units retain reconstructable provenance.
DCP-036 complexity gate prevents unnecessary runtime fragmentation.
DCP-037 partial invalidation does not corrupt unaffected units.
DCP-038 mixed stale/current composition cannot be falsely released as current.
DCP-039 review decisions bind exact candidate fingerprint.
DCP-040 material version reconstructs exact upstream authority chain.

## 42. Acceptance Gates
UPSTREAM AUTHORITY PASS
AUTHORING PLAN COMPLETENESS PASS
SCOPE CONTAINMENT PASS
DEPTH ALIGNMENT PASS
SOURCE/EVIDENCE PASS
PEDAGOGY CONFORMANCE PASS
REPRESENTATION/EXAMPLE INTEGRITY PASS
REVIEW GOVERNANCE PASS
FINGERPRINT/IMMUTABILITY PASS
ATOMIC PUBLICATION PASS
CONCURRENCY PASS
INVALIDATION PASS
SHARED REUSE SAFETY PASS
TEACHING-BOUNDARY PASS
ASSESSMENT-BOUNDARY PASS
LEGACY MIGRATION SAFETY PASS
AUDITABILITY PASS
COMPLEXITY GATE PASS

DOCUMENTED != IMPLEMENTED.

## 43. Non-Negotiable Invariants
1. No DigiBook material without valid upstream syllabus and pedagogy authority.
2. DigiBook cannot create or repair syllabus authority.
3. Every material academic claim remains in authorized scope.
4. Required evidence cannot be replaced by model confidence.
5. AI cannot self-authorize academic truth or release.
6. Required pedagogy components cannot be silently omitted.
7. Released material is immutable and exactly versioned.
8. Reviewed fingerprint must equal release candidate fingerprint.
9. Publication cannot expose partial released authority.
10. Stale material cannot create new taught authority.
11. Released does not mean taught.
12. Taught does not mean mastered.
13. Content existence does not mean question eligibility.
14. Shared content reuse requires semantic/scope/depth equivalence.
15. Language/delivery variants cannot silently fork canonical truth.
16. PYQ absence never blocks legitimate DigiBook production.
17. Historical material and review evidence remain reconstructable.
18. Legacy content is never falsely certified.
19. Micro-level provenance is preserved without unnecessary runtime fragmentation.
20. Every released material version reconstructs to verified syllabus authority.

## 44. Downstream Handoff
This contract hands immutable RELEASED material versions to Teaching Execution governed by the existing DigiBook & Taught Content Authority Contract.

The next deep contract should refine Teaching Execution and Taught Manifest evidence without redefining the already-established constitutional distinction:
RELEASED != TAUGHT != MASTERED.

Current status: DOCUMENTED. IMPLEMENTATION NOT CLAIMED. RETROSPECTIVE LEGACY-CONFLICT AUDIT PENDING.
