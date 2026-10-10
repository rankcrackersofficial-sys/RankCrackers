# RankCrackers Mission Discovery & Evidence Acquisition Contract

**Status:** Founder-locked canonical architecture contract  
**Effective decision date:** 2026-10-10  
**Scope:** Authority Watch → mission discovery → Founder mission acceptance → mission evidence acquisition → continuing official change monitoring  
**Supersedes:** Any prior workflow in which Founder manual upload is the normal or authoritative mission-discovery entry path.  
**Preserves:** Existing Official Syllabus Authority (OSA), Derived Syllabus Decomposition (DSD), provenance, verification, fail-closed, DigiBook and Assessment boundaries except where this contract explicitly defines upstream acquisition.

## 1. Constitutional purpose

RankCrackers must discover important examinations from competent official authorities without requiring the Founder to know of, locate, download or upload the source notification first.

The canonical upstream chain is:

`Official Authority → Authority Watch → Official Evidence Discovery → Mission Candidate → Founder Accept/Reject → Mission Authority → Mission Evidence Acquisition → OSA/DSD → DigiBook/Teaching → Assessment`

Authority Watch discovers evidence. It does not create academic truth by itself.

## 2. Founder-locked laws

1. **Watch-first discovery is canonical.** Manual Founder upload is not the normal mission-creation source.
2. **One real examination mission is one durable mission identity.** Do not create year-wise duplicate missions merely because a new cycle, notice or paper appears.
3. **Pre-acceptance search is intentionally bounded.** Search only far enough backward to establish the latest sufficient official mission notification package.
4. **Deep acquisition starts after Founder accepts the mission.**
5. **Notification, syllabus and PYQ use different temporal policies.**
6. **Syllabus authority is temporal and versioned.**
7. **Official PYQ discovery has no artificial historical year limit.**
8. **Forward official changes attach to the same mission and are never silently lost.**
9. **Official provenance is mandatory.**
10. **Uncertainty fails closed; it never becomes authority by model confidence.**

## 3. Terminology

### Authority Watch
Persistent monitoring of official examination/recruitment authority sources.

### Mission Candidate
A deduplicated Founder-facing proposal representing a real exam/recruitment mission discovered from official evidence.

### Mission Notification Anchor (MNA)
The accepted mission's authoritative notification package and its canonical notification date. This date is the temporal anchor for post-acceptance syllabus resolution.

### Notification Package
The base notification plus any official documents necessary to interpret it correctly at discovery time, including corrigenda/amendments already in force.

### Mission Acceptance
Explicit Founder decision that the candidate becomes a RankCrackers mission. Acceptance is not Student publication.

### Mission Evidence Acquisition
Post-acceptance acquisition of official syllabus, PYQs and future mission-linked official updates.

### Current Official Syllabus
The applicable official syllabus version selected under Section 10.

## 4. Source authority boundary

Discovery MUST prioritize the competent authority's official domain, official portal, official document store or another source whose official ownership can be established.

Evidence classes:
- `OFFICIAL_PRIMARY`: competent authority publication.
- `OFFICIAL_LINKED`: official document reached through an official authority surface.
- `OFFICIAL_MIRROR_VERIFIED`: byte/content-identical official material whose provenance is independently established.
- `SECONDARY_DISCOVERY_ONLY`: may identify a lead but cannot establish mission/syllabus/PYQ authority.
- `UNVERIFIED`: no authority.

Coaching sites, aggregators, social posts, memory-based papers and model knowledge MUST NOT be labeled official.

## 5. Watch coverage

Watch registry SHOULD model:
```
authorityId
authorityName
jurisdiction
officialDomains[]
officialEntryPoints[]
examFamilies[]
sourceLanguages[]
watchState
lastSuccessfulScanAt
lastEvidenceCursor
sourceHealth
```

Coverage includes national/central authorities, banking and railway recruiting bodies, and State/UT authorities relevant to RankCrackers.

A failed source scan MUST remain observable; silence is not proof of no update.

## 6. Discovery event normalization

Every discovered artifact SHOULD normalize:
```
evidenceId
authorityId
sourceUrl
canonicalUrl
documentTitle
documentType
publicationDate
effectiveDate
retrievedAt
contentHash
officialityClass
language
examIdentityHints[]
sourceLocator
verificationState
```

URL changes with identical official content MUST NOT create duplicate evidence.

## 7. Pre-acceptance notification search law

For an exam not yet represented by an accepted mission:

1. Watch discovers a plausible current official exam/recruitment signal.
2. Resolve the competent authority and exam family.
3. Search backward only as required to find the **latest sufficient official notification package** for that mission.
4. Once that package is sufficient to identify and evaluate the mission, backward notification discovery MUST STOP.
5. Do not perform unlimited historical notification harvesting before mission acceptance.
6. Do not deep-harvest syllabus or PYQs merely because they are nearby on the site.
7. Preserve supporting corrigenda/amendments already applicable to the discovered base notification.

A package is insufficient if material identity/scope facts cannot be established without another official document.

## 8. Mission Candidate contract

Minimum semantics:
```
candidateId
canonicalExamIdentity
authorityId
examFamily
displayName
notificationEvidenceIds[]
notificationDate
discoveredAt
candidateState
dedupeKey
materialChangeFingerprint
founderDecision
founderDecisionAt
acceptedMissionId
```

Candidate states SHOULD distinguish:
`DISCOVERED → EVIDENCE_RESOLVING → READY_FOR_FOUNDER → ACCEPTED | REJECTED | DUPLICATE | STALE | REVIEW_REQUIRED`.

Only `READY_FOR_FOUNDER` candidates with adequate official evidence may request a Founder decision.

## 9. Durable mission identity and deduplication

Mission identity is the durable exam concept, not a year label.

Before creating a candidate, reconcile against:
- existing accepted missions;
- pending candidates;
- authority + exam family;
- aliases/renames;
- recurring-cycle evidence;
- notification lineage.

A new annual notification for an existing durable mission normally becomes mission evidence/update, not a duplicate mission.

When authority restructuring or exam renaming creates genuine identity ambiguity, return `REVIEW_REQUIRED`.

## 10. Founder-locked syllabus temporal law

For an accepted mission:

1. Let `MNA_DATE` be the accepted mission notification's canonical date.
2. After mission acceptance, search official authority evidence for syllabus publications applicable to that mission.
3. Among applicable official syllabus versions **issued on or after MNA_DATE**, the latest authoritative applicable version becomes `CURRENT_OFFICIAL_SYLLABUS`.
4. If the notification itself contains the syllabus and no later applicable syllabus has been issued, that notification-bound syllabus may be current.
5. If, after RankCrackers accepts or publishes the mission, the competent authority officially changes/reissues the syllabus, the system MUST ingest the new version and consider the new applicable version the Current Official Syllabus.
6. Previous syllabus evidence MUST be preserved and marked superseded/effective-history; never overwrite it.
7. A future syllabus update MUST trigger downstream impact analysis and revalidation under the existing OSA/DSD contract.
8. A newer file that is not applicable to the mission MUST NOT supersede the current syllabus.
9. If two official sources conflict on applicability/effect, block automatic promotion and return `SYLLABUS_AUTHORITY_CONFLICT`.

Temporal selection is therefore not merely "newest file wins"; it is **latest applicable official syllabus issued on/after the accepted notification anchor, with future official changes continuously superseding prior current authority**.

## 11. Syllabus version record

Minimum semantics:
```
syllabusVersionId
missionId
notificationAnchorDate
officialEvidenceId
issuedDate
effectiveDate
applicability
contentHash
verificationState
effectiveState
supersedes
supersededBy
selectedAsCurrentAt
```

Exactly one version may be current for the same mission/applicability partition unless the official scheme itself intentionally has concurrent partitions.

## 12. Official PYQ acquisition law

PYQ discovery begins as deep acquisition after mission acceptance.

Rules:
1. There is **no artificial year limit**.
2. Search backward as far as trustworthy official evidence can be discovered.
3. Continue to ingest newly released official papers forward in time.
4. Newly discovered older official papers remain valid acquisitions.
5. Never downgrade an older paper merely because it predates the mission's current notification.
6. Bind each PYQ to durable mission identity plus its actual exam date/cycle/session/paper metadata.
7. Official answer keys may be linked separately and must retain their own provenance/version.
8. Memory-based/coaching reconstructions are not official PYQs.
9. If authenticity is unresolved, retain as candidate evidence but exclude from official-PYQ authority.

Minimum PYQ semantics:
```
pyqId
missionId
authorityId
paperDate
cycleLabel
stage
shift
paperCode
language
questionPaperEvidenceId
answerKeyEvidenceIds[]
officialityClass
contentHash
verificationState
discoveredAt
```

## 13. Forward monitoring after mission acceptance

Watch remains attached to every accepted mission.

Relevant future evidence includes:
- corrigendum;
- amendment;
- revised notification;
- syllabus/revised syllabus;
- scheme/pattern/rule change;
- eligibility change;
- exam calendar/date/schedule;
- postponement/cancellation;
- admit-card related material when product policy deems meaningful;
- question paper/PYQ release;
- provisional/final/revised answer key;
- result-stage evidence when relevant to mission operations;
- other material authority changes.

Future evidence MUST attach to the existing mission unless a genuine new mission identity is proven.

## 14. Notification lineage and effective state

Never mutate historical official evidence into a rewritten pseudo-document.

Represent:
`BASE_NOTIFICATION → CORRIGENDUM/AMENDMENT/REVISION → CURRENT_EFFECTIVE_NOTIFICATION_STATE`.

The current effective state is a derived operational view with traceable source edges. Each fact must remain attributable to the official evidence that establishes or changes it.

## 15. Material update classification

Every new official artifact SHOULD classify as:
- `NO_MATERIAL_CHANGE`
- `MISSION_FACT_CHANGE`
- `SYLLABUS_CHANGE`
- `SCHEME_PATTERN_CHANGE`
- `ELIGIBILITY_RULE_CHANGE`
- `DATE_SCHEDULE_CHANGE`
- `PYQ_RELEASE`
- `ANSWER_KEY_RELEASE_OR_REVISION`
- `CORRIGENDUM_OR_AMENDMENT`
- `MISSION_IDENTITY_REVIEW`
- `UNKNOWN_REVIEW_REQUIRED`

Cosmetic website changes must not flood Founder attention.

## 16. Founder role

Founder acts by exception/decision, not by manual evidence hunting.

Founder responsibilities:
- accept/reject a mission candidate;
- resolve material ambiguity when automation cannot;
- approve separately governed publication decisions where required.

Founder is NOT required to:
- locate the initial notification;
- upload every notification;
- locate syllabus revisions;
- search historical PYQs;
- manually monitor future official changes.

## 17. Mission acceptance versus publication

These states MUST remain distinct:
- mission discovered;
- mission candidate ready;
- Founder accepted;
- mission authority created;
- evidence acquisition complete/incomplete;
- academic authority ready/not ready;
- Student publication approved/not approved;
- Student live/not live.

Founder acceptance MUST NOT silently publish to Student.

## 18. Manual upload deprecation

The previous normal flow:
`Founder finds notification → Founder uploads → extraction → mission discovery`
is deprecated as canonical mission discovery.

If a manual upload capability remains for recovery, testing or exceptional evidence injection:
- it MUST NOT bypass Watch/canonical identity reconciliation;
- it MUST NOT auto-create a mission;
- it MUST NOT outrank verified official evidence;
- it MUST be explicitly marked exceptional/manual;
- it MUST enter the same provenance, dedupe and verification pipeline.

Legacy upload-origin records remain historical evidence; do not erase audit history.

## 19. AI versus deterministic responsibility

AI MAY:
- classify discovered documents;
- extract identity hints;
- propose candidate deduplication;
- interpret likely applicability;
- map evidence;
- flag ambiguity.

AI MUST NOT:
- declare an unofficial source official;
- accept a mission for Founder;
- silently supersede conflicting syllabus authority;
- invent dates/evidence;
- convert confidence into authority.

Deterministic code MUST enforce:
- required provenance;
- mission binding;
- state transitions;
- temporal constraints;
- dedupe invariants;
- one-current-syllabus invariant;
- supersession history;
- fail-closed behavior.

## 20. Failure taxonomy

Equivalent machine states MUST cover at least:
```
AUTHORITY_SOURCE_UNAVAILABLE
AUTHORITY_IDENTITY_UNRESOLVED
DOCUMENT_OFFICIALITY_UNVERIFIED
NOTIFICATION_PACKAGE_INCOMPLETE
NOTIFICATION_DATE_UNRESOLVED
MISSION_IDENTITY_AMBIGUOUS
MISSION_DUPLICATE
FOUNDER_DECISION_PENDING
MISSION_NOT_ACCEPTED
SYLLABUS_NOT_FOUND
SYLLABUS_PRE_ANCHOR_ONLY
SYLLABUS_APPLICABILITY_UNRESOLVED
SYLLABUS_AUTHORITY_CONFLICT
SYLLABUS_SUPERSESSION_PENDING
PYQ_OFFICIALITY_UNVERIFIED
PYQ_DUPLICATE
EVIDENCE_HASH_COLLISION_REVIEW
SOURCE_CHANGED_WITHOUT_DATE
FORWARD_UPDATE_UNCLASSIFIED
DOWNSTREAM_REVALIDATION_REQUIRED
```

## 21. Race and concurrency laws

1. Repeated Watch detections of the same evidence must be idempotent.
2. Concurrent candidate workers must not create two durable missions.
3. Concurrent syllabus updates must resolve through version/effective ordering, not last-write-wins.
4. A Founder decision must bind the exact candidate/evidence version reviewed.
5. Evidence changing between review and acceptance must reopen material review when the change is relevant.
6. Hash equality alone cannot prove two semantically different metadata records are the same document without provenance checks.

## 22. Search stopping and continuation matrix

| Evidence type | Before mission acceptance | After mission acceptance | Backward limit | Forward monitoring |
|---|---|---|---|---|
| Notification | Find latest sufficient official package, then stop | Preserve + attach material updates | Bounded by sufficiency | Yes |
| Syllabus | No indiscriminate deep acquisition | Resolve current official syllabus under Section 10 | Anchor-aware | Yes, superseding/versioned |
| PYQ | No deep historical harvest | Acquire official history | No artificial year limit | Yes |
| Corrigendum/amendment | Include when needed for candidate truth | Attach to mission lineage | As needed | Yes |
| Exam date/rules/keys | Only if needed for candidate truth | Mission-linked acquisition | As relevant | Yes |

## 23. Acceptance invariants

Implementation is non-conformant if:
1. Founder manual upload is required for normal mission discovery.
2. Watch creates a mission without Founder acceptance.
3. Pre-acceptance search performs unlimited historical harvesting.
4. A year label creates a duplicate durable mission without identity justification.
5. A syllabus issued before the notification anchor is automatically selected contrary to Section 10.
6. A later applicable official syllabus fails to supersede current authority.
7. Superseded syllabus evidence is destroyed/overwritten.
8. A non-applicable newer syllabus supersedes applicable authority.
9. PYQ search has an arbitrary year cutoff.
10. Coaching/memory-based paper is labeled official.
11. A future corrigendum creates a duplicate mission instead of updating lineage.
12. Student publication occurs merely because Founder accepted the mission.
13. AI confidence bypasses provenance or verification.
14. Source failure is interpreted as "no change".
15. Existing OSA/DSD fail-closed boundaries are weakened.

## 24. Required test families

At minimum:
1. new authority notification → one candidate;
2. duplicate URL/content detection;
3. latest sufficient notification package stop;
4. corrigendum required to make package sufficient;
5. candidate rejection;
6. candidate acceptance without Student publication;
7. recurring annual notice maps to existing durable mission;
8. genuine renamed/new exam triggers identity review;
9. syllabus embedded in accepted notification and no later syllabus;
10. later post-anchor syllabus becomes current;
11. multiple later syllabus versions choose latest applicable;
12. newer unrelated syllabus rejected;
13. conflicting official syllabus sources block promotion;
14. future syllabus revision supersedes current and triggers impact analysis;
15. historical syllabus remains queryable;
16. PYQ discovery beyond arbitrary 5/10/20-year windows;
17. newly discovered older official PYQ accepted;
18. unofficial memory-based paper excluded;
19. future official PYQ attaches to existing mission;
20. future answer-key revision preserves lineage;
21. repeated Watch event idempotency;
22. concurrent candidate dedupe;
23. concurrent syllabus update ordering;
24. source outage observable;
25. evidence changed after Founder review reopens decision when material;
26. manual upload cannot bypass canonical pipeline;
27. Student/UI state cannot create authority;
28. downstream OSA/DSD version invalidation remains intact.

## 25. Migration law

Migration MUST:
1. retain all legacy audit/evidence records;
2. mark old upload-first discovery semantics deprecated;
3. reconcile existing missions to durable canonical identities;
4. bind existing verified evidence where provenance remains valid;
5. avoid rewriting historical timestamps or pretending Watch originally discovered legacy evidence;
6. require review for ambiguous legacy mission aliases;
7. introduce Watch-driven discovery without changing Student UI/login/behavior unless separately authorized.

## 26. Operational sequence

```
WATCH
  ↓
DISCOVER OFFICIAL SIGNAL
  ↓
RESOLVE AUTHORITY + EXAM IDENTITY
  ↓
SEARCH BACKWARD FOR LATEST SUFFICIENT NOTIFICATION PACKAGE
  ↓
STOP PRE-MISSION BACKFILL
  ↓
DEDUPE / RECONCILE
  ↓
MISSION CANDIDATE
  ↓
FOUNDER ACCEPTS
  ↓
CREATE/BIND DURABLE MISSION AUTHORITY
  ↓
DEEP ACQUISITION
  ├─ CURRENT OFFICIAL SYLLABUS (POST-ANCHOR TEMPORAL LAW)
  ├─ OFFICIAL PYQs (NO ARTIFICIAL YEAR LIMIT)
  └─ OTHER MISSION EVIDENCE
  ↓
CONTINUOUS FORWARD WATCH
  ↓
VERSION / SUPERSEDE / IMPACT / REVALIDATE
```

## 27. Constitutional summary

**Discovery:** Watch finds the exam; Founder does not need to upload it first.  
**Mission:** Founder acceptance creates/binds mission authority, not Student publication.  
**Notification:** Search backward only until the latest sufficient official notification package is established.  
**Syllabus:** After acceptance, the latest applicable official syllabus issued on/after the mission notification anchor is current; every future applicable official syllabus change supersedes it through preserved version history.  
**PYQ:** Search official history without an artificial year cutoff and continue forward forever.  
**Updates:** Corrigenda, amendments, dates, rules, papers and keys attach to the same durable mission.  
**Truth:** Official provenance, deterministic state gates, version history and fail-closed behavior are mandatory.  
**Legacy:** Upload-first mission discovery is deprecated; historical evidence is preserved but cannot bypass the new canonical pipeline.
