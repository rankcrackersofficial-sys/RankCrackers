# FUP-2C-RX6C-RB1 Rebalance Dry-Run

## Purpose

RB1 rebalances the accepted RX6C write dry-run before any controlled expansion write. It remains read-only and does not write Firestore, syllabus_atoms, topic_nodes, student delivery, Crucible, or DigiBook content.

## RX6C Imbalance Summary

- RX6C projected planning atoms: 317
- RX6C projected deep learning atoms: 2120
- RX6C projected 100-day task equivalents: 222
- Mathematics projected planning: 55, target 90-110
- Physics projected planning: 130, target 95-115
- Chemistry projected planning: 131, target 95-115

## Rebalance Targets

- Math planning: 90-110
- Physics planning: 95-115
- Chemistry planning: 95-115
- Total planning: 280-320
- Total deep learning: 1500-1800
- 100-day task equivalents: 200-215

## Math Expansion Correction

- Additional Math planning atoms needed: 35
- Proposed additional Math child atoms: 35
- Math projected planning after rebalance: 90
- Math projected deep learning after rebalance: 540
- Source risk: low, because source-backed Math parents exist for deterministic dry-run proposals

## Physics / Chemistry Compression

- Physics compressed/deferred: 20 planning items
- Chemistry compressed/deferred: 21 planning items
- Physics projected planning after rebalance: 110
- Chemistry projected planning after rebalance: 110
- Physics projected deep learning after rebalance: 585
- Chemistry projected deep learning after rebalance: 585

Compression means proposed write-plan adjustment only. Existing atoms are not deleted or rewritten.

## DigiBook Deep-Learning Rebalance

- Original deep learning atoms: 2120
- Projected after rebalance: 1710
- Deferred deep lessons: 410
- Notes/traps instead of lessons: 170
- Over-expansion risk after rebalance: low to medium
- Policy: average 5-6 deep lessons per planning atom; avoid 8+ unless high-weight

## Crucible 100-Day Rebalance

- Original task equivalents: 222
- Projected after rebalance: 210
- 100-day compatibility: GOOD
- Revision/test suitability: GOOD

## ID / Collision Check

- Existing atom IDs: 224
- RX6C proposed IDs: 171
- RB1 additional proposed IDs: 35
- Collisions: 0
- Duplicate canonical keys: 0
- Rejected ID reuse: 0
- Verdict: PASS

## Student Psychology Assessment

- Progress feel: good
- Fragmentation risk: low to medium
- Overload risk: controlled after deep lesson deferral
- Revision suitability: good
- Mental load: manageable for a 100-day journey

## Recommendation

READY_FOR_CONTROLLED_EXPANSION_WRITE

RB1 makes the RX6C plan academically better balanced, but it still does not approve a write. A later controlled write phase must be separate and explicit.

## Next Phase

If Founder accepts RB1, the next phase can prepare a controlled write command. No student publish should happen in that write phase unless separately approved.