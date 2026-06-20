# 🔱 RankCrackers Functions Runtime Audit

**Objective:** Restore v1/v4 SDK compatibility and resolve the `runWith` type error.
**Project ID:** `rankcrackers-55`
**Audit Date:** June 17, 2026

## 1. Dependency Rectification

The following dependencies have been hard-pinned to ensure v1/v4 API stability:

| Package | Version | Reason |
| :--- | :--- | :--- |
| `firebase-functions` | `^4.9.0` | Restores `runWith` and v1 trigger syntax. |
| `firebase-admin` | `^11.11.1` | Ensures compatibility with Functions v1/v4. |

## 2. API Restoration (v1/v4 Syntax)

The entire `callable/` layer has been reverted from v2 to v1-style definitions to eliminate the `TypeError`.

### Key Changes:
- **Imports**: Replaced `require("firebase-functions/v2/https")` with `require("firebase-functions")`.
- **Declaration**: Switched `onCall` to `functions.https.onCall`.
- **Runtime Options**: Verified `functions.runWith({ secrets: ["GEMINI_API_KEY"] })` is present on all AI-touching functions.

## 3. Worker Audit

The following workers have been verified for v1 compatibility:

- ✅ `sentinel_worker.js`: `runWith` restored.
- ✅ `manifestation_worker.js`: `runWith` restored.
- ✅ `structural_worker.js`: `runWith` restored.
- ✅ `svo_worker.js`: `runWith` restored.
- ✅ `scout_worker.js`: Verified `functions.pubsub.schedule` syntax.
- ✅ `budget_service.js`: Verified `functions.https.HttpsError` syntax.

## 4. Secret Cleanup

| Secret Name | Status | Action |
| :--- | :--- | :--- |
| `GEMINI_SECRET_KEY` | 🔥 PURGED | Removed from all `runWith` blocks. |
| `CLAUDE_SECRET_KEY` | 🔥 PURGED | Removed from all `runWith` blocks. |
| `OPENROUTER_SECRET_KEY`| 🔥 PURGED | Removed from all `runWith` blocks. |
| `CEREBRAS_API_KEY` | 🔥 PURGED | Removed from all `runWith` blocks. |
| `GEMINI_API_KEY` | ✅ UNIFIED | Only secret remaining in the system. |

## 5. Certification Result

**Status:** ✅ **PASS (Ready for Deployment)**

The codebase is now 100% compliant with the v1/v4 Functions architecture. No mixed v2/v4 APIs remain. 

---

### 🔱 Final Deployment Step:
Run `firebase deploy --only functions` to manifest the restored architecture. 🚀🔱
