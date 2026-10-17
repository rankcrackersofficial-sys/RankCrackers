# RankCrackers Crucible — Endless Circle & Assessment Contract

**Status:** SUPERSEDED / HISTORICAL CONTRACT  
**Contract ID:** `RC-CRUCIBLE-ENDLESS-CIRCLE-V1`  
**Effective date:** 17 October 2026  
**Scope:** All missions unless a later, versioned mission blueprint explicitly overrides a parameter.

This document is retained for audit history only. It is superseded by [`CRUCIBLE_ENDLESS_CIRCLE_ASSESSMENT_CONTRACT_V2.md`](CRUCIBLE_ENDLESS_CIRCLE_ASSESSMENT_CONTRACT_V2.md), which is the active authority for runtime, Founder configuration and student UI.

## 1. Non-negotiable operating principle

The Crucible is a **global, continuously running mission clock**. A student's join time never pauses, shifts or restarts the mission. The student receives the portion of the currently active global schedule that is allowed by the joining rule below, while assessment dates remain global.

The student has a personal ledger only for eligibility, participation, mastery and completion evidence. The student does not receive a private replacement calendar.

## 2. Authoritative clock

- Timezone: `Asia/Kolkata` for display and boundary decisions.
- Storage: server-authoritative timestamp, persisted in UTC.
- Daily cutover: exactly **10:00:00 IST**.
- A global day is a half-open interval `[10:00, next 10:00)`.
- A normal schedule is 48 hours: two global days.
- Day 1 of a schedule: first 24 hours.
- Day 2 of a schedule: next 24 hours.
- A boundary timestamp belongs to the new interval, never the old one.

For a schedule starting at `S`:

```text
[S, S + 24h)       = Schedule Day 1
[S + 24h, S + 48h) = Schedule Day 2
[S + 48h, ...)      = next Schedule Day 1
```

Each normal schedule contains:

```text
47 hours learning, DigiBook and spaced retrieval
1 hour Micro Test window
```

## 3. Joining and Buffer-Day contract

The exact `joinedAt` server timestamp is recorded. The global clock is not moved for the student.

### 3.1 Join during active Schedule Day 1

The student enters the current schedule as **Current Schedule — Day 1**.

### 3.2 Join during active Schedule Day 2

The student immediately receives the **next schedule's Day 1 timetable as Buffer-Day access**. Buffer Day is not an empty waiting state. It may expose the next schedule's syllabus map, timetable, linked DigiBook lessons and preparation path.

The next schedule becomes officially active at the next global 10:00 cutover. Buffer access does not create a private schedule, move a test window or count an assessment early.

### 3.3 Boundary rule

At the exact Day 2 end (`S + 48h`, 10:00:00 IST), the next schedule is officially **Day 1 Active**.

## 4. 98-day Endless Circle

The mission ring is:

```text
7 phases × 14 days = 98 days
```

Every 14-day phase contains:

| Global days | Function |
|---|---|
| Days 1–12 | Six 48-hour schedules; each has 47h learning + 1h Micro Test |
| Day 13 | 46-hour Rebuild & Revision Window |
| Day 14 | 2-hour Macro/Test Arena junction |

At Day 98 the ring closes and immediately returns to Day 1. There is no terminal end state, syllabus reset, or student-specific pause.

## 5. Assessment lanes

### 5.1 Micro Test

- One window after every two-day schedule.
- 42 global Micro windows per 98-day circle.
- Default SSC mission size: 20 verified questions.
- Purpose: atomic retrieval, immediate misconception detection and next-step calibration.
- New students remain Micro-led. Qualified students may be promoted to a higher assessment lane at a selected junction, but Micro generation and weak-area Micro calibration do not disappear globally.

### 5.2 Macro Test

- Every 14-day junction remains a Macro junction unless promoted to Major or Full.
- Seven Macro junctions exist per 98-day circle.
- Default size: 50 verified questions.
- Standard Macro: latest six schedules.
- Cumulative Macro: latest six schedules plus the preceding six schedules, with the older block at lower weight.
- Macro content never becomes unavailable merely because a student is eligible for Major or Full; the student's active lane may be promoted while the global Macro record remains in the mission history.

### 5.3 Major Test

- The first Major becomes eligible after six verified Macro completions or an equivalent, server-approved qualifying participation record.
- It opens at the next selected global Macro junction; it does not open on a personal date.
- Default size: 100 verified questions, with a longer readiness window than Macro.
- The recent six schedules receive the highest weight; the preceding six schedules receive lower weight; older content remains cumulative diagnostic coverage.

### 5.4 Full Test

- The first Full becomes eligible after seven verified Macro completions and the student's Major-readiness gate.
- It opens at the next global Full junction, not 60 personal days later.
- Default size: 100 verified questions in the mission's complete exam-simulation format.
- It covers the whole official syllabus and its verified derived atomic map. Recent content receives additional weight but never replaces whole-syllabus coverage.
- Default Full weighting:

```text
Latest four schedules       40%
Preceding twelve schedules  30%
Whole accumulated syllabus 30%
```

The weight is a sampling policy, not permission to omit any official subject or verified syllabus branch.

## 6. Frozen global promotion sequence

Macro junctions continue every 14 days. The following selected junctions are promoted:

| Global day | Primary lane |
|---:|---|
| 98 | Major 1 |
| 126 | Major 2 |
| 154 | Full 1 |
| 182 | Major 3 |
| 210 | Full 2 |
| 238 | Major 4 |
| 266 | Full 3 |
| 294 | Major 5 |
| 322 | Full 4 |
| 350 | Major 6 |
| 378 | Full 5 |
| 392 | Macro / circle milestone |

All other 14-day junctions remain Macro junctions. Days such as 105 or 152 are not valid assessment dates because they are not aligned to the 14-day global clock.

This sequence prevents the earlier failure mode in which Macro disappeared or Major and Full were placed on arbitrary non-junction days.

## 7. Late-joiner eligibility

A late joiner inherits the active global day and future global assessment calendar. The student does not restart the 98-day ring.

Example: a student joining around global Day 29 may encounter Macro windows at Days 42, 56, 70, 84, 98, 112 and 126. After the required six/seven verified Macro milestones, the student can unlock the next applicable global Major or Full junction. If a gate is not met before a junction, that student waits for the next global eligible junction; the mission itself does not move.

Opening the app or leaving it idle is not qualifying study time. Qualifying participation must come from server-recorded learning, lesson, revision or assessment evidence.

## 8. Rebuild and revision

Each phase provides 46 continuous hours for:

- weak atomic-topic repair;
- DigiBook re-reading;
- failed-question review;
- syllabus navigation;
- subject-balanced revision;
- personalized recovery without changing the global clock.

Revision also occurs inside every 47-hour learning window through spaced-retrieval lanes. Day 13 is therefore a dedicated repair window, not the only revision opportunity.

## 9. Test integrity gates

No test is student-visible merely because its calendar slot exists. A test requires:

1. source-bound syllabus coverage;
2. verified question generation;
3. independent answer-key verification;
4. required question count and section balance;
5. release authorization;
6. server-side eligibility evaluation.

If a gate is incomplete, the correct state is `pending_verification` or `not_ready`, never fabricated questions or a false score.

## 10. Exam-date mode

When the official mission exam date is published, Test Arena may add a separately versioned exam-date plan. It may increase Full and Major frequency, but it must preserve the global Crucible clock, source-bound content, student eligibility gates, verified-question release rules and whole-syllabus coverage. Exam-date mode is an overlay, not a silent rewrite of this contract.

## 11. Permanent audit invariants

Every implementation audit must be able to prove:

- global 10:00 IST boundaries are deterministic;
- 98 days = 7 × 14 phases;
- 42 Micro windows per circle;
- 7 Macro junctions per circle before promotion;
- Day 13 has 46h rebuild and Day 14 has 2h assessment window;
- Major and Full dates are valid 14-day junctions;
- late joiners never shift the global clock;
- Micro remains generated for the mission even when a qualified student is promoted;
- Full contains whole-syllabus coverage with recent-block weighting;
- no assessment is released without verified questions.

## 12. Authority and supersession

This contract supersedes informal schedules, arbitrary 10 PM cutoffs, personal test calendars, non-junction Major/Full dates, and any UI copy that implies Macro or Micro has disappeared. The existing 98-day protocol specification remains the mathematical base; this document is the final assessment, joining and Endless Circle addendum.
