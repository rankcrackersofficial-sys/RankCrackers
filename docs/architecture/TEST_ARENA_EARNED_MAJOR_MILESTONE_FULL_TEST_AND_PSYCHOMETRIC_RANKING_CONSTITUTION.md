# RANKCRACKERS — EARNED MAJOR MILESTONE, FULL TEST AND PSYCHOMETRIC RANKING CONSTITUTION

Document ID: RC-TESTARENA-EMR-001
Version: 1.0 — FOUNDER-DIRECTION-CONSOLIDATED / NUMERIC-POLICY-PENDING
Status: Canonical architecture candidate for implementation planning; NOT runtime implemented, NOT psychometrically validated
Authority: Subordinate to verified official mission/exam/syllabus authority, taught authority, question closure and Founder decisions
Extends: TEST_ARENA_EXECUTION_CONTRACT.md; CRUCIBLE_TO_TEST_ARENA_HANDOFF_AND_FORMAL_ASSESSMENT_BOUNDARY_CONTRACT.md; CRUCIBLE_98_DAY_DAY_BY_DAY_CORE_OPERATING_SPECIFICATION.md
Depends: Effective Exam Blueprint, Canonical Syllabus/DSD, Teaching Execution/Taught Manifest, Question Repository/Knowledge Closure, scoring/attempt evidence.
Conflict policy: Later explicit Founder correction prevails over earlier draft suggestions. This document does not authorize code, Student UI changes, deployment or official-rank claims.

## 1. Scope and exact status
This is the governing design for Major readiness, milestone progression, paper assembly, Full Test separation, alternate forms, equating, percentile, competitive rank, psychological safeguards and auditability. Founder has NOT approved fixed Major 1/2/3/4 calendar numbering, 28-day/10-Micro/2-Macro numeric thresholds, 25/50/75% milestone boundaries, six mandatory forms, or arbitrary paper-size fractions. Those are NOT locked. Any exact numeric setting must be approved in an immutable Mission/Stage/Component policy after evidence-based feasibility review.

## 2. Non-negotiable conceptual separation
Crucible: 98-day rotating learning rhythm; seven 14-day phases; six Micros on phase days 2,4,6,8,10,12; Day 13 Rebuild; Day 14 Macro. Day 98 -> next cycle Day 1, but learner evidence and syllabus history do not reset.
Micro: short frequent formative diagnostic; primarily recent taught frontier plus governed repair/retention; personal feedback, NOT an official competitive rank.
Macro: phase integration and retention diagnostic, broader than Micro, NOT a Major.
Major: protected, earned, cumulative-syllabus formal benchmark in Test Arena; comparative ranking only when statistical evidence permits.
Full Test: complete verified applicable official stage/paper simulation, not shortened. Full Test and Major remain distinct student-facing surfaces.
Test Arena: formal assessment and governed competition, not merely a test player. Rank is a separate qualified output, not an automatic property of every attempt.

## 3. Founder-approved direction vs unresolved parameterization
Approved design direction: no Day-1 Major; genuine Crucible learning plus valid Micro/Macro evidence required; Major driven by earned syllabus milestone, NOT a fixed Crucible day or serial Major number; subsequent milestones cumulatively include earlier eligible knowledge; 98-day cycle reset never resets milestone history; Full Test reproduces official paper structure; national/state comparisons are desired and must be statistically defensible.
Not approved: exact minimum days, count/ratio of Micros and Macros, eligibility point weights, syllabus milestone threshold sizes, paper fractions, event frequency, cohort window size, form count, minimum calibration sample, exact Full Test access thresholds. Store as PENDING_POLICY_DECISION; never guess runtime defaults.

## 4. Two independent clocks and three independent identities
CrucibleClock = (StudentID, MissionID, CycleIndex, PhaseIndex, RelativeDay).
AcademicProgress = (StudentID, MissionID, StageID, ComponentID, EffectiveSyllabusVersion, TaughtBoundaryFingerprint, accumulated valid evidence).
MajorBenchmark = (MissionID, StageID, ComponentSet/Track, MilestoneDefinitionID/version, cumulative canonical coverage boundary, assessment policy/version).
Major is NEVER named or keyed by cycle index or by a permanent user-facing Major-1/2/3/4 sequence. Internal events have opaque immutable IDs and optional chronological display dates. Cycle-2 Day-1 cannot trigger a reset/repeat of prior milestone automatically.

## 5. Academic milestone compiler
MilestoneDefinition specifies a canonical common assessable knowledge frontier, not a student's arbitrary personalized subset: verified applicable atoms/objectives, paper/component weights, prerequisites, taught eligibility policy, representation/cognitive depth, minimum breadth, cumulative coverage floor, newly-added coverage floor, previous-milestone retention floor, minimum effective evidence, question-bank feasibility, version/fingerprint.
Coverage is computed over weighted canonical eligible objectives, not raw chapter counts, app scrolls, question volume or elapsed time. Subject/paper coverage floors prevent concentrating only on easy subjects. Milestones must be attainable in realistic learning time and educationally meaningful; sparse missions may have fewer, broader milestones.
Student may become READY at different times, but attempts for one ranked benchmark must use the SAME common milestone definition and comparable paper blueprint. Personalized weakness questions may be delivered in unranked practice or separately scored diagnostic supplements; they must not secretly alter ranked form difficulty or content weighting.
Each next milestone's eligible universe includes all still-effective earlier applicable milestone knowledge plus newly earned scope. Cumulative universe does NOT mean every atom appears in each finite test. Assembly applies representative stratified sampling with minimum retention, new coverage and integration constraints; if the bank cannot represent the blueprint, BLOCK rather than overrepeat.
If official syllabus changes, produce a new benchmark lineage or independently proven equivalent mapping; do not merge incompatible versions.

## 6. Earned Major access: conjunctive proof, not points shortcut
MajorAccessDecision = ALL of:
A. valid active Crucible participation and server-authoritative minimum elapsed genuine tenure (policy-defined);
B. minimum completed valid Micro evidence, including sufficient distinct knowledge coverage and attempt quality;
C. minimum completed valid Macro integration evidence, including relevant component representation;
D. required Rebuild/repair follow-through where assigned; no artificial requirement to fail first;
E. applicable Taught Manifest-derived knowledge closure and canonical milestone coverage;
F. eligibility evidence/consistency score above versioned threshold, if enabled;
G. no unresolved integrity, stale authority, or question-bank security blockers.
All thresholds are per approved policy; none are silently hard-coded. The eligibility score measures verified sustained engagement, NOT raw marks, innate aptitude, purchasing, time idle, easy-item farming or a requirement to achieve high scores. Low-scoring but diligent learners can qualify; targeted remediation is offered without humiliation.
No question-generation count can substitute for learning or valid attempts: question creation and review are repository governance, not a student reward. A Micro/Macro must actually be validly attempted; the existence of generated questions alone grants no eligibility.
Eligibility is re-evaluated at reservation and start; immutable decision proof binds policy version, source events, exclusions, cutoff, server time, reason codes and fingerprint. Payment/subscription never overrides academic gates.
States: NOT_STARTED -> ACCUMULATING -> MILESTONE_CANDIDATE -> EVIDENCE_READY -> ACCESS_ELIGIBLE -> FORM_RESERVED -> IN_PROGRESS -> SUBMITTED -> VALIDATED; alternative states BLOCKED_COVERAGE, BLOCKED_EVIDENCE, BLOCKED_BANK, STALE, INTEGRITY_HOLD, EXPIRED. Re-evaluate after changes; never delete historical attempts. Idempotent reservation prevents duplicate ranked attempts.

## 7. Scheduling without arbitrary calendar Major numbering
Eligibility is asynchronous. Ranked administration uses versioned BenchmarkAdministrationWindow or a validated continuous calibrated administration model. Student receives a window after earning the SAME milestone. A late learner can enter a later comparable administration only if the benchmark/scale and security assumptions remain valid.
No automatic Major on Day 28, 56, 84, 98 or next-cycle Day 1. Windows must not collide unreasonably with Crucible Rebuild/Macro, and learner may defer within allowed limits without losing academic credit. If no comparable ranked window/form is ready, show READY_WAITING_FOR_VALID_BENCHMARK or offer clearly UNRANKED diagnostic practice, not fabricated rank.
Repeated attempts: at most one designated rank-eligible attempt per benchmark/administration under approved policy; retries for practice are separately labeled and excluded from rank unless a prepublished repeat-attempt rule proves fairness. Failed connection has server-timed resume, no second question exposure advantage, and explicit adjudication.

## 8. Major sizing, cognitive design and multi-paper identity
For each applicable StageID/ComponentID, derive count/marks/time from VERIFIED_EFFECTIVE official blueprint plus approved MajorSizingPolicy. Count-timed, mark-timed, mixed and special/subjective assessments require separate derivation modes. No universal 50% or 60% size, no hard-coded 50/75 items, no artificial rounding that breaks sections, and no silent padding.
Size must be large enough for blueprint coverage, reliability, precision and meaningful comparisons, yet proportionate to cumulative taught scope and cognitive load. Increase scale only when psychometric information, coverage breadth, age/learner burden and available fresh questions justify it; growth is NOT automatically linear with milestone ordinal.
Paper-I and Paper-II remain distinct test instances with independent time, marking, qualifying/merit roles and paper-specific percentiles where supported. A Major event may group both, but a paper without enough eligible taught knowledge is BLOCKED/DEFERRED, not filled with untaught content. Event completion rules distinguish PARTIAL_COMPONENT_COMPLETE from COMPLETE; do not invent an overall rank from missing/qualifying components. Optional papers resolve applicability before compilation.
Paper form security includes QuestionID/version, family overlap, stimulus reuse, language-equivalence, exposure, anchor protection, response-key integrity and validated item-type compatibility.

## 9. Full Test is not a shortened Major
Full Test = complete applicable official examination structure for the declared Stage/Component and BlueprintVersion: full item/task count, full marks, full duration, sections, compulsory/optional choices, marking/negative marking, official timing and applicable session structure. Two-paper official stage means two separately timed full papers under one event where official rules justify grouping; separate-day exams must not be forced into one sitting. Prelims and Mains never become one artificial mega-paper.
If a verified official dimension is missing, block an unqualified official-pattern label. A shortened form MUST be named Major/Condensed Practice, never Full Test. Historical-paper reconstruction has its own provenance labeling.
FullTestAccessDecision requires versioned evidence of mature Crucible participation, applicable scope readiness, valid Macro/Major evidence and integrity; 98 days alone NEVER grants it, and completing 100% syllabus before Day 98 alone NEVER grants it. The precise policy must distinguish (i) ability to sit a diagnostic full official paper despite incomplete teaching, if Founder separately authorizes an explicitly labelled open simulation, from (ii) protected FULL_TEST readiness certification. Under the current protected model, no bypass is authorized. Avoid hard performance-score gates that permanently exclude weaker learners; provide remediation and re-evaluation. Completion of one cycle does NOT prove 100% taught scope.

## 10. Psychometrics: critical non-equivalence warning
NTA session percentile is an empirical rank within an administered session; it is NOT automatically a form-equating algorithm and NOT a direct solution to self-selected asynchronous cohorts. NTA-style multi-shift normalization often relies on randomized/roughly comparable session allocations and large samples. RankCrackers' early/late milestone earners are systematically different populations (selection, maturation, coaching, practice, exposure); simply merging within-form percentiles may produce unfair results.
Reviewer difficulty tags EASY/MEDIUM/HARD/VERY_HARD are ordinal estimates, not calibrated interval-scale difficulty. Equal tag counts do NOT establish equivalent forms. Never claim NTA, JEE or NEET official rank, percentile or identical official normalization; all RankCrackers results are independent platform estimates.

## 11. Measurement and calibration pipeline
Stage 0 — CONTENT_VALIDATED: expert review, closure, blueprint mapping, accessibility, linguistic parity, cognitive demands, estimated difficulty and expected time. May issue raw score + descriptive diagnostic ONLY; NO cross-form competitive rank.
Stage 1 — SINGLE_FORM_COHORT: one common secured form and sufficient eligible cohort; can publish within-form observed percentile/rank with explicit cohort size, dates, nonrepresentativeness and uncertainty. Not comparable to different forms/periods.
Stage 2 — LINKED_FORMS_PROVISIONAL: equivalent blueprints plus approved randomized/common-population or secure anchor design, sample adequacy, stable scoring, linking assumptions and independent review; publish provisional linked score with uncertainty and limited comparison claims. No false precision.
Stage 3 — EQUATED_FORMS_VALIDATED: empirical item calibration, model fit, linking diagnostics, differential item functioning checks, form information/reliability, scale drift and cohort stability demonstrated. Cross-form calibrated score and benchmark-referenced percentile/rank MAY be published with versioned method and uncertainty.
Stage 4 — CONTINUOUS_MONITORING: repeated drift/anchor leakage, population shifts, retakes, item parameter drift and fairness monitoring; suspend or recalibrate on breach.
No stage promotion from test-count alone. A qualified psychometric review and signed evidence package is required. No universal sample-size magic number; minimum effective N and precision criteria are set before observing results, by method and cohort.

## 12. Multiple secure forms and equating
FormDefinition = (BenchmarkID/version, Stage/Component, FormID/version, question versions, item order policy, response type, blueprint fingerprint, estimated and empirical parameters, security classification).
A/B/C... or six/seven forms are possible, not mandated. Every form must match content weights, cognitive demand, timing burden, language and response types. Calibrated item discrimination, empirical difficulty, guessing where model-appropriate, item/test information, reliability, distractor functioning and response-time anomalies are recorded separately from expert estimates.
Choose and document one defensible linking design: randomized equivalent groups; common-person with practice/order-effect control; common-item nonequivalent groups with secure representative anchors; or validated IRT linking. Anchor identity/position, representativeness, differential functioning, drift and exposure are monitored. Do not reuse compromised anchors endlessly. Pretest/calibration items must not silently distort official-scored form.
Model selection (classical equating, equipercentile, Rasch/2PL/3PL or alternative) is evidence-dependent; IRT is NOT automatically superior with sparse/noisy samples. If assumptions fail, downgrade to unranked or within-form results. Item parameters are context/version-bound and never imported from unrelated missions without validation.
Question family and solution exposure controls apply across Micro/Macro/Major/Full. Personalized item selection is prohibited for a shared ranked scale unless adaptive testing is independently calibrated and equated under a separate approved CAT policy.

## 13. Percentile, score, rank: distinct quantities
RawScore: official-style marks under bound scoring rule; may be negative.
Percentage: raw earned marks relative to defined maximum, not percentile.
WithinFormPercentile: 100 * (# valid cohort scores <= candidate score) / N under a published tie convention; descriptive of that form/cohort only.
EquatedScore: validated transformed score on benchmark scale, with error/uncertainty and method version.
BenchmarkPercentile: candidate's calibrated score position relative to a FIXED declared reference population and reference period; not a universal timeless ability value. If cohort is dynamic, label LIVE_COHORT_PERCENTILE and timestamp/snapshot; it can change.
Rank: ordinal placement among unique eligible persons in a declared cohort, not a deterministic function of percentile alone. Tie handling, precision, exclusions, identity, attempts and cutoff must be published. Percentile cannot uniquely reconstruct exact rank. Do not imply 94th percentile equals 94% correct.
National pool is meaningful for all-India comparable mission cohort; State pool filters verified appropriate jurisdiction within the SAME benchmark scale and eligibility rules. State percentile/rank can differ due to population, not due to separate question scoring. Central exams may show national primary; state recruitments state primary. Show denominators, timestamp, methodology/status and minimum cohort privacy thresholds.
Official recruitment merit rules control any permitted multi-paper aggregate: qualifying papers cannot be naively added to merit; missing papers prohibit composite rank; no cross-stage arithmetic. No simulated rank equals an official authority rank.

## 14. Fairness, access, and student psychology
Student-facing order: first actionable learning feedback and strengths; then calibrated competitive context only if qualified. Do not shame low ranks, falsely predict selection, use anxiety countdowns, or imply intelligence is fixed. Explain progress toward Major with specific verified evidence and next attainable action; no opaque points-only lock. Failure to unlock is a guidance state, not punishment.
Provide choice to hide public leaderboard identity, privacy-safe alias, rank visibility controls, age-appropriate protection and accessibility (screen reader, font, contrast, permitted accommodations). Where an accommodation changes timing/construct comparability, document a fairness-approved comparable scoring policy or separate labelled cohort; never automatically disqualify disabled students. Language/translation equivalence and differential functioning are tested before pooling. Protect underrepresented state/language cohorts from misleading small-N ranks.
Learning science: retrieval practice, spaced retention, interleaving, prerequisite repair, transfer/integration, formative feedback, cognitive load, desirable challenge and test anxiety are design considerations; none are asserted to be universally effective for every learner. Test difficulty mix and duration should measure intended competencies rather than reading speed or fatigue unrelated to official construct.
Post-Major feedback routes to exact knowledge dependencies/DigiBook repair without granting TAUGHT. Allow meaningful review after security embargo; show uncertainty where inference is weak. No monetized access override, no addictive rank-chasing loops, no arbitrary penalty for illness or schedule interruptions; policy permits justified deferment while preserving fairness.

## 15. Security, integrity, and governance
Server-authoritative clock; signed blueprint/policy fingerprints; deterministic reservation; one rank-eligible attempt policy; item/family exposure controls; answer leakage embargo; bot/collusion/proctoring signals with proportional privacy safeguards; appeal/adjudication workflow; documented exclusions; no arbitrary secret rank changes.
Never silently overwrite responses, rank snapshots, score transforms or cohort membership. Regrade creates immutable new ScoreRevision and RankSnapshotVersion with reason; old public result superseded with visible explanation. Handle deleted accounts, consent/privacy and regional data minimization.
Benchmark comparability breaks on blueprint/syllabus change, material item defect, scoring change, significant population shift, anchor compromise or failed model-fit/fairness check. Block publication or show explicitly NOT_COMPARABLE. Rankings are withheld on statistical insufficiency rather than inventing precision.

## 16. Minimal logical entities (not mandated microservices)
MilestoneDefinition; StudentAcademicProgressSnapshot; MajorEligibilityPolicy; MajorAccessDecision; MajorBenchmarkDefinition; BenchmarkAdministrationWindow; PaperComponentDefinition; FormDefinition; ItemCalibrationEvidence; EquatingStudy; EquatingModelVersion; CohortDefinition; RankEligibilityDecision; Attempt/Response; ScoreRevision; PercentileSnapshot; RankSnapshot; FairnessReview; SecurityIncident; AppealDecision.
All identities bind MissionID, StageID, ComponentID, track, ExamBlueprintVersion, SyllabusVersion, question versions, and policy/model fingerprints where applicable. Persist immutable evidence only where independent lifecycle requires; logical detail does not mean one database row per atom.

## 17. Deterministic end-to-end pipeline
Verified exam/syllabus -> Taught Manifest -> eligible canonical knowledge -> valid Micro/Macro/Rebuild evidence -> StudentProgressSnapshot -> MilestoneDefinition match -> AccessDecision -> approved administration + form readiness -> Form reservation -> scored Attempt -> integrity check -> raw score -> calibration/equating qualification -> published result level (diagnostic / within-form / provisional / equated) -> benchmark/state/national cohort projection -> percentile/rank with provenance -> repair feedback.
Fail closed at EVERY boundary; never downgrade silently from ranked to a different test or upgrade unranked scores into ranked claims without new signed evidence.

## 18. Failure codes
MILESTONE_NOT_EARNED; INSUFFICIENT_TENURE; MICRO_EVIDENCE_INSUFFICIENT; MACRO_EVIDENCE_INSUFFICIENT; REBUILD_EVIDENCE_REQUIRED; TAUGHT_BOUNDARY_STALE; COVERAGE_UNREPRESENTATIVE; INSUFFICIENT_FRESH_ITEMS; FORM_BLUEPRINT_MISMATCH; ANCHOR_COMPROMISED; CALIBRATION_SAMPLE_INSUFFICIENT; EQUATING_ASSUMPTIONS_FAILED; MODEL_FIT_FAILED; DIF_REVIEW_FAILED; COHORT_NONCOMPARABLE; RANK_SAMPLE_TOO_SMALL; SCORE_REVISION_PENDING; PAPER_APPLICABILITY_AMBIGUOUS; FULL_TEST_BLUEPRINT_INCOMPLETE; ACCESS_POLICY_UNAPPROVED; BENCHMARK_VERSION_STALE; ATTEMPT_DUPLICATE; SECURITY_HOLD.

## 19. Mandatory acceptance fixture matrix
F01 Day-1 high performer cannot bypass Major gates.
F02 98-day cycle wrap preserves academic milestone history; no Major numbering reset.
F03 student earns milestone on different day yet same canonical benchmark definition.
F04 two students with different personal taught scopes cannot receive misleading same ranked benchmark unless both meet common full milestone boundary.
F05 subsequent milestone samples older and newer eligible atoms, never newly untaught dependencies.
F06 missed Micro tolerated only according to policy; replay/farming earns no extra evidence.
F07 valid low-scoring diligent student can earn Major; high-scoring unprepared student cannot.
F08 insufficient item bank blocks ranked Major; no duplicate padding.
F09 Paper-I and Paper-II independent attempts/scoring; qualifying paper excluded from fake merit aggregate.
F10 official two-paper Full Test preserves full count/time/marks and sessions; shortened label prohibited.
F11 Cycle-1 complete with 70% taught coverage does not auto-unlock Full Test.
F12 full taught coverage before maturity gates does not auto-unlock protected Full Test.
F13 six expert-balanced forms without empirical linkage produce NO cross-form rank.
F14 randomized/anchor linkage with violated assumptions blocks equated rank.
F15 nonrandom early vs late student populations cannot be merged using raw within-form percentiles as though equivalent.
F16 identical raw marks on different forms need not imply identical calibrated performance.
F17 rank tie handling, one-person/one-ranked-attempt, duplicate accounts and small cohorts.
F18 State and National cohorts share scale but have distinct denominators; region verification and privacy respected.
F19 blueprint corrigendum invalidates future benchmark and preserves historical attempt binding.
F20 item defect triggers immutable regrade and rank revision with user-facing explanation.
F21 language DIF and accommodation comparability checks; no discriminatory default exclusion.
F22 anchor leakage/retake exposure triggers security review and ranking hold.
F23 rank unavailable -> honest diagnostic result and next learning action, not fake percentile.
F24 Full Test under unresolved official exam duration/count cannot be labelled official simulation.
F25 assessment success never grants Taught Authority.
F26 student can hide leaderboard identity; minimum cohort privacy.
F27 validated calibrated benchmark percentile distinguished from dynamic cohort percentile.
F28 attempts across different milestone/blueprint versions cannot share a leaderboard without documented linking evidence.
F29 stress/feedback UX avoids selection prediction and shame language.
F30 partial multi-paper event does not create fake overall rank.

## 20. Implementation gates and acceptance evidence
Gate A: Founder-approved numeric Major/Full eligibility and sizing policy per mission/paper; educational load review.
Gate B: immutable schema, question closure, Taught Authority, form security and assessment compiler fixtures.
Gate C: validated item review, bank depth, form blueprint equivalence and empirical pilot.
Gate D: independent psychometric equating/fairness review with prespecified precision, sample and drift thresholds.
Gate E: ranking privacy, cohort, appeal, regrade, security and live UX validation.
Gate F: independent Codex implementation/tests, Founder Web review, non-regression proof and explicit deployment approval.
No ranking claim before Gate D. No code changes/deployment implied by this document.

## 21. Integration conflict register for later audit
LEGACY: Crucible engine 100-Day/Day99-100 Major logic conflicts with 98-day rotation and Test Arena ownership.
LEGACY: fixed 25/50/100 question counts and JEE-2027 defaults in Micro/Macro/mission blueprint need blueprint-derived reconciliation.
LEGACY: Test Arena major assembly currently lacks protected eligibility, milestone, calibrated form/equating, and multi-paper event orchestration; unsafe section count defaults must be reviewed.
LEGACY: test_submit_engine contains print-only placeholder; not accepted as production submission.
All are DOCUMENTED CONFLICTS, not silently repaired. No Student Android, Founder UI, runtime or deployment mutation authorized here.

## 22. Remaining decisions before coding
D1 Minimum genuine tenure, minimum distinct valid Micros/Macros, Rebuild evidence and fairness exception policy.
D2 Canonical weighted syllabus milestone construction per mission/paper and required NEW/retention breadth.
D3 Major paper size/duration derivation and bank-depth/exposure reserves per stage/component.
D4 Ranked administration window vs validated continuous administration; retake, missed-window and form-assignment rules.
D5 Empirical sample/precision thresholds, calibration method, reference population and ranking visibility policy.
D6 Full Test protected access thresholds and treatment of optional open diagnostic simulation.
These are parameter decisions, NOT permission to replace the architecture with arbitrary constants.

## 23. Source and evidence notes
- NTA, official normalization procedure (2019): https://www.nta.ac.in/Download/Notice/20190429155134.pdf — documents within-session percentile and randomized multi-shift conditions; NOT proof asynchronous self-selection is comparable.
- NTA, Test Administration: https://nta.ac.in/TestAdministration — multiple comparable forms, indexed item bank and accommodations.
- AERA/APA/NCME, Standards for Educational and Psychological Testing (2014), Chapter 5: https://www.testingstandards.net/uploads/7/6/6/4/76643089/9780935302356.pdf — equating designs, linking assumptions and anchor-item evidence.
- NTA, Development of Tests: https://nta.ac.in/DevelopmentofTests — expert review, item quality and post-administration analysis.
These inform best-practice design; RankCrackers has NOT conducted its own psychometric validation.

**DOCUMENTED != IMPLEMENTED. FOUNDER-DIRECTION CONSOLIDATED != NUMERIC POLICIES APPROVED. RANKING DESIRED != RANKING STATISTICALLY PROVEN.**
