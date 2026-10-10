# 46A6 Canonical Mission Profile Materialization Contract

- **Gate**: `RC_CANONICAL_MISSION_PROFILE_MATERIALIZATION_ENGINE_46A6`
- **Agent**: `AGENT-2 — BACKEND / ACADEMIC FACTORY IMPLEMENTATION`
- **Status**: **`CANONICAL_SPECIFICATION_VERIFIED`**

---

## 1. Overview & Core Philosophy

The **Canonical Mission Profile Materialization Engine** is a mission-agnostic, generic backend system responsible for validating, hashing, resolving, and staging official exam profiles across all RankCrackers missions.

### Non-Negotiable Axioms:
1. **Zero Production Mutation in 46A6**: All production writes and deployments remain forbidden until explicit materialization commands are authorized post-source normalization (`PRODUCTION_PROFILE_WRITE_COUNT = 0`).
2. **No Mission-Specific Workers**: No hardcoded `JeeProfileWorker`, `NeetProfileWorker`, or `RpscProfileWorker`. A single generic engine handles all exam shapes.
3. **Strict Fail-Closed Preconditions**: If a profile violates schema, references unmapped paper families, uses synthetic hashes or guessed URLs, or is marked `HOLD_FOR_REVIEW`, materialization is immediately rejected.
4. **No Academic Fabrication**: The engine never invers or creates papers, subjects, variants, or syllabus depth from inference. Academic truth is strictly derived from source-governed authority.
5. **Deterministic Idempotency**: Re-applying an identical profile produces `0` planned and `0` executed writes (`SECOND_RUN_SEMANTIC_MUTATION_COUNT = 0`).

---

## 2. Core Profile Schema & Models

### Authority & Provenance Model
- **Provenance Tags**: `SOURCE_VERIFIED`, `FOUNDER_DECLARED`, `SYSTEM_DERIVED`, `UNKNOWN`.
- **Evidence Classes**:
  - `BYTE_VERIFIED`: Exact byte-matched source PDF/document. Requires valid 64-character hex SHA-256 (`/^[a-f0-9]{64}$/`).
  - `PORTAL_TEXT_VERIFIED`: Extracted official text directly from government/agency web portals.
  - `PORTAL_REGISTRY_VERIFIED`: Web table or notification registry row (e.g. RPSC advertisement portal tables). Permits `sha256 = null`.
  - `ADVERTISEMENT_ROW_VERIFIED`: Gazette or tabular advertisement row.
  - `REFERENCE_ONLY`: Informational or historical reference.
  - `UNVERIFIED`: Unverified draft; cannot be materialized to production.

### Multi-Paper Family Model
A mission is not forced into a single universal paper. A mission may define multiple `paperFamilies`:
```json
"paperFamilies": [
  {
    "familyId": "fam_general_studies",
    "familyName": "General Cadre",
    "applicableVariants": ["var_admin"],
    "paperIds": ["paper_general_1", "paper_general_2"]
  },
  {
    "familyId": "fam_technical",
    "familyName": "Technical Cadre",
    "applicableVariants": ["var_civil", "var_mech"],
    "paperIds": ["paper_general_1", "paper_tech_specialized"]
  }
]
```
**Rule**: Every active variant must map to exactly one valid paper family unless source explicitly permits more.

### Generic Variant Model (Flat & Nested Trees)
Supports flat variant lists as well as hierarchical parent $\rightarrow$ subvariant structures:
```json
"variants": [
  {
    "variantId": "var_academic_english",
    "variantName": "Lecturer English",
    "parentVariantId": null
  },
  {
    "variantId": "var_coach_parent",
    "variantName": "Coach Discipline",
    "parentVariantId": null,
    "subvariants": [
      { "subvariantId": "sub_coach_athletics", "subvariantName": "Coach Athletics" },
      { "subvariantId": "sub_coach_basketball", "subvariantName": "Coach Basketball" }
    ]
  }
]
```

---

## 3. Profile Semantic Hash Law

To ensure deterministic change tracking and zero redundant writes:
- **Excluded Volatile Fields**:
  - `createdAt`, `updatedAt`, `lastCheckedAt`, `lastVerifiedAt`, `runtimeTimestamp`, `timestamp`, `manifestedAt`, `mirroredAt`, `profileHash`, `auditLogRef`.
- **Included Academic & Authority Fields**:
  - `identity`, `missionTargetYear`, `sourceBaselineYear`, `cycleRelation`, `authority`, `jurisdiction`, `supportedScope`, `paperModel`, `variantModel`, `subjectModel`, `languageModel`, `s2DocumentProfile`, `fieldAuthorityMap`.
- **Law**:
  $$\text{SemanticProfile}_A \equiv \text{SemanticProfile}_B \implies \text{Hash}_A = \text{Hash}_B$$
  $$\text{TimestampOnlyDiff} \implies \text{Hash}_A = \text{Hash}_B$$
  $$\text{AcademicOrSourceDiff} \implies \text{Hash}_A \neq \text{Hash}_B$$

---

## 4. Governance & Lifecycle Gates

| Profile Status | Description | Production Materialization Permitted? |
|---|---|:---:|
| `DRAFT` | Initial draft under compilation | NO (Review Required) |
| `READY_FOR_REVIEW` | Complete profile awaiting verification | NO (Verification Required) |
| `HOLD_FOR_REVIEW` | Flagged for academic or legal dispute | **STRICTLY FORBIDDEN (BLOCKED)** |
| `SOURCE_VERIFIED` | Verified by academic authority with evidence | YES (Upon Founder Approval) |
| `MATERIALIZATION_READY`| Approved for deployment/materialization | **YES** |
| `SUPERSEDED` | Replaced by newer official cycle | ARCHIVED / NO-OP |

---

## 5. Storage Path & Mutation Safety

1. **Target Document Path**:  
   `mission_realms/{missionId}/canonical_profile/current`
2. **Version History Path**:  
   `mission_realms/{missionId}/canonical_profiles/{profileHash}`
3. **Student Projection Path**:  
   `student_mission_catalog/{missionId}.canonicalProfileSummary`
4. **Precondition Locks**:
   - `expectedProfileVersion`: Fails closed if current stored version differs.
   - `expectedProfileHash`: Fails closed if current stored hash differs.
   - `expectedMissionRealmExists`: Parent realm must exist before profile materialization.
5. **Mutation Allowlist**:
   Any operation targeting a path or collection outside the explicit allowlist immediately aborts with `UNALLOWLISTED_MUTATION_ATTEMPTED`.
