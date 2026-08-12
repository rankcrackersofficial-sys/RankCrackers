# RankCrackers Vertex/Gemini 3.x Task-Aware Routing Upgrade

Verdict:
RANKCRACKERS_VERTEX_GEMINI_3X_TASK_AWARE_MODEL_ROUTING_PASSED

Baseline:
e09201efefc82d63ca6c6a027ee86c2c27cd8312

Architect correction:
RankCrackers should not keep Gemini 2.5 Pro/Flash as the current R2 defaults. The backend/offline factory now uses a task-aware Gemini 3.x policy.

Model policy:
- Deep reasoning / academic adjudication: gemini-3.1-pro-preview
- High-capability factory: gemini-3.6-flash
- Low-cost parsing / normalization: gemini-3.5-flash-lite
- Optional intermediate Flash fallback: gemini-3.5-flash

Explicit non-goals:
- Do not invent gemini-3.5-pro.
- Do not invent gemini-3.6-pro.
- Do not silently downgrade Pro preview work to Flash.
- Do not put Gemini credentials or direct model generation in the Flutter student app.

Implemented files:
- tools/student_pillars_r2/vertex_policy.json
- tools/student_pillars_r2/validate_vertex_3x_policy.py
- functions/services/gemini_service.js
- functions/src/providers/geminiProvider.ts
- functions/lib/providers/geminiProvider.js
- functions/workers/structural_worker.js

Backend resolver behavior:
- resolveGeminiModel('deepReasoningPro') => gemini-3.1-pro-preview
- resolveGeminiModel('factoryFlash') => gemini-3.6-flash
- resolveGeminiModel('bulkLite') => gemini-3.5-flash-lite
- legacy alias 'pro' maps to deepReasoningPro
- legacy alias 'flash' maps to factoryFlash
- RC_VERTEX_MODEL compatibility override is respected
- RC_GEMINI_MODEL compatibility override is respected
- RC_VERTEX_MODEL_PRO / FLASH / LITE task overrides are respected
- fallbackUsed defaults to false and silent fallback is not implemented

Academic safety:
- Flash can draft candidates.
- Pro preview is used for difficult academic adjudication.
- Agreement between models is not source evidence.
- Official English source evidence and review remain mandatory before student delivery.
- Any Pro unavailability must keep Pro-required artifacts REVIEW_PENDING unless an authorized review completes.

SDK audit:
- @google-cloud/vertexai deprecated generative SDK path: NOT FOUND
- @google/genai imports: NOT FOUND
- Existing backend currently uses @google/generative-ai
- functions/package-lock.json: NOT PRESENT
- No SDK migration was performed because the specific deprecated @google-cloud/vertexai path was not present.

Validation:
- validate_vertex_3x_policy.py: PASS
- vertex_policy.json parse: PASS
- node --check functions/services/gemini_service.js: PASS
- node --check functions/lib/providers/geminiProvider.js: PASS
- Gemini 3.x resolver default/override tests: PASS
- R2 validators py_compile: PASS
- forbidden model ID audit: only validator forbidden-list references remain

Official documentation cross-check:
- Google Gemini API release notes list Gemini 3.6 Flash and Gemini 3.5 Flash-Lite as GA.
- Google Gemini API deprecations list gemini-3.1-pro-preview as an active preview model with no shutdown date announced.
- Google latest-model guidance identifies Gemini 3.6 Flash and 3.5 Flash-Lite as GA/current models.

Safety proof:
NO_PRODUCTION_READ
NO_PRODUCTION_WRITE
NO_RULES_CHANGE
NO_DEPLOY
NO_STUDENT_PUBLISH
NO_FIREBASE_CONFIG_SWAP
NO_GRADLE_TOUCH
NO_STUDENT_RUNTIME_AI
MODEL_OUTPUT_NOT_CANONICAL_TRUTH
REVIEW_REQUIRED_BEFORE_STUDENT_DELIVERY
SILENT_MODEL_FALLBACK_DISABLED