# DOMAIN-C — Crucible Temporal Contract R1

Status: Founder-corrected temporal structure  
Scope: global Crucible clock, schedules, Micro eligibility, Rebuild, Macro, orbit rollover  
Major: Test Arena only

## 1. Global ring law
One mission has one continuous global Crucible clock. Student enrollment never creates a private Day 1, restarts the ring, or pauses it. Each learner instead carries a personal coverage/mastery ledger.

Canonical schedule boundary: 10:00 AM mission-local time.

## 2. Normal 48-hour schedule
A normal tactical schedule is 48 hours:
- Hour 0: schedule begins at 10:00 AM.
- Hours 0–47: learning.
- Hours 47–48: Micro, normally 09:00–10:00.
- Hour 48: next schedule starts immediately.

Thus a schedule starting Day 1 at 10:00 reaches its Micro on Day 3 at 09:00–10:00 and the next schedule begins at 10:00.

## 3. Six-schedule block and Rebuild/Macro
Six normal schedules consume 6 × 48 = 288 hours.

Immediately after Micro-6 closes:
- Rebuild begins.
- Rebuild runs for 47 hours.
- The next 1 hour is the Macro.
- Macro completion is the next block boundary.
- There is NO separate Recovery window.

Arithmetic:
288h schedules + 47h Rebuild + 1h Macro = 336h = 14 days.

Using a block anchored at Day 1 10:00:
- S1: Day 1 10:00 → Day 3 10:00; Micro Day 3 09:00–10:00.
- S2: Day 3 10:00 → Day 5 10:00; Micro Day 5 09:00–10:00.
- S3: Day 5 10:00 → Day 7 10:00; Micro Day 7 09:00–10:00.
- S4: Day 7 10:00 → Day 9 10:00; Micro Day 9 09:00–10:00.
- S5: Day 9 10:00 → Day 11 10:00; Micro Day 11 09:00–10:00.
- S6: Day 11 10:00 → Day 13 10:00; Micro Day 13 09:00–10:00.
- Rebuild: Day 13 10:00 → Day 15 09:00 (47h).
- Macro: Day 15 09:00–10:00 (1h).
- S7 / next block: begins immediately Day 15 10:00.

The Founder has explicitly allowed a future post-Macro schedule to be up to one hour shorter if a specific operational Macro boundary is later placed at 10:00–11:00. That exception must be explicit; it must not silently distort the normal 47h-learning + 1h-Micro rule.

## 4. 98-day continuous orbit
Seven 336-hour blocks = 2,352 hours = 98 days.
Each block has six schedules, therefore one orbit has 42 schedules and 42 Micros.
Each block has one Rebuild and one Macro, therefore one orbit has seven Rebuilds and seven Macros.

At exactly orbit hour 2352, the final Macro closes and Orbit N+1 begins immediately. There is no terminal Day 99 and no recovery gap.

## 5. Late-entry / Micro eligibility
For a schedule beginning at 10:00 AM:
- join 10:00 AM through 10:00 PM inclusive → current Micro ELIGIBLE;
- join after 10:00 PM → current Micro NOT_ELIGIBLE_LATE_ENTRY;
- late-entry skip is never Fail, Zero or Absent;
- student stays on the global ring and proceeds toward the next Micro.

This Founder-defined cutoff is the operational rule. It is not to be replaced by a separate per-student Crucible clock.

## 6. Authority separation
Global clock = WHAT schedule/window is live.
Personal ledger = WHAT the learner has actually covered/missed/mastered.
Personalization changes HOW the learner trains, not the mission's global temporal position.

Micro and Macro are formative Crucible assessments. Major belongs exclusively to Test Arena.

## 7. Hard invariants
- Normal schedule: 47h learning + 1h Micro = 48h.
- Six schedules: 288h.
- Inter-block close: 47h Rebuild + 1h Macro = 48h.
- Block: 288 + 47 + 1 = 336h = 14 days.
- Seven blocks: 2352h = 98 days.
- Recovery duration: 0h.
- Next schedule/block starts immediately when Macro closes.
