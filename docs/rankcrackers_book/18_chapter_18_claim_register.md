# Chapter 18 — Chief Author Claim Register

## Audit status

**Status:** `AUDIT HOLD — NOT FINAL`  
**Audit owner:** Chief Author  
**Verification operator:** Antigravity 2.0  
**Repository:** `G:\RankCrackers Project\RankCrackers-55`  
**Primary chapter:** [`18_application_architecture_and_design_system.md`](18_application_architecture_and_design_system.md)  
**Audit date:** 2026-10-10  

यह register Chapter 18 के factual claims, code contracts, symbol inventories और numeric assertions का source-grounded control record है। Antigravity 2.0 की किसी भी पिछली रिपोर्ट को evidence नहीं माना गया है; केवल वर्तमान repository के machine-readable source readback को ही प्रमाण के रूप में स्वीकार किया गया है।

---

## Reproducible baseline

Chief Author readback एवं fresh source inventory में निम्न baseline सीधे live repository से प्राप्त हुआ:

| Evidence Metric | Machine Readback Result | Verification Status | Reference / Command |
|---|---:|---|---|
| `lib/` total files | 798 | `VERIFIED` | `os.walk('lib')` exhaustive file count |
| `lib/` Dart source files | 776 | `VERIFIED` | `os.walk('lib')` filter `*.dart` |
| `lib/` Non-Dart files | 22 | `VERIFIED` | All 22 files are `.bak` / fragment backups in `features/personalization/` |
| `lib/` Total disk bytes | 3,535,042 bytes | `VERIFIED` | `sum(os.path.getsize(f))` across all 798 files |
| `lib/` Dart source bytes | 3,396,565 bytes | `VERIFIED` | `sum(os.path.getsize(f))` across 776 Dart files |
| Master compiler source files | 23 | `VERIFIED` | `scripts/compile_master_book.py` `ordered_files` |
| Disjoint architecture layers | 15 layers = 776 files | `VERIFIED` | Disjoint partition algorithm (0 overlap, 0 unassigned) |
| Heading inventory | H1 28, H2 189, H3 416, H4 246 | `VERIFIED` | `scripts/verify_compilation.py` readback after Batch 01 |
| Local Markdown links | 27 tested, 0 broken | `VERIFIED` | `scripts/verify_compilation.py` |
| Referenced image assets | 30 verified, 0 missing | `VERIFIED` | `scripts/verify_compilation.py` |
| Chapter 18 audit status | `AUDIT HOLD — NOT FINAL` | `ENFORCED` | Chief Author Quality Gate |
| Google Drive sync status | `AUDIT HOLD / UNVERIFIED` | `AUDIT HOLD` | Must not be claimed as verified True without live readback |

---

## Exhaustive Claim Ledger (CH18-001 through CH18-015)

नीचे Chapter 18 के प्रत्येक प्रमुख factual sentence, code block, table row, symbol और numeric assertion का विस्तृत ऑडिट लेजर दर्ज है:

| Claim ID | Scope / Location in Ch 18 | Target Claim / Text Assertion | Live Source Evidence Checked | Finding & Reconciliation | Status |
|---|---|---|---|---|---|
| `CH18-001` | Section 14.1, Metadata | 776 Dart files scope in `lib/` | `Get-ChildItem lib -Recurse` | Exactly 776 Dart files and 22 non-Dart `.bak` files (total 798 files, 3,535,042 bytes). | `VERIFIED` |
| `CH18-002` | Section 14.1 | 15-Layer architecture distribution sums to 776 files | Disjoint partition script over all 776 files | 15 disjoint sets: L01 (4), L02 (5), L03 (18), L04 (57), L05 (7), L06 (28), L07 (182), L08 (56), L09 (57), L10 (87), L11 (73), L12 (130), L13 (31), L14 (35), L15 (6). Sum = 776 files exactly. | `VERIFIED` |
| `CH18-003` | Section 14.2 | Matrix row count reconciliation | Table parser across Section 14 | Prior text had an inconsistent 83/88 claim containing stale paths. Rebuilt into 78 verified existing source rows (Section 14.2) and 10 isolated stale paths (Section 14.3). | `CORRECTED` |
| `CH18-004` | Section 14.2 & 14.3 | Stale / non-existent file paths | `Test-Path` against `lib/` | 10 claimed paths do not exist in `lib/`: `math_renderer_util.dart`, `security_hasher.dart`, `string_utils.dart`, `tactical_paywall_overlay.dart`, `founder_authority.dart`, `authority_boundary_guard.dart`, `local_vault.dart`, `sound_service.dart`, `haptic_feedback_service.dart`, `notification_service.dart`. Isolated in Section 14.3. | `CORRECTED / UNRESOLVED` |
| `CH18-005` | Section 2, Section 11.2, 15.3 | Router mission authority gate | `lib/core/router/app_router.dart` (L93-112) | Router does not use `recruitmentSelectedSync()`. Actual flow reads `SessionManager.selectedExamSync()` and validates via `SessionManager.isMissionValid(selectedExam)`. | `CORRECTED` |
| `CH18-006` | Section 11.2, 15.5 | `SessionManager` synchronous methods | `lib/shared/session/session_manager.dart` (L1-140) | Verified synchronous symbols are: `profileCompletedSync()`, `selectedExamSync()`, `isMissionValid(...)`, `selectedRecruitmentIdSync()`, `isLoggedInSync()`, `consentAcceptedSync()`. Stale symbols `recruitmentSelectedSync()` and `targetExamSelectedSync()` removed. | `CORRECTED` |
| `CH18-007` | Section 7.4, 14.2 | `TacticalSecureLayer` screenshot / DRM protection | `lib/core/widgets/tactical_secure_layer.dart` (L1-17) | File is a 17-line widget returning `return child;` unchanged. No screenshot blocking, `FLAG_SECURE`, or platform channel DRM is implemented. Documented as a pass-through placeholder. | `CORRECTED` |
| `CH18-008` | Section 8.1, 12 | Telemetry anonymization & user identity storage | `lib/core/telemetry/telemetry_engine.dart` (L74-96) & `models/telemetry_record.dart` | While `anonymizedUserId: _generateShortHash(uid)` is stored, raw `userId: uid` is ALSO stored and uploaded in `TelemetryRecord`. Documented as dual-identifier storage with privacy gap noted. | `CORRECTED / SECURITY NOTE` |
| `CH18-009` | Section 8.1, 11.5 | Telemetry capture execution time & persistence | `lib/core/telemetry/telemetry_engine.dart` (L98-100) | `capture()` calls `await _persistQueue()`, which executes asynchronous SharedPreferences disk I/O. It is not a zero-time/synchronous in-memory operation. | `CORRECTED` |
| `CH18-010` | Section 8.2, 11.7 | `GlobalErrorHandler` caller boundary | `lib/main.dart` (L50-52) & full codebase search | `GlobalErrorHandler.handleFatal` is called solely from `main.dart` top-level catch block. `FlutterError.onError` and `PlatformDispatcher.instance.onError` do not invoke it in the current codebase. | `CORRECTED` |
| `CH18-011` | Section 9 | Performance: Slivers, RepaintBoundary, 60/120 FPS | `dashboard_screen.dart`, `digi_book_library_screen.dart`, tests | `CustomScrollView` and `SliverList` are verified in Dashboard and DigiBook. `RepaintBoundary` is verified in test visual QA harnesses (`test/nebula_vs0/...`), not card-by-card in production. 60/120 FPS and zero-drop are architectural design targets, not empirical benchmarks. | `CORRECTED / DESIGN GOAL` |
| `CH18-012` | Section 2.1, 11.3 | Firebase App Check activation timeout | `lib/main.dart` (L29-38) | `FirebaseAppCheck.instance.activate` is wrapped in standard `try/catch`. No custom 5-second timeout is implemented in Dart source. | `CORRECTED` |
| `CH18-013` | Section 8.3, 14.2 | Firestore declared collection constants count | `lib/core/firebase/firestore_service.dart` (L22-50) | Source code declares exactly 21 named `static const String *Collection` constants. Verified and documented. | `VERIFIED` |
| `CH18-014` | Section 16, Handoff | Google Drive / Google Docs synchronization status | `scripts/verify_compilation.py` & desktop client | Google Drive local sync is subject to desktop daemon mounting delays. Status is classified as `AUDIT HOLD / UNVERIFIED` until machine-readable live readback confirms cloud parity. | `AUDIT HOLD` |
| `CH18-015` | Metadata, Section 13 | Chapter 18 formal publication status | Chief Author Directive & Handoff Item 16 | Chapter 18 remains in `AUDIT HOLD — NOT FINAL` until all audit reconciliation criteria are completely satisfied and accepted by the Chief Author. | `AUDIT HOLD` |

---

## Stale and Absent Paths Ledger (CH18-004 Analysis)

नीचे वे 10 फ़ाइल पाथ दर्ज हैं जो पूर्व ड्राफ्ट्स में "verified" लिखे गए थे, किंतु वर्तमान कोडबेस में अनुपस्थित (Absent / Stale) पाए गए:

| Claimed Stale Path | Existence Check | Claimed Functionality | Actual Codebase Reality / True Replacement | Action Taken in Chapter 18 |
|---|---|---|---|---|
| `lib/core/utils/math_renderer_util.dart` | `ABSENT` | LaTeX / Math rendering utility | वास्तविक कार्यान्वयन `lib/shared/widgets/formatted_math_text.dart` में है। | Section 14.2 से हटाया गया; Section 14.3 Stale Ledger में स्थानांतरित। |
| `lib/core/utils/security_hasher.dart` | `ABSENT` | SHA-256 string hashing | हैशिंग सीधे `crypto` पैकेज से `TelemetryEngine._generateShortHash` में इनलाइन की गई है। | Section 14.2 से हटाया गया; Section 14.3 Stale Ledger में स्थानांतरित। |
| `lib/core/utils/string_utils.dart` | `ABSENT` | Generic string utilities | सामान्य स्ट्रिंग हेल्पर फ़ाइल मौजूद नहीं है; स्ट्रिंग संचालन इनलाइन या डार्ट कोर द्वारा होते हैं। | Section 14.2 से हटाया गया; Section 14.3 Stale Ledger में स्थानांतरित। |
| `lib/core/widgets/paywall/tactical_paywall_overlay.dart` | `ABSENT` | Paywall modal overlay | पेवॉल डायरेक्टरी में वास्तविक फ़ाइल `lib/core/widgets/paywall/premium_paywall_widget.dart` है। | Section 14.2 में वास्तविक फ़ाइल से प्रतिस्थापित; Stale Ledger में दर्ज। |
| `lib/core/authority/founder_authority.dart` | `ABSENT` | Founder claims & RBAC authority | फाउंडर पहचान सीधे `lib/core/constants/founder_identity.dart` में परिभाषित है। | Section 14.2 में `founder_identity.dart` से प्रतिस्थापित; Stale Ledger में दर्ज। |
| `lib/core/authority/authority_boundary_guard.dart` | `ABSENT` | Authority boundary validation guard | अलग गार्ड फ़ाइल मौजूद नहीं है; अधिकार सत्यापन `app_router.dart` और `AuthGate` में इनलाइन है। | Section 14.2 से हटाया गया; Section 14.3 Stale Ledger में स्थानांतरित। |
| `lib/core/storage/local_vault.dart` | `ABSENT` | Secure keystore storage vault | वास्तविक स्टोरेज फ़ाइलें `lib/core/storage/token_storage.dart` और `local_storage_service.dart` हैं। | Section 14.2 में वास्तविक स्टोरेज फ़ाइलों से प्रतिस्थापित; Stale Ledger में दर्ज। |
| `lib/core/services/sound_service.dart` | `ABSENT` | Audio playback for quiz/crucible | अलग ऑडियो सर्विस फ़ाइल मौजूद नहीं है। | Section 14.2 से हटाया गया; Section 14.3 Stale Ledger में स्थानांतरित। |
| `lib/core/services/haptic_feedback_service.dart` | `ABSENT` | Haptic feedback engine | हैप्टिक फीडबैक सीधे Flutter SDK के `HapticFeedback.lightImpact()` द्वारा विजेट्स में कॉल होता है। | Section 14.2 से हटाया गया; Section 14.3 Stale Ledger में स्थानांतरित। |
| `lib/core/notifications/notification_service.dart` | `ABSENT` | General notification service | वास्तविक नोटिफिकेशन इंजन `lib/core/notifications/notification_engine.dart` और `sentinel_notification_service.dart` हैं। | Section 14.2 में वास्तविक फाइलों से प्रतिस्थापित; Stale Ledger में दर्ज। |

---

## Batch 01 cross-chapter reconciliation note

Chapter 18 के ten absent paths यहाँ intentionally registered हैं। Chapters 08, 09, 13, 14, 15, 16, 19 और 20 के corrected paths और unresolved historical contracts का cross-chapter control record [`22_source_reconciliation_register_and_live_contracts.md`](22_source_reconciliation_register_and_live_contracts.md) में है। इस register की `CH18-004` entry को close नहीं किया गया है; absent paths को केवल quarantine किया गया है। इसलिए Chapter 18 का `AUDIT HOLD — NOT FINAL` status बना रहता है।

## Acceptance Gate Checklist for Chapter 18 Release

Chapter 18 को `AUDIT HOLD` से बाहर लाकर "Final" घोषित करने के लिए निम्नलिखित सभी शर्तों का पूर्ण होना अनिवार्य है:

- [x] **1. Disjoint 15-Layer Partition:** 776 Dart files को 15 गैर-अतिव्यापी पाथ सेट्स में विभाजित किया गया और योग ठीक 776 सत्यापित हुआ।
- [x] **2. Stale Paths Quarantine:** सभी 10 अनुपस्थित पाथ्स को Section 14.2 के सत्यापित मैट्रिक्स से हटाकर Section 14.3 के Stale Ledger में स्पष्ट रूप से दर्ज किया गया।
- [x] **3. Symbol Reconciliation:** `SessionManager.profileCompletedSync()`, `selectedExamSync()`, `isMissionValid(...)` और `selectedRecruitmentIdSync()` को वास्तविक स्रोत से मिलाया गया।
- [x] **4. Telemetry Realism:** `_persistQueue()` का डिस्क I/O और `TelemetryRecord` में raw `userId` तथा `anonymizedUserId` दोनों की उपस्थिति को बिना छिपाए दर्ज किया गया।
- [x] **5. DRM / Secure Layer Truth:** `TacticalSecureLayer` को 17-लाइन पास-थ्रू विजेट के रूप में सही दर्ज किया गया।
- [x] **6. Performance Evidence Discipline:** 60/120 FPS और zero-drop को डिजाइन लक्ष्य के रूप में स्पष्ट किया गया; स्लिवर्स को डैशबोर्ड/डिजीबुक में और RepaintBoundary को टेस्ट्स में मैप किया गया।
- [x] **7. GlobalErrorHandler Reality:** स्पष्ट दर्ज किया गया कि यह केवल `main.dart` के टॉप-लेवल कैच में सक्रिय है।
- [x] **8. Master Compilation Pass:** `compile_master_book.py` और `verify_compilation.py` का सफल निष्पादन (Exit Code 0)।
- [ ] **9. Live Google Drive Sync Confirmation:** `I:\My Drive\Rank_Cracker_Book` में लाइव रीडबैक से 100% क्लाउड समन्वय की पुष्टि होने तक स्टेटस `AUDIT HOLD` रहेगा।
- [ ] **10. Chief Author Final Sign-Off:** चीफ ऑथर द्वारा सभी रिकॉन्सिलिएशन सुधारों की औपचारिक स्वीकृति।
