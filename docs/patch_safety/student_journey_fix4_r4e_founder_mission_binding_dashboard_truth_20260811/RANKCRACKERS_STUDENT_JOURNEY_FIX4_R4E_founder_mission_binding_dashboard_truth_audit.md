# RANKCRACKERS STUDENT JOURNEY FIX4-R4E

## Founder Canonical Mission Binding And Dashboard Truth Audit

Verdict:

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4E_BLOCKED_BY_FOUNDER_MISSION_SOURCE`

This gate is intentionally blocked. The current app must not invent mission cards, mission counts, percentages, risk labels, readiness labels, mastery, priority, or progress values. The audit found enough code-level provenance to explain the current wrong behavior, but did not find a safe local/non-production source that proves the exact Founder mission inventory of three missions with category split `competitive = 2` and `qualifying = 1`.

## Baseline

- Branch: `safety/rc-g2-pre-notification-schema`
- Starting HEAD: `79b1c23f17a0c11251eaa198dcdd00ed6f4cfa2e`
- Known unrelated dirty file: `android/app/build.gradle.kts`
- Preserved Gradle hash: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Founder Source Findings

Founder mission creation is routed through:

- `lib/features/admin/presentation/widgets/mission_control/mission_creation_center.dart`
- Callable: `handleSentinelAction`
- Action: `launch_exam_mission`

The backend callable writes two important records:

- canonical mission shell: `mission_realms/{realmId}`
- legacy/student-discovery mirror: `recruitments/{realmId}`

The callable also builds a student-safe shell at:

- `student_mission_catalog/{realmId}`

Important safety behavior in the student catalog shell:

- `userPanelVisible = false`
- `cardVisible = false`
- `visibility.studentVisible = false`
- `visibility.catalogVisible = false`
- `visibility.userPanelVisible = false`

This proves the architecture direction exists:

`Founder Panel -> mission_realms -> student-safe catalog/mirror -> Student Mission Realm`

But the audit did not prove the current live/non-production Founder mission inventory from a safe source.

## Student Mission Realm Findings

Current student screen reads:

- `publishedRecruitmentsProvider`
- `RecruitmentRepository.streamPublished()`
- Firestore query: `recruitments where status == published`

In explicit emulator mode, `RecruitmentRepository.streamPublished()` has a fallback:

- local asset: `assets/data/preview/jee_main_2027/assessment_preview_manifest.json`
- fallback card: `JEE Main 2027`
- fallback mission id: `jee_main_2026`
- fallback category: `competitive`
- fallback status: `published`

This explains the screenshot symptom: only one visible `JEE Main 2027` mission can appear even when the real Founder mission inventory is not proven.

Current section label also contains encoding corruption before the category text:

- `ðŸ›¡ COMPETITIVE MISSIONS`
- `ðŸŽ“ QUALIFYING MISSIONS`

That mojibake should be removed in the repair gate, but this audit did not patch it because the instruction was to fix data truth first and not do cosmetic repair before source truth is established.

## Canonical Registry Findings

The repository contains a canonical pilot alias registry:

- `functions/canonical_mission_registry.js`

Known pilot IDs:

- `jee_main_2026`
- `neet_(ug)-2027`
- `RPSC_FIRST_GRADE2026_2026_1782713222215`

This proves known canonical IDs exist, but it does not by itself prove the Founder-created mission records, category split, visibility, or student eligibility state. The app must not derive student cards only from this registry because that would still be a local synthetic mission source.

## Dashboard Truth Findings

The Dashboard still contains default/fallback display values that can become fake student-facing truth when real evidence is absent:

- readiness fallback: `(readiness?.score ?? 0)%`
- coverage fallback: `(coverage?.coveragePercent ?? 0)`
- streak fallback: `momentum?.studyStreakDays ?? 0`
- risk fallback: `risk?.highRisk == true ? HIGH : LOW`
- priority mastery fallback: `state?.mastery ?? 0.0`
- target display: `Target: X% Mastery`

These must be changed in a later repair to honest empty states unless each value is backed by real mission/user data. The R4B pillars remain preserved in code:

- `THE CRUCIBLE`
- `DIGIBOOK`
- `SYLLABUS`

## Matrix: Why Only One Mission Is Visible

| Founder Mission | Founder source record | Student source record | Filter | Visible | Reason |
|---|---|---|---|---|---|
| `jee_main_2026` / JEE Main 2027 | Not safely proven in this gate | Emulator fallback can synthesize one `Recruitment` | category `competitive`, state `Central` | Yes in emulator fallback | Local fallback, not proven Founder binding |
| `neet_(ug)-2027` | ID known in registry, full Founder record not safely proven | Not proven in student stream | unknown | Not proven | No safe local/non-production record proving visibility |
| `RPSC_FIRST_GRADE2026_2026_1782713222215` | ID known in registry, full Founder record not safely proven | Not proven in student stream | unknown | Not proven | No safe local/non-production record proving visibility |

## Required Next Repair

The next coding gate should only run after a safe Founder mission source is available. Safe options:

1. Emulator seed with the exact three Founder mission records.
2. Committed local canonical catalog containing the exact three Founder mission records, categories, visibility and source proof.
3. Founder Panel non-production data source.

Do not use production Firestore read for this gate.

Once safe source is available, the repair should:

- bind Student Mission Realm to `student_mission_catalog` or a clearly defined student-safe projection;
- remove the emulator one-card JEE fallback from normal mission discovery;
- show all eligible Founder-created missions by category;
- derive counts from source records, never hardcode them;
- remove mojibake before category labels;
- replace dashboard fake zeros/LOW/HIGH/defaults with honest empty states.

## Safety Proof

- `NO_PRODUCTION_WRITE`
- `NO_PRODUCTION_READ`
- `NO_RULES_CHANGE`
- `NO_DEPLOY`
- `NO_STUDENT_PUBLISH`
- `NO_MISSION_FABRICATION`
- `NO_LOCAL_FAKE_MISSION`
- `NO_HARDCODED_MISSION_COUNT`
- `NO_FAKE_PERCENTAGE`
- `NO_FAKE_RISK`
- `NO_FAKE_MASTERY`
- `NO_FAKE_PROGRESS`
- `NO_FAKE_PRIORITY`
- `NO_FAKE_READINESS`
- `NO_ACADEMIC_DATA_MUTATION`
- `NO_CRUCIBLE_ALLOCATION_MUTATION`
- `NO_PROFILE_REWRITE`
- `NO_GRADLE_TOUCH`

