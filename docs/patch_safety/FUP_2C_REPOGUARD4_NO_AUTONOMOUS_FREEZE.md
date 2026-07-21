# FUP-2C REPOGUARD4 NO AUTONOMOUS FREEZE

Freeze rules:
- No P15/R14/autonomous/background commit process during MIRROR/QCELL phases.
- No external commit insertion during validation.
- No package script may modify HEAD.
- No QCELL/MIRROR commit is accepted if HEAD changes mid-phase.
- P15/R14 evidence files remain separate.
- Before MIRROR/QCELL: run npm run audit:repo:staged-state-guard and npm run audit:repo:head-freeze-guard -- <expectedHead>.
- After each validation command: run git rev-parse HEAD and compare with expectedHead.
- If HEAD changes: STOP, no commit, report blocker.
