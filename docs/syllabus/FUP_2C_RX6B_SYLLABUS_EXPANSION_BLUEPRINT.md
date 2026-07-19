# FUP-2C-RX6B — Syllabus Atom Expansion Blueprint

## Purpose
Stabilized read-only split/merge blueprint for JEE syllabus atoms before any topic_nodes publishing, Crucible schedule generation, or DigiBook generation.

## Founder Status Understanding
Current phase is RX6B cleanup/isolation and syllabus expansion planning, not publish. RX6A showed the atom base is useful but too low and too broad for a professional 100-day Crucible and DigiBook chain. RX6B decides what should be split, what should be merged, and where subject balance needs adjustment. This FIX0 stabilizes the audit and validation scope after unrelated R12/IR3 files entered the working tree. No Firestore data is written and no student delivery path is touched.

## Subject-Wise Current vs Target
| Subject | Current Atoms | Planning-ready | Target Planning | Target Deep Learning | Projected Planning | Projected Deep Learning | Action |
| --- | ---: | ---: | --- | --- | ---: | ---: | --- |
| Mathematics | 50 | 47 | 90-110 | 500-600 | 55 | 352 | EXPAND |
| Physics | 111 | 64 | 95-115 | 500-600 | 130 | 908 | REBALANCE |
| Chemistry | 63 | 34 | 95-115 | 500-600 | 131 | 860 | REBALANCE |

## Split Blueprint
- Atoms needing split: 50
- Projected child planning atoms: 171
- Projected deep learning atoms from splits: 1026
- Biggest risk: broad Chemistry official syllabus clusters need careful split before write.

## Merge Blueprint
- Atoms needing merge: 2
- Merge targets found: 2
- Unresolved tiny fragments: 0

## Duplicate Review
- Duplicate canonical groups: 7
- Merge recommended: 1
- Human review required: 6

## Projected After Blueprint
- Projected planning atoms: 317
- Projected deep learning atoms: 2120
- Projected 100-day task equivalents: 222
- Subject balance verdict: GOOD overall, with subject-level rebalance still required.

## Crucible Compatibility
- 100-day compatibility: GOOD
- Revision/test suitability: GOOD
- Recommended action: READY_FOR_EXPANSION_WRITE_DRY_RUN

## DigiBook Compatibility
- Projected units: 317
- Projected lessons: 2120
- Explanation readiness: GOOD, but deep lesson count should be rebalanced before final generation.

## Student Psychology Assessment
- Progress feel: GOOD
- Topic size: MIXED_BUT_FIXABLE
- Fragmentation risk: LOW
- Overload risk: CONTROLLED
- Verdict: READY_FOR_EXPANSION_DRY_RUN

## Risks
1. Mathematics still needs expansion.
2. Physics and Chemistry projected planning counts need rebalance.
3. Chemistry cluster splitting must remain source-grounded.
4. Duplicate Physics legacy/source pairs need human review.
5. Deep learning projection is above target and should be pruned later.

## Recommended Next Phase
FUP-2C-RX6C — Syllabus Atom Expansion Write Dry-Run.

RX6C should simulate the exact child atoms and merge results without writing Firestore. Actual writes should only happen after Founder approval.

## Verdict
FUP_2C_RX6B_FIX0_STABILIZED