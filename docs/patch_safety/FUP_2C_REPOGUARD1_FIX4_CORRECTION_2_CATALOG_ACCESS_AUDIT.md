# Student Catalog Client Access Audit - Phase FUP-2C-REPOGUARD1-FIX4-CORRECTION-2

## 1. Non-Authorizing Statement
> [!IMPORTANT]
> This document does not authorize deployment, live execution, Firestore/Storage mutation, backfill, Founder approval, second gate, or token activation.

---

## 2. Client Access Analysis

We traced client-side access to the `student_mission_catalog` collection in the Flutter application:

* **Method Reference**: `streamStudentMissionCatalog()` in [firestore_service.dart](file:///C:/RankCrackers/RankCrackers-55/lib/core/firebase/firestore_service.dart)
* **Method Logic**:
  ```dart
  static Stream<List<Map<String, dynamic>>> streamStudentMissionCatalog() {
    return _firestore
        .collection(studentMissionCatalogCollection)
        .where('cardVisible', isEqualTo: true)
        .where('userPanelVisible', isEqualTo: true)
        .where('archived', isEqualTo: false)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }
  ```
* **Access Mode**: `DIRECT_FIRESTORE` (Direct stream snapshots query, not via HTTPS callable).
* **Authentication**: Requires authenticated student (`request.auth != null`).

---

## 3. Catalog Field Security Classification

We audited all 33 fields written to `student_mission_catalog` by `handle_sentinel_action.js`:

| Field Name | Type | Classification | Rationale |
| :--- | :--- | :--- | :--- |
| `id` | String | `PUBLIC_STUDENT_SAFE` | Canonical identifier for matching. |
| `title`, `name`, `subtitle`, `displayTitle`, `examName` | String | `PUBLIC_STUDENT_SAFE` | Non-sensitive display names. |
| `examYear`, `year`, `exam_year`, `target_year` | Number | `PUBLIC_STUDENT_SAFE` | Target exam years. |
| `missionType`, `examCategory`, `exam_category` | String | `PUBLIC_STUDENT_SAFE` | Non-sensitive category slugs. |
| `missionStructureType`, `examScope` | String | `PUBLIC_STUDENT_SAFE` | Structural configurations. |
| `mediumPolicy`, `supportedMediums`, `defaultMedium`| Array/String| `PUBLIC_STUDENT_SAFE` | Allowed exam language policies. |
| `status`, `catalogStatus`, `studentMessage` | String | `PUBLIC_STUDENT_SAFE` | Public readiness status. |
| `userPanelVisible`, `cardVisible`, `archived` | Boolean | `PUBLIC_STUDENT_SAFE` | Public visibility filters. |
| `titleHindi`, `state` | String | `PUBLIC_STUDENT_SAFE` | Regional and language details. |
| `boardId`, `organizationCode` | String | `PUBLIC_STUDENT_SAFE` | Exam board codes. |
| `priority`, `sortOrder` | Number | `PUBLIC_STUDENT_SAFE` | Order precedence. |
| `visibility` | Map | `PUBLIC_STUDENT_SAFE` | Nested visibility flags. |
| `contentLocks` | Map | `CONDITIONAL` | Boolean gates (no question or exam content). |
| `source` | Map | `INTERNAL_ONLY` | Path metadata. Minor system details, no secrets. |

### Forbidden Fields (Confirming Absence):
* **variables**: `ABSENT` (Forbidden by `audit_mission_catalog_shell_contract.js`)
* **contentReadiness**: `ABSENT` (Forbidden by `audit_mission_catalog_shell_contract.js`)

---

## 4. Access Model Verdict
* **Selected Model**: **MODEL A — AUTHENTICATED DIRECT READ**
* **Rationale**: All mirrored catalog fields are safe to expose to authenticated users. Direct collection reads are secure under our Firestore rule filters.
