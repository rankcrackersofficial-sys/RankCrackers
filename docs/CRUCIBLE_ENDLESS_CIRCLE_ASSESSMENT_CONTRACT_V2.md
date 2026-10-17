# RankCrackers Crucible — Endless Circle & Assessment Contract V2

**Status:** CANONICAL / FROZEN PRODUCT CONTRACT  
**Contract ID:** `RC-CRUCIBLE-ENDLESS-CIRCLE-V2`  
**Effective date:** 17 October 2026  
**Scope:** All missions using the current Crucible cadence. A mission may override content and question counts only through a versioned blueprint; it may not silently change the clock or eligibility rules.

This is the final 105-day circle, 420-day four-circle and endless-cycle authority. Runtime, Founder configuration, student UI, Test Arena and documentation must resolve to this contract.

## 1. Global clock and joining

- Timezone: `Asia/Kolkata`; storage remains server-authoritative UTC.
- Cutover: exactly **10:00:00 IST**.
- A global day is `[10:00, next 10:00)`.
- A schedule is 48 hours: two 24-hour learning days followed by a one-hour Micro Test window at the end of the second day.
- Joining never moves or pauses the mission clock.
- Join during Schedule Day 1: current schedule, Day 1.
- Join during Schedule Day 2: immediate Buffer-Day access to the next schedule's Day 1 timetable; it is not a free day and does not create early assessment credit.
- At the exact 10:00 cutover after Day 2, the next schedule becomes officially active.

## 2. Circle topology

One circle is **105 global days**: seven 15-day blocks.

| Block days | Global function |
|---|---|
| Days 1–12 | Six 48-hour schedules; each contains 47h learning/DigiBook/retrieval + 1h Micro Test |
| Day 13, 10:00 → Day 15, 10:00 | 48h Rebuild and Revision window |
| Day 15, 10:00 → Day 16, 10:00 | Test window and heavy buffer; consolidate the six schedules and prepare the next block |
| Day 16, 10:00 | Next block starts |

The circle therefore contains **42 schedules and 42 Micro windows**. Four planned circles cover **420 global days, 168 schedules and 168 Micro windows**. After Day 420 the same global clock continues into the next circle; there is no student-specific reset.

## 3. Assessment ladder

Every 15-day junction has one unified assessment event. A junction remains Macro unless the global promotion ladder below promotes it.

| Global day | Event |
|---:|---|
| 15, 30, 45, 60, 75, 90 | Macro |
| 105 | Major 1 |
| 120 | Macro |
| 135 | Major 2 |
| 150 | Macro |
| 165 | Full 1 |
| 180 | Macro |
| 195 | Major 3 |
| 210 | Macro |
| 225 | Full 2 |
| 240 | Macro |
| 255 | Major 4 |
| 270 | Macro |
| 285 | Full 3 |
| 300 | Macro |
| 315 | Major 5 |
| 330 | Macro |
| 345 | Full 4 |
| 360 | Macro |
| 375 | Major 6 |
| 390 | Macro |
| 405 | Full 5 |
| 420 | Macro / circle milestone |

After Day 105 the repeating cadence is **Macro → Major → Macro → Full**, every 15-day junction. Micro generation never disappears from the content pipeline; it is the retrieval lane for each two-day schedule.

## 4. Eligibility and late joiners

Eligibility is evaluated per student from server-recorded, verified evidence. Mission dates never shift for a late joiner.

- First Major gate: the student must have six verified Macro completions from the mission path and the required preceding schedule evidence. The first applicable Major junction is Day 105; if the gate is not met, the student waits for the next Major junction.
- Later Major gates: the same minimum six verified Macro completions must be maintained before the next applicable Major. The latest six schedules receive the highest weight; the preceding six receive lower weight.
- First Full gate: the student must have eight verified Macro completions, two verified Major completions, and verified coverage of the first 105-day syllabus circle. It opens at the next global Full junction, not on a private 60-day timer.
- Later Full gates: the same verified evidence rule applies to the next global Full junction. Whole-syllabus coverage is mandatory; the latest four schedules receive additional weight.
- Missed or unverified assessments do not count. No gate may be satisfied by app opens, fabricated scores, or inherited test completion.

## 5. Test composition policy

Question counts and duration are mission-specific blueprint values, but every release requires source-bound syllabus mapping, independent answer-key verification, section balance, publication authorization and server-side eligibility.

- Micro: current schedule atoms plus spaced retrieval.
- Macro: recent six schedules, with cumulative lower-weight retrieval where configured.
- Major: recent six schedules weighted highest, preceding six lower, and cumulative diagnostic coverage retained.
- Full: whole official syllabus plus verified derived taxonomy; latest four schedules high-weight, preceding schedules and the rest of the syllabus retained. The default sampling policy is 40% latest four schedules, 30% preceding twelve schedules, 30% whole accumulated syllabus. This weighting never permits an official subject or verified branch to be omitted.

## 6. Rebuild and buffer semantics

The 48-hour rebuild window is for weak-atom repair, DigiBook re-reading, failed-question review and subject-balanced revision. The following Day 15 test/buffer window is intentionally heavy: finish the junction assessment, consolidate all six schedules and prepare the next block. Buffer time is productive timetable access, not an idle state.

## 7. Permanent invariants

Implementations must prove: deterministic 10:00 IST boundaries; 105 days = 7 × 15; six schedules per block; 48h rebuild; Day 15 unified assessment; 420-day four-circle projection; global Macro/Major/Full dates; late joiners never shift the mission; Micro content remains generated; Full is whole-syllabus; and no assessment is released without verified content and eligibility.

## 8. Supersession

This V2 contract supersedes the prior 98-day/14-day/46-hour contract and all informal schedules. The old contract remains in the repository only as historical evidence and must not be used by runtime, Founder controls or student UI.
