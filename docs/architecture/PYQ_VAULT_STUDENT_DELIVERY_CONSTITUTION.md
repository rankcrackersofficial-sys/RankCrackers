# RANKCRACKERS — PYQ VAULT STUDENT DELIVERY CONSTITUTION

Document ID: RC-PYQ-VAULT-001
Version: 1.0 — FOUNDER-DIRECTION-CONSOLIDATED / PC-AUDIT-GROUNDED / NUMERIC-POLICY-PENDING
Status: Canonical student-delivery architecture baseline; NOT runtime implemented
Authority: Subordinate to Universal PYQ Authority & Data Contract, PYQ Acquisition Review & Delivery SOP, Central Question Repository, verified Mission/Syllabus/Taught authorities and later explicit Founder corrections
Canonical student-facing name: PYQ Vault
Conflict rule: PYQ Vault is a projection of governed PYQ evidence. It never becomes syllabus, answer-key, question-repository, teaching, Test Arena ranking or Rank Radar authority.

## 1. Purpose
PYQ Vault is the student's provenance-preserving workspace for discovering, studying, practicing and revisiting verified historical examination questions and papers.

It answers what the authority actually asked, the exact event/paper/date/shift/language/set, latest effective official answer authority if established, separately-labelled RankCrackers explanation, current/historical syllabus mapping, and the student's own interaction state.

PYQ Vault is NOT a generic PDF dump, coaching compilation, prediction engine or duplicate Question Repository.

## 2. Runtime audit baseline
PC forensic audit on 2026-10-10 at local HEAD ffb20f4a19d665739a5ba16414cf427e231a0db4 established:
- active Battle Tools name is PYQ Vault and route is /pyq-vault;
- active destination is a governed not-ready panel;
- card readiness depends on totalBattles rather than PYQ availability;
- no active paper/year/shift browser, student interaction model or Vault repository/provider is wired;
- PyqEntry is incomplete for official provenance;
- QuestionModel has generic identity plus isPYQ, while official paper evidence is separate;
- Crucible already requires official paper evidence for a PYQ claim;
- official/provenance/answer/solution collections are protected from student writes;
- PYQ linkage engines fail closed rather than fabricate linkage;
- legacy/incomplete PYQ frequency logic influences importance, diagnostic difficulty and mastery without adequate provenance/version policy.
These findings guide reconciliation but do not supersede higher PYQ authority contracts.

## 3. Canonical naming
The canonical student-facing surface remains **PYQ Vault**.
Reason: it is the proven active product label and its purpose is a governed historical-evidence collection, not a transactional wallet.
Legacy references to PYQ Wallet are aliases only unless explicitly approved later.

## 4. Authority stack
Authority Watch / competent official source
-> immutable Official Question Paper Evidence
-> exact Question Appearance identity
-> official Answer Key Evidence chronology
-> Canonical Question linkage
-> syllabus/atom mapping
-> RankCrackers solution/review
-> publication eligibility
-> PYQ Vault projection.

Question authority and answer authority remain independent.
Latest valid Final/Revised Final official key is operational answer authority when available.
RankCrackers reviewed solution is never relabelled official.
Provisional key is historical/challenge evidence, not final operational authority.
Superseded evidence remains auditable.

## 5. Identity law
A boolean PYQ flag is NEVER sufficient proof of an official PYQ.

A Vault-deliverable official PYQ binds:
AuthorityID, MissionID, Recruitment/Examination Cycle/Event, Stage, Component/Paper, Track/Applicability where used, ExamDate, Language, Shift/Session where used, Booklet/Series/Set where used, QuestionAppearanceID, official question number/authority ID, exact official wording/options/media, source evidence object, source document hash, page/section locator, CanonicalQuestionID + semantic version, answer-authority state/version, syllabus/current-scope mapping and publication eligibility.

Authority dimensions not used by an exam remain null/not-applicable; never fabricate them.

## 6. Canonical Question vs Appearance
CanonicalQuestion represents proven semantic identity.
QuestionAppearance preserves the exact historical occurrence including wording, option order, media, language, number, date, shift and set.
Never fuzzy-merge official appearances.
Never overwrite historical official text to match a normalized/current version.
Derived/adapted RankCrackers questions can link to a PYQ for pedagogy but MUST NOT masquerade as the PYQ.

## 7. Student information architecture
### 7.1 Discover
Mission-scoped navigation may expose Year/Cycle -> Stage -> Paper/Component -> Date/Shift/Session -> Language/Set as applicable. Only meaningful authority dimensions are shown.

### 7.2 Paper view
Shows paper identity, official-source/provenance status, answer-authority status and historical fidelity. A source document/PDF may be available as evidence/reference where rights and delivery permit, but the Vault is not merely a PDF repository.

### 7.3 Question view
Shows exact historical appearance, answer-authority label, RankCrackers explanation separately, syllabus/topic mapping and student state. Internal normalization/review machinery is not dumped into Student UI.

### 7.4 My Vault
Personal projection may include saved/bookmarked, attempted, incorrect, skipped, revisit and notes where implemented. Student state is separate from immutable official content.

### 7.5 Search/filter
May filter only governed metadata. Historical frequency can be descriptive only when provenance-complete and policy-versioned.

## 8. Student interaction model
Student writes are permitted only to learner-owned projection records, never official PYQ evidence.

Logical events:
PYQ_VIEWED
PYQ_SAVED
PYQ_UNSAVED
PYQ_ATTEMPTED
PYQ_SKIPPED
PYQ_MARKED_REVISIT
PYQ_NOTE_UPDATED
PYQ_REVISION_RESOLVED

Every learner event binds StudentID, MissionID, QuestionAppearanceID/CanonicalQuestionVersion as applicable, timestamp and projection-policy version.
Correct/incorrect status binds the answer-authority version used at evaluation time.
A later revised official key triggers bounded re-evaluation; historical attempt evidence is retained.

## 9. Answer chronology and disputes
Supported authority states inherit Universal PYQ Authority contract:
OFFICIAL_FINAL_VERIFIED
OFFICIAL_REVISED_FINAL_VERIFIED
OFFICIALLY_DROPPED_OR_DELETED
OFFICIAL_KEY_RELEASED_NOT_ACQUIRED
OFFICIAL_ANSWER_NOT_ESTABLISHED
RANKCRACKERS_VERIFIED_NONOFFICIAL
ANSWER_CONFLICT_REVIEW_REQUIRED

Preserve provisional/superseded key evidence chronologically when acquired.
Dropped/deleted/bonus/multiple-accepted-answer treatment preserves exact authority disposition and scoring context.
Vault UI clearly distinguishes OFFICIAL ANSWER, RANKCRACKERS EXPLANATION, ANSWER NOT OFFICIALLY ESTABLISHED and ANSWER UNDER CONFLICT/REVIEW.

## 10. Syllabus and teaching boundary
PYQ is historical exam evidence, NEVER syllabus authority.
PYQ frequency cannot add/remove syllabus atoms or authorize teaching depth.
Historical PYQs may be CURRENT_SCOPE, HISTORICAL_SCOPE_ONLY or UNMAPPED_REVIEW_REQUIRED.
Historical-scope-only questions may remain visible as historical evidence but cannot bypass Taught Authority into scored current learning.
Missing PYQ never blocks DigiBook, Crucible, Test Arena or Mission validity.

## 11. Analytics constitution
Allowed descriptive analytics, only with provenance-complete eligible appearances and a versioned method:
- verified appearance count by governed scope/time window;
- historical topic distribution;
- historical paper/section pattern summaries;
- student personal attempt/error/revisit statistics.

PROHIBITED unless separately validated/approved:
- expected-question claims;
- future-question probability;
- repeat probability presented as forecast;
- PYQ frequency as syllabus authority;
- arbitrary frequency-to-difficulty conversion;
- arbitrary frequency-to-mastery bonus;
- unversioned magic normalization such as fixed 50-PYQ maximum;
- frequency alone as topic importance truth.

Runtime findings requiring reconciliation: importance_engine 40/30/30 importance mix and hard-coded 50 normalization; diagnostic_engine >8/>4 frequency difficulty tiers; mastery_update_worker +3.0 PYQ bonus. These are LEGACY_POLICY_REVIEW_REQUIRED and have no authority from this constitution.

## 12. Question Repository boundary
One Central Question Repository remains authoritative for canonical/versioned question identity.
PYQ Vault references eligible repository objects and official appearances; it does not duplicate them into a second mutable bank.
Repository classes remain immutable: PYQ and RANKCRACKERS_AUTHORED.
Internal content can never become PYQ by toggling a boolean flag.
Vault-specific learner state remains outside immutable question content.

## 13. Historical paper mode
PYQ Vault MAY launch a Historical Paper Experience only when paper reconstruction fidelity is sufficient.

It binds original event/stage/paper/date/shift/language/set, question appearances/order where authoritative, scoring scheme, duration, official dispositions, answer-authority snapshot and reconstruction/fidelity status.

A historical paper attempt is not automatically a current calibrated Test Arena competitive event.
It MUST NOT receive current national/state RankCrackers rank/percentile unless independently admitted into a qualified Test Arena benchmark under Test Arena constitution.
Historical practice results may feed personal revision diagnostics with explicit provenance.

## 14. Test Arena boundary
Test Arena owns formal governed assessment events and qualified competitive ranking.
PYQ Vault owns historical evidence discovery/practice.
Vault can deep-link to an eligible historical Test Arena experience, but cannot manufacture ranking authority or inject unqualified historical attempts into competitive cohorts.

## 15. Revision Desk boundary
Student-owned PYQ evidence may create revision candidates from incorrect attempts, skips, saved/revisit state, repeated misconceptions or retention/recheck needs.
Revision Desk owns prioritization and repair execution.
PYQ Vault preserves source/question context and can receive resolution state; it does not become the revision scheduler.

## 16. Rank Radar boundary
PYQ activity alone cannot create rank, percentile, competitive position or formal trajectory.
Rank Radar may consume only explicitly governed learning/readiness signals derived from PYQ behavior, never raw PYQ volume as competitive authority.
No "more PYQs solved = higher rank" logic.

## 17. DigiBook and Crucible boundary
DigiBook may contextually reference eligible PYQs around taught material.
Crucible may use eligible PYQs only when verified syllabus + Taught Authority + Question Repository/PYQ trust gates pass.
Vault visibility of a historical question does not grant Crucible/Test Arena eligibility.

## 18. Security and mutation
Students cannot write official evidence, provenance, canonical question text, official answers, solution verification, lineage or publication status.
Server/Founder-governed publication is required.
Official evidence and appearances are immutable/versioned; corrections create new governed versions/supersession links.
Student clients may write only authorized personal interaction state.
Offline cache, if implemented, is a signed/version-aware projection and cannot become authority.

## 19. Evidence maturity and empty states
Replace totalBattles gating.
Conceptual Vault states:
NO_PYQ_EVIDENCE_FOR_MISSION
PYQ_EVIDENCE_INGESTING
PYQ_REVIEW_IN_PROGRESS
PYQ_PARTIALLY_AVAILABLE
PYQ_AVAILABLE
PYQ_STALE_OR_INVALIDATED
PYQ_INTEGRITY_HOLD

Availability derives from mission-bound published PYQ projections, not battle count.
Partial availability must be honest: never imply complete historical coverage.

## 20. Historical coverage honesty
Vault must show coverage status when meaningful: which authority/event years/papers are verified, missing, unverified or answer-unresolved.
"No artificial year limit" means discovery continues backward where official evidence exists; it does NOT mean completeness is guaranteed.

## 21. Privacy/accessibility
Personal notes/bookmarks/attempts are private by default.
Historical official evidence is not mixed with another student's data.
Question/media delivery supports accessible representation where feasible without silently altering historical content; adaptations are labelled.

## 22. Logical entities
Existing higher-authority entities are reused:
OfficialQuestionPaperEvidence
OfficialAnswerKeyEvidence
CanonicalQuestion
QuestionAppearance
QuestionVersion
SolutionVerification
PYQPublicationProjection

Vault-specific logical entities:
PYQVaultAvailability
PYQStudentInteractionEvent
PYQStudentProjection
HistoricalPaperManifest
HistoricalPaperAttemptRef
PYQCoverageSnapshot
PYQAnalyticsPolicy

Logical entities do not mandate separate Firestore collections.

## 23. Deterministic delivery pipeline
Official acquisition
-> immutable source evidence
-> exact event/paper/appearance identity
-> answer-authority resolution
-> canonical question linkage
-> syllabus/atom mapping
-> solution review
-> publication eligibility
-> mission-scoped Vault projection
-> student discovery/practice
-> learner interaction events
-> optional Revision Desk candidate
-> optional governed historical Test Arena experience.

Fail closed at every authority ambiguity.

## 24. Failure codes
NO_PYQ_SET
PYQ_SOURCE_UNVERIFIED
PYQ_EVENT_AMBIGUOUS
PYQ_PAPER_AMBIGUOUS
PYQ_SHIFT_AMBIGUOUS
PYQ_SET_AMBIGUOUS
PYQ_APPEARANCE_AMBIGUOUS
PYQ_SOURCE_HASH_MISMATCH
PYQ_ANSWER_NOT_ESTABLISHED
PYQ_ANSWER_CONFLICT
PYQ_REVISED_KEY_PENDING_REVIEW
PYQ_DROPPED_OR_DELETED
PYQ_SCOPE_HISTORICAL_ONLY
PYQ_MAPPING_REVIEW_REQUIRED
PYQ_PUBLICATION_NOT_ELIGIBLE
PYQ_PARTIAL_COVERAGE
PYQ_HISTORICAL_FIDELITY_INSUFFICIENT
PYQ_INTEGRITY_HOLD

## 25. Mandatory acceptance fixtures
P01 no mission PYQ -> honest empty state; no fake set.
P02 one battle but no PYQ -> Vault remains unavailable.
P03 PYQ available with zero battles -> Vault can be available.
P04 generic PYQ flag without official evidence -> not official Vault PYQ.
P05 official paper + no final key -> question may display with answer-not-established.
P06 provisional key only -> not labelled final official answer.
P07 later final key -> operational answer updates; earlier evidence retained.
P08 later revised final -> revised authority supersedes operationally; history retained.
P09 dropped/deleted question -> preserved, not silently scored normally.
P10 two shifts with similar text -> appearances remain distinct until reviewed equivalence.
P11 normalized canonical question -> exact official appearance remains reconstructable.
P12 historical-only syllabus item -> visible historically, cannot authorize current scored teaching.
P13 missing PYQ -> DigiBook/Crucible/Test Arena not blocked.
P14 student bookmark/note -> cannot mutate official content.
P15 answer-key revision -> affected personal correctness can be re-evaluated audibly.
P16 historical paper with incomplete fidelity -> no false exact-paper claim.
P17 historical practice -> no current competitive rank by default.
P18 frequency -> descriptive only; no future-question prediction.
P19 hard-coded 50 normalization -> rejected absent approved versioned policy.
P20 fixed +3 mastery PYQ bonus -> rejected absent approved mastery evidence policy.
P21 >8/>4 frequency difficulty tiers -> rejected absent validated versioned policy.
P22 official answer and RankCrackers solution -> visibly separate authority.
P23 partial archive -> coverage status shown.
P24 source/hash invalidated -> affected publication fails closed.
P25 PYQ mistake routed to Revision Desk -> source lineage preserved.
P26 PYQ activity -> cannot directly manufacture Rank Radar rank/percentile.
P27 student offline cache -> cannot override newer authority.
P28 unauthorized student write to provenance/answer -> denied.
P29 unused authority dimension -> null, never fabricated.
P30 commercial compilation-only item -> not official PYQ.

## 26. Implementation gates
Gate A: this constitution + higher PYQ authority contracts.
Gate B: reconcile incomplete PyqEntry/PYQ-flag model with canonical appearance/evidence model.
Gate C: mission-scoped Vault repository/provider + availability state.
Gate D: student browse/question/personal-state projection.
Gate E: answer chronology, historical fidelity and Revision Desk integration.
Gate F: tests for provenance, authority, mutation, historical paper and learner state.
Gate G: independent Student surface audit and explicit deployment approval.

No Student UI mutation is authorized merely by documentation closure.

## 27. Runtime disposition register
PRESERVE:
- governed not-ready fail-closed behavior until replacement is proven;
- Crucible official-paper evidence gate;
- separate answer-key and solution verification;
- protected authority collections;
- explicit PYQ-not-syllabus law;
- fail-closed linkage behavior.

REPLACE/REFINE DURING IMPLEMENTATION:
- totalBattles Vault readiness gate;
- incomplete PyqEntry;
- unconnected Vault data path;
- missing learner projection;
- missing paper identity/answer chronology.

LEGACY_POLICY_REVIEW_REQUIRED:
- unversioned repeat-frequency/trendScore;
- hard-coded topic importance normalization;
- frequency-driven diagnostic difficulty;
- fixed PYQ mastery bonus.

No deletion is authorized by this document.

## 28. Pending policy decisions
D1 exact browse/filter presentation and default sorting.
D2 learner interaction retention/offline policy.
D3 historical-paper fidelity grades and launch threshold.
D4 descriptive analytics windows and minimum evidence.
D5 whether personal notes are device-only or account-synced.
D6 coverage-status presentation.
These may be decided during implementation/product validation; runtime must not invent authority-changing defaults.

## 29. Closure statement
PYQ VAULT != SYLLABUS AUTHORITY.
PYQ VAULT != QUESTION REPOSITORY.
PYQ VAULT != TEST ARENA RANKING.
PYQ VAULT != FUTURE QUESTION PREDICTOR.
PYQ VAULT = GOVERNED STUDENT PROJECTION OF VERIFIED HISTORICAL EXAM EVIDENCE + PERSONAL STUDY STATE.

DOCUMENTED != IMPLEMENTED.
HISTORICAL FREQUENCY != FUTURE PROBABILITY.
RANKCRACKERS SOLUTION != OFFICIAL ANSWER.
A PYQ FLAG != OFFICIAL PROOF.
MISSING PYQ != BLOCKED LEARNING.
