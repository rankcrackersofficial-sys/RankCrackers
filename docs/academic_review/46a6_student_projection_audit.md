# 46A6 Student Projection Contract Audit Report

- **Gate**: `RC_CANONICAL_MISSION_PROFILE_MATERIALIZATION_ENGINE_46A6`
- **Agent**: `AGENT-2 — BACKEND / ACADEMIC FACTORY IMPLEMENTATION`
- **Audit Target**: Student runtime read paths, model binding, and Founder-to-Student projection mechanisms.

---

## 1. Student Runtime Audit Matrix

| Metric / Parameter | Value / Finding | Contract Status |
|---|---|:---:|
| **`STUDENT_PROFILE_READ_PATH`** | `student_mission_catalog/{missionId}` | ACTIVE CANONICAL |
| **`STUDENT_VARIANT_READ_PATH`** | `student_mission_catalog/{missionId}.missionVariables.subject_variables` | ACTIVE CANONICAL |
| **`STUDENT_LEGACY_VARIANT_PATH`** | `mission_variants` (where `parentRecruitmentId == missionId`) | RETIRED / FALLBACK ONLY |
| **`FOUNDER_PROFILE_TO_STUDENT_PROJECTION`** | **`DERIVED`** | REQUIRES ADAPTER EXTENSION |
| **`STUDENT_FLUTTER_UI_MUTATION`** | **`FORBIDDEN`** (Zero Dart UI changes permitted) | PRESERVED |

---

## 2. Flutter Student Discovery & Model Flow

In `lib/core/firebase/firestore_service.dart` (lines 462–475):
```dart
static Stream<List<Recruitment>> streamStudentMissionCatalogRecruitments() {
  return _firestore
      .collection('student_mission_catalog')
      .where('cardVisible', isEqualTo: true)
      .where('userPanelVisible', isEqualTo: true)
      .where('archived', isEqualTo: false)
      .snapshots()
      .map((snapshot) => snapshot.docs
          .where((doc) => _hasCanonicalMissionLineage(doc.id, doc.data()))
          .map((doc) => _studentCatalogDocToRecruitment(doc.id, doc.data()))
          .toList());
}
```

- Students consume the catalog through `RecruitmentRepository.streamPublished()`.
- Each document in `student_mission_catalog` is mapped into a `Recruitment` model where:
  - `missionVariables` are parsed via `_extractMissionVariables(data)`.
  - `variantCode` determines the active variant context.
  - Content locks (`syllabusPublished`, `cruciblePublished`, `digibookPublished`) gate student access to study materials.

---

## 3. Exact Backend Projection Gap

Currently, `functions/callable/handle_sentinel_action.js` contains `mirrorMissionShellToStudentCatalog` which collects variables via `collectMissionVariables(realmData, recruitmentData)`.

### The Gap:
1. **No Canonical Profile Mirroring**: `student_mission_catalog` does not currently receive the structured `paperModel`, `variantModel` (with parent/subvariant relationships), or `subjectModel` from `mission_realms/{missionId}/canonical_profile`.
2. **Variant Granularity Gap**: Variant selections (such as RPSC 1st Grade's 23 disciplines and Coach subvariants) are currently only partially represented in `subject_variables`.
3. **S2 Profile Isolation**: S2 document profile metadata is not projected to students (which is correct, as S2 is an ingestion/parsing specification, not student UX).

### Proposed Backend Projection Mechanism:
The materialization engine will provide an idempotent projection function:
```
projectCanonicalProfileToStudentCatalog(canonicalProfile) -> StudentCatalogProjection
```
This maps:
- `paperModel` $\rightarrow$ `student_mission_catalog/{missionId}.examStructure.papers`
- `variantModel.variants` $\rightarrow$ `student_mission_catalog/{missionId}.missionVariables.subject_variables`
- `languageModel` $\rightarrow$ `student_mission_catalog/{missionId}.missionVariables.{mediumPolicy, supportedMediums, defaultMedium}`
- `profileHash` $\rightarrow$ `student_mission_catalog/{missionId}.canonicalProfileHash`

Zero client-side Flutter changes are required because the projection conforms directly to the existing `Recruitment` and `_extractMissionVariables` consumer contracts.
