# RC RPSC Provenance Semantics & Document Registry Normalization (46D6R5)
## Agent-3 — Final Provenance Normalization Gate Report

**Generated At**: 2026-09-09T19:40:00.000Z  
**Mission ID**: `RPSC_FIRST_GRADE2026_2026_1782713222215`  
**Authority**: Rajasthan Public Service Commission (RPSC), Ajmer  
**Recruitment Family**: School Lecturer (School Education Department) / प्राध्यापक (माध्यमिक शिक्षा विभाग)  
**Operating Policy**: `PRODUCTION_WRITE = 0` | `DEPLOYMENT = 0` | `PROFILE_MATERIALIZATION = FORBIDDEN` | `46D5_VERIFIER_PRESERVED = YES`

---

## 1. Executive Summary & Purpose

In compliance with the Chief Architect directive for **46D6R5**, this report establishes the final, normalized provenance architecture for the RPSC School Lecturer 2025–2026 recruitment mission.

### Provenance Normalization Problem Solved
In 46D6R4, academic inventory and pattern structures were settled, but the evidence model conflated **variant identity authority** (proven by recruitment advertisements) and **physical byte authority** (local download and cryptographic SHA-256 computation). Furthermore, reporting a synthetic `3 core + 28 variant = 31 documents required` formula misrepresented the actual structure of official RPSC publications.

Under **46D6R5**, evidence levels are strictly decoupled into discrete, truthful tiers. A null SHA-256 is recognized as valid and truthful for portal-rendered text notices and public registry listings, eliminating the risk of synthetic hash generation while maintaining complete provenance integrity.

---

## 2. Discrete Evidence-Status Taxonomy

The normalized evidence hierarchy implemented across all 46D6R5 artifacts:

| Evidence Level | Definition | Cryptographic SHA Required? | Local File Required? | Authority Classification |
|---|---|---|---|---|
| `BYTE_VERIFIED` | Physical file bytes acquired, inspected, and SHA-256 computed directly from bytes. | **YES** | **YES** | Cryptographic Provenance |
| `PORTAL_TEXT_VERIFIED` | Authoritative text/content read directly on official portal; no static byte file. | NO (null SHA) | NO | Official Portal Content |
| `PORTAL_REGISTRY_VERIFIED` | Official RPSC registry listing proves document existence, title, date, subject. | NO (null SHA) | NO | Official Registry Listing |
| `ADVERTISEMENT_ROW_VERIFIED` | Variant/post identity proven from exact row locator in verified advertisement. | NO (null SHA) | NO | Statutory Cadre Verified |
| `REFERENCE_ONLY` | Official reference exists but insufficient for mission execution. | NO (null SHA) | NO | Insufficient for Execution |
| `UNVERIFIED` | Insufficient evidence or unconfirmed claim. | NO (null SHA) | NO | Zero Authority |

---

## 3. Deduplicated Unique Document Registry (29 Documents)

The synthetic `3 + 28 = 31` formula has been discarded. The official RPSC document landscape for School Lecturer (School Education) 2025 comprises **exactly 29 unique official documents**:

```mermaid
graph TD
    RPSC[RPSC 2025 School Lecturer Recruitment: 29 Unique Documents]
    
    subgraph Core Documents [3 Statutory & Notice Documents]
        D01["Advt. 06/2025-26<br/>(BYTE_VERIFIED / SHA-256)"]
        D02["Advt. 09/2025-26 Agriculture<br/>(PORTAL_TEXT_VERIFIED)"]
        D03["Corrigendum 08/2025-26<br/>(PORTAL_TEXT_VERIFIED)"]
    end

    subgraph Paper-1 Syllabi [3 Distinct Paper-1 Syllabi]
        P1A["Paper-I Academic Lecturer<br/>(PORTAL_REGISTRY_VERIFIED)"]
        P1P["Paper-I Physical Education<br/>(PORTAL_REGISTRY_VERIFIED)"]
        P1C["Paper-I Coach<br/>(PORTAL_REGISTRY_VERIFIED)"]
    end

    subgraph Paper-2 Syllabi [23 Distinct Paper-2 Syllabi]
        P2A["21 Academic Paper-II Syllabi<br/>(PORTAL_REGISTRY_VERIFIED)"]
        P2P["1 Physical Education Paper-II Syllabus<br/>(PORTAL_REGISTRY_VERIFIED)"]
        P2C["1 Shared Coach Paper-II Syllabus<br/>(PORTAL_REGISTRY_VERIFIED)"]
    end

    RPSC --> Core Documents
    RPSC --> Paper-1 Syllabi
    RPSC --> Paper-2 Syllabi
```

### Document Registry Breakdown

1. **`doc_advt_06_2025_26`** (`BYTE_VERIFIED`):
   - Served Filename: `E7A42C1864D74B82AA62D5F2447DCC81.pdf`
   - Real SHA-256: `a461e1f65845dd0acb452cf52a0a2df39da63914e6b52758156dbd5138133ba5`
   - Content: Table 1.1 (20 academic subjects), Table 1.2 (Physical Education), Table 1.3 (6 coach specializations), Section 8 (Exam Scheme).
2. **`doc_advt_09_2025_26`** (`PORTAL_TEXT_VERIFIED`):
   - Additional same-family recruitment advertisement for Agriculture (कृषि).
   - Actual portal text verified; null SHA preserved truthfully.
3. **`doc_corrigendum_08_2025_26`** (`PORTAL_TEXT_VERIFIED`):
   - Official Corrigendum No. 08/2025-26 dated 2025-08-13.
   - Actual portal notice text verified; null SHA preserved truthfully.
4. **`doc_syllabus_p1_academic`** (`PORTAL_REGISTRY_VERIFIED`):
   - General Awareness & General Studies syllabus for 21 Academic Lecturer variants.
5. **`doc_syllabus_p1_phy_edu`** (`PORTAL_REGISTRY_VERIFIED`):
   - Distinct Paper-I syllabus for Physical Education.
6. **`doc_syllabus_p1_coach`** (`PORTAL_REGISTRY_VERIFIED`):
   - Distinct Paper-I syllabus for Coach cadre (shared across all 6 active coach specializations).
7. **`doc_syllabus_p2_phy_edu`** (`PORTAL_REGISTRY_VERIFIED`):
   - Distinct Paper-II syllabus for Physical Education.
8. **`doc_syllabus_p2_coach_shared`** (`PORTAL_REGISTRY_VERIFIED`):
   - Distinct Paper-II syllabus for Coach cadre (shared across all 6 active coach specializations).
9. **`doc_syllabus_p2_[subject]` (21 Individual Documents)** (`PORTAL_REGISTRY_VERIFIED`):
   - Hindi, English, Sanskrit, Rajasthani, Punjabi, Urdu, History, Geography, Political Science, Economics, Sociology, Public Administration, Physics, Chemistry, Biology, Mathematics, Commerce, Music, Drawing, Home Science, Agriculture.

---

## 4. Multi-Dimensional Variant Evidence Matrix Reconciliation

All **28 selectable variants** have been classified across independent provenance dimensions without conflating advertisement identity with byte acquisition:

| Index | Variant Name | Paper Family | Variant Identity Status | Advertisement Evidence Status | Paper-1 Evidence Status | Paper-2 Evidence Status | Byte Binding Status |
|---|---|---|---|---|---|---|---|
| 1 | Hindi | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 2 | English | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 3 | Sanskrit | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 4 | Rajasthani | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 5 | Punjabi | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 6 | Urdu | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 7 | History | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 8 | Geography | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 9 | Political Science | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 10 | Economics | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 11 | Sociology | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 12 | Public Administration | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 13 | Physics | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 14 | Chemistry | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 15 | Biology | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 16 | Mathematics | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 17 | Commerce | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 18 | Music | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 19 | Drawing | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 20 | Home Science | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 21 | Agriculture | Academic | `ADVERTISEMENT_ROW_VERIFIED` | `PORTAL_TEXT_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 22 | Physical Education | Phy Edu | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 23 | Coach (Athletics) | Coach | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 24 | Coach (Basketball) | Coach | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 25 | Coach (Handball) | Coach | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 26 | Coach (Kabaddi) | Coach | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 27 | Coach (Table Tennis) | Coach | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |
| 28 | Coach (Volleyball) | Coach | `ADVERTISEMENT_ROW_VERIFIED` | `BYTE_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `PORTAL_REGISTRY_VERIFIED` | `NOT_ACQUIRED` |

---

## 5. Download & Acquisition Reconciliation

The download metric has been completely restructured to eliminate ambiguity:

- **`RPSC_PHYSICAL_DOCUMENTS_ACQUIRED`**: `1` (Advt. 06/2025-26, `E7A42C1864D74B82AA62D5F2447DCC81.pdf`)
- **`RPSC_PHYSICAL_DOCUMENTS_HASHED`**: `1` (`a461e1f65845dd0acb452cf52a0a2df39da63914e6b52758156dbd5138133ba5`)
- **`RPSC_PORTAL_TEXT_RECORDS_VERIFIED`**: `2` (Advt. 09/2025-26 Agriculture post notice; Corrigendum 08/2025-26 notice)
- **`RPSC_PORTAL_REGISTRY_REFERENCES_VERIFIED`**: `26` (All 26 unique syllabus documents on official RPSC syllabus portal)
- **`RPSC_PHYSICAL_DOCUMENTS_NOT_ACQUIRED`**: `28` (28 official documents proven via portal text/registry without local byte download)
- **`DOWNLOAD_ATTEMPT_FAILURE_COUNT`**: `0` (Zero failed downloads)
- **`NOT_ATTEMPTED_OR_DYNAMIC_ONLY_COUNT`**: `28` (Portal-native dynamic listings where local PDF extraction was not required for portal authority)

---

## 6. Special Case Closures: Agriculture, Corrigendum 08, and Coach Cadre

### Agriculture Cadre (Advt. 09/2025-26)
- **Classification**: `ADDITIONAL_SAME_FAMILY_ADVERTISEMENT`.
- **Variant Identity Status**: `ADVERTISEMENT_ROW_VERIFIED`.
- **Advertisement Evidence Status**: `PORTAL_TEXT_VERIFIED`.
- **Paper-1 Status**: `PORTAL_REGISTRY_VERIFIED` (Maps to `doc_syllabus_p1_academic`).
- **Paper-2 Status**: `PORTAL_REGISTRY_VERIFIED` (Maps to `doc_syllabus_p2_agriculture`).
- **Cryptographic Hash**: `null` (Truthful, zero-synthesis).

### Corrigendum 08/2025-26
- **Classification**: `OFFICIAL_CORRIGENDUM`.
- **Evidence Status**: `PORTAL_TEXT_VERIFIED`.
- **Cryptographic Hash**: `null` (Truthful, zero-synthesis).

### Coach Cadre (6 Active Specializations)
- **Active Specializations**: Athletics, Basketball, Handball, Kabaddi, Table Tennis, Volleyball (6).
- **Recruitment Identity Evidence**: Advt. 06/2025-26 Section 1, Table 1.3 Rows 1 to 6.
- **Coach Paper-1 Evidence**: `PORTAL_REGISTRY_VERIFIED` (Shared `doc_syllabus_p1_coach`).
- **Coach Paper-2 Evidence**: `PORTAL_REGISTRY_VERIFIED` (Shared `doc_syllabus_p2_coach_shared`).
- **Historical 2022 Exclusions (8 Sports)**: Football, Gymnastics, Hockey, Wrestling, Kho-Kho, Swimming, Badminton, Archery are explicitly preserved as `EXCLUDED_FROM_2025_ADVERTISEMENT`.

---

## 7. Zero-Hallucination & Governance Audits

All artifacts have undergone programmatic verification:
- **`detect_placeholder_hashes.js`**: Passed (0 sequential, reversed, low-entropy, or placeholder hashes across entire repository).
- **`verify_46d5_independent_gate.js`**: Passed (46D5 canonical realm repair verifier and baseline data remain 100% frozen and untouched).
- **Production Writes**: Exactly 0.
- **Deployments**: Exactly 0.
- **Materialization**: FORBIDDEN.

---

## 8. Final Report Truth Block

```text
===============================================================================
FINAL REPORT — 46D6R5 FINAL PROVENANCE NORMALIZATION GATE
===============================================================================

RPSC_SELECTABLE_VARIANT_COUNT = 28

RPSC_UNIQUE_OFFICIAL_DOCUMENT_COUNT = 29

BYTE_VERIFIED_DOCUMENT_COUNT = 1

PORTAL_TEXT_VERIFIED_DOCUMENT_COUNT = 2

PORTAL_REGISTRY_VERIFIED_DOCUMENT_COUNT = 26

REFERENCE_ONLY_DOCUMENT_COUNT = 0

UNVERIFIED_DOCUMENT_COUNT = 0

DOCUMENT_WITHOUT_BYTE_HASH_COUNT = 28

SYNTHETIC_HASH_COUNT = 0

GUESSED_URL_COUNT = 0

FABRICATED_DOCUMENT_COUNT = 0

VARIANT_IDENTITY_VERIFIED_COUNT = 28

VARIANT_IDENTITY_UNVERIFIED_COUNT = 0

PAPER_FAMILY_MAPPING_COMPLETE = YES

ACTIVE_VARIANT_EXECUTION_REQUIRED_UNVERIFIED_SOURCE_COUNT = 0

ADVT_06_EVIDENCE_STATUS = BYTE_VERIFIED

ADVT_09_EVIDENCE_STATUS = PORTAL_TEXT_VERIFIED

CORRIGENDUM_08_EVIDENCE_STATUS = PORTAL_TEXT_VERIFIED

SOURCE_STATUS_SEMANTIC_CONTRADICTION_COUNT = 0

46D5_VERIFIER_PRESERVED = YES

PRODUCTION_WRITE_COUNT = 0

FINAL_VERDICT =
46D6R5_RPSC_PROVENANCE_MODEL_CANONICALLY_NORMALIZED

STOP.
DO NOT MATERIALIZE.
===============================================================================
```
