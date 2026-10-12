# DOMAIN-C — Crucible Temporal Contract R1

Status: Founder-locked temporal structure  
Scope: Crucible clock, schedules, Micro eligibility, Rebuild, Macro, orbit rollover  
Major: Test Arena only

## 1. Sovereign mission clock

One mission has one continuous global Crucible clock. Student enrollment never restarts, pauses, or shifts the mission ring. Each learner has a separate personal coverage/mastery ledger.

The canonical Crucible day boundary is 10:00 AM mission-local time.

## 2. 48-hour tactical schedule

Each study schedule is exactly 48 hours:

- Hour 0: schedule starts at 10:00 AM.
- Hours 0–47: Learning window.
- Hour 47: Micro starts at 09:00 AM two calendar dates after schedule start.
- Hours 47–48: Micro window, 60 minutes.
- Hour 48: Micro closes at 10:00 AM and the next schedule starts immediately.

No gap exists between schedules.

## 3. Fourteen-day phase

Each phase is exactly 336 hours:

| Window | Phase hours | Duration |
|---|---:|---:|
| Schedule 1 | 0–48 | 48h |
| Schedule 2 | 48–96 | 48h |
| Schedule 3 | 96–144 | 48h |
| Schedule 4 | 144–192 | 48h |
| Schedule 5 | 192–240 | 48h |
| Schedule 6 | 240–288 | 48h |
| Rebuild | 288–312 | 24h |
| Macro | 312–314 | 2h |
| Recovery/transition | 314–336 | 22h |

Therefore: 288 + 24 + 2 + 22 = 336 hours = 14 days.

For a phase beginning at 10:00 AM:
- Micro windows are 09:00–10:00 at hours 47, 95, 143, 191, 239 and 287.
- Rebuild is Day 13 10:00 AM through Day 14 10:00 AM.
- Macro is Day 14 10:00 AM–12:00 PM.
- Recovery is Day 14 12:00 PM through the next phase boundary at 10:00 AM.

## 4. Ninety-eight-day ring

Seven phases × 14 days = 98 days = 2,352 hours.
Six schedules × seven phases = 42 schedules and 42 Micro windows.
There are seven Rebuild windows and seven Macro windows.

Phase boundaries:
- Phase 1: Days 1–14; Macro Day 14.
- Phase 2: Days 15–28; Macro Day 28.
- Phase 3: Days 29–42; Macro Day 42.
- Phase 4: Days 43–56; Macro Day 56.
- Phase 5: Days 57–70; Macro Day 70.
- Phase 6: Days 71–84; Macro Day 84.
- Phase 7: Days 85–98; Macro Day 98.

The final Macro begins at the Day-98 boundary (orbit hour 2328) and ends two hours later. Recovery then runs for 22 hours. At orbit hour 2352 / the next 10:00 AM boundary, Orbit N+1 Day 1 begins. There is no terminal Day 99.

## 5. Late-entry and Micro eligibility

The global ring always remains fixed.

For any 48-hour schedule beginning at 10:00 AM:
- Join from 10:00 AM through 10:00 PM inclusive: current Micro = ELIGIBLE.
- Join after 10:00 PM: current Micro = NOT_ELIGIBLE_LATE_ENTRY.
- A skipped Micro due solely to late entry is not Fail, Zero, or Absent.
- The learner remains on the running global ring and is eligible from the next schedule's Micro under the normal rule.

This is a Founder-defined 12-hour schedule-entry cutoff. It must not be reinterpreted as an exact “24 hours before Micro” formula.

## 6. Authority separation

Global clock answers: what scope/window is live for the mission now?
Personal ledger answers: what this learner has actually covered, missed, rebuilt, or mastered?

Personalization may change HOW the live scope is trained; it must not create a private Crucible clock or change WHAT the mission ring says is live.

Micro and Macro are formative Crucible assessments and do not generate public AIR. Major is excluded from Crucible and belongs exclusively to Test Arena.

## 7. Arithmetic invariants

- learningHoursPerSchedule + microHoursPerSchedule = hoursPerSchedule = 48.
- schedulesPerPhase × hoursPerSchedule = 288.
- 288 + rebuildDurationHours + macroDurationHours + recoveryDurationHours = 336.
- phaseCount × 336 = cycleLengthDays × 24 = 2352.
- Orbit rollover occurs exactly at 2352 hours.
