# RANKCRACKERS STUDENT JOURNEY FIX4-R4E-R1

## Founder Mission Canonical Inventory Recovery

Verdict:

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4E_R1_BLOCKED_BY_MISSING_FOUNDER_MISSION_EVIDENCE`

This is a safety block, not a product repair failure. The repository and Git history contain mission registry, mirror contracts, safe-shell rules, tests, and scripts. They do not contain adequate evidence for the exact three Founder-created mission records with all required fields: `realmId`, display name, category, status, visibility, Founder-created provenance, creation timestamp/source artifact, and student eligibility.

No product code was changed in this gate.

## Baseline Proof

- Branch: `safety/rc-g2-pre-notification-schema`
- Starting HEAD: `0f240fdfca6f64d79b9e2d5cd7e096ff3de54b45`
- Known unrelated dirty file: `android/app/build.gradle.kts`
- Preserved Gradle hash: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## A. Founder Canonical Mission Inventory

Required target from Founder:

- total missions: `3`
- competitive: `2`
- qualifying: `1`

Recovered with adequate Founder-created record proof:

- `0 / 3`

Candidate IDs found:

| Candidate ID | Evidence Found | Adequate Founder-created Record? | Notes |
|---|---|---:|---|
| `jee_main_2026` | Canonical registry, JEE preview assets, mission mirror tests, many syllabus/PYQ evidence files | No | Exact Founder mission record and current visibility not recovered from safe source |
| `neet_(ug)-2027` | Canonical registry, NEET pagewise/authorization evidence, readiness script mention | No | Exact category/visibility/status as Founder mission record not proven |
| `RPSC_FIRST_GRADE2026_2026_1782713222215` | Canonical registry, readiness script mention | No | Exact Founder mission record not proven |

Important distinction:

`functions/canonical_mission_registry.js` proves known pilot IDs and aliases. It does not prove a Founder-created mission inventory or a student-visible catalog state. Using only this registry to create cards would still be mission fabrication.

## B. Mission Realms To Student Catalog Mapping

The architecture path exists in code:

`Founder Mission Creation -> handleSentinelAction -> mission_realms/{realmId} -> recruitments/{realmId} -> student_mission_catalog/{realmId}`

Evidence:

- `lib/features/admin/presentation/widgets/mission_control/mission_creation_center.dart`
  - calls `handleSentinelAction`
  - action: `launch_exam_mission`
- `functions/callable/handle_sentinel_action.js`
  - writes `mission_realms/{realmId}`
  - writes `recruitments/{realmId}`
  - calls `mirrorMissionShellToStudentCatalog(...)`
- `functions/backfill_student_mission_catalog.js`
  - dry-run/apply script for `student_mission_catalog/{id}`

However, R1 did not recover actual three-current-record data across these surfaces.

## C. Mission Visibility Governance Transition

Current safe-shell contract intentionally keeps student catalog hidden by default:

- `userPanelVisible = false`
- `cardVisible = false`
- `visibility.studentVisible = false`
- `visibility.catalogVisible = false`
- `visibility.userPanelVisible = false`

Historical audit shows why:

- Earlier MIRROR2 audit found unsafe automatic `LIVE` / `userPanelVisible=true` mapping from lifecycle states.
- Safe-shell repair removed automatic visibility from ACTIVE/GRADUATED states.
- Student catalog read rules require authenticated users to see only records with:
  - `cardVisible == true`
  - `userPanelVisible == true`
  - `archived == false`

Therefore, visibility must be set by a later explicit Founder/publication/governance transition. R1 did not find the current intended event/action that safely turns these flags true. Do not flip them manually.

## D. Recruitments Current Or Legacy Verdict

Verdict:

`SOURCE_CONTRACT_AMBIGUOUS`

Reason:

- Current Student Mission Realm code reads `recruitments where status == published`.
- Existing Firestore service also contains `streamStudentMissionCatalog()` with a rules-compatible query.
- Historical docs state `student_mission_catalog` is the student-safe projection with visibility gates.
- Current UI has not yet been rebound to that projection.

So `recruitments` is the current runtime source, but the architecture and rules evidence indicate `student_mission_catalog` is the safer intended student projection. R2 must make this explicit; R1 must not choose by guess.

## E. JEE Emulator Fallback Reachability Report

Fallback source:

- `lib/core/backend/recruitment_repository.dart`
- asset: `assets/data/preview/jee_main_2027/assessment_preview_manifest.json`

Runtime condition:

- `RC_USE_FIREBASE_EMULATOR == true`
- `FirestoreService.streamPublishedRecruitments()` emits empty list, or throws
- repository yields local preview mission:
  - id: `jee_main_2026`
  - title: `JEE Main 2027`
  - category: `competitive`
  - state: `Central`
  - status: `published`

Classification:

`PRODUCT_RUNTIME_FAKE_FALLBACK`

Reason:

It is emulator-gated, but it reaches the actual Student Mission Realm runtime in QA and can be mistaken as canonical Founder-linked truth. It should not be used as the normal mission discovery fallback after R2.

## F. Safe Source For R4E Repair

R4E-R2 is not authorized until one of these sources exists:

1. Founder-authorized export of the existing three mission records from non-production/Founder Panel.
2. Emulator seed containing exact exported mission records, categories, visibility, and provenance.
3. Committed canonical catalog generated from the Founder-authorized export.

The export must include:

- `realmId`
- `displayName`
- `category`
- `status`
- `visibility`
- `createdAt`
- source collection/path
- source commit/artifact

After that, R4E-R2 can:

- bind Student Mission Realm to the student-safe projection;
- remove the one-card runtime fallback from normal mission discovery;
- derive tab counts from source records;
- remove mojibake before category labels;
- replace fake dashboard defaults with honest evidence-missing states.

## Safety Proof

- `NO_PRODUCTION_READ`
- `NO_PRODUCTION_WRITE`
- `NO_FIRESTORE_WRITE`
- `NO_RULES_CHANGE`
- `NO_DEPLOY`
- `NO_STUDENT_PUBLISH`
- `NO_MISSION_CREATION`
- `NO_MISSION_FABRICATION`
- `NO_MISSION_CATEGORY_GUESSING`
- `NO_VISIBILITY_GUESSING`
- `NO_HARDCODED_3_MISSION_FIX`
- `NO_DASHBOARD_REPAIR_YET`
- `NO_GRADLE_TOUCH`

