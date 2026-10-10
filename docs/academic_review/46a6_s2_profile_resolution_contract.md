# 46A6 Stage 2 (S2) Profile Resolution Contract

- **Gate**: `RC_CANONICAL_MISSION_PROFILE_MATERIALIZATION_ENGINE_46A6`
- **Agent**: `AGENT-2 — BACKEND / ACADEMIC FACTORY IMPLEMENTATION`
- **Status**: **`CANONICAL_SPECIFICATION_VERIFIED`**

---

## 1. Objective & Purpose

The **Generic S2 Profile Resolver** dynamically bridges a canonical mission profile to the Stage 2 (S2) Document Extraction & Structured Syllabus Materialization pipeline (Generic B3 / B4 workers).

### Key Responsibilities:
1. Provide extraction workers with authoritative paper boundaries, expected subjects, aliases, OCR language requirements, and variant/family context.
2. Replace ad-hoc, hardcoded worker configurations with a unified, governed contract.
3. Enforce **strict fail-closed resolution**: If a mission profile is missing or invalid, extraction is halted (`HOLD`) with zero fabricated defaults.

---

## 2. Fail-Closed S2 Resolution Law

> [!CAUTION]
> **No Synthetic Default Structures**:  
> In the absence of a verified mission profile, the resolver will **NEVER** fabricate fallback entities such as `paper_default`, `unknown_subject`, or generic placeholder syllabi.
> 
> Required invariant:
> `MISSING_PROFILE_FALLBACK_TO_FAKE_STRUCTURE_COUNT = 0`

### Decision Matrix:
| Profile Condition | Resolver Action | S2 Pipeline Status | Output Payload |
|---|---|:---:|---|
| **Profile Missing (`null` / `undefined`)** | Fail Closed | **`HOLD`** | `{ status: 'HOLD', reason: 'MISSING_CANONICAL_MISSION_PROFILE' }` |
| **Profile Validation Failed** | Fail Closed | **`HOLD`** | `{ status: 'HOLD', reason: 'INVALID_CANONICAL_MISSION_PROFILE', errors: [...] }` |
| **`profileStatus === 'HOLD_FOR_REVIEW'`** | Fail Closed | **`HOLD`** | `{ status: 'HOLD', reason: 'PROFILE_STATUS_HOLD_FOR_REVIEW' }` |
| **Profile Verified & Ready** | Resolve Context | **`READY`** | Complete, governed `s2DocumentProfile` payload |

---

## 3. Resolver Output Payload Specification

When a valid profile is resolved, the resolver produces:

```typescript
interface ResolvedS2DocumentProfile {
  missionId: string;
  canonicalExamName: string;
  missionTargetYear: number;
  sourceBaselineYear: number;
  cycleRelation: string;
  expectedPapers: string[];
  paperAliases: Record<string, string[]>;
  expectedSubjects: string[];
  subjectAliases: Record<string, string[]>;
  variantContext: string | null;
  activePaperFamily: {
    familyId: string;
    familyName: string;
    applicableVariants: string[];
    paperIds: string[];
  } | null;
  languageScripts: string[];
  preferredOcrLanguages: string[];
  sourceYearPolicy: string;
  provenanceTag: string;
  profileHash: string;
}
```

---

## 4. Integration with Generic B3 / B4 Extraction Workers

Stage 2 extraction workers (`genericStructuredSyllabus.ts`, `physicalPageAuthority.ts`) consume `ResolvedS2DocumentProfile` to:
1. **Authorize Scope Boundaries**: Validate that incoming page extractions match `expectedPapers` and `expectedSubjects`.
2. **Normalize Section Titles**: Match extracted document headers against `paperAliases` and `subjectAliases`.
3. **Bind Optical Character Recognition (OCR)**: Configure OCR engines (e.g. Gemini / Tesseract) using `preferredOcrLanguages` (e.g. `['eng', 'hin']`) and `languageScripts` (e.g. `['Latin', 'Devanagari']`).
4. **Isolate Variant Trees**: Ensure discipline-specific papers (e.g. RPSC Paper 2 English vs. Hindi) are only processed under their respective `activePaperFamily`.
