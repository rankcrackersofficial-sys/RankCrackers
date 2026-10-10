# RANKCRACKERS — DOMAIN-B — DigiBook & Pedagogy

**DOMAIN_ID:** DOMAIN-B
**NAME:** DigiBook / Subject Teacher / Pedagogy
**STATUS:** INITIAL_STATE_PENDING_RECONCILIATION
**PURPOSE:** Govern HOW verified syllabus concepts are taught and establish actually taught material.
**BOUNDARY:** Subject Teacher resolution, atomic pedagogy, DigiBook, teaching execution, taught-content manifests/authority. Cannot independently expand syllabus or question authority.

## Canonical architecture
- [Cross-domain syllabus/teaching boundary](../../architecture/CANONICAL_SYLLABUS_AND_DERIVED_DECOMPOSITION_CONTRACT.md)
- Other accepted DigiBook/pedagogy contracts: identify latest accepted paths during reconciliation.

## Locked direction
SYLLABUS=WHAT; PEDAGOGY=HOW; DIGIBOOK=ACTUAL TAUGHT MATERIAL. Verified atom does not mean taught atom.

## Reported historical evidence
Taught Content Authority I1 reported independently accepted/closed with 15/15 dedicated tests; do not reopen absent contradiction. **Not rerun in this foundation setup.**

**CURRENT_IMPLEMENTATION_STATE:** Requires reconciliation.
**ACTIVE_TASK:** None verified.
**REAL_BLOCKERS:** Not established.
**TEST_DEBT:** Not established.
**INFRASTRUCTURE_DEBT:** Not established.
**PENDING_DECISIONS:** None newly authorized.
**NEXT_AUTHORIZED_ACTION:** Verify current implementation/evidence without reopening I1.
**LAST_VERIFIED_SHA:** Pending.
**LAST_VERIFIED_AT:** Pending.
**EVIDENCE_REFERENCES:** Architecture link above; I1 historical report to locate.


## Primary historical milestone and boundary
Taught Content Authority I1 historically accepted CLOSED (15/15 dedicated tests); fail-closed when `scope.missionActive !== true` or `scope.atomVerified !== true`, including `MISSION_INACTIVE` and `ATOM_NOT_VERIFIED`. I2 design readiness previously READY; this is **not** proof that I2 was implemented. P8B was held in the earlier Domain-B handoff. DigiBook may not self-authorize syllabus changes. Current code/merge/deploy status still requires direct verification.

## DOMAIN-B bootstrap reconciliation — 2026-10-10
**BOOTSTRAP:** COMPLETE, READ_ONLY; report says GitHub access available at `a57657ea3c984f1b6ced4f72c34c7734b28c15ab`. **Evidence tier:** domain-room historical handoff unless primary GitHub acceptance artifact is separately located.

**P8A historical accepted claims to verify:** Subject Teacher/Pedagogy FINAL ACCEPTED/CLOSED at `d53030d944f225512964501113a1b55f2416ded4`; reported 75/75; nine subject plugins, no generic fallback, nine runtime pedagogy dimensions, Smart Entry HOW-not-WHAT, unit specialization, DigiBook teaching-plan consumption. **Do not promote to independently verified current implementation yet.** I1 previously recorded accepted with 15/15 and fail-closed mission-active/atom-verified checks. I2 was design-ready only; P8B historically held.

**Missing primary evidence:** exact P8A commit/test artifact, current merge coverage, I1 report, teacher assignment/materialization lifecycle, persistent taught manifest, DigiBook consumption proof. **Next:** bounded primary evidence lookup and reviewed state correction; no new implementation or I1 reopening absent contradiction.
