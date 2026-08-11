# RANKCRACKERS ONE TIME READ ONLY PRODUCTION MISSION EXPORT

Verdict:

`RANKCRACKERS_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT_PASSED_WITH_PROJECTION_DIVERGENCE`

## Authorization

- Authorization: `EXPLICIT_ONE_TIME_PRODUCTION_READ_EXCEPTION_GRANTED`
- Project: `rankcrackers-55`
- Mode: `PRODUCTION READ-ONLY / EVIDENCE EXPORT ONLY`
- This gate does not authorize general production read access.

## Read Accounting

- mission_realms reads: 3
- recruitments reads: 3
- student_mission_catalog reads: 3
- total production reads: 9
- total production writes: 0
- collection scans: 0
- queries: 0

## Inventory Verification

- exact record count: 3
- Founder expected total: 3
- competitive count: 0
- Founder expected competitive: 2
- qualifying count: 0
- Founder expected qualifying: 1
- missing mission_realms: none

## Source Contract Verdict

`PRODUCTION_PARITY_SHOWS_MIGRATION_INCOMPLETE`

## Mission Summary

### jee_main_2026

- displayName: `JEE Main 2027`
- category: not present in selected fields
- status: `ACTIVE`
- eligibility: `STUDENT_ELIGIBLE_PROVEN`
- mission_realms exists: true
- recruitments exists: true
- student_mission_catalog exists: true

### neet_(ug)-2027

- displayName: `NEET (UG)-2027`
- category: not present in selected fields
- status: `ACTIVE`
- eligibility: `STUDENT_ELIGIBLE_PROVEN`
- mission_realms exists: true
- recruitments exists: true
- student_mission_catalog exists: true

### RPSC_FIRST_GRADE2026_2026_1782713222215

- displayName: `RPSC 1st Grade`
- category: not present in selected fields
- status: `ACTIVE`
- eligibility: `STUDENT_ELIGIBLE_PROVEN`
- mission_realms exists: true
- recruitments exists: true
- student_mission_catalog exists: true


## Visibility

- MISSION_PROJECTION_VISIBILITY_DIVERGENCE: true
- surface visibility divergence: true
- catalog hidden while recruitments published: false
- hidden missions: none
- visible/promoted missions: `jee_main_2026`, `neet_(ug)-2027`, `RPSC_FIRST_GRADE2026_2026_1782713222215`

## Safety Proof

- NO_WRITE
- NO_SET
- NO_UPDATE
- NO_MERGE
- NO_CREATE
- NO_DELETE
- NO_TRANSACTION
- NO_BATCH
- NO_BACKFILL
- NO_RULES_CHANGE
- NO_IAM_CHANGE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_MISSION_ACTIVATION
- NO_VISIBILITY_CHANGE
- NO_STATUS_CHANGE
- NO_PROJECTION_REBUILD
- NO_REPAIR_DURING_EXPORT
- NO_DASHBOARD_CHANGE
- NO_MISSION_REALM_CHANGE
- NO_FALLBACK_REMOVAL
- NO_MOJIBAKE_PATCH
- NO_GRADLE_TOUCH

## Full JSON Evidence

See:

- `RANKCRACKERS_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT_20260811065513.json`
- `FOUNDER_MISSION_EXACT_PRODUCTION_INVENTORY_20260811065513.json`
