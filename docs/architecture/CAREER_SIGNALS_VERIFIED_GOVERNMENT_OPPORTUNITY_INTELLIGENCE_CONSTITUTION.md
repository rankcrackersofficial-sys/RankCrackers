# RANKCRACKERS — CAREER SIGNALS VERIFIED GOVERNMENT OPPORTUNITY INTELLIGENCE CONSTITUTION

Document ID: RC-CAREER-SIGNALS-001  
Version: 1.0 — WORLD-CLASS VERIFIED OPPORTUNITY INTELLIGENCE / FOUNDER-DIRECTION-CONSOLIDATED / PC-AUDIT-GROUNDED  
Status: Canonical architecture baseline for implementation planning; NOT runtime implemented  
Canonical student-facing name: Career Signals  
Primary domain: Verified government opportunity intelligence + student-specific eligibility interpretation + mission-specific official alerts  
Authority: Subordinate to verified official authority evidence, canonical Mission identity, governed Student Profile facts, and approved eligibility rules.  
Conflict rule: OFFICIAL AUTHORITY owns recruitment truth. PROFILE owns Student-declared/verified attributes. CAREER SIGNALS interprets their intersection; it never invents official eligibility rules or selection probability.

---

## 1. Founder product intent — LOCKED

Career Signals exists so a Student does not have to manually inspect every government recruitment source to discover what is relevant to them.

The canonical purpose is:

**Verified Government Opportunity Intelligence
+ Student-Specific Eligibility Interpretation
+ Mission-Specific Official Alerts.**

Career Signals must answer:

1. Which verified government opportunities are relevant to me?
2. Am I eligible under the currently verified official rules?
3. If eligibility cannot yet be determined, exactly which profile fact is missing?
4. Which posts/vacancies/benefits/relaxations/fees/dates apply to me?
5. Why am I seeing this signal?
6. Which official document/rule supports every material claim?
7. What changed after a corrigendum, extension, reopening, cancellation or revised vacancy notice?
8. Does this affect a mission I already follow?

Career Signals is not generic motivational career counselling and is not a future-selection predictor.

---

## 2. Runtime forensic baseline

PC forensic audit at local HEAD `ffb20f4a19d665739a5ba16414cf427e231a0db4` established:

- live `/opportunities` is a governed not-ready placeholder;
- dormant `Opportunity`, `CareerSignal`, matching, profile and alert components exist;
- current UI is not wired to the dormant engine;
- exact mission-ID filtering exists;
- source authority/version fields and explainability reason arrays exist;
- current dormant matching uses heuristic weights;
- missing DOB/category/domicile can still leave `eligible=true`;
- `N% Eligible Match` can overstate certainty;
- match persistence can be Student-written;
- corrigendum/supersession/currentness handling is incomplete;
- no active selection/rank/cutoff prediction was proven.

These facts are implementation evidence, not authority to preserve unsafe behavior.

---

## 3. Core laws

**OFFICIAL FACT != RANKCRACKERS GUIDANCE.**

**PROFILE MATCH != OFFICIAL ELIGIBILITY.**

**MISSING REQUIRED DATA != ELIGIBLE.**

**ELIGIBILITY != SELECTION PROBABILITY.**

**MISSION RELEVANCE != ELIGIBILITY.**

**HISTORICAL CUTOFF != FUTURE CUTOFF.**

**VACANCY COUNT != CHANCE OF SELECTION.**

**RANK RADAR POSITION != GOVERNMENT SELECTION PROBABILITY.**

**CAREER SIGNAL != ADVERTISEMENT.**

**NO VERIFIED AUTHORITY -> NO AUTHORITATIVE CAREER SIGNAL.**

---

## 4. Product model: two signal streams

Career Signals has two legitimate discovery streams.

### 4.1 Mission Signal
If a Student follows/chooses a mission, verified material changes related to that mission can create high-priority signals even before a new eligibility match is needed.

Examples:
- official notification released;
- corrigendum;
- application opening/closing;
- date extension/reopening;
- vacancy revision;
- eligibility/rule change;
- exam calendar/date change;
- scheme/pattern change relevant to the mission;
- cancellation/postponement.

### 4.2 Profile Opportunity Signal
A Student may receive a verified opportunity signal even if they have not chosen that mission, when their governed profile contains enough information to establish relevance/eligibility under current official rules.

Example:
A graduate Rajasthan Student may be surfaced a verified RAS recruitment event when the governed rules establish relevance.

The system must explain why the opportunity appeared.

---

## 5. Career Signals is an interpretation layer, not an authority replacement

Canonical upstream ownership:

OFFICIAL RECRUITMENT FACTS -> Authority Watch / verified official evidence  
MISSION IDENTITY -> Mission governance  
STUDENT ATTRIBUTES -> Deep/Secondary Profile  
CURRENT PREPARATION EVIDENCE -> DigiBook / Crucible / Test Arena / Rank Radar as applicable  
HISTORICAL STUDENT MEMORY -> Sacred Archive  
CAREER SIGNAL INTERPRETATION -> Career Signals

Career Signals must not independently author:
- official vacancy truth;
- official age limits;
- official category rules;
- official fees;
- official dates;
- canonical mission identity;
- Test Arena rank;
- Rank Radar position;
- current mastery;
- selection probability.

---

## 6. Canonical recruitment identity

A permanent Mission and a recruitment event are different identities.

A canonical opportunity/recruitment event must be able to bind, as applicable:

AuthorityID  
MissionID / ExamFamilyID  
RecruitmentEventID  
NotificationID  
AdvertisementNumber  
Cycle/RecruitmentPeriod  
Department/Organization  
PostID / PostGroupID  
PostName  
Cadre/Service where official  
Stage/Component where relevant  
Jurisdiction/State/Zone/Region  
OfficialSourceDocumentID  
OfficialSourceVersion  
OfficialSourceHash  
PublishedAt  
EffectiveFrom  
EffectiveTo  
Supersedes / SupersededBy  
VerificationState.

A new annual notification does NOT automatically create a new permanent Mission.

**MISSION = enduring exam/recruitment family.**  
**RECRUITMENT EVENT = time-bounded official opportunity under that family.**

Identity dimensions that do not apply remain null; they are never fabricated.

---

## 7. Official evidence and currentness

Every material Student-facing official fact must resolve to governed evidence.

Examples:
- post/vacancy;
- age rule;
- relaxation;
- education;
- subject requirement;
- category/reservation rule;
- PwBD rule;
- domicile rule;
- nationality;
- experience;
- attempt restriction;
- fee;
- application date;
- exam date;
- physical/medical requirement;
- corrigendum.

Required evidence semantics include, where applicable:

Source authority  
Document ID  
Document version/hash  
Rule/evidence locator  
VerifiedAt  
EffectiveFrom/To  
Supersession state  
Currentness state.

Synthetic defaults such as `Governed Authority` or `v1.0.0` must never masquerade as real provenance.

---

## 8. Official change graph

Career Signals must support official chronology, not one mutable notification record.

Conceptual chain:

NOTIFICATION_RELEASED
-> CORRIGENDUM_RELEASED
-> DEADLINE_EXTENDED
-> VACANCY_REVISED
-> EXAM_POSTPONED
-> APPLICATION_REOPENED
-> RECRUITMENT_CANCELLED

Only events actually issued by the authority apply.

A later official event may supersede operational facts without erasing the historical evidence chain.

Affected Student signals must be re-evaluated when a material governing fact changes.

---

## 9. Secondary Profile contract

Career Signals depends on a governed **Secondary/Deep Profile**, but only collects/uses attributes necessary for legitimate eligibility or delivery purposes.

Potential eligibility attributes, only when relevant to an official rule:

Date of birth  
Nationality  
State/domicile  
Category/subcategory  
PwBD/disability status  
Gender where legally relevant  
Widow/divorcee/separated-woman status where officially relevant  
Education level  
Degree/qualification  
Subjects  
Marks/percentage where required  
Graduation/completion status  
Professional qualification/licence  
Experience/service status  
Ex-serviceman/government-employee status where applicable  
Other explicitly official eligibility attributes.

Profile fields may be self-declared, verified, derived or unknown. Their provenance state must be distinguishable.

Career Signals must not require irrelevant sensitive attributes merely to increase profile completeness.

---

## 10. Minimum profile is rule-dependent, not one global percentage

There is no universal arbitrary "80% profile complete" gate.

Two concepts are separate:

### 10.1 Baseline Opportunity Profile
Minimum fields required to perform useful broad government-opportunity discovery. Founder intent includes at least:
- DOB;
- qualification/education;
- category;
- state/domicile.

Exact production minimum remains schema/policy governed.

### 10.2 Opportunity-Specific Required Facts
A particular recruitment may require additional facts, for example:
- specific subject;
- percentage;
- PwBD category;
- widow status;
- professional registration;
- experience;
- physical standard.

The Student can still see a verified opportunity while its personalized eligibility remains unresolved.

---

## 11. Profile Completion Resolver

Missing information becomes an actionable Career Signal state.

Examples:

**Update your Date of Birth**  
Needed to evaluate the official age rule for this recruitment.

**Update your Category**  
Needed to evaluate applicable reservation, age relaxation or fee rules.

**Update your Qualification**  
Needed to evaluate the official education requirement.

**Update your Domicile/State**  
Needed to evaluate jurisdiction-specific eligibility/benefits.

**Update your PwBD status**  
Only when an official rule makes it relevant.

Every request must state:
- what is missing;
- why it is needed;
- which opportunity/rule requires it;
- whether it blocks eligibility, a benefit calculation, or only alert delivery.

No dark-pattern pressure to disclose unrelated data.

---

## 12. Eligibility state machine

Canonical semantic states:

**ELIGIBLE**  
All mandatory currently verified rules that can be evaluated are satisfied and all required profile facts are available.

**NOT_ELIGIBLE**  
At least one mandatory verified rule is definitively not satisfied.

**MORE_INFORMATION_REQUIRED**  
One or more facts required to determine eligibility are missing/insufficient.

**OFFICIAL_RULE_UNRESOLVED**  
The official evidence is ambiguous, incomplete, conflicting or not yet governed enough to decide.

**SOURCE_STALE_OR_SUPERSEDED**  
The prior evaluation cannot safely be treated as current.

**INTEGRITY_HOLD**  
Evidence/identity/version integrity is insufficient.

Runtime naming may differ later, but these semantics are mandatory.

Missing DOB/category/domicile must never silently resolve to ELIGIBLE when those facts are material.

---

## 13. Rule-by-rule eligibility, not percentage theatre

The dormant weighted model:
- age 25%;
- qualification 35%;
- subject 15%;
- category 15%;
- domicile 10%

is classified:

**LEGACY_POLICY_REVIEW_REQUIRED / NOT CANONICAL ELIGIBILITY.**

Government eligibility is evaluated rule by rule.

A Student cannot be "85% officially eligible" when a mandatory qualification is absent.

The UI must not present arbitrary `N% Eligible Match` as official certainty.

A future relevance score, if ever useful for ranking opportunities, must:
- be explicitly labelled relevance, never eligibility probability;
- be versioned;
- be explainable;
- never override mandatory rules;
- never imply selection probability;
- require separate Founder approval.

---

## 14. Personalized Recruitment Dossier

For every verified signal, the Student should receive a structured dossier whose sections appear only when supported.

### A. Why you are seeing this
Mission followed, qualification match, governed profile relevance, or another explicit reason.

### B. Opportunity identity
Authority, recruitment/exam, notification/advertisement, cycle, department and status.

### C. Your eligibility
State + rule-by-rule explanation + missing facts.

### D. Your relevant posts
Only posts whose applicability can be established from official rules/profile evidence.

### E. Vacancy intelligence
Official total and relevant category/post distributions with version/corrigendum context.

### F. Age intelligence
Official cutoff date, Student age on the governing date, lower/upper age, applicable relaxation and source rule.

### G. Qualification intelligence
Required degree/subjects/percentage/experience versus profile evidence.

### H. Reservation/benefit intelligence
Only officially supported benefits/relaxations applicable to the Student.

### I. Fee intelligence
Applicable official fee based on governed rules/profile, plus fee deadline where available.

### J. Important dates
Application, fee, correction, exam and other official dates with currentness.

### K. Mission impact
If the Student already follows the mission, explain the relevant mission change without redefining academic authority.

### L. Official evidence
Authority, document, version, verification time and official source access.

---

## 15. Vacancy intelligence

Vacancy information must preserve:
- total posts;
- post-wise distribution;
- category distribution;
- horizontal reservation where official;
- PwBD/women/ex-serviceman or other officially defined buckets;
- state/zone/region allocation where applicable;
- backlog/withdrawn/revised status where official;
- source version.

A Student-facing phrase such as "Your vacancies" is allowed only when the applicable subset can be established under official rules. Otherwise show the official distribution and explain what cannot yet be personalized.

Vacancy revisions trigger re-evaluation.

**VACANCY COUNT != SELECTION CHANCE.**

---

## 16. Age and relaxation engine

Age evaluation must use the authority-defined cutoff/reference date, not today's age unless the official rule actually says so.

It must support rule-specific:
- minimum age;
- maximum age;
- category relaxation;
- PwBD relaxation;
- ex-serviceman/service relaxation;
- government-employee relaxation;
- gender/widow/divorcee provisions where official;
- cumulative/non-cumulative relaxation rules;
- date-of-birth boundary semantics.

All relaxation logic must be sourced and versioned.

Client local clock must not decide authoritative age eligibility.

---

## 17. Qualification engine

Qualification evaluation must distinguish:
- completed qualification;
- appearing/final-year allowance where official;
- required degree;
- equivalent qualification only where officially accepted;
- required subjects;
- required percentage/grade;
- professional registration/licence;
- experience;
- recognition/accreditation requirements where applicable.

RankCrackers must not decide equivalence on its own when the authority has not established it.

Ambiguity -> OFFICIAL_RULE_UNRESOLVED.

---

## 18. Fee intelligence

Fees are official facts, not generic profile metadata.

The engine may resolve the Student's applicable fee from:
- category;
- gender;
- PwBD;
- domicile;
- other officially specified status.

The dossier must distinguish:
application/exam fee,
processing/service charges where official,
fee exemption,
payment deadline,
refund rule where officially stated.

Email/mobile requirements for RankCrackers alert delivery are NOT official eligibility rules unless the recruitment authority itself makes them so.

---

## 19. Contact and notification-channel completeness

Profile completeness and alert-delivery completeness are separate.

Example:

**Add email to receive email alerts**

must not be presented as:

**Eligibility incomplete**

unless email itself is an official recruitment eligibility/application requirement.

Channel states may include:
IN_APP_AVAILABLE
EMAIL_NOT_CONFIGURED
PUSH_NOT_CONFIGURED
DELIVERY_PERMISSION_REQUIRED

without contaminating eligibility semantics.

---

## 20. Alert taxonomy

Career Signals may create governed alerts for material events such as:

NEW_VERIFIED_OPPORTUNITY  
MISSION_NOTIFICATION_RELEASED  
ELIGIBILITY_MATCH_ESTABLISHED  
PROFILE_DATA_REQUIRED  
APPLICATION_OPENED  
APPLICATION_CLOSING  
DEADLINE_EXTENDED  
APPLICATION_REOPENED  
CORRIGENDUM_RELEASED  
VACANCY_REVISED  
ELIGIBILITY_RULE_CHANGED  
EXAM_DATE_CHANGED  
RECRUITMENT_POSTPONED  
RECRUITMENT_CANCELLED  
SOURCE_INTEGRITY_HOLD.

Alert eligibility must be policy-governed and deduplicated.

The dormant hard-coded `matchScore > 80` threshold is NOT canonical.

---

## 21. Alert priority without panic

Priority can reflect:
- official deadline proximity;
- mission membership;
- confirmed eligibility/relevance;
- materiality of official change;
- action required from Student.

It must not use:
- fear-of-missing-out manipulation;
- fake "last chance";
- vacancy bait;
- salary bait;
- unsupported selection confidence;
- rank shame.

Urgent official deadlines may be clearly urgent without psychological manipulation.

---

## 22. Freshness state machine

Every current opportunity must have explicit currentness.

Conceptual states:

VERIFIED_CURRENT  
VERIFICATION_PENDING  
SUPERSEDED  
CLOSED  
CANCELLED  
REOPENED  
STALE_RECHECK_REQUIRED  
SOURCE_UNAVAILABLE  
INTEGRITY_HOLD.

An old notification cannot remain silently "active" because a local date filter says so.

Material source changes trigger bounded re-evaluation of affected eligibility and alerts.

---

## 23. Mission relationship

Career Signals may:
- surface verified events for an existing mission;
- suggest a verified opportunity relevant to the Student;
- offer a governed path to inspect/adopt an available mission.

Career Signals must NOT silently create canonical missions.

Mission creation/activation remains under Mission governance and Founder/server rules.

A recruitment event and a Mission remain separate identities.

---

## 24. Authority Watch integration

Target canonical flow:

Official Authority
-> Authority Watch / Evidence Acquisition
-> Verified Recruitment Event
-> Versioned Rules / Dates / Vacancies
-> Career Signals Eligibility Resolver
-> Student Relevance Resolver
-> Career Signal
-> Governed Alert Delivery
-> Sacred Archive event where materially appropriate.

Career Signals must consume verified evidence rather than scrape/create competing official truth.

---

## 25. Rank Radar boundary

Rank Radar owns competitive preparation intelligence.

Career Signals may eventually show a clearly labelled preparation context for a mission, but:

Rank Radar rank/percentile/readiness
must never automatically become:
- government selection chance;
- official cutoff prediction;
- job probability;
- admission probability.

No circular loop may allow a Career Signal to inflate Rank Radar and then use that inflated Rank Radar to justify itself.

---

## 26. Test Arena boundary

Test Arena owns governed formal assessment evidence.

Career Signals may reference preparation evidence only as **RankCrackers preparation context**, never official eligibility.

Example allowed:
"Your latest governed full-test evidence suggests these syllabus areas still need work."

Not allowed without independently validated methodology:
"You have an 82% chance of RAS selection."

---

## 27. Revision Desk boundary

Career Signals does not create academic weakness merely because an opportunity is important.

If a Student adopts/follows a mission, qualified learning evidence may later create Revision Desk recovery objectives through the normal academic pipeline.

Completing Revision Desk work does not directly alter official eligibility or selection probability.

---

## 28. DigiBook/Taught boundary

Taught coverage may be shown as preparation progress when governed.

**72% governed taught scope**
must never be transformed into
**72% selection chance**.

Career Signals cannot expand syllabus or mark untaught content mastered.

---

## 29. PYQ boundary

PYQ evidence may help a Student inspect historical exam material in PYQ Vault.

PYQ frequency/history must not determine:
- official eligibility;
- vacancy probability;
- selection chance;
- future-topic guarantee;
- career suitability.

---

## 30. Sacred Archive boundary

Sacred Archive may preserve meaningful Career Signals history, for example:
- material eligibility evaluation;
- official eligibility change caused by a revised rule;
- saved/followed opportunity if policy deems it meaningful;
- mission adoption;
- deadline/cancellation event acted upon by the Student.

Routine browsing need not become permanent academic memory.

Career Signals remains current opportunity intelligence; Sacred Archive preserves qualified historical Student events.

---

## 31. Career pathway guidance

Career pathway guidance must distinguish:

**OFFICIAL PATHWAY FACT**
from
**RANKCRACKERS GUIDANCE.**

A title-substring classifier such as MBBS->Medicine or IAS->Civil Services is not a canonical pathway authority.

A future pathway graph must bind official qualification/post/exam/service relationships where available and label editorial guidance separately.

---

## 32. Salary/pay/career facts

If Career Signals later displays:
- pay level;
- salary;
- grade pay;
- allowances;
- in-hand estimate;
- service/cadre;
- promotion path;
- posting conditions,

each item must distinguish:
OFFICIAL FACT,
DERIVED ESTIMATE,
RANKCRACKERS GUIDANCE.

Approximate in-hand salary must never be labelled official salary.

No salary/pay capability is authorized merely by this constitution.

---

## 33. Explainability contract

Every personalized signal must be able to answer:

WHY AM I SEEING THIS?  
WHICH PROFILE FACTS WERE USED?  
WHICH OFFICIAL RULES WERE USED?  
WHAT IS MISSING?  
WHAT IS DEFINITIVELY ELIGIBLE/INELIGIBLE?  
WHAT IS STILL UNKNOWN?  
WHEN WAS THIS VERIFIED?  
HAS ANYTHING BEEN SUPERSEDED?  
WHAT ACTION SHOULD I TAKE?  
WHAT IS OFFICIAL FACT VS RANKCRACKERS GUIDANCE?

Black-box recommendation is not acceptable.

---

## 34. Privacy and sensitive profile governance

Career Signals may process sensitive/personal attributes only for a legitimate product purpose.

Requirements:
- data minimization;
- purpose limitation;
- Student visibility/control;
- UID isolation;
- no cross-Student exposure;
- no public weakness/eligibility history;
- no use of sensitive attributes for unrelated ranking;
- governed retention/export/deletion policy;
- explicit distinction between self-declared and verified attributes.

Exact retention/export/deletion periods remain pending policy.

Student profile data must never be reproduced in logs/audit reports unnecessarily.

---

## 35. Fairness

Official legal eligibility restrictions may be represented when verified.

RankCrackers must not invent restrictions based on:
- gender;
- caste/category;
- disability;
- state;
- language;
- economic status;
- current Rank Radar position;
- prior failures.

A low preparation score must not hide an opportunity for which the Student is officially eligible.

Career Signals can say "eligible, preparation evidence currently limited"; it must not silently convert preparation weakness into official ineligibility.

---

## 36. Server authority and security

Authoritative Career Signals outcomes must not rely on Student-writable match documents.

Target principles:
- official recruitment evidence is server/Founder-governed;
- eligibility policy/rules are versioned;
- authoritative evaluation is server/governed;
- Student client can update permitted profile facts, save/watch preferences and delivery preferences;
- Student cannot author official vacancy/date/rule/eligibility truth;
- cached client projections are non-authoritative;
- every authoritative result binds evaluation version + source versions + profile snapshot/fingerprint as appropriate.

Current UID-scoped reads are a useful foundation but do not make Student-authored matches authoritative.

---

## 37. Eligibility Evaluation Manifest

Every authoritative personalized evaluation should be reproducible from an immutable/logically immutable manifest containing, as applicable:

EvaluationID  
StudentID  
RecruitmentEventID  
MissionID  
ProfileSnapshotVersion/Fingerprint  
EligibilityPolicyVersion  
RuleSetVersion  
OfficialEvidenceVersions  
EvaluatedAt server/governed time  
OverallState  
RuleResults[]  
MissingFacts[]  
ApplicableBenefits[]  
ApplicableFees[]  
ApplicablePosts[]  
VacancyProjectionVersion  
SupersededBy  
IntegrityState.

Do not store more sensitive profile content than required for reproducibility.

---

## 38. Rule Result

Each rule result should conceptually contain:

RuleID  
RuleType  
OfficialEvidenceRef  
Requirement  
StudentFactRef / fact state  
Result = PASS / FAIL / UNKNOWN / NOT_APPLICABLE / OFFICIAL_AMBIGUITY  
Explanation  
EffectiveVersion.

Overall eligibility is derived conjunctively according to the official rule structure, not arbitrary weighted averaging.

---

## 39. Student information architecture

Recommended world-class surface:

### Career Signals Home
- profile readiness;
- urgent verified actions;
- mission signals;
- new matching opportunities;
- saved/watched opportunities;
- recent official changes.

### Signal Card
- opportunity;
- status;
- eligibility state;
- why shown;
- key deadline;
- action required.

### Opportunity Dossier
- Overview
- Your Eligibility
- Posts & Vacancies
- Age & Relaxations
- Qualification
- Reservation/Benefits
- Fees
- Important Dates
- Official Changes
- Mission Connection
- Official Evidence

### Profile Action Drawer
- exact missing field;
- why needed;
- affected opportunity;
- privacy/purpose explanation;
- update path.

No arbitrary eligibility percentage as the primary status.

---

## 40. Empty and failure states

NO_VERIFIED_OPPORTUNITIES  
PROFILE_BASELINE_INCOMPLETE  
OPPORTUNITY_REQUIRES_MORE_INFORMATION  
OFFICIAL_RULE_UNRESOLVED  
SOURCE_VERIFICATION_PENDING  
SOURCE_STALE  
SOURCE_SUPERSEDED  
RECRUITMENT_CLOSED  
RECRUITMENT_CANCELLED  
MISSION_NOT_AVAILABLE  
ELIGIBILITY_REEVALUATION_PENDING  
ALERT_DELIVERY_NOT_CONFIGURED  
INTEGRITY_HOLD.

Fail closed on authority; remain useful through explanation.

---

## 41. Historical/current distinction

Every recruitment event must distinguish, as applicable:

UPCOMING_VERIFIED  
OPEN  
CLOSING  
CLOSED  
REOPENED  
POSTPONED  
CANCELLED  
SUPERSEDED  
HISTORICAL  
VERIFICATION_PENDING  
UNKNOWN/INTEGRITY_HOLD.

Historical recruitment facts must never appear as current opportunities merely because their documents still exist.

---

## 42. No selection-prediction policy

Version 1.0 explicitly prohibits presenting unsupported:
- selection probability;
- expected official rank;
- expected official percentile;
- guaranteed qualification;
- future cutoff forecast;
- "safe score" as certainty;
- job/admission chance.

A future model would require a separate constitution, validated external outcome data, population/selection-bias analysis, calibration, uncertainty, fairness testing, monitoring and explicit Founder approval.

This document does not authorize such a model.

---

## 43. Existing runtime disposition

### PRESERVE
- live fail-closed not-ready surface until replacement is proven;
- exact mission-ID filtering;
- tests rejecting title-keyword mission matching;
- source authority/version concepts;
- explainability reason arrays;
- Founder-controlled recruitment writes;
- UID-scoped Student reads;
- More Information Needed concept.

### REPLACE / REFINE
- unsafe missing-profile eligibility behavior;
- `N% Eligible Match` wording;
- weighted eligibility heuristic;
- hard-coded `matchScore > 80` alert threshold;
- local-clock deadline authority;
- synthetic provenance defaults;
- Student-authoritative persisted match outcomes;
- title-substring career family authority.

### ADD THROUGH AUTHORIZED IMPLEMENTATION
- recruitment-event identity;
- official supersession/corrigendum graph;
- rule engine;
- server-authoritative evaluation;
- freshness states;
- profile action resolver;
- dossier;
- deduplicated alerts;
- privacy/retention contract;
- archive integration;
- comprehensive tests.

No deletion or runtime mutation is authorized by this document.

---

## 44. Mandatory acceptance fixtures

C01 No verified opportunities -> honest empty state.  
C02 Baseline profile missing DOB -> exact DOB update action; no false ELIGIBLE.  
C03 Category missing and category material -> MORE_INFORMATION_REQUIRED.  
C04 Domicile missing and material -> MORE_INFORMATION_REQUIRED.  
C05 Missing irrelevant profile field -> does not block eligibility.  
C06 Mandatory qualification absent -> NOT_ELIGIBLE.  
C07 Qualification equivalence ambiguous -> OFFICIAL_RULE_UNRESOLVED.  
C08 Final-year allowed by official rule -> evaluated exactly.  
C09 Age exactly at lower boundary -> official date semantics.  
C10 Age exactly at upper boundary -> official date semantics.  
C11 Applicable relaxation -> source-backed explanation.  
C12 Relaxation not applicable -> no invented benefit.  
C13 PwBD field requested only when relevant.  
C14 Widow/divorcee provision applied only where official.  
C15 Fee personalized from official rule.  
C16 Email missing -> delivery action, not eligibility failure unless officially required.  
C17 Mission followed + new notification -> mission signal.  
C18 Mission not followed + profile eligible -> profile opportunity signal may appear.  
C19 Same exam next annual cycle -> new RecruitmentEventID, same canonical Mission where appropriate.  
C20 Same post name different authority -> no identity collision.  
C21 Corrigendum changes age rule -> affected evaluations superseded/recomputed.  
C22 Deadline extended -> old date retained historically, current dossier updated.  
C23 Application reopened -> state becomes REOPENED.  
C24 Recruitment cancelled -> no active opportunity; clear cancellation signal.  
C25 Vacancy revised -> current distribution version changes with provenance.  
C26 Source disappears -> SOURCE_STALE/verification state, no silent trust.  
C27 Synthetic provenance -> cannot qualify authoritative signal.  
C28 Duplicate official event ingestion -> deduplicated by governed identity.  
C29 Client clock wrong -> authoritative deadlines unaffected.  
C30 Student edits DOB -> affected eligibility re-evaluated.  
C31 Student edits category -> affected benefits/fees/eligibility re-evaluated.  
C32 Student tries to write official eligibility -> denied/not authoritative.  
C33 `matchScore` legacy value exists -> not shown as official eligibility certainty.  
C34 Low Rank Radar position -> does not make officially eligible opportunity ineligible.  
C35 High Test Arena score -> does not create selection probability.  
C36 Revision resolved -> does not alter official eligibility.  
C37 PYQ frequency high -> does not create career signal priority by itself.  
C38 Taught coverage 72% -> not shown as 72% selection chance.  
C39 Official historical cutoff exists -> labelled historical, not forecast.  
C40 Vacancy count large -> no implied easy selection.  
C41 Student sees why signal appeared.  
C42 Student sees official source/version/currentness.  
C43 Required profile action explains purpose.  
C44 Sensitive irrelevant field absent -> no forced disclosure.  
C45 Cross-mission opportunity -> no contamination.  
C46 Closed recruitment -> not shown as open.  
C47 Alert duplicated from same event -> one governed notification.  
C48 Superseded alert -> current state/correction visible.  
C49 Career Signal archived -> meaningful event only; routine browse not forced into Sacred Archive.  
C50 Incomplete official rule -> no guess.  
C51 Multiple posts with different rules -> post-specific eligibility.  
C52 Category vacancy bucket unavailable -> do not fabricate "your vacancies."  
C53 Fee exemption rule changes -> reevaluate fee.  
C54 Official date timezone/cutoff semantics preserved.  
C55 Student follows mission after signal -> mission adoption uses Mission governance.  
C56 Opportunity has no canonical Mission yet -> signal cannot silently create one.  
C57 Official notification English evidence unavailable under current project evidence policy -> follow governing evidence-acquisition policy; do not invent translated authority.  
C58 Profile fact is self-declared -> provenance remains distinguishable.  
C59 Eligibility evaluation becomes stale -> clearly marked and re-evaluated.  
C60 Selection probability requested by UI -> unavailable unless separately validated/authorized.

---

## 45. Implementation gates

**Gate A — Architecture reconciliation**  
This constitution + Mission Discovery/Evidence Acquisition + profile authority + downstream constitutions reconciled.

**Gate B — Identity**  
Canonical Mission vs RecruitmentEvent vs Notification/Post identity implemented/tested.

**Gate C — Official evidence**  
Version/hash/currentness/supersession and corrigendum contracts proven.

**Gate D — Profile governance**  
Required fields, provenance, privacy and update semantics proven.

**Gate E — Eligibility engine**  
Rule-by-rule fail-closed evaluator + manifests + unknown handling.

**Gate F — Opportunity dossier**  
Posts/vacancies/age/qualification/benefits/fees/dates/evidence.

**Gate G — Alerts**  
Event taxonomy, relevance, dedupe, stale/cancel behavior and delivery.

**Gate H — Security**  
Server/governed authority; Student cannot forge official facts/results.

**Gate I — Cross-domain adapters**  
Mission, Authority Watch, Sacred Archive and optional preparation-context boundaries.

**Gate J — Test suite**  
C01-C60 plus corruption, migration, privacy and cross-mission cases.

**Gate K — Independent live Student audit**  
No fake eligibility, stale facts, unsupported predictions or misleading percentages.

**Gate L — Founder deployment approval**  
No deployment before explicit approval.

---

## 46. Pending Founder/policy decisions

The Founder has resolved the core product purpose. Remaining implementation policy decisions include:

P1 exact baseline Secondary Profile field set versus opportunity-specific fields;  
P2 whether save/watch ships in first release;  
P3 alert channels and frequency controls;  
P4 exact notification priority policy;  
P5 whether preparation context appears inside Career Signals v1;  
P6 privacy retention/export/deletion periods;  
P7 whether salary/pay intelligence is included later;  
P8 whether editorial career-pathway guidance is included later;  
P9 exact wording for self-declared vs verified profile facts;  
P10 handling of opportunities whose official evidence is not available in the project's accepted authority language.

No runtime agent may invent these silently.

---

## 47. World-class closure

**CAREER SIGNALS != JOB PORTAL SCRAPE.**  
**CAREER SIGNALS != GENERIC CAREER COUNSELLOR.**  
**CAREER SIGNALS != RANK PREDICTOR.**  
**CAREER SIGNALS != SELECTION PREDICTOR.**  
**CAREER SIGNALS != MISSION AUTHORITY.**  
**CAREER SIGNALS != STUDENT PROFILE AUTHORITY.**

**CAREER SIGNALS = VERIFIED GOVERNMENT OPPORTUNITY INTELLIGENCE + STUDENT-SPECIFIC ELIGIBILITY INTERPRETATION + MISSION-SPECIFIC OFFICIAL ALERTS.**

**OFFICIAL AUTHORITY DEFINES THE OPPORTUNITY.**  
**THE STUDENT PROFILE PROVIDES GOVERNED PERSONAL FACTS.**  
**CAREER SIGNALS EXPLAINS THE INTERSECTION.**

**MISSING REQUIRED DATA -> ASK FOR THE EXACT MISSING FACT.**  
**OFFICIAL CHANGE -> RE-EVALUATE THE AFFECTED SIGNAL.**  
**UNKNOWN -> SAY UNKNOWN.**  
**ELIGIBLE -> DOES NOT MEAN SELECTED.**  
**DOCUMENTED != IMPLEMENTED.**
