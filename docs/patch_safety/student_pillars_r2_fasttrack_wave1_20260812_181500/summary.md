# RANKCRACKERS STUDENT PILLARS R2 FASTTRACK WAVE-1

## Verdict

RANKCRACKERS_STUDENT_PILLARS_R2_FASTTRACK_WAVE1_PARALLEL_ACADEMIC_MOVEMENT_PASSED_WITH_DIGIBOOK_HOLD

## Baseline

- Baseline: 36f00384cfe5a629e52cd1af54316d2453a39e2d
- Backend: Vertex AI through ADC
- Flash actual: gemini-3.6-flash
- Pro actual: gemini-3.1-pro-preview
- Silent fallback count: 0

## Denominator Movement

- Syllabus: 211/417 -> 211/417
- Syllabus attempted: 26
- Syllabus newly verified: 0
- Syllabus held for source: 26
- Crucible packs: 1/8 -> 2/8
- Crucible Macro reviewed: 1/7 -> 2/7
- Crucible Major reviewed: 0/1 -> 0/1
- Crucible verified academic answer keys: 1/8 -> 2/8
- DigiBook: 2/417 -> 2/417
- DigiBook attempted: 20
- DigiBook approved: 0
- DigiBook held/rejected: 20

## Academic Notes

Macro test 2 received a Flash draft and Pro review. The Pro review passed 12/12 items for answer correctness, solution correctness, scope, and multiple-correct risk. Its answer key is a RankCrackers verified academic answer key, not an official answer key.

DigiBook Wave-1 did not receive approval because the model returned malformed JSON during the draft/review chain. Those 20 atoms are held; no fake approval was made.

Syllabus Wave-1 selected 26 source-traced atoms, but the first selected set still had untrusted Unit/Chapter hierarchy. They remain held for source-backed hierarchy verification; no model-only promotion was made.

## Validators

- R2_FASTTRACK_WAVE1_VALIDATION=PASS
- R2_FASTTRACK_PROGRESS_VALIDATION=PASS
- CRUCIBLE_R2B_VALIDATION=PASS
- DIGIBOOK_R2C_BATCH_VALIDATION=PASS

## Safety

- NO_PRODUCTION_READ
- NO_PRODUCTION_WRITE
- NO_FIRESTORE_WRITE
- NO_RULES_CHANGE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_STUDENT_RUNTIME_AI
- MODEL_ONLY_CANONICAL_PROMOTIONS=0
- STUDENT_READY=false
- PRODUCTION_READY=false
