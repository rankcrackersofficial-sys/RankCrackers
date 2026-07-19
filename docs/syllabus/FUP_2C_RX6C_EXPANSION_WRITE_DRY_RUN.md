# FUP-2C-RX6C Expansion Write Dry-Run

## Purpose

Create a persistent, read-only dry-run plan for future syllabus atom expansion. This phase does not write Firestore and does not modify `syllabus_atoms` or `topic_nodes`.

## Input Baseline

- Mission: `jee_main_2026`
- Total atoms: 224
- Planning-ready: 145
- Deep-learning-ready: 145
- Source-backed: 198
- Legacy: 26
- Rejected: 1
- Needs review: 196

## RX6B Blueprint Summary

- Projected planning atoms: 317
- Projected deep learning atoms: 2120
- Projected 100-day task equivalents: 222
- Proposed child planning atoms: 171
- Merge fragments: 2
- Source review holds: 26
- Human review holds: 6
- Duplicate review holds: 7

## Proposed Write Operations

All operations are dry-run only and use `writeAllowedNow: false`.

- `CREATE_CHILD_PLANNING_ATOM`: 171
- `CREATE_DEEP_LEARNING_ATOM_LATER`: 2120 projected later units
- `MERGE_FRAGMENT_INTO_PARENT`: 2 blueprint fragments, unresolved until human review
- `KEEP_EXISTING_AS_PLANNING_PARENT`: 145
- `SOURCE_REVIEW_HOLD`: 26
- `HUMAN_REVIEW_HOLD`: 6
- `EXCLUDE_REJECTED`: 1

## Proposed ID Policy

Proposed IDs use this deterministic pattern:

`DRYRUN_JEE_MAIN_2026_{SUBJECT}_{PARENT_ATOM_ID}_CH{INDEX}`

The strategy is mission-aware, subject-aware, parent-aware, child-index-aware, stable across reruns, and does not claim topic_nodes IDs.

## Collision / Duplicate Check

- Existing atom IDs: 224
- Proposed new IDs: 171
- Collisions: 0
- Duplicate canonical keys: 0
- Rejected ID reuse: 0
- ID verdict: PASS

## Subject-Wise Projected Counts

| Subject | Current | New Planning | Projected Planning | Target Planning | Projected Deep Learning | Target Deep Learning | Verdict |
| --- | ---: | ---: | ---: | --- | ---: | --- | --- |
| Mathematics | 50 | 8 | 55 | 90-110 | 352 | 500-600 | EXPAND |
| Physics | 111 | 66 | 130 | 95-115 | 908 | 500-600 | REBALANCE |
| Chemistry | 63 | 97 | 131 | 95-115 | 860 | 500-600 | REBALANCE |

## Merge Dry-Run

- Blueprint merge fragments: 2
- Safe automatic merge targets: 0
- Unresolved: 2
- Write allowed now: false

Merge candidates are held for human review. Existing atoms are not updated.

## Review Holds

- Source review holds: 26
- Human review holds: 6
- Duplicate review holds: 7
- Rejected excluded: 1

These items are not counted as ready for student publish.

## Crucible Dry-Run Readiness

- Projected planning atom count: 317
- Projected 100-day task equivalents: 222
- Subject balance: mixed but workable after rebalance
- Verdict: ready for controlled expansion write dry-run, not publish

## DigiBook Dry-Run Readiness

- Projected deep learning atom count: 2120
- Over-expansion risk: high
- Recommended later compression/rebalance: yes
- Verdict: dry-run ready, content writing must wait

## Student Psychology Assessment

- Progress feel: good
- Fragmentation risk: controlled if child atoms stay planning-level
- Overload risk: medium-high until DigiBook rebalance
- Revision suitability: good for Crucible after rebalance

## Recommendation

`READY_FOR_CONTROLLED_EXPANSION_WRITE`

This recommendation means the dry-run plan has no ID collisions and is safe to consider for a future controlled write phase. It does not approve a write in RX6C.

## Next Phase

If Founder accepts RX6C, the next phase can be RX6D controlled expansion write. RX6D must still be separate and must not publish topic_nodes or student delivery unless explicitly approved later.