# RankCrackers — Project Control & Memory System (RC-PCMS)

**Purpose:** GitHub-backed, durable project continuity across ChatGPT, Gemini and engineering-agent sessions.

**Status:** Foundation proposed in a review branch. Not canonical until approved and merged.

## Start here
1. [MASTER_STATE.md](MASTER_STATE.md) — current cross-domain snapshot and pending verification.
2. [DOMAIN_REGISTRY.md](DOMAIN_REGISTRY.md) — permanent **DOMAIN-A, DOMAIN-B, DOMAIN-C, DOMAIN-D, DOMAIN-E** identifiers and links.
3. [CURRENT_PRIORITIES.md](CURRENT_PRIORITIES.md) — prioritized work.
4. [ACTIVE_BLOCKERS.md](ACTIVE_BLOCKERS.md) — proven vs unverified blockers.
5. [governance/CONTROL_PROTOCOL.md](governance/CONTROL_PROTOCOL.md) — authority, evidence and update rules.
6. [governance/CHAT_BOOTSTRAP.md](governance/CHAT_BOOTSTRAP.md) — copyable new-chat instructions.

## Governing principle
**Architecture ≠ Decisions ≠ Current State ≠ Evidence.** Existing accepted architecture contracts remain the authority. These files are a navigation and state layer, not a competing specification. Do not import raw chats or silently promote a proposed claim to Founder approval.

## Update discipline
After a durable Founder decision, verified milestone, material blocker change, or deployment/live proof, the owning Domain proposes a bounded state update with evidence. Review and merge according to actual repository governance. Keep domain summaries concise and link to the canonical contracts.

**PC repository:** `G:\RankCrackers Project\RankCrackers-55`. **GitHub:** `rankcrackersofficial-sys/RankCrackers`. **Canonical branch:** `safety/rc-g2-pre-notification-schema`. Never force push. No new worktree is required for ordinary documentation updates.


## Founder navigation / acceptance checkpoint
The GitHub tree is visible on this PR branch now. **Do not describe it as merged or active on the protected canonical branch.** Pull Request #2 requires at least one eligible approving review (as shown in the Founder screenshot). A reviewer with write access must approve; do not bypass policy. Once merged, PC `G:\RankCrackers Project\RankCrackers-55` must fetch/pull safely after confirming its worktree and 11 accepted local generated modifications.

**Existing chat integration:** use a separate one-time command for each DOMAIN-A through DOMAIN-E, provided in [CHAT_BOOTSTRAP.md](governance/CHAT_BOOTSTRAP.md). GitHub cannot automatically inject commands into pre-existing chat sessions.
