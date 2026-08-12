# RANKCRACKERS STUDENT PILLARS R2 FASTTRACK VERTEX ADC FACTORY ACTIVATION

## Verdict

RANKCRACKERS_STUDENT_PILLARS_R2_FASTTRACK_VERTEX_FACTORY_ACTIVATED_AND_FIRST_LIVE_ACADEMIC_MOVEMENT_PASSED_WITH_PARTIAL_DENOMINATOR_MOVEMENT

## Baseline

- Starting HEAD: `04c2884e62e5ce282b34b4a40a52a750c4e0e746`
- Backend route: Vertex AI through ADC
- Firebase / Firestore production data: untouched
- Student runtime AI: not enabled
- Deploy: not run

## Vertex ADC Factory

- SDK path: `@google/genai`
- ADC project: `rankcrackers-55`
- Location: `global`
- API: `aiplatform.googleapis.com` enabled
- Auth: Application Default Credentials available
- API key: not required and not committed
- Silent fallback: disabled

## Model Probes

- Flash workload: `gemini-3.6-flash`
- Pro workload: `gemini-3.1-pro-preview`
- Pro bounded retry: succeeded after quota backoff
- Fallback used: false

## Academic Movement

The first live academic movement was intentionally narrow. The existing Mechanics Foundations Macro assessment pack was reviewed through Vertex Pro and passed independent technical review.

- Slot: `macro_test_1`
- Items reviewed: 12
- Item/source alignment: PASS
- Answer technical correctness: PASS
- Solution technical correctness: PASS
- Multiple-correct risk: PASS
- Scope leakage: PASS
- Answer key verified: PASS
- Student ready: false
- Official answer key: false

## Denominator Movement

- Syllabus verified: 211/417 unchanged
- Crucible question packs ready: 1/8
- Crucible reviewed macro slots: 1/7
- Crucible reviewed major slots: 0/1
- Crucible answer keys verified: 1/8
- DigiBook approved atoms: 2/417 unchanged
- Production ready: false

## Evidence Files

- `tools/student_pillars_r2_fasttrack/vertex_adc_policy.json`
- `tools/student_pillars_r2_fasttrack/validate_vertex_adc_policy.py`
- `tools/student_pillars_r2_fasttrack/vertex_factory_client.js`
- `tools/student_pillars_r2_fasttrack/vertex_factory_probe.js`
- `tools/student_pillars_r2_fasttrack/run_crucible_macro1_pro_review.js`
- `docs/patch_safety/student_pillars_r2_fasttrack_vertex_batch_20260812_173300/macro_test_1_pro_review.json`
- `docs/patch_safety/student_pillars_r2_fasttrack_vertex_batch_20260812_173300/crucible_r2b_8_slot_register_after_pro_review.json`
- `docs/patch_safety/student_pillars_r2_fasttrack_vertex_batch_20260812_173300/student_pillars_r2_fasttrack_progress_after_vertex_batch.json`

## Safety

- NO_PRODUCTION_READ
- NO_PRODUCTION_WRITE
- NO_FIRESTORE_WRITE
- NO_RULES_CHANGE
- NO_DEPLOY
- NO_STUDENT_RUNTIME_AI
- MODEL_OUTPUT_NOT_CANONICAL_TRUTH
- STUDENT_READY_FALSE
- PRODUCTION_READY_FALSE
