# RankCrackers Universal Mission, Examination Blueprint & Student Projection Contract

**Status:** Founder-locked canonical architecture contract
**Effective:** 2026-10-10
**Upstream:** Mission Discovery & Evidence Acquisition Contract
**Downstream:** OSA/DSD, DigiBook, Taught Content Authority, Crucible, Test Arena, Career Signals, Student delivery

## 1. Constitutional model

Canonical normalization:
`Authority → Mission → Recruitment Cycle → Examination Blueprint → Stage → Component → Track/Applicability → Career Outcome → Vacancy Allocation`

Cross-mission prerequisites remain separate:
`Provider Mission → verified dependency → Consumer Mission`

Academic execution:
`Effective Blueprint → Effective Syllabus → DSD/Atoms → DigiBook → Taught Authority → Crucible/Test Arena`

Career execution:
`Mission + Cycle + Outcome + Vacancy + Eligibility → Career Signals`

Student delivery:
`Canonical backend truth → Student Projection`

## 2. Core laws

1. Mission is a durable official examination/recruitment identity.
2. Recruitment Cycle contains notification-specific facts and does not create a new Mission merely because the year changes.
3. Examination Blueprint is the verified machine representation of stages, papers/components, choices and applicability.
4. Stage is a selection phase; Component is a paper/assessment unit.
5. Track exists only when candidate examination/academic requirements materially branch.
6. Career Outcome is a service/post/cadre/subject opportunity and is not automatically a Track.
7. Vacancy Allocation is cycle-specific and preserves official dimensions.
8. Cross-Mission Dependency links independently governed prerequisite exams/qualifications without merging their authority.
9. Official evidence determines structure; RankCrackers UI convenience does not.
10. Ambiguity fails closed.

## 3. Anti-confusion invariants

- Same notification does not imply same Mission.
- Different notification does not imply different Mission.
- Different year does not imply different Mission.
- Different post does not imply different Mission.
- Different vacancy count does not imply different Mission.
- Different subject does not automatically imply different Mission.
- Materially different academic requirements may require a Track/Component.
- Independently governed exam/recruitment identity may require a separate Mission.
- Shared authority does not imply shared Mission.
- Shared component label does not prove shared academic authority.
- Student UI grouping never creates backend authority.

## 4. Minimum entities

### Mission
```
missionId
authorityId
canonicalIdentity
aliases[]
status
evidenceRefs[]
```

### Recruitment Cycle
```
cycleId
missionId
notificationAnchor
effectiveNotificationState
applicationWindow
cycleDates
status
evidenceRefs[]
```

### Examination Blueprint
```
blueprintId
missionId
cycleId
version
effectiveFrom
verificationState
stages[]
trackDefinitions[]
componentApplicabilityRules[]
outcomeApplicabilityRules[]
dependencyRefs[]
supersedes
supersededBy
evidenceRefs[]
```

### Stage
```
stageId
blueprintId
officialName
stageType
sequenceRule
screeningOrMeritRole
qualificationRule
componentIds[]
evidenceRefs[]
```

### Component
```
componentId
stageId
officialName
componentType
assessmentMode
marks
duration
questionCount
negativeMarkingRule
qualifyingRule
meritRule
choiceRule
languageRule
applicabilityRule
officialSchemeEvidenceRefs[]
officialSyllabusVersionRefs[]
```

### Track
```
trackId
missionId
blueprintId
displayName
selectionDimension
applicableStageIds[]
applicableComponentIds[]
excludedComponentIds[]
outcomeRefs[]
eligibilityRuleRefs[]
evidenceRefs[]
```

### Career Outcome
```
outcomeId
missionId
canonicalOutcomeName
outcomeType
serviceOrPostCode
departmentOrCadre
payLevelOrScale
eligibilityRuleRefs[]
trackApplicability[]
cycleAvailability[]
evidenceRefs[]
```

### Vacancy Allocation
```
vacancyAllocationId
cycleId
outcomeId
trackId?
subject?
category?
region?
reservationDimension?
advertisedCount
revisedCount?
effectiveCount
revisionLineage[]
evidenceRef
verificationState
```

### Cross-Mission Dependency
```
dependencyId
consumerMissionId
providerMissionId
dependencyType
requiredQualification
validityRule
cycleApplicability
evidenceRefs[]
verificationState
```

## 5. Deterministic classification

For each official notification structure:
1. Reconcile durable Mission identity.
2. Determine whether evidence is only a new Cycle.
3. Identify official stages.
4. Identify papers/components.
5. Determine whether academic requirements branch.
6. If they branch materially, create/reference Track.
7. If only service/post outcome differs, create Career Outcome, not Track.
8. Bind vacancies to exact official dimensions.
9. Represent independently governed prerequisite exams as Cross-Mission Dependencies.
10. If classification is ambiguous, emit `STRUCTURE_CLASSIFICATION_REVIEW_REQUIRED`.

## 6. Effective Examination Blueprint

For a student context, resolve only verified applicable stages/components using Mission, active Cycle, selected track/subject/optional, applicable outcome rules, dependencies and current scheme version.

A component MUST NOT enter the Effective Blueprint merely because it exists elsewhere in the Mission.

## 7. Syllabus and academic binding

Syllabus authority binds to the narrowest correct entity: Mission-wide when genuinely common, otherwise Stage/Component/Track applicability as official evidence requires.

A shared label such as Paper-I MUST NOT cause reuse if scheme/syllabus authority differs.

DSD/atoms inherit Mission, blueprint version, applicable Stage/Component/Track and official syllabus version.

## 8. DigiBook

DigiBook resolves from Effective Blueprint plus verified syllabus/atoms.

For branched exams:
`DigiBook = genuinely shared applicable teaching + applicable specialized teaching`.

Do not expose unrelated track content as required preparation. Reuse shared teaching by reference rather than uncontrolled duplication.

## 9. Taught Content Authority

Authority requires active Mission, current verified Blueprint, current verified syllabus, verified atom, applicable component/track and actual taught content.

When applicability changes, affected authority fails closed without deleting history.

## 10. Crucible

Question eligibility:
`Mission ∩ Effective Blueprint ∩ Current Syllabus ∩ Verified Atom ∩ Taught Authority`.

Difficulty never expands scope. Mastery cannot leak across incompatible tracks/components.

## 11. Test Arena

Test Arena renders the applicable verified official structure: stage, paper/component, marks, duration, question count, assessment mode, negative marking, qualifying/merit role, choices and track applicability.

Any non-official practice variation must be explicitly labeled simulation/practice.

## 12. Career Signals

Career Signals is outcome-oriented. It may show service/post/subject, vacancy/revised vacancy, department/cadre, verified pay level, eligibility, required track, external qualification dependency and milestones.

Every signal binds back to Mission/Cycle/evidence.

Career Outcome never creates syllabus authority.

## 13. Structured notification extraction

Watch evidence produces separate candidates for Mission identity, Cycle, stages, components, tracks, outcomes, vacancies, eligibility, dependencies, syllabus/scheme refs and amendments.

Every extracted field carries value, source evidence, page/locator, extraction confidence, verification state and applicability/effective context.

AI proposes; verified evidence plus deterministic gates authorize.

## 14. Vacancy law

Never infer missing breakup. Never double-count overlapping reservation dimensions. Totals may be computed only when child dimensions are mutually exclusive and aggregation is valid.

Corrigenda create revision lineage; never destructive overwrite.

## 15. Version and impact law

Material official change:
`Evidence → Blueprint version → applicability diff → syllabus/DSD impact → DigiBook impact → Taught Authority impact → Crucible/Test Arena impact → Student projection refresh`.

Bounded changes should invalidate only affected branches when safe.

## 16. Student Android projection constitution

**Prime law: Backend may be deeply normalized; Student UI MUST be progressively simple.**

- Mission cards show high-value identity/status, not raw hierarchy.
- Track/subject/optional choice appears only when relevant.
- After selection, Syllabus/DigiBook/Crucible/Test Arena resolve automatically.
- Multiple career outcomes do not create duplicate mission cards.
- Career Signals can be granular without cluttering preparation surfaces.
- External eligibility dependencies are explained as pathway requirements without merging Missions.
- Technical IDs/entity names do not leak as primary labels.
- Student choice changes context, never official authority.
- If a student must understand backend normalization to proceed, projection design has failed.
- Existing Student Android UI/login/behavior remains protected; this contract is not implementation authorization.

Suggested conceptual surface:
```
Mission
├─ Prepare: Syllabus | DigiBook | Crucible
├─ Test: Test Arena
└─ Career: Career Signals
```

## 17. Founder projection

Founder may inspect deeper normalized structure: Mission, Cycle, Blueprint version, stages, components, tracks, outcomes, vacancies, dependencies, evidence lineage, conflicts and downstream impact.

Summarize first; atomic evidence remains available on demand.

## 18. Failure taxonomy

```
STRUCTURE_CLASSIFICATION_REVIEW_REQUIRED
MISSION_IDENTITY_AMBIGUOUS
CYCLE_BINDING_UNRESOLVED
BLUEPRINT_INCOMPLETE
BLUEPRINT_CONFLICT
STAGE_ORDER_UNRESOLVED
COMPONENT_APPLICABILITY_UNRESOLVED
TRACK_APPLICABILITY_UNRESOLVED
OUTCOME_BINDING_UNRESOLVED
VACANCY_DIMENSION_AMBIGUOUS
VACANCY_TOTAL_CONFLICT
DEPENDENCY_UNRESOLVED
SYLLABUS_COMPONENT_BINDING_UNRESOLVED
STUDENT_CONTEXT_INCOMPLETE
DOWNSTREAM_IMPACT_REVALIDATION_REQUIRED
```

Unknown remains unknown.

## 19. Concurrency/idempotency

Repeated evidence processing must not duplicate entities. Concurrent extraction must not duplicate Missions/Tracks/Outcomes. Cycle and vacancy revisions preserve history. Blueprint promotion uses version/expected-current protection. Student projection cache is invalidated by governing Blueprint/Syllabus change.

## 20. Reference patterns

### Common exam, many outcomes
One Mission + common examination pathway + many Career Outcomes. Learning stays shared unless official conditional requirements exist.

### Common + specialized tracks
One Mission + genuinely shared components + specialized Track components. Effective Blueprint is the verified composition.

### Stage-based selection
One Mission + ordered/conditional stages. Screening, qualifying and merit roles remain explicit.

### External eligibility dependency
Eligibility Mission and Recruitment Mission remain separate and are linked by verified dependency.

## 21. Acceptance tests

Implementation MUST prove:
1. annual notification reuses durable Mission;
2. posts do not auto-create Missions;
3. vacancies do not auto-create Tracks;
4. one notification can represent independent Missions when official identity requires;
5. multiple notifications can bind one Mission;
6. subject branch creates Track only for material exam/academic branching;
7. common component reuse requires identical authority;
8. same label with different authority does not merge;
9. stage order and screening/merit role are preserved;
10. optional and conditional components are representable;
11. external eligibility exam remains separate;
12. dependency links without authority merger;
13. multiple outcomes share learning without syllabus duplication;
14. subject/post vacancies bind correctly;
15. reservation dimensions do not double-count;
16. vacancy revisions preserve lineage;
17. missing breakup stays unknown;
18. Career Signal retains evidence;
19. Career Outcome cannot create academic authority;
20. Effective Blueprint excludes inapplicable components;
21. syllabus binds to narrowest correct entity;
22. DSD inherits applicability;
23. DigiBook excludes unrelated track requirements;
24. shared teaching reuse preserves provenance;
25. Taught Authority fails closed after invalidation;
26. Crucible cannot use another track's substantive knowledge;
27. mastery cannot leak across incompatible tracks;
28. Test Arena preserves official scheme;
29. practice variation is labeled;
30. Blueprint revision triggers bounded impact analysis;
31. Student card hides raw backend hierarchy;
32. Track choice appears only when relevant;
33. academic surfaces auto-resolve after selection;
34. career outcomes do not duplicate mission cards;
35. Career Signals granularity does not clutter Prepare;
36. dependency is understandable without Mission merger;
37. unresolved state is not shown as certainty;
38. Student choice cannot mutate authority;
39. backend IDs do not leak as primary labels;
40. projection refreshes after governing version change;
41. Student UI/login/behavior remains unchanged until separately authorized.

## 22. Professional product gate

Every architecture review must pass both:

**Truth Lens:** official structure is exact, traceable, versioned and collision-free.

**Experience Lens:** student can understand what to prepare, what test applies and what career opportunity exists without understanding backend normalization.

Failure of either lens blocks acceptance.

## 23. Canonical summary

Mission = durable identity. Cycle = notification instance. Blueprint = official exam structure. Stage = selection phase. Component = paper/assessment unit. Track = materially different candidate pathway. Career Outcome = service/post/subject opportunity. Vacancy Allocation = cycle-specific numbers. Cross-Mission Dependency = independently governed prerequisite. Effective Blueprint drives academic engines. Career Signals consumes outcomes without creating academic authority. Student Projection hides backend complexity. Official evidence governs every relationship. Ambiguity fails closed.
