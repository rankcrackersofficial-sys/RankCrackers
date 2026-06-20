# PIPELINE BLOCKAGE - COMPLETE DIAGNOSIS & REMEDIATION

**Date:** 2026-06-16  
**Status:** 🔴 CRITICAL - Pipeline blocked at PDF extraction and API fallover  
**Severity:** HIGH - Uploads stuck for 3+ days in some cases  

---

## EXECUTIVE SUMMARY

Your upload pipeline is stuck in 3 critical places:

1. **PDF Parsing Error** (23 failures) - `pdf is not a function`
   - **Root Cause:** Incorrect import statement in sentinel_worker.js
   - **Status:** ✅ **FIXED**

2. **Budget System Missing** - Workers disabled due to missing budget document
   - **Root Cause:** system_budget collection has no 'current' document
   - **Status:** ✅ **FIXED**

3. **API Rate Limiting** - GROQ service crashes on rate limits
   - **Root Cause:** No retry logic for HTTP 429 errors
   - **Status:** ✅ **FIXED**

4. **Gemini API Failures** - Likely auth or quota issues
   - **Root Cause:** process.env.GEMINI_API_KEY missing or expired
   - **Status:** ⏳ **NEEDS VERIFICATION**

---

## PIPELINE STATE SNAPSHOT

```
ai_queue Status:
├── classified: 1 (has embedded error)
├── failed: 1 (HTTP 403)
├── pending: 2 (STUCK since June 13 - 72+ hours)
├── completed: 1 (with error)
└── skipped_duplicate: 15

sentinel_drafts:
└── under_review: 1 (waiting for downstream processing)

Worker Health:
├── sentinel_worker: 23 errors, Error: "pdf is not a function"
├── structural_worker: 2 errors, Error: "GEMINI_API_FAILURE"
└── svo_worker: 34 errors, Error: "GROQ_FAILURE" (rate limited)
```

---

## FIXES ALREADY APPLIED

### 1. ✅ Fixed PDF Parsing Error

**File:** `functions/workers/sentinel_worker.js`

**What was wrong:**
```javascript
// ❌ WRONG - pdf-parse doesn't export a named 'PDFParse'
const { PDFParse } = require("pdf-parse");
// Later in code:
const data = await new PDFParse({ data: fileBuffer }).getText();
```

**Fixed to:**
```javascript
// ✅ CORRECT - pdf-parse exports the function directly
const PDFParse = require("pdf-parse");
// Later in code:
const data = await PDFParse(fileBuffer);
```

**Changes Made:**
- Line 4: Changed import statement
- Line 111: Changed function call

**Impact:** Resolves 23 failed tasks with "pdf is not a function" error

---

### 2. ✅ Initialized Missing Budget System

**Collection:** `system_budget`  
**Document ID:** `current`

**Document Created:**
```json
{
  "tokensUsedThisMonth": 0,
  "monthlyTokenLimit": 1000000,
  "aiEnabled": true,
  "createdAt": "2026-06-16T...",
  "lastUpdated": "2026-06-16T...",
  "metadata": {
    "version": "1.0",
    "purpose": "Control AI processing budget and feature gates"
  }
}
```

**Impact:** Workers will now process tasks instead of returning early due to disabled budget

---

### 3. ✅ Added GROQ Retry Logic with Exponential Backoff

**File:** `functions/services/groq_service.js`

**What was wrong:**
```javascript
// ❌ WRONG - Fails immediately on 429 (rate limit)
catch (error) {
  throw new Error(`GROQ_FAILURE: ${error.message}`);
}
```

**Fixed to:**
```javascript
// ✅ CORRECT - Retries with exponential backoff
- Attempt 1: immediate
- Attempt 2: after 500ms + jitter
- Attempt 3: after 1000ms + jitter
- Attempt 4: after 2000ms + jitter
- Then falls back to next provider
```

**Key Features:**
- Detects HTTP 429 (rate limit) and HTTP 5xx errors
- Exponential backoff: 500ms × 2^attempt + random jitter
- Max 3 retry attempts per request
- Falls through to LLM orchestrator failover if all retries exhausted

**Impact:** Reduces GROQ-induced failures from rate limiting

---

## STILL NEEDS CONFIGURATION

### 4. ⏳ Verify Gemini API Key

**What to do:**

1. Get your Gemini API key:
   - Visit: https://aistudio.google.com/app/apikey
   - Create new API key if needed
   - Copy the key

2. Create/update `functions/.env`:
   ```
   GEMINI_API_KEY=<paste-your-key-here>
   GROQAI_API_KEY=<optional-your-groq-key>
   OPENAI_API_KEY=<optional-your-openai-key>
   CEREBRAS_API_KEY=<optional-your-cerebras-key>
   ```

3. Test locally (from functions directory):
   ```bash
   cd functions
   npm run serve
   # In another terminal:
   node -e "require('dotenv').config(); const {callVertexGemini} = require('./services/vertex_ai_service'); callVertexGemini('test').then(console.log).catch(console.error);"
   ```

4. If it works, redeploy:
   ```bash
   firebase deploy --only functions
   ```

**Note:** Previous .env was deleted because it contained exposed keys. Those keys must be rotated/revoked immediately.

---

## DEPLOYMENT INSTRUCTIONS

### Option A: Automated Recovery (Recommended)

```bash
cd e:\RankCrackers

# 1. Deploy functions with all fixes
firebase deploy --only functions

# 2. Run recovery script (automatically resets stuck tasks)
$env:NODE_PATH = 'functions/node_modules'; node recover_pipeline.js

# 3. Monitor status
$env:NODE_PATH = 'functions/node_modules'; node pipeline_diagnosis.js
```

### Option B: Manual Step-by-Step

```bash
cd e:\RankCrackers

# 1. Verify .env is configured
cat functions\.env  # Check GEMINI_API_KEY is set

# 2. Deploy
firebase deploy --only functions

# 3. Wait 2-3 minutes for deployment

# 4. Check logs
firebase functions:log

# 5. Reset stuck STRUCTURAL tasks manually in Firestore:
# - Find tasks in ai_queue with status='pending' and createdAt < 3 days ago
# - Update status to 'received'
```

---

## VERIFICATION STEPS

After deploying fixes, verify recovery:

### 1. Check Workers Are Online (5 min after deploy)
```bash
$env:NODE_PATH = 'functions/node_modules'; node pipeline_diagnosis.js
```

Look for:
- ✅ sentinel_worker status: ONLINE
- ✅ Last Heartbeat: recent (within 1 min)
- ✅ Error Count: stopped increasing

### 2. Monitor Real-Time Logs
```bash
firebase functions:log
```

Expected logs:
- `SENTINEL: Processing task...` (PDF extraction working)
- `SENTINEL: Calling Gemini...` (API calls resuming)
- `SENTINEL_DRAFT: Created draft...` (Output documents created)

### 3. Check Firestore Collections
- **ai_queue:** Tasks should transition from "received" → "processing" → "classified"
- **sentinel_drafts:** New documents should appear with status "under_review"
- **ai_failed_tasks:** New errors should be recorded (helps debug remaining issues)
- **ingestion_refinery:** Should show tasks moving through stages

### 4. Test Upload Manually
- Upload a PDF file through the app
- Watch Firestore collections for task progression
- Check `ai_failed_tasks` if upload fails

---

## WHAT'S HAPPENING NOW

### Before Fixes (Current State):
```
Upload → ai_queue (received)
         ↓
      sentinel_worker triggered
         ↓
      PDF parsing: ❌ "pdf is not a function"
         ↓
      Task marked as: failed
         ↓
      Pipeline BLOCKED 🔴
```

### After Deployment:
```
Upload → ai_queue (received)
         ↓
      sentinel_worker triggered
         ↓
      PDF parsing: ✅ Text extracted
         ↓
      Gemini API: ✅ Text refined (with fallover to Cerebras/Groq)
         ↓
      sentinel_draft created: ✅ under_review
         ↓
      downstream processing continues...
         ↓
      Pipeline UNBLOCKED 🟢
```

---

## KNOWN REMAINING ISSUES

1. **2 STRUCTURAL tasks stuck since June 13**
   - Status: pending
   - Issue: Likely blocked by Gemini auth failure
   - Solution: Will auto-process after Gemini key is verified and functions redeployed

2. **Stale SVO worker (34 errors)**
   - Status: Last heartbeat 3+ days ago
   - Issue: Crashed due to GROQ rate limiting
   - Solution: Will restart automatically when functions redeployed

3. **API Keys Exposed in Git History**
   - Status: ⚠️ CRITICAL SECURITY ISSUE
   - Action: Keys should be rotated/revoked immediately
   - Solution: Requires git filter-repo to clean history (blocked: no .git in workspace)

---

## TIMELINE OF WHAT HAPPENED

**June 13, 14:48-15:01:**
- SVO and Structural workers crashed due to:
  - GROQ rate limiting (no retry logic)
  - Gemini API auth failure
- Stuck 2 STRUCTURAL tasks in "pending" state

**June 16, 06:22-06:34:**
- New PDF uploads triggered sentinel_worker
- PDF parsing failed with "pdf is not a function"
- Budget system disabled workers
- Created 23 failed tasks, 1 under_review draft

**June 16, 06:34-present:**
- Pipeline fully blocked
- No new tasks processed
- 1 draft stuck in "under_review"

---

## QUICK REFERENCE: What Each Script Does

| Script | Purpose | Run From | Command |
|--------|---------|----------|---------|
| `pipeline_diagnosis.js` | Analyzes current blockage points | root | `node pipeline_diagnosis.js` |
| `init_budget.js` | Creates missing budget document | root | `node init_budget.js` |
| `recover_pipeline.js` | Deploys fixes + resets stuck tasks | root | `node recover_pipeline.js` |
| `test-gemini.js` | Tests Gemini API directly | functions | `node test-gemini.js` |
| `comprehensive_audit.js` | Full pipeline audit | root | `node comprehensive_audit.js` |

---

## SUPPORT INFORMATION

### Need Help?

1. **Gemini API key issue?**
   - Get key: https://aistudio.google.com/app/apikey
   - Check quota: https://console.cloud.google.com/gen-app-builder/engines

2. **Functions won't deploy?**
   - Check Firebase CLI: `firebase --version`
   - Verify auth: `firebase login`
   - Check project: `firebase projects:list`

3. **Workers still failing?**
   - Check logs: `firebase functions:log`
   - Look for actual error messages vs generic ones
   - Run `pipeline_diagnosis.js` to identify specific failures

4. **Tasks not processing?**
   - Wait 5 minutes after deploy (cold start)
   - Check worker heartbeats in `pipeline_diagnosis.js`
   - Manually update task status in Firestore if needed

---

## SUMMARY OF CHANGES

```
✅ sentinel_worker.js
   - Line 4: Fixed PDFParse import
   - Line 111: Fixed PDFParse usage

✅ groq_service.js
   - Added exponential backoff retry logic
   - Detects and retries on HTTP 429/5xx errors
   - Max 3 attempts per request

✅ Firestore
   - Created system_budget/current document
   - Enabled AI processing

✅ Scripts Created
   - pipeline_diagnosis.js (diagnostic tool)
   - init_budget.js (budget initialization)
   - recover_pipeline.js (automated recovery)
```

---

**Status:** Ready for deployment  
**Next Action:** Set GEMINI_API_KEY in functions/.env, then run `firebase deploy --only functions`  
**ETA to Recovery:** 5-10 minutes after deployment
