# RankCrackers Canonical Syllabus & Derived Decomposition Contract

**Status:** Founder-locked architecture contract  
**Scope:** Mission syllabus authority, decomposition, teaching and assessment boundaries  
**Change control:** Architecture changes require explicit Founder approval.

## 1. Purpose

RankCrackers must preserve the exact authority of an official examination syllabus while still producing enough instructional granularity for teaching, DigiBook construction, coverage analysis and assessment.

The system therefore maintains two distinct but traceably linked layers:

1. **Official Syllabus Authority (OSA)** — what the competent examination authority actually published.
2. **Derived Syllabus Decomposition (DSD)** — RankCrackers' controlled decomposition of an official syllabus node into finer teachable and assessable concepts.

"Digestive Syllabus" may be used as a product-facing alias for DSD. Engineering, schemas, tests and authority logic use the precise term **Derived Syllabus Decomposition**.

## 2. Non-negotiable law

> **Official authority defines the boundary. RankCrackers may derive depth only inside that boundary.**

Derived content never becomes evidence that the examination authority published that wording or granularity.

## 3. Canonical hierarchy

The normalized instructional hierarchy is:

`SUBJECT → UNIT → TOPIC → MICRO_TOPIC → ATOMIC_TOPIC`

Not every official syllabus must contain every level. Official structure is captured faithfully, even when levels are absent.

Example:

Official publication:
`Subject → Unit → Topic: Rajasthan ki Mukhya Nadiyan`

RankCrackers may derive:
`Topic → Micro Topics → Atomic Topics`

The derived children remain descendants of the official topic and must not expand its semantic scope.

## 4. Provenance classes

Every syllabus node MUST carry provenance.

### OFFICIAL
A node or wording directly supported by authoritative official evidence.

Required properties include:
- mission identity;
- authority/source identity;
- source document/version identity;
- evidence locator where available (page/section/heading);
- verbatim or normalized official wording with traceability;
- effective/version state;
- verification state.

### DERIVED
A RankCrackers-created decomposition node.

Required properties include:
- mission identity;
- parent node identity;
- nearest official ancestor identity;
- derivation version;
- derivation method/worker identity;
- semantic-scope binding;
- verification state;
- supersession/invalidation state;
- no claim of official authorship.

No node may silently change provenance.

## 5. Official extraction law

The Official Syllabus Extraction process MUST:
- preserve the authority's published meaning and hierarchy;
- not invent missing levels;
- not convert inferred concepts into OFFICIAL nodes;
- retain source traceability;
- distinguish formatting normalization from semantic addition;
- preserve ambiguity rather than silently resolving it;
- version changes when official evidence changes.

If an official syllabus stops at TOPIC, the official tree stops at TOPIC.

## 6. Derived decomposition law

DSD MAY create missing lower instructional levels when required for teaching or assessment.

A derived node MUST:
1. be semantically contained within its parent;
2. be traceable to a nearest OFFICIAL ancestor;
3. add granularity, not broaden examinable scope;
4. represent a meaningful teachable/assessable concept;
5. avoid duplicate or materially overlapping siblings;
6. remain separately identifiable and versioned;
7. pass verification before downstream authority is granted.

A derived node MUST NOT:
- introduce a new subject area outside the official ancestor;
- be labeled or presented as official;
- use PYQs, textbooks, coaching material or model knowledge to enlarge official scope;
- inherit verification merely because its parent is verified;
- become Student authority merely because it is visible in a UI.

## 7. Atomic-topic criterion

An ATOMIC_TOPIC is the smallest useful syllabus concept that RankCrackers intends to independently teach, map, assess, track or reason about without requiring another syllabus split for normal platform operation.

Atomicity is functional, not word-count based.

A candidate atom should be split further when it contains independently teachable concepts whose separate mastery or assessment materially matters.

It should NOT be split merely to create artificial granularity.

## 8. Evidence versus decomposition

External academic sources, standard references and official PYQs may help validate interpretation or discover likely decomposition candidates, but they do not change the official syllabus boundary.

PYQ presence can support relevance **within** an official boundary. PYQ absence does not by itself remove an official syllabus concept.

No unofficial source can promote a DERIVED node to OFFICIAL.

## 9. Ambiguity handling

When a broad official term has multiple plausible interpretations:
- preserve the official wording;
- create an ambiguity record;
- prefer conservative in-bound decomposition;
- block questionable derived branches from verified authority;
- escalate material unresolved scope ambiguity as a Founder/academic exception rather than silently broadening scope.

Routine unambiguous decomposition should remain automated.

## 10. Duplicate and overlap control

Before accepting a derived node, the system should test for:
- semantic duplicate under the same ancestor;
- alias/synonym duplication;
- cross-branch overlap;
- parent-child redundancy;
- circular ancestry.

Canonical identity must remain stable across wording normalization where the underlying concept is unchanged.

## 11. Verification states

Implementation may use schema-specific names, but semantics must distinguish at least:

- `CANDIDATE`
- `VERIFIED`
- `INVALIDATED`
- `SUPERSEDED`

Missing verification is not equivalent to VERIFIED.

Downstream authority requiring a verified atom MUST fail closed when atom verification is missing or false.

## 12. Versioning and official change impact

Official syllabus evidence is versioned.

When official authority changes, the system MUST perform impact analysis across:
- affected official nodes;
- derived descendants;
- pedagogy/teacher resolution;
- DigiBook/material versions;
- teaching executions and taught-content authority;
- question/assessment mappings;
- delivery readiness and publication state.

Affected derived nodes must be revalidated, invalidated or superseded as appropriate. Old authority must not silently remain current.

## 13. Separation of workers/responsibilities

### Official Syllabus Extraction
Captures WHAT the authority published.

### Derived Syllabus Decomposition
Creates instructional depth inside the official boundary.

These responsibilities MUST NOT be collapsed in a way that makes generated decomposition indistinguishable from official evidence.

## 14. Downstream authority

The syllabus chain is:

`Official Evidence → Official Syllabus Authority → Derived Decomposition (when needed) → Atom Verification → Subject Teacher/Pedagogy → DigiBook/Material → Teaching Execution → Taught Content Authority → Assessment`

Important distinctions:

- Official evidence ≠ verified mission.
- Mission verified ≠ syllabus/atom verified.
- Syllabus/atom verified ≠ content taught.
- Content created ≠ content taught.
- Content taught ≠ assessment/publication readiness.
- UI visibility ≠ authority.
- Student state ≠ authority.

## 15. DigiBook boundary

DigiBook may teach only content justified by the applicable verified syllabus authority.

It may explain an atom deeply, use examples and pedagogy, but teaching expansion must not silently create new syllabus authority.

If teaching reveals a genuinely missing decomposition need, it returns to DSD for controlled creation and verification rather than self-authorizing the new syllabus node.

## 16. Assessment boundary

Questions must be bounded by applicable verified syllabus authority and, where RankCrackers policy requires it, verified taught-content authority.

Assessment generation cannot use question-bank convenience, PYQ frequency or model confidence to bypass missing syllabus authority.

## 17. Automation and Founder exception model

Default: automate deterministic work.

Automatable:
- official hierarchy parsing;
- candidate decomposition;
- provenance assignment;
- duplicate/overlap checks;
- scope-containment checks;
- version impact propagation;
- verification queues;
- downstream invalidation signals.

Founder/qualified human exception:
- unresolved official ambiguity;
- conflicting authoritative documents;
- material semantic scope dispute;
- irreversible/high-impact publication decisions when policy requires approval.

**Founder operates by exception, not by routine.**

## 18. Fail-closed rules

The system MUST fail closed when required authority is absent, invalid, superseded, ambiguous beyond tolerance or not verified.

It MUST NOT infer authority from:
- publication status;
- readiness flags;
- Founder UI visibility;
- Student visibility/activity;
- existence of content;
- existence of questions;
- mastery/attempt data.

## 19. Minimum node contract

A production implementation should provide equivalent semantics for:

```
nodeId
missionId
level
parentNodeId
nearestOfficialAncestorId
label
normalizedLabel
provenance: OFFICIAL | DERIVED
officialEvidenceRef      // required for OFFICIAL
derivationRef            // required for DERIVED
verificationState
versionId
effectiveState
createdAt
verifiedAt
invalidatedAt
supersededBy
```

Exact storage field names may evolve without changing these semantics.

## 20. Acceptance invariants

A syllabus implementation is non-conformant if any of these are possible:

1. A derived node is represented as official.
2. A derived node has no traceable official ancestor.
3. Decomposition broadens official scope.
4. Missing official hierarchy levels are fabricated as official.
5. An unverified atom grants downstream teaching/assessment authority.
6. UI or Student state substitutes for authority.
7. Official syllabus change leaves affected descendants silently valid.
8. DigiBook or Assessment creates syllabus authority by itself.
9. A legacy test is made green by weakening an authority gate.
10. Provenance is lost during materialization or projection.

## 21. Required test families

At minimum:
- official-only hierarchy with missing lower levels;
- valid derived micro/atomic decomposition;
- out-of-scope derived child rejection;
- missing nearest-official-ancestor rejection;
- provenance mutation rejection;
- unverified atom fail-closed;
- invalidated/superseded atom fail-closed;
- official source version-change impact;
- duplicate/overlap handling;
- ambiguous-scope escalation;
- downstream DigiBook boundary;
- downstream Assessment boundary;
- Student/UI non-authority.

## 22. Change control

This contract is an architectural invariant.

A bug, new exam, new syllabus format, failed test or implementation inconvenience MUST be solved inside this contract where possible.

The contract may be changed only when:
1. a genuine architectural contradiction or insufficiency is demonstrated; and
2. the Founder explicitly approves the architectural change.

Implementation details may evolve without Founder architecture approval only when they preserve all contract semantics.

## 23. Canonical terminology

- **Official Syllabus Authority (OSA):** authoritative published syllabus representation.
- **Derived Syllabus Decomposition (DSD):** RankCrackers-generated granular decomposition within official scope.
- **Digestive Syllabus:** optional product-facing alias for DSD.
- **Atomic Topic:** smallest useful independently teachable/assessable syllabus concept.
- **Nearest Official Ancestor:** closest ancestor node whose provenance is OFFICIAL.
- **Scope containment:** requirement that derived meaning remains inside official ancestor meaning.

---

**Founder-locked summary:** Preserve official truth exactly. Derive missing instructional depth separately. Keep provenance explicit. Never broaden official scope through decomposition. Verify derived atoms before downstream authority. Fail closed when authority is missing. Automate routine decomposition and governance; escalate genuine ambiguity by exception.
