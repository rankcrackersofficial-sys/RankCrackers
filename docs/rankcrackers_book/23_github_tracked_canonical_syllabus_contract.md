# Chapter 23 — GitHub-Tracked Canonical Syllabus & Derived Decomposition Contract

**Current acceptance:** working reference; path existence does not certify runtime behavior, production state or passing tests. Historical code excerpts and line ranges require SHA-specific readback before implementation use.

**GitHub source snapshot:** [`docs/rankcrackers_book/23_github_tracked_canonical_syllabus_contract.md`](https://github.com/rankcrackersofficial-sys/RankCrackers/blob/5161592ddafb42f1ecc8923cc7b7b0309934cc83/docs/rankcrackers_book/23_github_tracked_canonical_syllabus_contract.md) · source blob `3e456cf4d7378f7749756c2b9065e862cae98954`. This Drive edition contains editorial corrections; it is not a claim that those corrections were committed to GitHub. See `github_source_manifest.json` and the current reconciliation register.


**Volume:** B — Student Experience, Academic Authority & Learning Surface  
**Part:** 5 — Official Syllabus Authority, Derived Decomposition & Knowledge Closure  
**Source class:** DEFAULT-BRANCH TRACKED ARCHITECTURE CONTRACT — runtime implementation parity separately pending  
**Editorial status:** SOURCE-REVIEWED / BOOK-INGESTED / IMPLEMENTATION PARITY PENDING  
**Chief Author observation date:** 2026-10-10  
**Repository:** [rankcrackersofficial-sys/RankCrackers](https://github.com/rankcrackersofficial-sys/RankCrackers)  
**Tracked branch:** `safety/rc-g2-pre-notification-schema`  
**Historical contract-change commit:** [bfee5c70814af5c2c2c3f3ba9fd9163361441d87](https://github.com/rankcrackersofficial-sys/RankCrackers/commit/bfee5c70814af5c2c2c3f3ba9fd9163361441d87)  
**Previous observed commit:** [b5ef867206d350db527e964c391fc324221752fd](https://github.com/rankcrackersofficial-sys/RankCrackers/commit/b5ef867206d350db527e964c391fc324221752fd)  
**Tracked source path:** `docs/architecture/CANONICAL_SYLLABUS_AND_DERIVED_DECOMPOSITION_CONTRACT.md`

---

## 23.1 Chief Author tracking decision

यह chapter GitHub default branch में tracked syllabus architecture contract को book में traceable रूप से शामिल करता है। इसे local code की स्वतः-सिद्ध implementation नहीं माना जाएगा। Remote contract में वर्णित कोई भी rule तभी “live implementation” कहलाएगा जब वर्तमान checkout में उसका source symbol, schema, test evidence और runtime/readback proof अलग से मिल जाए।

Remote और local state का अंतर:

| Evidence layer | Current finding | Book treatment |
|---|---|---|
| GitHub remote document | Latest head पर उपलब्ध | Canonical remote source के रूप में track |
| Current GitHub default branch | Contract file exists at `5161592ddafb42f1ecc8923cc7b7b0309934cc83` | Default-tracked architecture; runtime parity remains separately pending |
| Existing book chapters | Syllabus, DigiBook और assessment architecture पहले से documented | इस chapter से cross-reference और reconciliation आवश्यक |
| Runtime implementation | इस chapter से स्वतः प्रमाणित नहीं | Source/test audit के बाद ही VERIFIED |
| Google Docs | Full parity अलग gate है | इस chapter से synchronized नहीं माना जाएगा |

## 23.2 Remote change history

### 23.2.1 Commit `b5ef867...`

Commit message: **docs: lock canonical syllabus and derived decomposition contract**

इस commit ने Founder-locked architecture contract स्थापित किया:

- Official Syllabus Authority और Derived Syllabus Decomposition का अलगाव;
- `SUBJECT → UNIT → TOPIC → MICRO_TOPIC → ATOMIC_TOPIC` hierarchy;
- `OFFICIAL` और `DERIVED` provenance;
- official extraction और derived decomposition की अलग जिम्मेदारी;
- atomicity को word-count नहीं बल्कि functional utility से परिभाषित करना;
- verification states, versioning, ambiguity और overlap controls;
- DigiBook तथा Assessment को syllabus authority बनाने से रोकना;
- fail-closed authority boundary;
- minimum node contract और acceptance invariants।

### 23.2.2 Commit `bfee5c7...`

Commit message: **docs: lock syllabus decomposition boundary and knowledge closure**

इस commit ने contract को sections 24–38 तक विस्तारित किया:

- concept boundary बनाम teaching-content boundary;
- Decomposition Stop Test;
- scope, depth और difficulty का स्वतंत्र modelling;
- Mission Academic Boundary Profile;
- evidence hierarchy;
- official PYQ scope exceptions;
- Question Knowledge Closure;
- machine-enforceable DSD decision model;
- AI और deterministic code की अलग भूमिकाएँ;
- boundary-drift control;
- failure taxonomy;
- implementation sequence;
- expanded acceptance test matrix;
- constitutional authority chain।

## 23.3 Editorial interpretation and authority boundary

इस source का governing principle है:

> **Official authority defines the boundary. RankCrackers may derive depth only inside that boundary.**

इसका अर्थ:

1. Official syllabus वह है जो competent examination authority ने प्रकाशित किया।
2. RankCrackers derived hierarchy बना सकता है, लेकिन derived wording को official wording नहीं बना सकता।
3. Teaching explanation, derivation, example, mnemonic, practice set और remediation note सामान्यतः syllabus decomposition नहीं, बल्कि DigiBook/Pedagogy content हैं।
4. PYQ, textbook, coaching material या AI confidence official scope का विस्तार नहीं कर सकते।
5. UI visibility, publication readiness, mastery state या student activity authority का विकल्प नहीं हैं।
6. Unverified, superseded, invalidated या ambiguous authority पर downstream publication fail closed होना चाहिए।

## 23.4 Canonical hierarchy and provenance

Remote contract में normalized instructional hierarchy है:

`SUBJECT → UNIT → TOPIC → MICRO_TOPIC → ATOMIC_TOPIC`

हर node को कम-से-कम इन semantic properties की आवश्यकता है:

```
nodeId
missionId
level
parentNodeId
nearestOfficialAncestorId
label
normalizedLabel
provenance: OFFICIAL | DERIVED
officialEvidenceRef      // OFFICIAL के लिए आवश्यक
derivationRef            // DERIVED के लिए आवश्यक
verificationState
versionId
effectiveState
createdAt
verifiedAt
invalidatedAt
supersededBy
```

### OFFICIAL node

OFFICIAL node के लिए mission identity, source identity, source version, evidence locator, official wording, effective state और verification state traceable होने चाहिए।

### DERIVED node

DERIVED node के लिए parent identity, nearest official ancestor, derivation version, worker/method, semantic-scope binding, verification और supersession/invalidation state अनिवार्य हैं। DERIVED node को official authorship का दावा नहीं करना चाहिए।

## 23.5 Decomposition boundary

DSD केवल तब lower-level nodes बना सकता है जब:

- child parent के अर्थ के भीतर हो;
- nearest OFFICIAL ancestor से traceable हो;
- examinable scope न बढ़ाए;
- meaningful teachable/assessable concept हो;
- duplicate या materially overlapping sibling न हो;
- independently identifiable और versioned हो;
- downstream authority से पहले verified हो।

निम्न items सामान्यतः syllabus child नहीं हैं:

- definition या explanation;
- derivation या proof;
- worked example;
- illustration;
- mnemonic या trick;
- misconception;
- teaching sequence;
- practice set;
- remediation note;
- solution narration।

Boundary test: जब अगला split “यह कौन-सा concept है?” से बदलकर “इसे कैसे सिखाएँ/समझाएँ/practise करें?” हो जाए, DSD रुकता है और DigiBook/Pedagogy शुरू होता है।

## 23.6 Decomposition Stop Test

हर proposed child set को इन mandatory gates से गुजरना है:

### Scope Containment Gate

हर child immediate parent और nearest OFFICIAL ancestor दोनों के अर्थ के भीतर होना चाहिए।

### Concept Gate

Child वास्तविक concept, skill, relationship, process या meaningful factual unit होना चाहिए। arbitrary token, spelling fragment, metadata या editorial heading atom नहीं है।

### Sibling Coherence Gate

Sibling set coherent हो, duplicate/alias nodes न हों और semantic overlap नियंत्रित हो।

### Utility signals

Independent Teaching Value, Independent Assessment Value और Independent Mastery/Diagnostic Value evaluate किए जाएँ। सामान्यतः तीन में से कम-से-कम दो materially true होने चाहिए।

### Diminishing-Utility Stop Rule

यदि अगला split teaching selection, mastery diagnosis, assessment mapping, coverage assurance या remediation में material downstream gain नहीं देता, वर्तमान node `ATOMIC_TOPIC` है और decomposition रुकना चाहिए।

### No artificial quotas

“हर topic में पाँच atoms”, “maximum ten atoms” या “हमेशा पाँच hierarchy levels” जैसे fixed quotas मान्य नहीं हैं।

### Mission-sensitive atomicity

एक concept एक mission में atomic और दूसरे mission में decomposed हो सकता है, यदि official scope तथा academic standard इसका औचित्य सिद्ध करें।

## 23.7 Scope, depth and difficulty

इन तीनों को अलग controls के रूप में model करना होगा:

- **Scope:** verified mission authority के भीतर कौन-से concepts अनुमत हैं।
- **Depth:** mission के लिए कितनी conceptual granularity चाहिए।
- **Difficulty:** अनुमत knowledge का उपयोग करके reasoning, integration, traps और application कितनी कठिन हो सकती है।

कठिन question scope को broaden नहीं करता। गहरी explanation नई syllabus authority नहीं बनाती।

Canonical rule:

> **Maximize legitimate reasoning difficulty without exceeding verified scope, mission-appropriate depth, or taught-knowledge authority.**

## 23.8 Mission Academic Boundary Profile

प्रत्येक mission के लिए versioned boundary profile recommended है:

```
missionId
profileVersion
officialSyllabusVersion
academicLevel
subjectDomain
scopePolicy
depthPolicy
referencePolicy
pyqPolicy
effectiveState
verifiedAt
supersededBy
```

यह profile mission-specific होगी। “Indian exam” अपने-आप content boundary नहीं है; competent authority, prescribed academic level, subject nature और applicable reference standards मिलकर boundary निर्धारित करते हैं।

## 23.9 Evidence hierarchy

Evidence की default hierarchy:

1. current competent official syllabus, scheme और rules;
2. official prescribed/reference material;
3. official question papers/PYQs और official answer material;
4. authoritative academic/government/reference sources;
5. secondary educational sources — केवल corroboration;
6. AI/model knowledge — केवल candidate generation assistance।

Lower-level evidence higher-level authority को silently override नहीं कर सकती।

## 23.10 Official PYQ Scope Exception

यदि official PYQ current interpreted boundary से बाहर दिखाई दे:

- उसे ignore नहीं करना है;
- उससे syllabus को स्वतः expand नहीं करना है;
- governed exception record बनाना है;
- classification `IN_SCOPE`, `DEPTH_SIGNAL`, `SCOPE_EXCEPTION` या `AMBIGUOUS` हो सकती है;
- repeated official evidence controlled boundary review खोल सकती है;
- कोई actual scope change versioned, attributable और downstream revalidated होना चाहिए।

## 23.11 Question Knowledge Closure

Production assessment item को substantive untaught या unverified knowledge पर निर्भर नहीं होना चाहिए।

Question binding contract:

```
questionId
missionId
requiredKnowledgeAtomIds[]
requiredMaterialVersionIds[]
reasoningProfile
boundaryProfileVersion
closureState
```

Publication gate `QUESTION_KNOWLEDGE_CLOSED` तभी हो जब हर substantive dependency:

1. सही mission/version से belong करे;
2. verified syllabus authority तक trace हो;
3. invalidated या superseded न हो;
4. taught-content authority से compatible हो;
5. hidden external specialist knowledge पर निर्भर न हो।

Novel combinations और कठिन multi-atom reasoning allowed हैं, यदि underlying knowledge closed है।

## 23.12 Machine-enforceable DSD decision states

Suggested pure decision states:

```
ALLOW_DERIVED_NODE
ATOMIC_STOP
REVIEW_REQUIRED
REJECT_OUT_OF_SCOPE
REJECT_NON_CONCEPT
REJECT_DUPLICATE_OR_OVERLAP
REJECT_MISSING_LINEAGE
REJECT_MISSING_EVIDENCE
REJECT_UNVERIFIED
```

Reference model:

```js
function decideDerivedNode(candidate, context) {
  if (!context.missionActive) return "REJECT_UNVERIFIED";
  if (!candidate.nearestOfficialAncestorId) return "REJECT_MISSING_LINEAGE";
  if (!candidate.scopeContained) return "REJECT_OUT_OF_SCOPE";
  if (!candidate.isMeaningfulConcept) return "REJECT_NON_CONCEPT";
  if (!candidate.siblingCoherent) return "REJECT_DUPLICATE_OR_OVERLAP";
  if (candidate.semanticAmbiguityAboveTolerance) return "REVIEW_REQUIRED";

  const utilitySignals = [
    candidate.independentTeachingValue,
    candidate.independentAssessmentValue,
    candidate.independentMasteryValue,
  ].filter(Boolean).length;

  if (utilitySignals < 2 || !candidate.materialDownstreamGain) {
    return "ATOMIC_STOP";
  }

  return "ALLOW_DERIVED_NODE";
}
```

यह reference contract है। Semantic inputs को traceable evidence/model output और verification policy चाहिए। Final state transition deterministic code own करेगा और fail closed रहेगा।

## 23.13 AI versus deterministic code

### AI may

- Micro/Atomic candidates propose कर सकता है;
- semantic containment estimate कर सकता है;
- duplicate/overlap detect कर सकता है;
- utility signals propose कर सकता है;
- ambiguity identify कर सकता है;
- evidence mapping और required knowledge atoms propose कर सकता है।

### AI must not

- खुद को OFFICIAL authority घोषित करे;
- workflow verification के बिना derived node को self-verify करे;
- scope silently expand करे;
- missing provenance bypass करे;
- confidence को authority में बदले;
- open knowledge dependencies वाला question publish करे।

### Deterministic code must

- required fields और lineage enforce करे;
- provenance/state/version gates enforce करे;
- mission binding enforce करे;
- fail-closed transitions enforce करे;
- supersession/invalidation enforce करे;
- Question Knowledge Closure enforce करे;
- ambiguity को review में route करे।

## 23.14 Dry-run examples

### Hindi grammar

`Hindi → Vyakaran → Sandhi → Swar Sandhi → Gun Sandhi` valid decomposition हो सकती है, यदि official ancestor, scope containment, coherence और utility प्रमाणित हों।

`Gun Sandhi → Definition` syllabus decomposition में `ATOMIC_STOP` है; यह teaching content है।

`Gun Sandhi → first letter of the wording` को `REJECT_NON_CONCEPT` मिलना चाहिए।

### JEE Mathematics

Official mathematics topic के भीतर mission-appropriate, coherent और separately useful sub-concepts derived हो सकते हैं। Research-level extension जो verified JEE scope से बाहर हो, `REJECT_OUT_OF_SCOPE` है।

### Rajasthan examination knowledge

Broad official topic से meaningful in-scope river concepts derived हो सकते हैं। Expert hydrological/isotopic research concept केवल related होने से valid नहीं बनता।

## 23.15 Boundary-drift control

DSD को official syllabus change, new official PYQ, reference standard change, ambiguity resolution या atom granularity correction पर silently mutate नहीं करना चाहिए।

हर change के लिए नया version या explicit supersession relationship चाहिए। Impact analysis DigiBook/material, teaching execution, taught authority, questions और publication readiness तक पहुँचना चाहिए।

## 23.16 Failure taxonomy

कम-से-कम ये semantic failure codes होने चाहिए:

```
MISSION_INACTIVE
OFFICIAL_ANCESTOR_MISSING
OFFICIAL_AUTHORITY_UNVERIFIED
DERIVED_SCOPE_ESCAPE
DERIVED_NON_CONCEPT
DERIVED_DUPLICATE
DERIVED_OVERLAP
DERIVED_AMBIGUOUS
DERIVED_UTILITY_INSUFFICIENT
ATOM_NOT_VERIFIED
BOUNDARY_PROFILE_MISSING
BOUNDARY_PROFILE_SUPERSEDED
PYQ_SCOPE_EXCEPTION_OPEN
KNOWLEDGE_ATOM_MISSING
KNOWLEDGE_ATOM_UNVERIFIED
KNOWLEDGE_ATOM_NOT_TAUGHT
QUESTION_KNOWLEDGE_OPEN
```

Names evolve हो सकते हैं; semantics कमजोर नहीं होने चाहिए।

## 23.17 Implementation sequence

Recommended sequence:

1. semantic contract lock करना;
2. pure DSD boundary models/validators;
3. valid, invalid और ambiguous decomposition fixtures;
4. MABP model और version checks;
5. PYQ exception model;
6. verified atoms से DigiBook/material binding;
7. Question Knowledge Closure validator;
8. pure contracts पास होने के बाद persistence/security integration;
9. regression और security tests;
10. Git checkpoint;
11. separate authorization के बाद deployment;
12. live behavior proof के बाद completion declaration।

Student UI/login/behavior इस implementation से बाहर हैं जब तक अलग authorization न हो।

## 23.18 Expanded acceptance test matrix

न्यूनतम tests:

1. official TOPIC without official Micro/Atomic children;
2. valid derived Micro child;
3. valid derived Atomic child;
4. out-of-scope child;
5. academic-level boundary violation;
6. missing official ancestor;
7. derived node mislabeled OFFICIAL;
8. duplicate sibling;
9. overlapping sibling;
10. artificial token/word fragment;
11. definition/example as invalid syllabus child;
12. utility signals below threshold → `ATOMIC_STOP`;
13. semantic ambiguity → `REVIEW_REQUIRED`;
14. no fixed atom-count assumption;
15. mission-specific atomicity;
16. official source supersession;
17. descendant invalidation/revalidation;
18. anomalous PYQ does not silently expand scope;
19. repeated PYQ opens controlled review;
20. all verified+taught dependencies → closure;
21. missing atom blocks;
22. unverified atom blocks;
23. untaught atom blocks;
24. hard multi-atom reasoning remains allowed when knowledge is closed;
25. Student/UI/readiness cannot substitute for authority;
26. AI confidence cannot bypass deterministic gates;
27. DigiBook explanation cannot create syllabus node;
28. legacy test cannot weaken authority gate।

## 23.19 Constitutional authority chain

`Official Evidence → Official Syllabus Authority → Mission Academic Boundary Profile → Derived Syllabus Decomposition → Atomic Stop → Atom Verification → Pedagogy/DigiBook → Teaching Execution → Taught Content Authority → Question Knowledge Closure → Assessment Review → Publication`

Governing laws:

1. official authority defines scope;
2. derived decomposition adds depth, never scope;
3. syllabus decomposition stops where teaching treatment begins;
4. atomicity is functional and mission-sensitive;
5. scope, depth and difficulty are separate;
6. AI proposes; verified authority and deterministic gates decide;
7. PYQ anomalies are governed exceptions;
8. production questions cannot depend on untaught knowledge;
9. difficult reasoning is allowed when knowledge is closed;
10. authority changes are versioned, traceable and fail closed।

---

## 23.20 Tracked-source acceptance gate

This remote document may be marked **book-accepted** only at the documentation layer. It may be marked **implementation-verified** only after:

- the current checkout contains the source or an approved equivalent;
- schema fields and state transitions are located;
- exact symbols and line ranges are recorded;
- deterministic tests cover the decision states;
- Firestore/security boundaries are verified;
- live runtime/readback evidence exists where applicable;
- downstream chapters are reconciled;
- the GitHub commit and local evidence hashes are recorded.

Until then, the correct publication wording is:

> **Remote architecture contract tracked; local implementation parity pending.**

## 23.21 Source integrity note

This chapter preserves the latest remote contract’s semantic content in a book-facing, Hindi-first editorial form. The GitHub commit links above remain the authoritative remote provenance. Any future remote change must create a new tracking entry with:

```
observedAt
repository
branch
commitSha
sourcePath
sourceBlobOrContentHash
changedSections
bookAction
implementationParity
verifiedBy
```

---

## 23.22 Current default branch contract payload

The payload below is the exact default-branch contract text at the recorded HEAD. Historical provenance is retained above; runtime parity remains separately pending.

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

## 24. Concept boundary versus teaching-content boundary

DSD decomposes **syllabus concepts**, not the internal teaching treatment of a concept.

A lower node is eligible to remain in the syllabus tree only while it is itself a meaningful concept, skill, relationship, process or examinable conceptual unit.

The following normally belong to DigiBook/Pedagogy rather than becoming lower syllabus nodes:
- definition/explanation;
- derivation/proof;
- worked example;
- illustration;
- mnemonic/trick;
- misconception/common error;
- teaching sequence;
- practice set;
- remediation note;
- solution method narration.

Example:

`Hindi → Vyakaran → Sandhi → Swar Sandhi → Gun Sandhi`

may be a valid syllabus/decomposition chain.

`Gun Sandhi → definition → rule → examples → tricks`

is not further syllabus decomposition; it is teaching-content structure.

**Boundary law:** when the next useful split changes from "what concept is this?" to "how do we teach/explain/practise this concept?", DSD MUST stop and Pedagogy/DigiBook takes over.

## 25. Decomposition Stop Test (DST)

There is no fixed maximum number of children, atoms or hierarchy depth. Termination is semantic and functional.

A proposed child set MUST pass all mandatory gates:

### 25.1 Scope Containment Gate — mandatory
Every child must be wholly contained in both:
1. its immediate parent meaning; and
2. its nearest OFFICIAL ancestor meaning.

If a child needs a new syllabus assumption or expands the examinable domain, reject it.

### 25.2 Concept Gate — mandatory
Each child must represent a real concept, skill, relationship, process or meaningful factual unit appropriate to the mission.

Arbitrary tokens, wording fragments, spelling fragments, metadata, editorial headings or artificial partitions are not atoms merely because a question can be written about them.

### 25.3 Sibling Coherence Gate — mandatory
The proposed children must form a coherent decomposition of the parent, avoid material duplicate/alias nodes, and minimize semantic overlap.

### 25.4 Utility signals
For each child evaluate:
- **Independent Teaching Value:** separate teaching/remediation can reasonably be selected for it.
- **Independent Assessment Value:** mastery can be meaningfully distinguished from sibling mastery by valid exam-style assessment.
- **Independent Mastery/Diagnostic Value:** knowing this child separately changes coverage, diagnosis or remediation.

At least **two of the three utility signals** should normally be materially true before accepting another syllabus split. A mission-specific policy may require all three, but it may not waive the mandatory gates.

### 25.5 Diminishing-Utility Stop Rule
If another split does not materially improve at least one downstream control—teaching selection, mastery diagnosis, assessment mapping, coverage assurance or remediation—the current node is an `ATOMIC_TOPIC` and decomposition MUST stop.

### 25.6 No artificial quotas
Do not impose rules such as "exactly five atoms per topic", "maximum ten atoms", or "always five hierarchy levels". Different subjects and missions legitimately require different granularity.

### 25.7 Mission-sensitive atomicity
A concept may be atomic for one mission and decomposed further for another when the applicable official scope and academic/examination standard justify that difference. This never permits expansion outside either mission's official boundary.

## 26. Scope, Depth and Difficulty are independent controls

RankCrackers MUST model these separately:

- **Scope:** what knowledge/concepts are permitted by verified mission authority.
- **Depth:** how granular or conceptually detailed the permitted knowledge must be for that mission.
- **Difficulty:** how demanding the reasoning, integration, traps, transformations or application may be while using permitted knowledge.

A harder question does not authorize broader scope.

A deeper explanation does not create new syllabus authority.

Canonical principle:

> **Maximize legitimate reasoning difficulty without exceeding verified scope, mission-appropriate depth, or taught-knowledge authority.**

## 27. Mission Academic Boundary Profile (MABP)

Each mission SHOULD resolve a versioned boundary profile used consistently by DSD, DigiBook and Assessment.

Minimum semantics:

```
missionId
profileVersion
officialSyllabusVersion
academicLevel
subjectDomain
scopePolicy
depthPolicy
referencePolicy
pyqPolicy
effectiveState
verifiedAt
supersededBy
```

The profile is mission-specific. "Indian exam" is not itself a geographic content restriction. The competent authority, prescribed academic level, subject nature and applicable official/reference standards define the boundary.

Examples:
- JEE Mathematics may legitimately use universally established mathematics inside JEE authority and level.
- Rajasthan-specific general knowledge may have a much stronger Rajasthan/India reference orientation.

## 28. Evidence hierarchy and authority separation

Evidence may support interpretation, depth calibration and decomposition, but evidence classes have different authority.

Default hierarchy:
1. current competent official syllabus/scheme/rules;
2. official prescribed/reference material where the authority provides it;
3. official question papers/PYQs and official answer material;
4. authoritative academic/government/reference sources appropriate to the mission;
5. secondary educational sources as non-authoritative corroboration only;
6. model/AI knowledge as candidate-generation assistance only.

Lower evidence MUST NOT silently override higher authority.

Coaching notes, random web pages or model confidence cannot create official scope.

## 29. Official PYQ Scope Exception

An official PYQ that appears outside the current interpreted boundary MUST NOT be ignored and MUST NOT automatically enlarge the syllabus.

Create a separately governed exception record, conceptually:

```
exceptionId
missionId
questionEvidenceRef
officialSyllabusVersion
suspectedOutsideNode
classification: IN_SCOPE | DEPTH_SIGNAL | SCOPE_EXCEPTION | AMBIGUOUS
reviewState
rationale
effectiveDecision
createdAt
verifiedAt
```

A single exceptional question is evidence of examination behavior, not automatic authority to rewrite the canonical syllabus.

Repeated official evidence may trigger a boundary review. Any actual scope/profile change remains versioned, attributable and revalidated downstream.

## 30. No Untaught Knowledge Dependency / Question Knowledge Closure

A production assessment item MUST NOT require substantive factual or conceptual knowledge that is outside the applicable verified and taught mission boundary.

Each question SHOULD bind to the knowledge atoms materially required to solve it:

```
questionId
missionId
requiredKnowledgeAtomIds[]
requiredMaterialVersionIds[]
reasoningProfile
boundaryProfileVersion
closureState
```

Publication gate:

`QUESTION_KNOWLEDGE_CLOSED` only when every substantive required knowledge dependency:
1. belongs to the correct mission/version;
2. traces to verified syllabus authority;
3. is not invalidated/superseded;
4. satisfies applicable taught-content authority;
5. does not rely on hidden external specialist knowledge.

Novel combinations, multi-atom reasoning and difficult applications are allowed when the underlying required knowledge remains closed.

## 31. Machine-enforceable DSD decision model

The production implementation may evolve, but equivalent semantics should exist.

Suggested pure decision states:

```
ALLOW_DERIVED_NODE
ATOMIC_STOP
REVIEW_REQUIRED
REJECT_OUT_OF_SCOPE
REJECT_NON_CONCEPT
REJECT_DUPLICATE_OR_OVERLAP
REJECT_MISSING_LINEAGE
REJECT_MISSING_EVIDENCE
REJECT_UNVERIFIED
```

Reference decision model:

```js
function decideDerivedNode(candidate, context) {
  if (!context.missionActive) return "REJECT_UNVERIFIED";
  if (!candidate.nearestOfficialAncestorId) return "REJECT_MISSING_LINEAGE";
  if (!candidate.scopeContained) return "REJECT_OUT_OF_SCOPE";
  if (!candidate.isMeaningfulConcept) return "REJECT_NON_CONCEPT";
  if (!candidate.siblingCoherent) return "REJECT_DUPLICATE_OR_OVERLAP";
  if (candidate.semanticAmbiguityAboveTolerance) return "REVIEW_REQUIRED";

  const utilitySignals = [
    candidate.independentTeachingValue,
    candidate.independentAssessmentValue,
    candidate.independentMasteryValue,
  ].filter(Boolean).length;

  if (utilitySignals < 2 || !candidate.materialDownstreamGain) {
    return "ATOMIC_STOP";
  }

  return "ALLOW_DERIVED_NODE";
}
```

This is a reference contract, not permission to trust AI booleans blindly. Semantic inputs require traceable evidence/model outputs and verification policy. Deterministic code owns the final state transition and fail-closed behavior.

## 32. AI role and deterministic-code role

### AI MAY
- propose Micro/Atomic candidates;
- estimate semantic containment;
- detect likely duplicates/overlap;
- propose learning/assessment/mastery utility signals;
- identify ambiguity;
- map evidence to candidate concepts;
- propose required knowledge atoms for a question.

### AI MUST NOT
- self-declare OFFICIAL authority;
- self-verify its own derived node without the verification workflow;
- silently expand scope;
- bypass missing provenance;
- convert confidence into authority;
- publish a question with open knowledge dependencies.

### Deterministic code MUST
- enforce required fields and lineage;
- enforce provenance/state/version gates;
- enforce mission binding;
- enforce fail-closed transitions;
- enforce supersession/invalidation;
- enforce Question Knowledge Closure before publication;
- route semantic ambiguity to review rather than guessing.

## 33. Dry-run examples

### 33.1 Hindi grammar

Candidate chain:
`Hindi → Vyakaran → Sandhi → Swar Sandhi → Gun Sandhi`

If `Sandhi` is the verified official ancestor and the lower concepts are in-scope, meaningful, coherent and independently useful, derived Micro/Atomic nodes may be allowed.

Proposed child:
`Gun Sandhi → Definition`

Expected decision: `ATOMIC_STOP` for syllabus decomposition; definition belongs to teaching content.

Proposed child:
`Gun Sandhi → first letter of the wording`

Expected decision: `REJECT_NON_CONCEPT`.

### 33.2 JEE Mathematics

For an official mathematics topic that stops above instructional granularity, DSD may propose meaningful mathematical sub-concepts/skills.

A child that is mathematically inside the official topic, mission-appropriate, coherent and separately useful for teaching/assessment may be allowed.

A research-level extension that requires concepts outside the verified JEE scope/profile must return `REJECT_OUT_OF_SCOPE`, even if intellectually related.

### 33.3 Rajasthan examination knowledge

For a broad official topic such as major rivers of Rajasthan, derived nodes may cover meaningful in-scope river concepts.

An expert hydrological/isotopic research concept does not become valid merely because it concerns a Rajasthan river. If it exceeds the mission academic boundary, reject or review it.

## 34. Boundary-drift control

DSD MUST NOT silently mutate when:
- official syllabus changes;
- a new official PYQ appears;
- a reference standard changes;
- a previous ambiguity is resolved;
- an atom is found too broad or too narrow.

Changes create a new version or explicit supersession relationship. Impact analysis must reach DigiBook/material, teaching execution, taught authority, questions and publication readiness.

## 35. Required failure taxonomy

Equivalent implementation codes should cover at least:

```
MISSION_INACTIVE
OFFICIAL_ANCESTOR_MISSING
OFFICIAL_AUTHORITY_UNVERIFIED
DERIVED_SCOPE_ESCAPE
DERIVED_NON_CONCEPT
DERIVED_DUPLICATE
DERIVED_OVERLAP
DERIVED_AMBIGUOUS
DERIVED_UTILITY_INSUFFICIENT
ATOM_NOT_VERIFIED
BOUNDARY_PROFILE_MISSING
BOUNDARY_PROFILE_SUPERSEDED
PYQ_SCOPE_EXCEPTION_OPEN
KNOWLEDGE_ATOM_MISSING
KNOWLEDGE_ATOM_UNVERIFIED
KNOWLEDGE_ATOM_NOT_TAUGHT
QUESTION_KNOWLEDGE_OPEN
```

Names may evolve; semantics may not be weakened.

## 36. Implementation sequence

To minimize rework and preserve the existing architecture:

1. lock this semantic contract;
2. implement pure DSD boundary models/validators first;
3. add deterministic fixture tests for valid, invalid and ambiguous decompositions;
4. add MABP model and version checks;
5. add PYQ exception model;
6. bind DigiBook/material authority to verified atoms without allowing DigiBook to create syllabus authority;
7. implement Question Knowledge Closure as a pure validator;
8. integrate with persistence/security only after pure contracts pass;
9. run regression and security tests;
10. checkpoint Git;
11. deploy only when separately authorized;
12. prove live behavior before declaring completion.

Student UI/login/behavior is outside this implementation and MUST remain unchanged unless separately authorized.

## 37. Expanded acceptance test matrix

At minimum test:

1. official TOPIC with no official Micro/Atomic children;
2. valid derived Micro child;
3. valid derived Atomic child;
4. child outside official ancestor;
5. child inside parent wording but outside mission academic level;
6. missing official ancestor;
7. derived node mislabeled OFFICIAL;
8. duplicate sibling;
9. overlapping sibling;
10. artificial token/word fragment;
11. definition/example incorrectly proposed as syllabus child;
12. utility-signals below threshold → ATOMIC_STOP;
13. ambiguous semantic containment → REVIEW_REQUIRED;
14. no fixed atom-count assumption;
15. mission-specific atomicity difference;
16. official source supersession;
17. derived descendant invalidation/revalidation;
18. single anomalous official PYQ does not silently expand scope;
19. repeated PYQ evidence opens controlled boundary review;
20. question with all verified+taught dependencies closes;
21. question with one missing atom blocks;
22. question with one unverified atom blocks;
23. question with one untaught atom blocks;
24. hard multi-atom reasoning remains allowed when knowledge is closed;
25. Student/UI/publication/readiness state cannot substitute for authority;
26. AI high confidence cannot bypass deterministic gates;
27. DigiBook explanation does not create a new syllabus node;
28. legacy test cannot be fixed by weakening authority.

## 38. Constitutional boundary summary

RankCrackers uses one continuous authority chain:

`Official Evidence → OSA → Mission Academic Boundary Profile → DSD → Atomic Stop → Atom Verification → Pedagogy/DigiBook → Teaching Execution → Taught Content Authority → Question Knowledge Closure → Assessment Review → Publication`

The governing laws are:

1. **Official authority defines scope.**
2. **Derived decomposition may add depth, never scope.**
3. **Syllabus decomposition stops where teaching treatment begins.**
4. **Atomicity is functional and mission-sensitive, never quota-driven.**
5. **Scope, depth and difficulty are separate controls.**
6. **AI proposes; verified authority and deterministic gates decide.**
7. **Official PYQ anomalies are governed exceptions, not silent scope expansion.**
8. **No production question may depend on substantive untaught knowledge.**
9. **Hard reasoning is allowed; hidden external knowledge is not.**
10. **All authority changes are versioned, traceable and fail closed.**

---

**Founder-locked summary:** Preserve official truth exactly. Derive only meaningful instructional concepts inside mission-specific authority. Stop decomposition when the next split becomes teaching treatment or loses material instructional/assessment value. Keep scope, depth and difficulty separate. Use AI for candidate semantics, never for self-authorizing authority. Bind every production question to verified and actually taught knowledge. Treat official PYQ anomalies as explicit governed exceptions. Version every boundary change and fail closed whenever authority, lineage, verification or knowledge closure is incomplete.

## 23.23 Operational tracking command

The book repository now includes a read-only tracker and a machine-readable source manifest:

- Manifest: `docs/rankcrackers_book/github_source_manifest.json`
- Tracker: `scripts/check_github_book_tracking.py`

The tracker checks the configured branch, lists recent documentation commits, compares each tracked source's recorded commit with GitHub's current latest commit, and returns `UNCHANGED`, `REMOTE_AHEAD` or `CHECK_FAILED`. It never pulls, merges, overwrites or publishes code. A `REMOTE_AHEAD` result is a Chief Author review gate: fetch the new source, record the semantic change set, reconcile the affected chapters, compile the master files and rerun the book verification before updating the manifest.

Recommended read-only check:

```text
python scripts/check_github_book_tracking.py --json
```

The tracker is a change detector, not implementation proof. A source may be current on GitHub while the local checkout, runtime code, tests or Google Docs manuscript remain behind.
