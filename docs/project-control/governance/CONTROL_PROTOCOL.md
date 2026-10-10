# RC-PCMS — Control Protocol V1 (proposed)

## Four independent layers
1. **Architecture:** Existing accepted canonical contracts define system law.
2. **Decisions:** Founder/authorized acceptance, rationale, supersession, scope.
3. **Current State:** Concise Master and Domain snapshots; references rather than copies.
4. **Evidence:** Git SHA, PR, tests, authority/source, deployment and live proof.

## Decision record
Stable ID; date; Domain; decision; authority; rationale; supersedes; affects; evidence; status. **PROPOSED** is not **FOUNDER_ACCEPTED**. Never overwrite historical decisions silently.

## State status vocabulary
`PLANNED → ARCHITECTURE_ACCEPTED → IMPLEMENTED → TESTED → REVIEWED → MERGED → DEPLOYMENT_READY → DEPLOYED → LIVE_VERIFIED`.
Exceptional: `PARKED`, `BLOCKED`, `SUPERSEDED`, `REJECTED`.
Each transition requires corresponding evidence; do not treat lifecycle as automatic or infer skipped states.

## Update triggers
Durable accepted decision; verified/merged milestone; real blocker appearing/resolving; material active-task or next-action change; deployment/live verification. Casual conversation, temporary logs, raw prompts and scratch are **not** project memory.

## Update workflow
Domain owns bounded technical update proposal → evidence and code/architecture references → authorized review → Git commit/PR/merge under verified branch rules → update Domain State → update Master executive State. Do not directly rewrite canonical history. One writer per file set.

## Session handoff
Handoffs are snapshots only and must identify `CANONICAL_STATE_REFERENCE`, `VALID_AT_SHA`, `CREATED_AT`. New sessions read current GitHub state first.

## Repository safety
Existing G repo only. Reuse existing branches/worktrees where safe. No force push, no unapproved production mutation, no secrets, no duplicate canonical contracts. GitHub records do not replace runtime data stores or official academic authorities.
