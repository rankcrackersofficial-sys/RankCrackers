# 🔱 CRUCIBLE PROTOCOL SPECIFICATION — CANONICAL CADENCE

**STATUS:** CANONICAL TRUTH  
**AUTHORITY:** Founder & Antigravity Master Architecture  
**DATE:** 12 October 2026  
**DOCUMENT ID:** RC-DOC-CRUCIBLE-105DAY-002  

> **Final assessment and joining authority:** See [`CRUCIBLE_ENDLESS_CIRCLE_ASSESSMENT_CONTRACT_V2.md`](CRUCIBLE_ENDLESS_CIRCLE_ASSESSMENT_CONTRACT_V2.md). It freezes the 10:00 IST clock, Buffer-Day rule, 105-day circle, 48-hour rebuild, Day-15 junctions and late-joiner eligibility. This file is the mathematical/runtime summary; older 98-day notes are historical.

---

## 1. CANONICAL CADENCE INVARIANT

The RankCrackers Crucible is strictly defined as a **105-Day Continuous Modulo Ring**:

$$\text{Total Duration} = 7 \text{ Blocks} \times 15 \text{ Days} = 105 \text{ Days}$$

Any external or legacy reference stating 98 days, 14-day phases, 46-hour rebuilds or Day-14-only assessment is **EXPLICITLY OBSOLETE AND SUPERSEDED**. The active kernel enforces 7 blocks of 15 days each.

---

## 2. FIFTEEN-DAY BLOCK BREAKDOWN

Within each 14-day block (Phase 1 through Phase 7):

| Day Range | Sacred Chamber | Operational Purpose | Route / Surface |
|---|---|---|---|
| **Days 1–12** | **Sacred Micro Chamber** | Daily targeted 15–30 min retrieval tests across active syllabus atoms. | `/crucible/micro` |
| **Day 13 10:00 → Day 15 10:00** | **Sacred Rebuild Chamber** | 48-hour repair/revision window for weakened atoms. | `/crucible/rebuild` |
| **Day 15** | **Assessment Junction** | Unified Macro/Major/Full event plus heavy buffer and next-block preparation. | `/crucible/macro` |

---

## 3. MODULO RING MATHEMATICAL FORMULATION

For an enrolled student with enrollment timestamp $T_{\text{enrolled}}$ and current evaluation timestamp $T_{\text{now}}$:

$$\Delta d = \lfloor \frac{T_{\text{now}} - T_{\text{enrolled}}}{86400000} \rfloor$$
$$\text{Cycle Day} = (\Delta d \pmod{105}) + 1 \quad \in [1, 105]$$
$$\text{Current Block} = (\lfloor \frac{\Delta d}{15} \rfloor \pmod{7}) + 1 \quad \in [1, 7]$$

### Ring Closure
Upon completion of Block 7 Day 15 (Day 105), the modulo ring seamlessly wraps to Block 1 Day 1 with decayed mastery weights, driving perpetual mastery and zero forgotten facts.
