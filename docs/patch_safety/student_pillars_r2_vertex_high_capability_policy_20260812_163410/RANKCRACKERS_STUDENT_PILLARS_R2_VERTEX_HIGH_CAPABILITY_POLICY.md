# RankCrackers Student Pillars R2 - Vertex/Gemini Higher Capability Policy

Verdict:
RANKCRACKERS_STUDENT_PILLARS_R2_EXECUTION_CONTRACT_AND_VERTEX_HIGHER_TIER_POLICY_PASSED

Starting HEAD:
9b40e1857a3bbb17830f83338726cd69a49eacc9

Founder authorization:
Use the highest safe Vertex/Gemini capability tier where RankCrackers already uses Gemini/Vertex-style AI, but only for backend/offline academic factory work.

Implemented scope:
- Added R2 execution contract validators under tools/student_pillars_r2.
- Added vertex_policy.json with RC_VERTEX_MODEL as the explicit model selection hook.
- Upgraded backend Gemini defaults from legacy 1.5 model names to Gemini 2.5 defaults.
- Added env override path: RC_VERTEX_MODEL, with RC_GEMINI_MODEL fallback.
- Removed Flutter metadata hardcode of gemini-1.5-pro; student app remains backend-policy controlled.

Backend model routing:
- Default pro model: gemini-2.5-pro
- Default flash model: gemini-2.5-flash
- Explicit override: RC_VERTEX_MODEL
- Compatibility override: RC_GEMINI_MODEL

Academic safety contract:
- Model output is candidate assistance, not canonical academic truth.
- Source grounding is required.
- Independent review is required before student delivery.
- No AI answer/solution is official unless official source proof exists.
- No automatic ready promotion.
- No automatic student publish.

Allowed AI use:
- official source extraction assistance
- syllabus hierarchy candidate resolution
- Crucible draft/question assistance
- answer candidate generation for review
- DigiBook draft generation
- cross-check assistance

Forbidden AI use:
- student runtime chat
- live student answer generation
- unsourced academic truth
- automatic student publish
- automatic ready promotion
- automatic answer key approval

Validation:
- node --check functions/services/gemini_service.js: PASS
- node --check functions/lib/providers/geminiProvider.js: PASS
- R2 Python validator py_compile: PASS
- vertex_policy.json parse: PASS
- dart analyze lib/core/ai/workers/knowledge_expansion_worker.dart: PASS
- Gemini model resolver defaults and RC_VERTEX_MODEL override: PASS

Official model reference used:
- Firebase AI Logic supported models lists gemini-2.5-pro and gemini-2.5-flash as GA/stable model names.
- Google AI for Developers documents gemini-2.5-flash as a stable Gemini API model.

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