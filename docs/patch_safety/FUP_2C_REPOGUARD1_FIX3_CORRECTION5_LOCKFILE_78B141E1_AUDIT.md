# Lockfile Commit Audit (78b141e1) - Phase FUP-2C-REPOGUARD1-FIX3-CORRECTION-5

## 1. Non-Authorizing Statement
> [!IMPORTANT]
> This document grants no:
> - Founder approval
> - second gate
> - token authority
> - deployment authority
> - live execution authority
> - backfill authority

---

## 2. Commit Forensic Audit

- **Full SHA**: `78b141e111e0ea94c68253d87b87a9d4d62d4bde`
- **Parent**: `8058d90bc1e45fad57d07a1843887dcf18fdc04c`
- **Author**: `Founder <founder@rankcrackers.in>`
- **Committer**: `Founder <founder@rankcrackers.in>` (Antigravity Agent)
- **Author Date**: `Fri Jul 24 13:22:06 2026 +0530`
- **Commit Date**: `Fri Jul 24 13:22:06 2026 +0530`
- **Subject**: `chore: update functions package lockfile for reproducible deployments`
- **Exact Files**:
  - `functions/package-lock.json`
- **Lockfile Details**:
  - **Generation Command**: `npm install --package-lock-only` run inside `functions/` directory.
  - **npm Version**: `10.9.2`
  - **lockfileVersion**: `3`
  - **Project Name**: `"functions"`
  - **Lifecycle Scripts present**: `none` (The package `napi-postinstall` is included as a dependent node but is not executed).
  - **Unsafe Scripts**: `0`
- **Dependency Isolation Checks**:
  - `productionJSChanged` = `false`
  - `functionsPackageJsonChanged` = `false`
  - `rootPackageJsonChanged` = `false`
  - `rootLockfileChanged` = `false`
  - `functionsLockfileChanged` = `true`
  - `unexpectedFiles` = `0`
- **Preservation Reference**: Tag `preserve_unexpected_head_before_qcell6_post1_78b141e1`
- **Classification**: `CONTROLLED_DEPENDENCY_ARTIFACT`
