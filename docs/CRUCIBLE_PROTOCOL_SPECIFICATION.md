# 🔱 CRUCIBLE PROTOCOL SPECIFICATION — CANONICAL CADENCE

**STATUS:** CANONICAL TRUTH  
**AUTHORITY:** Founder & Antigravity Master Architecture  
**DATE:** 12 October 2026  
**DOCUMENT ID:** RC-DOC-CRUCIBLE-98DAY-001  

---

## 1. CANONICAL CADENCE INVARIANT

The RankCrackers Crucible is strictly defined as a **98-Day Continuous Modulo Ring**:

$$\text{Total Duration} = 7 \text{ Phases (Blocks)} \times 14 \text{ Days} = 98 \text{ Days}$$

Any external or legacy reference stating "49 two-day cycles" is **EXPLICITLY OBSOLETE AND SUPERSEDED**. The mathematical kernel and operational reality of the Crucible enforce 7 phases of 14 days each.

---

## 2. FOURTEEN-DAY PHASE BREAKDOWN

Within each 14-day block (Phase 1 through Phase 7):

| Day Range | Sacred Chamber | Operational Purpose | Route / Surface |
|---|---|---|---|
| **Days 1–12** | **Sacred Micro Chamber** | Daily targeted 15–30 min retrieval tests across active syllabus atoms. | `/crucible/micro` |
| **Day 13** | **Sacred Rebuild Chamber** | Intensive repair of weakened atoms with mastery $M(a) < 0.50$. | `/crucible/rebuild` |
| **Day 14** | **Sacred Macro Citadel** | Cumulative 100–150 question citadel exam evaluating the complete 14-day block. | `/crucible/macro` |

---

## 3. MODULO RING MATHEMATICAL FORMULATION

For an enrolled student with enrollment timestamp $T_{\text{enrolled}}$ and current evaluation timestamp $T_{\text{now}}$:

$$\Delta d = \lfloor \frac{T_{\text{now}} - T_{\text{enrolled}}}{86400000} \rfloor$$
$$\text{Cycle Day} = (\Delta d \pmod{14}) + 1 \quad \in [1, 14]$$
$$\text{Current Phase} = (\lfloor \frac{\Delta d}{14} \rfloor \pmod{7}) + 1 \quad \in [1, 7]$$

### Ring Closure
Upon completion of Phase 7 Day 14 (Day 98), the modulo ring seamlessly wraps to Phase 1 Day 1 with decayed mastery weights, driving perpetual mastery and zero forgotten facts.
