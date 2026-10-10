# RANKCRACKERS — SUBJECT TEACHER RESOLUTION CONSTITUTION

Document ID: RC-ACADEMIC-STR-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Draft / Pending Retrospective Conflict Audit
Authority Level: Academic Constitutional Candidate
Scope: Mission -> Verified Syllabus -> DSD/Atom -> Subject Teacher -> Pedagogy -> DigiBook
Conflict Rule: Founder latest explicit locked decision and ratified higher constitutional authority prevail. Legacy conflicts must be reconciled explicitly, never silently overwritten.

## 1. Governing Law
SYLLABUS = WHAT must be taught.
SUBJECT TEACHER = subject-specific authority over interpretation of HOW it should be taught.
PEDAGOGY = HOW the atom is pedagogically executed.
DIGIBOOK = actual taught material produced under those authorities.

Subject Teacher authority may enrich HOW an atom is taught. It may never silently change WHAT the verified syllabus says.

## 2. Atomic Resolution Unit
The smallest authoritative resolution unit is:
Mission x SyllabusVersion x DSDNode x AtomID

Every teachable atom must answer which exact Subject Teacher authority owns its subject-teaching interpretation under the exact syllabus version.

## 3. Exactly-One Effective Owner
For every atom eligible for teaching:
effective_teacher_count(atom) = 1

Zero valid matches => UNRESOLVED => FAIL CLOSED.
One valid highest-precedence match => RESOLVED.
Multiple deterministic-precedence matches => resolve winner with explainable rejected candidates.
Multiple equally authoritative matches => AMBIGUOUS => FAIL CLOSED.

No random choice, first-record-wins behavior, generic fallback, or best-guess production teaching is permitted.

## 4. Required Teacher Identity
Every Subject Teacher definition is versioned and must include:
- subject_teacher_id
- subject_teacher_version
- subject_domain
- supported_subdomains
- mission_constraints
- resolution_rules_version
- pedagogy_capability_contract
- status
- effective_from
- deprecated_at when applicable
- superseded_by when applicable

Material behavior changes require a new version; published versions are not mutated in place.

## 5. Resolution Inputs
Minimum authoritative inputs:
- mission ID/version
- exam authority
- blueprint version
- verified syllabus version
- DSD node ID
- atom ID and canonical atom text
- parent hierarchy
- subject/topic/subtopic
- learning intent where available
- mission context
- applicable language requirements
- prerequisite metadata where established
- resolution-rule version

Teacher authority must never be inferred solely from display text.

## 6. Resolution Output
Every successful resolution records:
- teacher_resolution_id
- mission_id
- syllabus_version
- atom_id
- subject_teacher_id/version
- resolution_rule_version
- resolution_reason
- resolution_specificity
- resolved_at
- resolution_status
- input_fingerprint
- output_fingerprint

Resolution must be reproducible from authoritative inputs.

## 7. Resolution Precedence
Resolution moves from most-specific legitimate authority to broader legitimate authority:
1. explicit atom-level subject authority
2. explicit subtopic-level authority
3. explicit topic-level authority
4. verified subject-domain authority
5. approved mission-specific subject mapping

A broader rule cannot override a valid more-specific rule. Specificity alone cannot legitimize an invalid mapping.

## 8. No Silent Fallback
Forbidden:
resolution failure -> GenericTeacher -> publish DigiBook

Any future Generalist Teacher must be explicitly defined, versioned, scope-limited, auditable and governance-approved. It cannot suppress resolution errors.

## 9. Multidisciplinary Atoms
Compound atoms should first be tested for valid decomposition. If decomposition would corrupt official syllabus meaning, exactly one Primary Subject Teacher remains authoritative and bounded SupportingSubjectAuthority entries may contribute expertise. Supporting authorities cannot silently redefine the atom or publish conflicting taught authority.

## 10. Decomposition Gate
Decompose only if:
- each child has independent pedagogical meaning
- official syllabus semantics remain intact
- parent-child traceability is lossless
- assessment coverage remains reconstructable
- no artificial syllabus expansion occurs

Children retain provenance to the canonical parent.

## 11. Subject Teacher Responsibilities
May own:
- conceptual structure
- prerequisites and dependency ordering
- misconception taxonomy
- terminology discipline
- representation requirements
- explanation depth
- abstraction level
- subject reasoning patterns
- diagram/equation/derivation requirements
- exam-relevant treatment
- prohibited pedagogical shortcuts

Does not own official syllabus truth, notification authority, arbitrary syllabus expansion, PYQ provenance, final question publication authority, student mastery truth, or unrelated mission policy.

## 12. Syllabus Immutability Boundary
A teacher detecting malformed, misclassified, duplicated, missing-context or semantically inconsistent syllabus data raises UPSTREAM_SYLLABUS_REVIEW_REQUIRED. The teacher cannot locally rewrite canonical syllabus truth and continue.

## 13. Pedagogy Handoff
Required chain:
Verified Atom -> Teacher Resolution -> Teacher Interpretation -> Pedagogy Plan -> DigiBook Content

DigiBook cannot bypass teacher resolution where Subject Teacher authority is required.

## 14. Teacher Interpretation Artifact
Minimum fields:
interpretation ID, atom ID, teacher ID/version, syllabus version, conceptual meaning, prerequisites, learning objectives, key concepts, misconceptions, required representations, treatment depth, exclusions, cross-links, pedagogy constraints, assessment implications, evidence references, version and status.

## 15. Version Binding
Every downstream artifact retains atom_id, syllabus_version, teacher_id, teacher_version, teacher_interpretation_version and pedagogy_version. New teacher implementations cannot retroactively appear to have authored old content.

## 16. Change Impact and Invalidation
Changes to syllabus semantics/hierarchy/classification, teacher identity/version, resolution rules, interpretation, prerequisites or pedagogy capability trigger deterministic impact evaluation.

Possible impact states:
UNAFFECTED, REVALIDATION_REQUIRED, REGENERATION_REQUIRED, REVIEW_REQUIRED, INVALID, SUPERSEDED.

Affected descendants can include Pedagogy Plans, DigiBook Blocks, Published DigiBook Versions, Taught Content Manifest, Question Eligibility/Dependencies, Crucible Items, Test Arena Assemblies and Knowledge Closure.

Historical evidence is preserved; stale authority is not silently treated as current.

## 17. Fingerprints
Use deterministic canonical fingerprints for resolution inputs and interpretation payloads to distinguish metadata-only change, semantic change, unchanged recomputation and stale descendants. Serialization and hash algorithm are centrally defined.

## 18. State Machine
UNRESOLVED -> RESOLUTION_PENDING -> RESOLVED
Exception states: AMBIGUOUS, INVALID_MAPPING, STALE, SUPERSEDED.
Only RESOLVED with current valid dependencies authorizes new pedagogy execution.

## 19. Fail-Closed Conditions
Block affected teaching when syllabus authority/atom identity is missing, teacher resolution is absent or ambiguous, teacher version is invalid/deprecated without successor, provenance is broken, mission/version mismatches exist, or authoritative fingerprints mismatch.

## 20. Determinism, Idempotency and Concurrency
Identical authoritative inputs produce semantically identical effective resolution. Repeated execution cannot create competing active resolutions. Persistence must enforce one effective owner using transactional/conditional/unique equivalent guarantees.

## 21. Audit Ledger
Reconstruct resolution requests, candidate evaluations, accepted/rejected decisions, ambiguity, invalidation, supersession, descendant impact and manual governance intervention. Machine and human decisions remain distinguishable.

## 22. Manual Override
Overrides are exceptional and record actor, authority, reason, previous/replacement resolution, scope, effective time, review/expiry, evidence and downstream impact. Historical evidence cannot be erased.

## 23. Mission and Language Isolation
Mappings are mission-aware; a subject mapping cannot leak across missions merely because labels match. Language rendering must preserve canonical academic ownership; materially changed treatment requires versioned pedagogy/content authority.

## 24. PYQ Relationship
PYQ count zero does not block Subject Teacher resolution. PYQ may enrich misconception evidence, exam emphasis, calibration and examples, but syllabus teaching authority is independent of PYQ availability.

## 25. Downstream Academic Laws
RESOLVED TEACHER != TAUGHT
DIGIBOOK GENERATED != TAUGHT
QUESTION EXISTS != CRUCIBLE ELIGIBLE

Question provenance must remain reconstructable:
Question -> Knowledge Dependency -> Taught Content -> DigiBook -> Pedagogy -> Teacher Interpretation -> Teacher Resolution -> Verified Syllabus Atom.

## 26. Observability
Expose total teachable atoms, resolved/unresolved/ambiguous atoms, stale resolutions, invalid mappings, teacher-version distribution and pending downstream revalidation. These are operational health metrics, not student mastery metrics.

## 27. Future Implementation Contract
Codex implementation should provide equivalent data models for teacher definitions/versions, resolutions, interpretations, evidence, audit events and dependency/invalidation edges; resolver/validator/fingerprint/change-impact/invalidation services; hard validation; singular effective-resolution persistence; and safe legacy migration.

Existing content without proven teacher authority must not be silently backfilled. It should be classifiable as LEGACY_AUTHORITY_UNPROVEN until reconciled.

## 28. Minimum Acceptance Suite
STR-001 exact mapping resolves.
STR-002 identical input is idempotent.
STR-003 no match fails closed.
STR-004 equal-precedence conflict is AMBIGUOUS.
STR-005 valid specific rule defeats broader rule.
STR-006 invalid specific rule cannot defeat valid authority.
STR-007 deprecated teacher cannot create new authority.
STR-008 teacher-version change evaluates descendants.
STR-009 syllabus semantic change stales affected resolution.
STR-010 unrelated change leaves unaffected atom unaffected.
STR-011 concurrency cannot create two active owners.
STR-012 silent generic fallback is impossible.
STR-013 compound decomposition preserves parent provenance.
STR-014 supporting teacher cannot replace primary owner.
STR-015 mission mappings cannot leak.
STR-016 PYQ absence does not block resolution.
STR-017 teacher resolution cannot mark content taught.
STR-018 unproven legacy content is not falsely certified.
STR-019 audit history survives supersession.
STR-020 fingerprint mismatch blocks current-authority claim.

## 29. Acceptance Gate
Implementation is complete only after schema, deterministic resolution, exactly-one authority, no-silent-fallback, version traceability, invalidation, concurrency, auditability, mission isolation, legacy migration safety and downstream provenance tests pass.

DOCUMENTED != IMPLEMENTED.

## 30. Constitutional Invariants
1. Every teachable atom has exactly one effective Subject Teacher authority or remains blocked.
2. Teacher authority never rewrites verified syllabus truth.
3. Ambiguity is never resolved by guessing.
4. Unresolved atoms never silently fall into a generic teacher.
5. Teaching artifacts retain exact authorizing teacher version.
6. Authority changes propagate through explicit dependency/invalidation logic.
7. Historical evidence is never rewritten to make current architecture appear retroactively true.
8. PYQ availability is not prerequisite to legitimate teaching.
9. Teacher resolution is necessary but never sufficient evidence that knowledge was taught.
10. Every downstream academic claim remains reconstructable to verified syllabus authority.

## 31. Next Contract
RC-ACADEMIC-APE-001 — Atomic Pedagogy Execution Contract will define:
Teacher Interpretation -> Learning Objective -> Prerequisite Graph -> Pedagogical Strategy -> Teaching Sequence -> Explanation Units -> Examples -> Representations -> Misconception Treatment -> Practice/Checkpoints -> Mastery Evidence Requirements -> DigiBook Production Specification.

Current status: DOCUMENTED. IMPLEMENTATION NOT CLAIMED. RETROSPECTIVE LEGACY-CONFLICT AUDIT PENDING.
