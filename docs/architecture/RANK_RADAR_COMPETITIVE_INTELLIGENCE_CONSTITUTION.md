# RANKCRACKERS — RANK RADAR COMPETITIVE INTELLIGENCE CONSTITUTION

Document ID: RC-RANKRADAR-001
Version: 1.0 — FOUNDER-DIRECTION-CONSOLIDATED / PC-AUDIT-GROUNDED / NUMERIC-POLICY-PENDING
Status: Canonical architecture baseline for implementation planning and later repository reconciliation; NOT runtime implemented, NOT psychometrically validated
Authority: Subordinate to verified official mission/exam authority, Test Arena ranking constitution, Taught Authority, assessment evidence and later explicit Founder corrections
Extends: TEST_ARENA_EARNED_MAJOR_MILESTONE_FULL_TEST_AND_PSYCHOMETRIC_RANKING_CONSTITUTION.md
Conflict policy: Test Arena is the governed producer of qualified competitive rank/percentile evidence. Rank Radar MUST NOT create a second competing rank authority.

## 1. Purpose
Rank Radar answers four student questions from governed evidence:
1. Where am I competitively?
2. Where is my evidence-supported trajectory heading?
3. What is driving that movement?
4. What should I do next?

Rank Radar is an evidence-governed competitive-position, trajectory, readiness and intervention-intelligence surface. It is NOT a leaderboard clone, official-rank predictor, selection predictor, teaching authority, assessment authority or independent percentile engine.

## 2. Runtime audit baseline
PC forensic audit on 2026-10-10 at local HEAD ffb20f4a19d665739a5ba16414cf427e231a0db4 established:
- Battle Tools Rank Radar card routes to /progress-tracker.
- Active destination is a governed not-ready surface and produces no rank/percentile/trend/readiness metric.
- Card readiness currently depends on totalBattles, which is insufficient evidence lineage.
- Separate RankingsScreen contains unsupported hard-coded ranking/performance values.
- SacredRankMatrix is a separate caller-supplied presentation with no proven active caller.
- Test Arena independently contains gated event rank/percentile logic.
- No Rank Radar-specific backend, cohort model, history model, metric engine or dedicated tests were proven.
These findings are implementation evidence, not architecture authority.

## 3. Authority boundary
TEST ARENA owns formal assessment truth:
- governed attempt and score;
- benchmark/form/cohort identity;
- qualified event rank and percentile;
- ranking-policy/equating status;
- immutable score/rank revisions.

RANK RADAR consumes qualified evidence and owns interpretation across time:
- competitive position presentation;
- comparable-evidence trajectory;
- readiness profile;
- performance drivers;
- evidence confidence;
- next-best-action routing.

CRUCIBLE owns formative learning/diagnostic rhythm, not competitive rank.
DIGIBOOK/TAUGHT AUTHORITY owns what was actually taught.
REVISION DESK owns repair/revision execution.
CAREER SIGNALS must not use Rank Radar as a hidden selection predictor.
No downstream surface may promote an unqualified Test Arena result into a qualified rank.

## 4. Five intelligence zones
### 4.1 Competitive Position
May display only qualified Test Arena-derived competitive evidence. Every value binds benchmark, cohort definition, denominator, reference period/window, ranking policy/model version, timestamp/snapshot and qualification status.
Possible views: mission-primary competitive position, national benchmark where mission and evidence justify it, state/jurisdiction view where the SAME calibrated scale and valid jurisdiction rules support it.
If evidence is insufficient: show NOT_ENOUGH_COMPARABLE_EVIDENCE, never a fabricated number.

### 4.2 Trajectory
Trajectory is change across comparable evidence, not arithmetic over unlike tests.
Allowed inputs must share or be validly linked across benchmark scale/version, construct, scoring/equating status and population/reference rules.
Micro %, Macro %, Major percentile and Full-Test raw marks MUST NOT be placed on one pseudo-continuous line merely because all are numeric.
Outputs may be IMPROVING, STABLE, MIXED, DECLINING or INSUFFICIENT_EVIDENCE, with evidence confidence and time horizon. Exact statistical thresholds remain policy-pending.

### 4.3 Readiness
Readiness is multidimensional and distinct from rank. It may include independently governed signals for:
- verified taught coverage;
- assessed coverage;
- retention stability;
- cross-topic integration;
- accuracy stability;
- speed/time-pressure stability where construct-valid;
- formal benchmark maturity;
- Full-Test maturity.
A high percentile on narrow taught scope cannot imply full-exam readiness. Readiness never grants TAUGHT authority and never predicts official selection.

### 4.4 Performance Drivers
Explain evidence-supported contributors to movement: subject/topic/knowledge-dependency strength, recurring errors, retention decay, timing pressure, consistency or integration weakness.
A driver requires traceable evidence. Correlation must not be presented as causal proof. Avoid fixed-ability language and shame.

### 4.5 Next Best Action
Rank Radar diagnoses and routes; it does not become the repair engine.
Possible destinations:
- Revision Desk for targeted repair;
- DigiBook for authorized relearning/reference;
- Crucible for governed reinforcement;
- Test Arena when a qualified formal assessment is due/eligible.
Recommendations bind reason/evidence and must not silently alter academic state.

## 5. Evidence maturity
Replace the current totalBattles binary heuristic with evidence maturity. Conceptual states:
NO_EVIDENCE
EARLY_SIGNALS
DEVELOPING_PROFILE
COMPARABLE_EVIDENCE_AVAILABLE
ESTABLISHED_COMPETITIVE_PROFILE
STALE_OR_NONCOMPARABLE
INTEGRITY_HOLD

These names are architecture-level states; numeric thresholds are pending policy. One battle never automatically establishes competitive evidence.

## 6. Metric truth classes
Every surfaced metric is classified:
A DIRECT_OBSERVED_EVIDENCE
B DERIVED_DETERMINISTIC
C STATISTICALLY_ESTIMATED
D PROJECTED
E MOCK/SYNTHETIC
F PLACEHOLDER
G UNKNOWN/UNPROVEN

Production competitive values may never originate from E/F/G. C/D require method version, uncertainty and qualification. UI must distinguish observed, estimated and projected truth.

## 7. Prediction boundary
PROHIBITED by default:
- exact future official AIR/state rank prediction;
- guaranteed selection/admission claims;
- deterministic conversion of RankCrackers percentile into official rank;
- false-precision score/rank forecasts.

A future ProjectedCompetitiveBand may be considered only after separate validated longitudinal methodology, declared reference population, out-of-sample validation, uncertainty/calibration review and Founder approval. It must remain explicitly non-official and may be withdrawn when evidence drifts.

## 8. Cohorts and geography
National/state/jurisdiction comparisons require:
- mission applicability;
- same qualified benchmark scale;
- unique eligible persons;
- declared attempt-selection rule;
- verified or policy-valid jurisdiction;
- minimum cohort/privacy rule;
- duplicate-account/retake handling;
- tie policy inherited from ranking authority;
- reference window and snapshot.
State rank is not created by rescoring questions differently. Small-N views are suppressed or generalized.

## 9. History and snapshots
Rank Radar must preserve immutable historical intelligence snapshots or reproducible references to immutable source snapshots. Each snapshot binds:
StudentID, MissionID, Stage/Component scope, RadarPolicyVersion, source TestArena RankSnapshot IDs, TaughtBoundary fingerprint where used, readiness-policy version, generatedAt server time, evidence cutoff and confidence.
98-day Crucible rollover NEVER resets Rank Radar history.
Regrades create new derived snapshots; old snapshots remain auditable and are visibly superseded where material.

## 10. Confidence and uncertainty
Every estimated/aggregated signal has confidence/qualification status. Confidence depends on evidence quantity, comparability, recency, measurement precision, breadth and integrity—not on cosmetic AI certainty.
Never show a precise decimal when measurement cannot support it. Insufficient evidence is a valid outcome.

## 11. Student psychology and accessibility
Default hierarchy:
1. actionable learning insight;
2. progress/readiness context;
3. competitive position where qualified.
Avoid shame, panic countdowns, fixed-intelligence labels, compulsive leaderboard loops and selection prophecy. Permit privacy-safe identity and rank-visibility controls. Support accessibility and accommodations without automatic exclusion; comparability consequences are governed by Test Arena/fairness policy.

## 12. UI information architecture
Recommended canonical surface:
A. Header: Rank Radar + mission/stage + evidence status/confidence.
B. Competitive Position card: qualified national/state/mission context and denominator.
C. Trajectory: only comparable evidence, with period and qualification.
D. Readiness profile: multidimensional, not a single magic score by default.
E. Helping / Holding Back: traceable performance drivers.
F. Next Best Action: one to few prioritized routes, especially Revision Desk.
G. Evidence Details drawer: source assessments, benchmark versions, cohort, timestamp, methodology status.
The visual metaphor may use a radar/spider visualization only when axes are independently meaningful and normalized under documented rules. Decorative pseudo-science is prohibited.

## 13. Backend authority and security
Rank Radar competitive inputs must be server-authoritative or consume signed/immutable governed outputs. Student clients cannot author rank, percentile, benchmark qualification, cohort identity or confidence class.
Derived Radar snapshots require policy/model version and source evidence IDs. Stale, regraded, integrity-held or invalidated inputs propagate explicit state rather than silently persisting old claims.
No hidden client-side national/state rank calculation.

## 14. Legacy/runtime disposition
Until final implementation audit:
- ProgressTrackerScreen: ACTIVE_PLACEHOLDER; preserve fail-closed behavior until replacement is proven.
- RankingsScreen hard-coded national rankings: UNSUPPORTED_STATIC_RANKING_SURFACE / LEGACY_CANDIDATE; NOT canonical evidence.
- SacredRankMatrix: UNRESOLVED_PARALLEL_PRESENTATION; no authority until caller/lineage is proven.
- totalBattles gate: INSUFFICIENT_EVIDENCE_GATE; must not become production Radar qualification.
No deletion is authorized by this document. Later code audit assigns KEEP/REUSE/REPLACE/DEPRECATE.

## 15. Minimal logical entities
RankRadarPolicy
RankRadarEvidenceSet
CompetitivePositionView
TrajectorySeries
ReadinessProfile
PerformanceDriver
RadarRecommendation
RankRadarSnapshot
RadarConfidenceAssessment
RadarSuppressionDecision
RadarRevisionLink

Logical entities do not mandate separate collections/services.

## 16. Deterministic pipeline
Qualified academic/assessment evidence
-> source validation
-> comparability filter
-> evidence maturity
-> competitive-position projection from qualified Test Arena outputs
-> trajectory analysis
-> readiness synthesis from authorized domain evidence
-> driver analysis
-> confidence/suppression
-> next-action routing
-> immutable/reproducible Radar snapshot
-> student presentation.

Fail closed at every unsupported transition.

## 17. Failure/suppression codes
NO_EVIDENCE
INSUFFICIENT_COMPARABLE_EVIDENCE
COHORT_TOO_SMALL
COHORT_UNQUALIFIED
BENCHMARK_NOT_COMPARABLE
RANK_AUTHORITY_WITHHELD
SOURCE_REGRADING
SOURCE_INTEGRITY_HOLD
RADAR_POLICY_STALE
TAUGHT_BOUNDARY_STALE
TRAJECTORY_INSUFFICIENT
READINESS_SCOPE_INCOMPLETE
STATE_COHORT_UNAVAILABLE
PRIVACY_SUPPRESSED
PROJECTED_BAND_NOT_VALIDATED

## 18. Mandatory acceptance fixtures
R01 zero battles/evidence -> no fabricated metric.
R02 one battle -> does not automatically establish competitive profile.
R03 unqualified Test Arena rank -> Radar cannot upgrade it.
R04 qualified event percentile -> displayed with cohort/benchmark provenance.
R05 unlike Micro/Macro/Major metrics -> no fake common trend.
R06 linked/equated comparable benchmarks -> trajectory permitted under policy.
R07 97th percentile on narrow taught scope -> no full-exam-ready claim.
R08 state cohort too small -> state rank suppressed.
R09 duplicate/retake evidence -> governed attempt-selection rule.
R10 equal-score rank inherits Test Arena tie policy, not client ordering.
R11 regrade -> new Radar snapshot; old history auditable.
R12 98-day cycle wrap -> Radar history preserved.
R13 unsupported static #82/Top3% values -> prohibited from production evidence.
R14 no exact official-rank prediction from platform percentile.
R15 driver without lineage -> not shown as fact.
R16 recommendation -> cannot grant TAUGHT or assessment eligibility.
R17 stale benchmark -> position marked stale/noncomparable.
R18 user hides competitive identity -> privacy preserved.
R19 accessibility accommodation -> no automatic discriminatory exclusion.
R20 insufficient evidence -> honest guidance and next action.

## 19. Implementation gates
Gate A: Founder-approved authority/boundary constitution — this document.
Gate B: Test Arena runtime reconciled to canonical ranking constitution, including explicit tie policy.
Gate C: Radar data lineage/schema and snapshot policy.
Gate D: readiness/trajectory metric definitions, comparability and statistical review.
Gate E: privacy, psychology, accessibility and UI validation.
Gate F: Codex implementation + tests + independent live Student surface audit + explicit deployment approval.
No production rank claim may bypass Test Arena's psychometric/ranking gates.

## 20. Pending numeric/policy decisions
P1 evidence-maturity thresholds.
P2 trajectory minimum comparable observations, recency window and trend method.
P3 readiness dimensions, weighting (if any), labels and scope floors.
P4 state/national minimum cohort/privacy thresholds.
P5 Radar refresh/snapshot cadence and stale thresholds.
P6 future projected-band research policy, if ever authorized.
These are intentionally unresolved. Runtime must not invent defaults.

## 21. Cross-feature laws
Test Arena PRODUCES governed formal competitive evidence.
Rank Radar INTERPRETS qualified competitive/learning evidence.
Revision Desk EXECUTES prioritized repair.
PYQ Wallet exposes governed official-PYQ study/evidence utility and does not become syllabus authority.
Crucible runs formative learning/diagnostic rhythm.
DigiBook/Taught Authority governs taught truth.
Career Signals must not reinterpret Radar as guaranteed career/selection probability.
Sacred Archives meaning/authority remains pending its dedicated forensic audit and constitution.

## 22. Closure statement
RANK RADAR != TEST ARENA.
RANK RADAR != LEADERBOARD.
RANK RADAR != OFFICIAL RANK PREDICTOR.
RANK RADAR != TEACHING AUTHORITY.
RANK RADAR = GOVERNED COMPETITIVE INTELLIGENCE FROM QUALIFIED EVIDENCE.

DOCUMENTED != IMPLEMENTED. ESTIMATED != OBSERVED. PROJECTED != OFFICIAL. INSUFFICIENT EVIDENCE IS A VALID RESULT.
