UPLOAD PIPELINE BLOCKAGE ANALYSIS
==========================================

Generated: 2026-06-16

CRITICAL FINDINGS
=================

1. 🔴 PDF EXTRACTION IS BROKEN
   Location: functions/workers/sentinel_worker.js (Line ~120)
   Issue: "pdf is not a function"
   Impact: 23 failures from PDF parsing task type
   
   Problem: The PDFParse import is incorrect:
   Current: const { PDFParse } = require("pdf-parse");
   Should be: const PDFParse = require("pdf-parse");
   
   Root Cause: pdf-parse exports the function directly, not as a named export.

2. 🔴 LLM ORCHESTRATOR RATE LIMITED
   Location: functions/services/llm_orchestrator.js (or vertex_ai_service.js)
   Issue: GROQ API returning HTTP 429 (too many requests)
   Impact: 7+ recent failures with "ORCHESTRATION_EXHAUSTED"
   
   Problem: GROQ free tier has very low rate limits (~30 requests/min).
   Solution: Implement exponential backoff + retry logic, or switch to Gemini/OpenAI.

3. 🔴 GEMINI API AUTHENTICATION FAILURE
   Location: functions/services/vertex_ai_service.js
   Issue: Google Gemini API returning auth errors
   Last Error: "[GoogleGenerativeAI Error]: Error fetching from https://gene..."
   
   Problem: GEMINI_API_KEY may be expired, rotated, or missing from .env

4. 🔴 BUDGET SYSTEM MISSING
   Location: Firestore collection "system_budget" (missing document)
   Issue: AI system marked as DISABLED (budget kill-switch)
   Impact: Workers may be returning early without processing tasks
   
   Status: 2 STRUCTURAL tasks stuck in "pending" since June 13 (72+ hours)

5. ⚠️ STRUCTURAL WORKER HEARTBEAT STALE
   Last Heartbeat: 2026-06-13T15:01:21.789Z (3+ days old)
   Error Count: 2 (Gemini API failure)
   
   Likely cause: Worker crashed or stopped after Gemini auth failure.

6. ⚠️ SVO WORKER HEARTBEAT STALE  
   Last Heartbeat: 2026-06-13T14:48:20.789Z (3+ days old)
   Error Count: 34 (GROQ rate limiting)
   
   Impact: 2 encoding tasks stuck in "pending"

BLOCKED PIPELINE STATE
======================

Current Queue Status:
  - 1 task CLASSIFIED (but has error: "pdf is not a function")
  - 1 task FAILED (HTTP 403)
  - 2 tasks PENDING (STRUCTURAL type - stuck since June 13)
  - 15 tasks SKIPPED_DUPLICATE
  - 1 task COMPLETED (with error)

Stuck in "under_review":
  - 1 sentinel_draft (recruitment_notification)
  - 1 ingestion_refinery item

REMEDIATION STEPS (PRIORITY ORDER)
===================================

1. FIX PDF PARSING (CRITICAL - Fix Code)
   
   File: functions/workers/sentinel_worker.js (Line 7)
   
   Change:
   - const { PDFParse } = require("pdf-parse");
   + const PDFParse = require("pdf-parse");
   
   Then redeploy functions.

2. INITIALIZE BUDGET SYSTEM (CRITICAL - Add Document)
   
   Collection: system_budget
   Document ID: current
   
   Add this document to Firestore:
   {
     "tokensUsedThisMonth": 0,
     "monthlyTokenLimit": 1000000,
     "aiEnabled": true,
     "createdAt": <now>,
     "lastUpdated": <now>
   }

3. VERIFY GEMINI_API_KEY (HIGH - Check Config)
   
   Ensure functions/.env has valid GEMINI_API_KEY:
   - Test locally: node -e "const { callVertexGemini } = require('./services/vertex_ai_service'); callVertexGemini('test').then(console.log).catch(console.error);"
   - If fails, rotate key in Google Cloud Console and update .env

4. ADD RETRY LOGIC FOR GROQ (HIGH - Update Code)
   
   File: functions/services/llm_orchestrator.js
   
   Add exponential backoff:
   - Use retry-request library or implement manual retry with jitter
   - Max retries: 3-5 with exponential backoff (500ms, 1s, 2s, etc.)
   - Fallback to Gemini if GROQ fails

5. RESTART WORKERS (MEDIUM - Deploy)
   
   After code fixes, redeploy functions:
   firebase deploy --only functions
   
   This will restart all workers and clear stale heartbeats.

6. REPLAY STUCK TASKS (MEDIUM - Manual)
   
   After fixes are deployed:
   
   a) Clear old pending tasks:
      - Query ai_queue where status == "pending" AND createdAt < 3 days ago
      - Delete or update status to "pending_retry"
   
   b) Trigger reprocessing:
      - Update them back to "received" to trigger sentinel_worker

7. MONITOR RECOVERY (LOW - Ongoing)
   
   - Watch ai_failed_tasks for new errors
   - Check worker_registry heartbeats (should update every minute)
   - Monitor system_budget token usage

QUICK TEST COMMANDS
===================

After deploying fixes:

1. Check if Gemini works:
   cd functions
   node -e "require('dotenv').config(); const { callVertexGemini } = require('./services/vertex_ai_service'); callVertexGemini('Hello').then(console.log).catch(console.error);"

2. Check worker status:
   npm run serve
   # Then in another terminal:
   NODE_PATH=./node_modules node ../pipeline_diagnosis.js

3. Manual task injection (after fixes):
   firebase functions:shell
   > const admin = require('firebase-admin');
   > await admin.firestore().collection('ai_queue').add({
       type: 'pdfParse',
       status: 'received',
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
       payload: { id: 'test123', fileType: 'pdf', filePath: 'path/to/file.pdf' }
     });

CURRENT ERROR SUMMARY
====================

Worker Status:
  sentinel_worker:   23 errors ("pdf is not a function" × 1, others?)
  structural_worker: 2 errors ("GEMINI_API_FAILURE")
  svo_worker:        34 errors ("GROQ_FAILURE" × 7, others?)

Queue Summary:
  Total Tasks: 20
  Failed: 1
  Pending: 2 (STUCK since June 13)
  Skipped: 15
  Completed: 1 (with error)

Recommendation: Fix #1 (PDF parsing) first as it's causing the majority of failures.
Then address #2 (budget system) and #3 (Gemini auth). After that, the pipeline should unblock.
