# RankCrackers — ACTIVE BLOCKERS

**As of foundation setup:** No fresh full project-wide blocker verification performed.

| Item | Classification | Evidence / required check |
|---|---|---|
| Current PC/GitHub branch parity | NOT_YET_REVERIFIED | Inspect G repository HEAD, remote HEAD, worktrees, local changes |
| Detailed branch protection controls | NOT_PROVEN / ADMIN_VERIFY | Prior evidence conflicts; require direct protected-branch policy evidence |
| Sacred Archive prerequisites | READINESS_UNKNOWN | Bounded dependency reconciliation |
| SSC CGL Hosting Identity / Gate-B | HISTORICAL_BLOCKER_REQUIRES_CURRENT_CHECK | Prior pilot reports; do not infer live status |
| 237 Flutter lint warning/info items | HISTORICAL_NONBLOCKING_DEBT | Migration handoff R39 |

**Blocker policy:** Only proven source/data/security correctness issues block ordinary development. Test debt, infrastructure debt and predeployment gates are tracked separately. Do not invent blocker status from a missing report.


## Current PR governance evidence (Founder screenshot, 10 Oct 2026)
**PR #2:** `REVIEW_REQUIRED`; GitHub displays “At least 1 approving review is required by reviewers with write access.” `MERGING_BLOCKED` for this PR. This is a **merge gate**, not a blanket source-development blocker. Do not disable review protection. The earlier detailed policy attributes (force-push/admin/stale review/etc.) remain independently unverified.

## Do not conflate
`MERGE_BLOCKED_BY_REVIEW` is distinct from `SOURCE_DEFECT`, `PREDEPLOYMENT_GATE`, `INFRASTRUCTURE_DEBT` and `NONBLOCKING_LINT_DEBT`.
