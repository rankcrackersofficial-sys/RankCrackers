# 46D5 Independent Baseline and Repair Gate Verifier

**Gate**: `RC_CANONICAL_MISSION_AUTHORITY_INDEPENDENT_BASELINE_AND_REPAIR_GATE_46D5`  
**Agent**: `AGENT-3 — INDEPENDENT RUNTIME / DATA BREAKER`  
**Role**: Independent verifier (Zero Production Mutation / Zero UI Modification / Zero Deployment)  
**Target Repair Mission**: `RC_CANONICAL_MISSION_REALM_PRESERVATION_REPAIR_46A5` (Agent-2)  

---

## 1. Target Mission Matrix

The independent verification gate covers the exact 3 canonical pilot missions:

| # | Mission ID | Canonical Display Name | Target Year | Category | Organization / Board |
|---|---|---|---|---|---|
| 1 | `jee_main_2026` | **JEE Main 2027** | 2027 | Engineering | NTA / Central |
| 2 | `neet_(ug)-2027` | **NEET (UG)-2027** | 2026 | Medical | NTA / Central |
| 3 | `RPSC_FIRST_GRADE2026_2026_1782713222215` | **RPSC 1st Grade** | 2026 | Teaching | RPSC / Rajasthan |

---

## 2. Phase 1 — Independent Live Before Baseline

- **`BASELINE_CAPTURED`**: **`YES`**
- **Baseline JSON Artifact**: `docs/academic_review/46d5_independent_before_baseline.json`
- **Overall Baseline Digest**: `38e9a25b2f81907fc9a59b34204481d4cf2f01eb0fce7c0932c02111dae01614`

### Summary of Live Before Baseline State:

1. **`jee_main_2026`**:
   - `recruitments`: Exists (`status: 'draft'`, `year: 2027`, SHA-256: `a1f04b4c3e06f23e42998a44b82f8a84db349887754f9a0c0e86bfa332ef4f12`).
   - `student_mission_catalog`: Exists (`status: 'PREPARING'`, `cardVisible: true`, `userPanelVisible: true`, SHA-256: `7ec9d4eb4501eb31a89c7923ba8681f21d3f4439c3e9860b777a28892d1ce79c`).
   - `mission_realms` Parent: Missing canonical root authority (`exists: false`, UI status: `AUTHORITY REPAIR REQUIRED`).
   - Subcollections: `official_documents` (1 doc, 140 page extractions), `syllabus_atoms` (211 active + 12 held duplicate = 223 atoms), `crucible_days` (1 doc).

2. **`neet_(ug)-2027`**:
   - `recruitments`: Exists (`status: 'draft'`, `year: 2026`, SHA-256: `5849842a22be2fa8d390a8a6be96041ec6f4370c0c662bd8788a1042733b8691`).
   - `student_mission_catalog`: Exists (`status: 'COMING_SOON'`, `cardVisible: true`, `userPanelVisible: true`, `recruitmentGroupId: 'student_mission_catalog'` [DEFECTIVE POINTER], SHA-256: `9369f6bbceaa42d453818e69c11867c4eeff7142436f5635fdb139b8bc14a7e6`).
   - `mission_realms` Parent: Missing canonical root authority (`exists: false`, UI status: `AUTHORITY REPAIR REQUIRED`).
   - Subcollections: `official_documents` (1 doc, 14 page extractions: 67–80), `syllabus_atoms` (7 verified atoms), `crucible_days` (0 docs).

3. **`RPSC_FIRST_GRADE2026_2026_1782713222215`**:
   - `recruitments`: Exists (`status: 'draft'`, `year: 2026`, SHA-256: `c2084c8a514d79ce7cfc6f4cf9fa1d5ee1e7b454924c5221ffc2f6d6ee48cf49`).
   - `student_mission_catalog`: Exists (`status: 'COMING_SOON'`, `cardVisible: true`, `userPanelVisible: true`, SHA-256: `d80b7ff2384a86fca6e64db803eeefcf24bfa7f2fdfd885897669d6eeea79075`).
   - `mission_realms` Parent: Missing canonical root authority (`exists: false`, UI status: `AUTHORITY REPAIR REQUIRED`).
   - Subcollections: `official_documents` (1 doc), `syllabus_atoms` (0 docs), `crucible_days` (0 docs).

---

## 3. Phase 2 — Known Blockers Reproduction & Forensic Evidence

### 1. `MISSING_REALM_PARENT_COUNT = 3` — PROVEN
- **Evidence**: In `lib/web/founder/mission_control/founder_mission_inventory.dart` (lines 224–256) and `lib/web/founder/mission_control/mission_variable_authority_panel.dart` (lines 112–128), and `lib/main_web.dart` (lines 730–760), UI panels evaluate `realmDoc.exists == false` when querying `mission_realms/{missionId}`.
- **Impact**: All 3 missions display `AUTHORITY REPAIR REQUIRED` and variable changes are blocked (`VARIABLE CHANGES LOCKED — Authority repair required.`).
- **Target Missing Count**: Exactly `3` parent documents missing.

### 2. NEET `recruitmentGroupId` Defect — PROVEN
- **Evidence**: In `student_mission_catalog/neet_(ug)-2027`, the field `recruitmentGroupId` was recorded as `"student_mission_catalog"` (the collection name) instead of `"neet_(ug)-2027"` (the mission ID).
- **Backend Gate Collision**: In `functions/callable/handle_sentinel_action.js` (lines 1071–1080), `mirrorMissionShellToStudentCatalog` checks:
  ```javascript
  const checks = {
    id: existing.id || existing.mission_id || realmId,
    mission_id: existing.mission_id || existing.id || realmId,
    recruitment_id: existing.recruitment_id || existing.recruitmentGroupId || realmId,
    recruitmentGroupId: existing.recruitmentGroupId || existing.recruitment_id || realmId
  };
  if (checks.recruitmentGroupId !== realmId) {
    throw new Error('FAILED_PRECONDITION: Identity mismatch detected for immutable fields.');
  }
  ```
- **Impact**: Because `'student_mission_catalog'` !== `'neet_(ug)-2027'`, any transactional update touching NEET throws `FAILED_PRECONDITION`. Repairing this specific pointer is the ONLY allowed catalog modification.

### 3. `manifest_realm` Would Mutate Non-Repair Fields — PROVEN
- **Evidence**: Inspection of `functions/callable/handle_sentinel_action.js` (lines 457–498) proves that executing `manifest_realm` triggers:
  1. Overwriting mission status to `'STAGED'`.
  2. Mutating `recruitments/{id}` via `transaction.update(recRef, { status: 'MANIFESTED' })`.
  3. Auto-publishing drafts in `sentinel_drafts`.
  4. Full re-mirroring to `student_mission_catalog`.
- **Verdict**: Calling `manifest_realm` for repair would violate the Zero Unauthorized Mutation contract. Agent-2 MUST use an isolated, surgical preservation repair instead.

---

## 4. Phase 3 — Read-Only Verification Harness

Created standalone harness: `tools/academic_factory/verify_46d5_independent_gate.js`.

### Harness Design & Safety Guarantees:
1. **Zero Mutation Path**: The harness contains no `.set()`, `.update()`, `.delete()`, or `.add()` operations.
2. **Deterministic Hash Verification**: Compares SHA-256 semantic hashes of before and after snapshots.
3. **Field-Level Mutation Detection**:
   - `recruitments`: 0 mutations allowed.
   - `student_mission_catalog`: 0 mutations allowed, EXCEPT `recruitmentGroupId: "student_mission_catalog"` $\rightarrow$ `"neet_(ug)-2027"`.
   - `lifecycleState`: 0 mutations allowed across catalog and recruitment status fields.
   - `visibility`: 0 mutations to `cardVisible`, `userPanelVisible`, `visibility`, `studentVisible`.
   - `publicationState`: 0 mutations to publication flags.
   - `contentLocks`: 0 mutations to content locks.
   - `subcollections`: 0 subcollections deleted, pruned, or truncated; atom counts must remain $\ge$ baseline count.

---

## 5. Phase 4 — Expected Repair Contract (10 Invariants)

Agent-2 (`RC_CANONICAL_MISSION_REALM_PRESERVATION_REPAIR_46A5`) must satisfy all 10 invariants:

1. **`realm_parent_created_for_exact_existing_mission_id`**: Parent created under `mission_realms/{missionId}` for `jee_main_2026`, `neet_(ug)-2027`, `RPSC_FIRST_GRADE2026_2026_1782713222215`.
2. **`no_duplicate_mission`**: Zero shadow or duplicate mission documents created.
3. **`no_recruitment_mutation`**: `recruitments` collection remains completely untouched.
4. **`no_non_approved_catalog_mutation`**: `student_mission_catalog` remains untouched except the NEET `recruitmentGroupId` fix.
5. **`no_lifecycle_mutation`**: No status field shifted to `STAGED` or altered.
6. **`no_visibility_mutation`**: Visibility and student eligibility flags preserved.
7. **`no_publication_mutation`**: Publication states preserved.
8. **`no_content_lock_mutation`**: Content locks preserved.
9. **`no_academic_mutation`**: Syllabus atoms, questions, and page extractions preserved.
10. **`second_run_idempotency`**: Running the repair a second time produces 0 additional mutations.

---

## 6. Phase 5 — Waiting Gate & Execution Protocol

### Pre-Repair State:
- Independent baseline captured and hashed.
- Blockers forensically verified.
- Verification harness compiled, tested, and ready.

### Post-Repair Evaluation Trigger:
When Agent-2 signals:
`46A5_CANONICAL_REALM_AUTHORITY_REPAIRED`

Agent-3 will execute:
`node tools/academic_factory/verify_46d5_independent_gate.js --verify-after <post_repair_snapshot.json>`

And report the certification metrics:
- `CANONICAL_TO_REPAIR_SET_EQUAL`
- `UNAUTHORIZED_MUTATION_COUNT`
- `MISSING_REALM_PARENT_COUNT_AFTER`
- `NEET_POINTER_ONLY_ALLOWED_DIFF`
- `SECOND_RUN_IDEMPOTENCY`

---

## 7. Final Pre-Repair Verdict

```
===============================================================================
FINAL PRE-REPAIR VERDICT:
46D5_REPAIR_VERIFIER_READY_WAITING_FOR_46A5
===============================================================================
```
