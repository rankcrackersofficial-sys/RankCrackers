# FUP-2C-BASELINE1 — Current Pagewise Baseline

## Purpose
Accept and document the current pagewise validation baseline before QCELL2 canonicalKey preflight.

## Why Reconciliation Is Needed
QCELL1-FIX0 proved that the old accepted Post-P14 baseline is stale. The live pagewise state has advanced independently, so future QCELL validation should use a current baseline gate instead of the historical Post-P14 gate.

## Previous Accepted Baseline
| Metric | Value |
| --- | ---: |
| Total tasks | 104 |
| Active | 64 |
| Completed | 37 |
| Failed | 3 |
| Processing | 0 |
| Page extractions | 118 |

## Current Actual Baseline
| Metric | Value |
| --- | ---: |
| Total tasks | 104 |
| Active | 61 |
| Completed | 40 |
| Failed | 3 |
| Processing | 0 |
| Page extractions | 133 |

## Drift Table
| Metric | Drift |
| --- | ---: |
| Active | -3 |
| Completed | +3 |
| Failed | 0 |
| Processing | 0 |
| Page extractions | +15 |

## Evidence Source
- `audit:pagewise:current-baseline-result`
- `audit:worker-training:current-pagewise-baseline`
- `docs/patch_safety/FUP_2C_BASELINE1_validation.txt`

## QCELL Responsibility
QCELL did not cause this drift. QCELL1-FIX0 was read-only for pagewise state.

## Safety Locks
- No extraction apply
- No Firestore writes
- No page_extractions writes
- No syllabus_atoms mutation
- No canonicalKey write
- No atomic_question_cells write
- No topic_nodes publish
- No student delivery change
- No AI/OCR/Pro AI call
- No Firebase deploy

## Validation Gate Policy
The old Post-P14 audit remains historical evidence. Future QCELL2 and later phases should use:
- `audit:pagewise:current-baseline-result`
- `audit:worker-training:current-pagewise-baseline`

Do not rename the old Post-P14 script as current. The current baseline is accepted only through BASELINE1.

## Recommended Next Phase
FUP-2C-QCELL2 — CanonicalKey Write Preflight.
