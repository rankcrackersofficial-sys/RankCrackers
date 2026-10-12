# DOMAIN-C — Global Major / Full Test Earned Eligibility Rulebook R1

Status: FOUNDER LOCKED — DOCUMENTATION AUTHORITY; CODE IMPLEMENTATION PENDING
Locked: 2026-10-12
Scope: Crucible global clock + earned Test Arena Major/Full eligibility
Code mutation in this change: NO

## 1. Sovereign-clock law
There is ONE mission-global Crucible clock. Micro, Macro, Major and Full Test milestones are mission-global events, never personal schedules.

A learner joining late does not restart, pause, shift or regenerate any event. Event date/time and paper identity are common to every learner in that mission.

The only learner-specific state is an eligibility ledger recording which required governed assessment events the learner actually attempted.

NO_PERSONAL_TEST_SCHEDULE = true
NO_MANUAL_ELIGIBILITY_EXCEPTION = true
NO_HIGH_SCORE_SHORTCUT = true
NO_LATE_JOIN_CLOCK_RESET = true

## 2. Crucible base cadence
One orbit = 98 days = seven 14-day phases.

Each phase:
- 6 normal schedules × 48h = 288h.
- each schedule = 47h Learning + 1h Micro.
- after Micro-6 = 47h Rebuild + 1h Macro.
- phase = 336h = 14 days.
- no separate Recovery window.

One orbit therefore contains:
- 42 Micro events;
- 7 Macro events;
- 7 phase boundaries.

## 3. Global Major schedule
Major Tests are cumulative milestone assessments and belong operationally to Test Arena, but their global milestone is declared by the Crucible clock from Day 1.

R1 Major milestones:
- MAJOR-1: after Phase 2 / Day 28 boundary.
- MAJOR-2: after Phase 4 / Day 56 boundary.
- MAJOR-3: after Phase 6 / Day 84 boundary.

Major paper scope is cumulative verified + actually taught mission coverage through its milestone. Major is NOT automatically the official full-paper geometry.

## 4. Earned Major eligibility
A learner may sit a scheduled Major only when the learner has actually attempted the minimum prior global Crucible events.

MAJOR-1 gate:
- at least 10 Micro attempts from the 12 Micros available before Major-1; AND
- both prior Macros attempted: 2/2.

MAJOR-2 gate:
- at least 20 cumulative Micro attempts from the 24 Micros available before Major-2; AND
- at least 3 of the 4 prior Macros attempted; AND
- at least 1 prior Major attempted (Major-1).

MAJOR-3 gate:
- at least 30 cumulative Micro attempts from the 36 Micros available before Major-3; AND
- at least 5 of the 6 prior Macros attempted; AND
- both prior Majors attempted: 2/2.

Attempt means a governed submitted/auto-submitted eligible assessment attempt. Merely opening an assessment, app attendance, elapsed account age or idle tenure does not count.

Scores do not create a shortcut. These gates measure participation/exposure, not a pass mark.

## 5. Global Full Test schedule
FULL TEST is separate from Major.

The first Full Test milestone is declared at the end of the first 98-day orbit, after Phase 7 / Day 98. It is a Test Arena event linked to the mission's complete governed official exam/paper contract.

A Full Test may only be offered when the official full-paper contract and required verified question inventory are launchable. Learner eligibility cannot override paper/content/authority readiness.

## 6. Earned Full Test eligibility
For the Day-98 Full Test, a learner must have:
- at least 35 cumulative Micro attempts from the 42 orbit Micros; AND
- at least 6 of the 7 orbit Macros attempted; AND
- all three scheduled Majors attempted: 3/3.

All conditions are AND gates.

Therefore:
FULL_ELIGIBLE = MICRO_35_OF_42
             AND MACRO_6_OF_7
             AND MAJOR_3_OF_3
             AND FULL_PAPER_AUTHORITY_READY.

There is no score-based bypass and no manual exception.

## 7. Late joiners
Late joiners enter the running sovereign ring at its current global position.

Past events are never recreated personally. A late learner who cannot accumulate the required prior event counts before a scheduled Major/Full simply remains NOT_ELIGIBLE for that event.

The learner continues accumulating valid attempts on the same global clock and may earn a later globally scheduled event, including milestones in a subsequent 98-day orbit.

Missed historical events are not Fail, Zero or Absent unless a separate assessment-result rule explicitly says so. For eligibility they simply contribute zero to the required attempt count.

## 8. Orbit rollover
At Day 98 the mission clock rolls directly into Orbit N+1 Day 1. The global schedule repeats; learner eligibility history does not reset.

Eligibility ledger is cumulative across orbits, while each Test Arena event remains a distinct global event/version.

A learner who missed a Full Test gate in Orbit N may earn a later global Full Test in Orbit N+1 after satisfying the same deterministic rulebook.

## 9. No-exception law
The same rules apply to every learner:
- no Founder override;
- no VIP bypass;
- no paid-tier bypass;
- no rank/score shortcut;
- no personalized Major/Full date;
- no backdated synthetic attempt;
- no private replacement event to manufacture eligibility.

Any future change to thresholds must be a versioned mission-wide rulebook change, never an individual exception.

## 10. Authority separation
Crucible owns the sovereign progression clock and publishes the milestone/eligibility state.
Test Arena owns Major/Full paper delivery, attempt lifecycle, scoring, result and governed ranking.
DigiBook/taught-content authority controls what has actually been taught.
Canonical syllabus authority controls what may be assessed.
Question readiness remains fail-closed.

## 11. R1 deterministic milestone table

| Global milestone | Available prior evidence | Earned learner gate |
|---|---|---|
| Day 28 / Major-1 | 12 Micro + 2 Macro | >=10 Micro AND 2/2 Macro |
| Day 56 / Major-2 | 24 Micro + 4 Macro + Major-1 | >=20 Micro AND >=3 Macro AND Major-1 attempted |
| Day 84 / Major-3 | 36 Micro + 6 Macro + Major-1/2 | >=30 Micro AND >=5 Macro AND both prior Majors attempted |
| Day 98 / Full Test | 42 Micro + 7 Macro + 3 Major | >=35 Micro AND >=6 Macro AND all 3 Majors attempted + full-paper authority ready |

This document finalizes the R1 governance structure. Runtime/code implementation remains a separate bounded task.
