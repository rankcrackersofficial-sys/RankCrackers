# Domain-M Force Mission Creation Reconciliation R1

Date: 2026-10-11
Mode: PRE-PRODUCTION RECONCILIATION — NO PRODUCTION WRITE
Research input: Anti-Gravity 2.0 final official-source register (9 authorities / 50 exam families).
Canonical inventory authority: repository/live Founder reconciliation, not the research report.

## Rules

- One permanent mission identity per recurring exam family; cycles are children, never new missions.
- Existing genuine mission identities are reused in place.
- No Student visibility is enabled by force creation.
- A missing mission may be materialized only as a hidden/PASSIVE shell.
- Official notification + official syllabus + English-availability evidence must pass governed source verification before downstream worker activation.
- Research URLs/clauses are discovery evidence, not OFFICIAL_VERIFIED records.
- The three known E2E/orphan records are never eligible for reuse or creation fallback.
- RSSB Patwari is held because the current detailed post-CET cycle notification is awaited.

## Reconciliation counts

- Research exam families: 50
- Existing genuine identities matching this register: 13
- Missing candidate identities: 37
- Missing candidates eligible to proceed to source validation: 36
- HOLD pending current cycle notification: 1 (RSSB Patwari)
- Existing genuine JEE Main + NEET UG remain outside this civil-government register and are unaffected.

## REUSE_EXISTING (13)

| Candidate family | Existing missionId |
|---|---|
| UPSC CSE | upsc_cse_prelims |
| SSC CGL | ssc_cgl |
| SSC CHSL | ssc_chsl |
| SSC MTS & Havaldar | ssc_mts_havaldar |
| SSC CPO | ssc_cpo |
| SSC JE | ssc_je |
| SSC GD | ssc_gd |
| SSC Stenographer | ssc_stenographer |
| SSC JHT / Combined Hindi Translators | ssc_hindi_translators |
| SSC Selection Posts | ssc_selection_post |
| RPSC RAS/RTS | rpsc_ras_prelims |
| RPSC School Lecturer / 1st Grade | RPSC_FIRST_GRADE2026_2026_1782713222215 |
| UPPSC PCS | uppsc_pcs_prelims |

## CREATE_CANDIDATE — source validation required before materialization (36)

### UPSC (8)
upsc_ifos, upsc_ese, upsc_cds, upsc_nda_na, upsc_capf_ac, upsc_combined_geo_scientist, upsc_cms, upsc_ies_iss

### RRB (5)
rrb_ntpc, rrb_alp, rrb_technician, rrb_je, rrb_paramedical

### RPSC (5)
rpsc_senior_teacher_grade_2, rpsc_assistant_professor, rpsc_si_platoon_commander, rpsc_aen, rpsc_jlo

### RSSB (6)
rssb_cet_graduate, rssb_cet_senior_secondary, rssb_teacher_grade_3, rssb_ldc_junior_assistant, rssb_informatics_assistant, rssb_animal_attendant

### Rajasthan High Court (2)
rhc_rjs_civil_judge, rhc_staff

### DSSSB (4)
dsssb_teaching, dsssb_junior_assistant_ldc, dsssb_healthcare, dsssb_district_courts_staff

### Delhi High Court (3)
dhc_djs, dhc_dhjs, dhc_staff

### UPPSC (3)
uppsc_ro_aro, uppsc_state_engineering_services, uppsc_pcs_j

## HOLD (1)

- rssb_patwari — permanent family is recognized, but current detailed post-CET cycle notification is awaited. Do not fabricate or substitute a non-cycle document.

## Existing non-register genuine missions preserved

- jee_main_2026
- neet_(ug)-2027

## Quarantine — never materialize/promote

- e2e_prod_mission_1790940914968
- m_prod_e2e_f5_1790946353278
- test_mission_catalog_bridge

## Execution gate

For each CREATE_CANDIDATE:
1. resolve canonical authorityKey and approved official domain;
2. independently retrieve official notification and official syllabus;
3. establish English availability from official evidence;
4. finalize server bytes and SHA-256;
5. governed verifier changes each source to VERIFIED;
6. atomic source-pair coordinator creates the deterministic worker task;
7. hidden/PASSIVE mission shell remains non-student-visible until later publication governance.

This document authorizes no deployment, production Firestore write, destructive cleanup, or Student publication by itself.
