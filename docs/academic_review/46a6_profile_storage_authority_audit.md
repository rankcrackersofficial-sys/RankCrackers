# 46A6 Profile Storage Authority Audit Report

- **Gate**: `RC_CANONICAL_MISSION_PROFILE_MATERIALIZATION_ENGINE_46A6`
- **Agent**: `AGENT-2 — BACKEND / ACADEMIC FACTORY IMPLEMENTATION`
- **Audit Target**: Current mission profile storage authority, schema, writer, reader, and S2 resolver across the codebase and production Firestore.

---

## 1. Storage Authority Landscape & Discovery

A complete audit of production Firestore (`rankcrackers-55`), Cloud Functions, and the Flutter client was conducted.

### Root Firestore Collections Inspected:
```
ROOT COLLECTIONS: [
  'ai_audit_logs', 'ai_failed_tasks', 'ai_queue', 'digibook_pointers',
  'digibook_revisions', 'founder_activity_log', 'micro_nodes', 'mission_realms',
  'notification_registry', 'pro_verification_queue', 'provider_budget',
  'provider_health', 'provider_usage_logs', 'published_questions',
  'rc_payment_orders', 'rc_plans', 'recruitments', 'search_index',
  'semantic_units', 'sentinel_drafts', 'source_documents',
  'student_mission_catalog', 'study_library_subjects', 'syllabus_registry',
  'system_budget', 'system_daily_usage', 'system_health_pings',
  'system_verification_sandbox', 'telemetry_nexus', 'transformation_lineage',
  'users', 'worker_registry'
]
```

**Key Discovery**: There is **no separate top-level `profiles` or `canonical_mission_profiles` collection** in Firestore.

### Existing Subcollections under `mission_realms/{missionId}`:
- **`jee_main_2026`**: `[atom_extraction_runs, atomic_question_cells, atomic_syllabus, crucible_days, crucible_plans, crucible_tests, digibook_units, exam_rules, official_documents, question_bank, question_review_queue, structured_nodes, syllabus_atoms, test_size_policy, variables]`
- **`neet_(ug)-2027`**: `[official_documents, structured_nodes, syllabus_atoms]`
- **`RPSC_FIRST_GRADE2026_2026_1782713222215`**: `[official_documents, variables]`

---

## 2. Core Authority Classification Matrix

| Component | Audit Result / Finding | Status / Path |
|---|---|---|
| **`CURRENT_PROFILE_STORAGE_PATH`** | `mission_realms/{missionId}/canonical_profile/current` | Recommended Canonical Anchor |
| **`EXISTING_VARIABLES_STORAGE_PATH`** | `mission_realms/{missionId}/variables/{variableId}` | Physical subcollection for legacy variables |
| **`RECRUITMENT_METADATA_PATH`** | `recruitments/{missionId}` | Exam lifecycle, structure, and mission plan |
| **`STUDENT_CATALOG_PATH`** | `student_mission_catalog/{missionId}` | Canonical Student projection document |
| **`CURRENT_PROFILE_SCHEMA`** | Documented in `docs/academic_review/46d6r_*_official_profile_draft.json` | Fragmented in review artifacts, normalized in 46A6 |
| **`CURRENT_PROFILE_WRITER`** | `handleSentinelAction.update_mission_variables` & `mirrorMissionShellToStudentCatalog` | Writes variables, but no unified profile materializer |
| **`CURRENT_PROFILE_READER`** | `founder_mission_inventory.dart` & `mission_variable_authority_panel.dart` | Reads `mission_realms` and `recruitments` |
| **`CURRENT_S2_PROFILE_RESOLVER`** | **MISSING / AD-HOC** | S2 workers receive ad-hoc scope trees; no fail-closed resolver |

---

## 3. Storage Architecture Recommendation

To preserve canonical single-parent mission authority and prevent shadow collections:
1. **Governed Canonical Profile Document**:  
   `mission_realms/{missionId}/canonical_profile/current`
2. **Historical Version Audit**:  
   `mission_realms/{missionId}/canonical_profiles/{profileHash}`
3. **Student Runtime Projection**:  
   `student_mission_catalog/{missionId}.canonicalProfileSummary` (derived, projection only)

No duplicate root collections should be created. All academic and structural authority resides strictly under the `mission_realms/{missionId}` parent hierarchy.
