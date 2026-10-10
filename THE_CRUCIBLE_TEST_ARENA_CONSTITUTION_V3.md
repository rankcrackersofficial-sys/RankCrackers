# RANKCRACKERS — THE CRUCIBLE × TEST ARENA
## CONSTITUTION V3 (AMENDMENT 01 — MISSION-ADAPTIVE ARCHITECTURE)
### RC_CRUCIBLE_MISSION_ADAPTIVE_ARCHITECTURE_AMENDMENT_01

---

### PREAMBLE & FOUNDER AUTHORIZATION
This document establishes the definitive constitutional architecture for **The Crucible** (Personalized Continuous Training) and **Test Arena** (Standardized Competition & Ranking) across all RankCrackers missions.

### CORE ARCHITECTURAL PRINCIPLE:
$$\text{UNIVERSAL CRUCIBLE CONSTITUTION} + \text{MISSION EXAM CONTRACT} + \text{MISSION CRUCIBLE BLUEPRINT} = \text{LIVE MISSION CRUCIBLE}$$

**SAME LEARNING ENGINE. DIFFERENT MISSION CONFIGURATIONS.**

---

### FIVE-LAYER AUTHORITY HIERARCHY

```
┌────────────────────────────────────────────────────────┐
│ I. UNIVERSAL CRUCIBLE PSYCHOLOGY CONSTITUTION          │
│ (Universal learning laws, spacing, retrieval, ledger) │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ II. MISSION EXAM CONTRACT                              │
│ (Official papers, duration, marks, question types)     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ III. MISSION CRUCIBLE BLUEPRINT                        │
│ (Cycle length, phases, schedule cadence, bank laws)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ IV. TEST ARENA EVENT BLUEPRINT                         │
│ (Standardized benchmarks, event lifecycle, ranking)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ V. MISSION IMPLEMENTATION                              │
│ (Live runtime execution, verified question banks)      │
└────────────────────────────────────────────────────────┘
```

---

### SECTION I: UNIVERSAL CRUCIBLE CONSTITUTION (MISSION-AGNOSTIC)

The following concepts are universal across ALL RankCrackers missions:
1. **Founder/Governed Launch Authority**: One global mission clock per mission.
2. **Continuous Rotation**: Never-stopping mission ring with multi-orbit progression (Orbit 1, Orbit 2...).
3. **Late-Join Law**: Students may join at any cycle position without restarting or pausing the global clock (`PARTIAL_ENTRY_PUNISHMENT = 0`).
4. **Student Completion Ledger**: Sovereign individual progress tracking independent of the rotating clock (`GLOBAL_CLOCK_PAUSES_FOR_STUDENT = false`, `MISSED_SCOPE_SILENTLY_DROPPED = 0`).
5. **Never-Wait Progression**: Auto-advancing schedule boundaries with backlog preservation.
6. **Smart Entry Framework**: Domain-agnostic, two-stage calibration diagnostic with provisional `Novice` / `Middle` / `Pro` output.
7. **Personalization Law**:
   * Global mission cycle determines **WHAT** academic scope is live.
   * Personal learner state determines **HOW** that scope is practiced and tested.
8. **Difficulty Bands & Envelopes**: `Foundation`, `Standard`, `High` (strictly within official syllabus).
9. **Formative Assessment Separation**: Crucible Micro and Macro tests are formative training instruments and **NEVER generate public All India Ranks (AIR)**.
10. **Major Belongs Exclusively to Test Arena**: Standardized, non-personalized competitive benchmarking is owned by Test Arena.
11. **Feedback Loop**: Test Arena diagnostic dimensions flow back into Crucible training recommendations without mutating immutable Test Arena results.
12. **Learning Load Protection**: Behavioral overload detection (time utilization, skip rates, error streaks) triggers adaptive scaffolding without pausing the global ring or reducing canonical syllabus scope.

---

### SECTION II: WHAT IS NOT UNIVERSAL (MISSION-SPECIFIC PARAMETERS)

The following parameters belong strictly to specific **Mission Blueprints** and **Exam Contracts** and must NEVER be hardcoded into generic core:

| Parameter | JEE Main 2027 Profile | Generic Core Behavior |
| :--- | :--- | :--- |
| **Cycle Length** | 98 Days | Configured via `MissionCrucibleBlueprint.cycleLengthDays` |
| **Phase Count** | 7 Phases | Configured via `MissionCrucibleBlueprint.phaseCount` |
| **Schedules per Phase** | 6 Schedules (42 Total) | Configured via `MissionCrucibleBlueprint.schedulesPerPhase` |
| **Schedule Duration** | 48 Hours (47h Learn + 1h Micro) | Configured via `hoursPerSchedule`, `learningHoursPerSchedule` |
| **Micro Student Attempt** | 25 Questions / 60 Minutes | Configured via `MicroPolicy.attemptQuestionCount`, `attemptDurationMinutes` |
| **Micro Verified Bank** | Minimum 50 Questions / Schedule | Configured via `MicroPolicy.minimumVerifiedBankDepth` |
| **Macro Student Attempt** | 50 Questions / 120 Minutes | Configured via `MacroPolicy.attemptQuestionCount`, `attemptDurationMinutes` |
| **Macro Verified Bank** | Minimum 100 Questions / Phase | Configured via `MacroPolicy.minimumVerifiedPhaseBankDepth` |
| **Smart Entry Domains** | Physics, Chemistry, Mathematics | Configured via `SmartEntryBlueprint.domainIds` |
| **Major Paper Pattern** | 75 Questions / 180 Minutes / 300 Marks | Configured via `MissionExamContract.papers` |

---

### SECTION III: JEE MAIN 2027 MISSION PROFILE

* **Recruitment ID**: `jee_main_2027` (Database realm baseline: `jee_main_2026`)
* **Exam Authority**: Provisional latest official baseline (JEE Main 2026 Paper 1).
* **Crucible Training Topology**:
  * 98-Day Continuous Rotating Orbit
  * 7 Phases × 14 Days = 98 Days
  * 6 Schedules × 48 Hours per Phase = 42 Schedules Total
  * Days 1–12 of Phase: 6 × 48h Schedules (47h Learning + 1h Micro)
  * Day 13 10:00 to Day 14 09:00: Rebuild Window (23h)
  * Day 14 09:00 to Day 14 11:00: Macro Test Window (2h)
  * Day 14 11:00 to Next Phase Day 1 10:00: Recovery Window (23h)
* **Micro Test**: 25 Questions / 60 Minutes (Selected from $\ge 50$ verified bank).
* **Macro Test**: 50 Questions / 120 Minutes (Selected from $\ge 100$ verified phase bank).
* **Smart Entry**: 15 calibration items (5 Physics, 5 Chemistry, 5 Maths) + up to 10 adaptive items.

---

### SECTION IV: TEST ARENA & COMPETITIVE RANKING ARCHITECTURE

1. **Role**: Test Arena is the sole standardized competitive assessment layer.
2. **Mission Major**: Full-syllabus, standardized benchmark derived from `MissionExamContract`.
3. **Ranking Laws**:
   * Live event participants receive verified `EVENT_RANK`, `PARTICIPANT_COUNT`, and `PERCENTILE`.
   * Late historical attempts receive `HISTORICAL_BENCHMARK_PERCENTILE` (No fake live AIR).
   * Unequated multi-form test papers cannot share AIR (`UNEQUATED_MULTI_FORM_AIR = 0`).
4. **Formative Feedback**: Test Arena performance feeds back into Crucible training recommendations without mutating Test Arena rank ledgers.

---

### SECTION V: OTHER MISSIONS (NEET, RPSC, UPSC, ETC.)

* **Unconfigured Mission Policy**:
  * Any mission without a Founder-ratified `MissionCrucibleBlueprint` returns `CRUCIBLE_BLUEPRINT_NOT_CONFIGURED`.
  * **STRICTLY FORBIDDEN**: No silent fallback to JEE Main parameters (`JEE_PROFILE_FALLBACK_TO_OTHER_MISSIONS = 0`, `SILENT_DEFAULT_EXAM_CONTRACT = 0`).

---

### SECTION VI: GOVERNANCE & INTEGRITY COUNTERS

* `HARDCODED_JEE_ASSUMPTIONS_IN_GENERIC_CORE = 0`
* `JEE_PROFILE_FALLBACK_TO_OTHER_MISSIONS = 0`
* `SILENT_DEFAULT_EXAM_CONTRACT = 0`
* `FAKE_ACADEMIC_CONTENT = 0`
* `MODEL_ONLY_CANONICAL_PROMOTIONS = 0`
* `LIVE_AI_DIRECT_TO_STUDENT = 0`
* `CLIENT_WRITABLE_GLOBAL_CLOCK = 0`
* `CLIENT_WRITABLE_SCORE_TRUTH = 0`
* `CLIENT_WRITABLE_PERSONALIZATION_TRUTH = 0`
* `CLIENT_WRITABLE_TEST_ARENA_RANK = 0`
* `FUTURE_ATOM_LEAKAGE = 0`
* `UNEQUATED_MULTI_FORM_AIR = 0`
* `CRUCIBLE_MAJOR_ACTIVE = false`
* `CRUCIBLE_TERMINAL_DAY_EXISTS = false`

---
*Ratified under Founder Authority: RC_CRUCIBLE_MISSION_ADAPTIVE_ARCHITECTURE_AMENDMENT_01*
