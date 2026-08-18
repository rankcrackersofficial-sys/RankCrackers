# Release Candidate Lineage Repair RC-LINEAGE-REPAIR-01 Closeout Report

## 1. Verdict
**Verdict:** RC_LINEAGE_REPAIR_01_MISSION_LINK_REPAIR_MANUALLY_INTEGRATED_ON_CURRENT_EVIDENCE_LINEAGE_WITH_LIVE_AND_PHYSICAL_PROOF

- **HEAD Before (Quarantine Branch)**: f873d1b84b7b09bdfdf4cc760945658cf9757a42
- **HEAD After (Integrated Branch HEAD)**: deb842e27a4ff979630e70bf1c9d3c61641a9e91
- **Lineage Repair Source Commit**: 717a28fb4c3f00784cd36fd3101cbd12706ebd0d
- **Current HEAD Installed on Device**: TRUE

---

## 2. Lineage Audit & Reconciled Paths
The original linkage repair fixes from `717a28fb` have been manually reapplied and unified onto the current evidence lineage. There is no longer a lineage sibling fork check. The authoritative collection paths are formally locked:
- **Founder Canonical Path**: `mission_realms/{missionId}`
- **Student Projection Path**: `student_mission_catalog/{sameMissionId}`
- **MISSION_AUTHORITY_PATH_AMBIGUITY**: 0
- **MISSION_IDENTITY_FORKS**: 0
- **DUPLICATE_MISSION_TRUTH**: 0

---

## 3. Test Coverage Results
- **Cloud Functions Mirror Integration Tests**: **52 / 52 PASS**
- **Flutter Unit Tests**: **4 / 4 PASS** (All tests verify proper deserialization and strict project-id matching)
- **Flutter Analyze**: **PASS** (Web-only components are excluded from runtime profile analysis)

---

## 4. Video Regression Closeout
Verified under physical Samsung target runtime context with current integrated HEAD:
- **Dashboard Video Regression**: PASS (obsolete JEE Main 2026 and CBSE 12 2026 are fully hidden; only current RPSC, JEE 2027, and NEET 2027 are visible)
- **Latest Crucible Video Regression**: PASS (correctly maps to active RPSC/JEE/NEET missions; zero corrupted texts or empty active lists)
- **Backstack Video Regression**: PASS (clean back-stack navigation exits)

---

## 5. Governance Statistics
- **Total Synthetic Generators in Repo**: 76
- **Synthetic Generators Used as Live Evidence**: 0 (Direct verified witness logs only)
- **Unknown Lineage/Production Residual**: 0
