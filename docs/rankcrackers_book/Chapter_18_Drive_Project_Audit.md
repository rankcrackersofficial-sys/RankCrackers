# Chapter 18 — Drive Project Source Audit


## Current Drive Project Audit — 10 October 2026

**Scope:** Read-only source audit of Drive `RankCrackers Project/RankCrackers-55/lib` and pinned GitHub default HEAD `5161592ddafb42f1ecc8923cc7b7b0309934cc83`. No repository, recovery, runtime, production or deployment mutation.

| Finding | Result | Meaning |
|---|---:|---|
| Drive lib files / Dart | 790 / 768 | Complete listing of 305 lib folders; 790 raw file downloads succeeded |
| GitHub tracked lib files / Dart | 779 / 757 | Complete pinned Git tree |
| Shared exact-byte files | 127 | Git blob SHA-1 matched |
| Shared CRLF-only files | 644 | CRLF→LF Git blob SHA-1 matched; no other content difference |
| Shared substantive code differences | 0 | All 771 common paths checked |
| Drive-only Dart paths | 19 | Historical/local extras, not GitHub authority |
| GitHub-only Dart paths | 8 | Taught-content-authority sources absent from this Drive folder |
| Current Chapter 18 core matrix | 73 GitHub paths + 5 Drive-only rows | Path presence does not certify every behavior column |
| Current disjoint architecture mapping | 757 assigned / 0 overlap / 0 unassigned | Explicit prefix classification over 15 layers |

`route_names.dart` and `shared/widgets/dark_card.dart` are comment-only placeholders; `RouteNames` and `SharedDarkCard` claims were withdrawn. Other matrix symbols corrected: `RankCrackersWebApp`, `BackendProvider.adapter`, `IndiaDistricts.districts`, `IndiaStates.statesAndUTs`, `configureFirebaseEmulatorsFromDartDefines`.

Security/privacy readback confirms: `TacticalSecureLayer.build` returns `child`; telemetry constructs and serializes both raw `userId` and hashed `anonymizedUserId`, and capture awaits `_persistQueue()`; `GlobalErrorHandler.handleFatal` has one current lib caller at `main.dart:51`; App Check activation has try/catch and no custom 5-second timeout. Firestore service declares 21 named `*Collection` string constants. Router reads `selectedExamSync()` and checks `isMissionValid`; navigation shell returns nonzero branches to branch 0.

**Static source discrepancy:** `main_web.dart` imports six files absent from current GitHub, including `web/shared/rc_colors.dart`, `rc_panel.dart`, `rc_field.dart`, `rc_loaders.dart`, `rc_layout.dart`, and `features/auth/presentation/screens/admin_invite_screen.dart`. All six are present in the Drive snapshot. This is a source dependency finding, not a measured build outcome. Drive extras must not be copied into GitHub on book authority.

**Remaining HOLD:** Runtime/visual/performance/security enforcement tests, all matrix behavior columns, production provenance, full Word/native Docs parity and final acceptance remain unverified. Historical Section 14.4 numbers describe the former 776-file snapshot only. Current Drive MD/HTML upload parity is verified separately by byte readback.

## Current layer counts

| Layer | GitHub Dart files |
|---|---:|
| L01 | 4 |
| L02 | 5 |
| L03 | 18 |
| L04 | 57 |
| L05 | 7 |
| L06 | 12 |
| L07 | 181 |
| L08 | 55 |
| L09 | 57 |
| L10 | 87 |
| L11 | 73 |
| L12 | 129 |
| L13 | 31 |
| L14 | 35 |
| L15 | 6 |
| Total | 757 |

## Exact source differences

| Classification | Path |
|---|---|
| DRIVE_ONLY | `lib/core/admin/admin_permission_resolver.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/material_version.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/pedagogy_authority.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/subject_teacher_authority.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/taught_content_authority.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/taught_content_failure_codes.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/taught_content_state.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/models/teaching_execution.dart` |
| GITHUB_ONLY | `lib/core/authority/taught_content_authority/services/taught_content_authority_engine.dart` |
| DRIVE_ONLY | `lib/features/admin/presentation/widgets/review_queue/admin_tasks_list.dart` |
| DRIVE_ONLY | `lib/features/auth/presentation/screens/admin_invite_screen.dart` |
| DRIVE_ONLY | `lib/web/admin/admin_my_access_panel.dart` |
| DRIVE_ONLY | `lib/web/founder/access/access_security_web.dart` |
| DRIVE_ONLY | `lib/web/founder/activity/recent_activity_web.dart` |
| DRIVE_ONLY | `lib/web/founder/ingestion/ingestion_review_web.dart` |
| DRIVE_ONLY | `lib/web/founder/intelligence/intelligence_room_web.dart` |
| DRIVE_ONLY | `lib/web/founder/revenue/revenue_subscription_control_web.dart` |
| DRIVE_ONLY | `lib/web/founder/study_master/subject_models.dart` |
| DRIVE_ONLY | `lib/web/founder/system/founder_system_operations_web.dart` |
| DRIVE_ONLY | `lib/web/shared/mission_processing_health_bar.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_colors.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_empty_states.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_field.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_file_helpers.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_layout.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_loaders.dart` |
| DRIVE_ONLY | `lib/web/shared/rc_panel.dart` |

## Limits and safest continuation

Keep GitHub authoritative. Treat this Drive folder as a source snapshot: no substantive differences at 771 common paths, but 19 additions and 8 omissions mean it is not full default-branch parity. Record the six Founder bootstrap dependency gaps for the Master engineering lane; do not restore files or deploy from the book. Source-only checks close count/partition and selected symbol gates. Runtime, UI and final acceptance gates remain open. This task did not execute Flutter analyze/build/test.

Evidence includes full Drive inventory (IDs/paths), per-path Git blob comparison, per-file layer assignment, scoped source findings and a static internal import scan. The import scan resolves literal relative/package directives only; it is not a Dart compiler.
