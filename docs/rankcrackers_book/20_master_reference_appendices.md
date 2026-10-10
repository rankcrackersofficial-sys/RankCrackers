# Volume I — Reference Appendices

## Part 1 — Master Lexicon, Route Topology, Schema Dictionary & API Catalog

---

# Chapter 20 — Master Reference Appendices

> **Canonical Hierarchy:** Volume I → Part 1 → Chapter 20  
> **Source Verification Status:** This is a scoped synthesis checked against the named route/bootstrap files, rules, `functions/src/index.ts`, and selected model files. It is not a claim that every appendix sentence is independently verified.  
> **Primary Language:** उच्च-स्तरीय तकनीकी हिन्दी (High-Register Technical Hindi) | Code, File Paths & Symbols: Original English

---

### Executive Overview

यह अध्याय Rank Crackers पुस्तक का **सर्वोच्च तकनीकी संदर्भ परिशिष्ट (Master Reference Appendix)** है। इसका उद्देश्य संपूर्ण पारिस्थितिकी तंत्र (Ecosystem) के सभी घटकों, मार्गों, स्कीमा अनुबंधों, क्लाउड फ़ंक्शंस, और पारिभाषिक शब्दों को एक ही स्थान पर वर्णानुक्रम और व्यवस्थित सूचकांक के रूप में प्रस्तुत करना है। चाहे कोई डेवलपर किसी विशिष्ट रूट गार्ड का व्यवहार जानना चाहता हो, कोई अकादमिक शिक्षक किसी SVO फ़ील्ड का प्रारूप देखना चाहता हो, या कोई ऑडिटर फायरस्टोर सिक्योरिटी रूल्स के अनुमति मैट्रिक्स की पुष्टि करना चाहता हो—यह परिशिष्ट उसके लिए अंतिम और प्रामाणिक स्रोत (Single Source of Truth) है।

---

## Appendix A: Complete System Glossary & Terminological Concordance

यह शब्दावली Rank Crackers के सभी डोमेन्स के पारिभाषिक शब्दों की आधिकारिक परिभाषा प्रदान करती है:

### A
- **Active Recall (सक्रिय स्मरण):** सामग्री को केवल पुनः पढ़ने के स्थान पर उसे स्मृति से सक्रिय रूप से बाहर निकालने की संज्ञानात्मक प्रक्रिया।
- **AdminInviteScreen:** व्यवस्थापकों को गुप्त इनविटेशन टोकन के माध्यम से वेब कंसोल तक पहुँच प्रदान करने वाली स्क्रीन (`admin_invite_screen.dart`)।
- **AppCheck:** गूगल प्ले इंटीग्रिटी (Android) और एप्पल डिवाइस चेक (iOS) द्वारा अनधिकृत या संशोधित क्लाइंट्स को ब्लॉक करने वाला सुरक्षा तंत्र।
- **AppRouter:** GoRouter 14.x पर आधारित 5-गेट सिंक्रोनस राउटिंग पाइपलाइन (`app_router.dart`)।
- **AtomicFact:** ज्ञान की सूक्ष्मतम तथ्यात्मक इकाई, जो SVO (Subject-Predicate-Object) संरचना में एनकोड होती है (`atomic_fact.dart`)।
- **AtomicMasteryState:** किसी एटॉमिक टॉपिक पर छात्र की 0-100 के पैमाने पर दक्षता, आत्मविश्वास और प्रवृत्ति का रिकॉर्ड (`atomic_mastery_state.dart`)।
- **AtomicRiskState:** किसी एटॉमिक टॉपिक की भेद्यता (Vulnerability), जिसमें कवरेज, मास्टरी, असेसमेंट और समय-क्षरण शामिल हैं (`atomic_risk_state.dart`)।
- **AtomicTopic:** पाठ्यक्रम की संवैधानिक मूल्यांकन इकाई, जो विशिष्ट प्रश्नों और डिजीबुक नोड्स से जुड़ी होती है (`atomic_topic.dart`)।

### B
- **BattleSession:** किसी मिशन या टेस्ट के दौरान छात्र द्वारा दिए गए परीक्षण का रीयल-टाइम निष्पादन सत्र (`battle_session.dart`)।
- **Bloom's Taxonomy:** संज्ञानात्मक विकास के 6 स्तर (Remember, Understand, Apply, Analyze, Evaluate, Create) जिन्हें प्रश्नों की कठिनाई में मैप किया गया है।

### C
- **Canonical Authority (कैनोनिकल प्राधिकार):** किसी डेटा या शैक्षणिक सामग्री का वह एकमात्र संस्करण जिसे सभी विवादों में अंतिम और वैध माना जाता है।
- **Career Signals:** आधिकारिक भर्ती बोर्डों द्वारा जारी राजपत्रित अधिसूचनाओं और रिक्तियों का सूचना केंद्र (`/career-signals` / `/opportunities`)।
- **Cloud Functions:** Node.js 22 LTS पर चलने वाले सर्वरलेस बैकएंड फ़ंक्शंस, जो असेसमेंट मूल्यांकन और बैकग्राउंड वर्कर्स को संचालित करते हैं।
- **Cognitive Load Theory:** छात्र के कार्यशील मस्तिष्क (Working Memory) पर अनावश्यक विज़ुअल या मानसिक अधिभार को रोकने का सिद्धांत।
- **Crucible (क्रूसिबल):** 98-दिवसीय दैनिक मोडुलो परीक्षण रिंग और अग्नि-परीक्षा का मुख्य इंटरफ़ेस (`CrucibleScreen`, `/crucible`)।

### D
- **DarkCard:** Tactical Noir डिज़ाइन सिस्टम का प्राथमिक कंटेनर विजेट (`dark_card.dart`), जो अडैप्टिव पैडिंग और 16px रेडियस प्रदान करता है।
- **Decay Function ($W_{rec}$):** एबिंगहॉस विस्मृति वक्र पर आधारित समय-क्षरण सूत्र, जहाँ $\tau = 14$ दिन के हाफ-लाइफ के आधार पर मास्टरी घटती है।
- **DigiBook:** कैनोनिकल पाठ्यपुस्तकों और सत्यापित एटॉमिक नोट्स का उच्च-पठनीयता वाला डिजिटल पठन वातावरण (`DigiBookScreen`, `/digibook`)।
- **Directed Acyclic Graph (DAG):** पाठ्यक्रम और ज्ञान का वह ग्राफ जिसमें कोई चक्रीय निर्भरता (Circular Dependency) नहीं होती।

### E
- **Ebbinghaus Forgetting Curve:** समय के साथ स्मृति प्रतिधारण में चरघातांकी गिरावट का गणितीय नियम: $R(t) = e^{-t/S}$।
- **evaluateAttempt:** क्लाउड फ़ंक्शंस का वह आधिकारिक कॉलएबल जो छात्र के टेस्ट सबमिशन का सर्वर-साइड मूल्यांकन करता है।

### F
- **FNV-1a Hashing:** 64-बिट फाउलर-नोल-वो हैश एल्गोरिदम, जो टेस्ट प्रश्नों के क्रम को निष्पक्ष और डिटरमिनिस्टिक रूप से शफ़ल करने के लिए उपयोग होता है।
- **Founder:** रैंक क्रैकर्स प्लेटफॉर्म का प्रशासक जिसके पास वेब कंसोल के माध्यम से सिस्टम निगरानी के संप्रभु अधिकार हैं।
- **FounderIdentity:** वह कॉन्स्टेंट वर्ग जो हार्डकोडेड और सुरक्षित यूआईडी के माध्यम से फाउंडर यूज़र्स की पुष्टि करता है (`founder_identity.dart`)।

### H
- **Human Authority Law:** वह गैर-परक्राम्य नियम जिसके अनुसार एआई द्वारा जनरेट किए गए किसी भी प्रश्न को तब तक प्रकाशित नहीं किया जा सकता जब तक मानव शिक्षक उस पर हस्ताक्षर न करे।

### K
- **Knowledge Engine:** छात्र के कवरेज, मास्टरी, रिस्क और रेडीनेस की गणना करने वाला केंद्रीय रिएक्टिव इंजन (`knowledgeEngineProvider`)।

### M
- **Macro Citadel:** क्रूसिबल चक्र के 14वें दिन संपूर्ण 12 दिनों के पाठ्यक्रम का 100-150 प्रश्नों वाला संचयी परीक्षण (`/crucible/macro`)।
- **MainNavigationShell:** 5 बॉटम-बार टैब्स को नियंत्रित करने वाला StatefulNavigationShell विजेट (`main_navigation_shell.dart`)।
- **Micro Test:** क्रूसिबल चक्र के दिन 1 से 12 तक आयोजित होने वाला 15-30 मिनट का दैनिक लक्षित परीक्षण (`/crucible/micro`)।
- **Mission:** वह विशिष्ट प्रतियोगी परीक्षा जिसका छात्र ने चयन किया है (उदा. BPSC, UPSC, SSC CGL)।
- **Modulo Ring (मोडुलो रिंग):** 98 दिनों का 7-ब्लॉक ($B_1$ से $B_7$) निरंतर चक्रीय परीक्षण कार्यक्रम।

### P
- **Play Integrity:** गूगल प्ले सर्विसेज का एंटी-टैम्परिंग एपीआई जो क्लाइंट बाइनरी की अखंडता की पुष्टि करता है।
- **PremiumButton:** सोने के रंग और अडैप्टिव ऊंचाई वाला प्राथमिक एक्शन बटन विजेट (`premium_button.dart`)।

### Q
- **QuestionOutcome:** बैटल सेशन के अंतर्गत एकल प्रश्न के परिणाम (सही/गलत, समय, कठिनाई) का रिकॉर्ड (`question_outcome.dart`)।

### R
- **Readiness Index ($R_{mission}$):** छात्र की संपूर्ण परीक्षा में सफलता की संभावित प्रायिकता का 0-100 के बीच का समग्र सूचकांक (`ReadinessState`)।
- **Rebuild Chamber:** चक्र के 13वें दिन और $M(a) < 0.50$ वाले कमज़ोर एटम्स को सुधारने का विशेष परीक्षण कक्ष (`/crucible/rebuild`)।
- **ResponsiveHelper:** 6 स्क्रीन आकारों पर विज़ुअल तत्वों को गतिशील रूप से स्केल करने वाला यूटिलिटी वर्ग (`responsive_helper.dart`)।

### S
- **Separation of Powers Law:** यह नियम कि फाउंडर वेब कंसोल किसी भी छात्र के व्यक्तिगत शैक्षणिक रिकॉर्ड्स (मास्टरी, टेस्ट स्कोर्स) को म्यूटेट नहीं कर सकता।
- **SessionManager:** स्थानीय स्तर पर सत्र, प्रोफ़ाइल पूर्णता, और चयनित मिशन को कैश करने वाला सॉवरेन क्लास (`session_manager.dart`)।
- **SVO (Subject-Verb-Object):** प्राकृतिक भाषा के तथ्यों को एनकोड करने वाली तीन-घटक संरचना (`AtomicFact`)।

### T
- **Tactical Noir:** डीप ब्लैक (`#0A0C10`), लग्जरी गोल्ड (`#B39B5D`), और स्लेट ग्रे पर आधारित डार्क डिज़ाइन भाषा (`AppColors`, `AppTypography`)।
- **TelemetryEngine:** गोपनीयता-संरक्षित (SHA-256 Hashed) और ऑफलाइन-पर्सिस्टेंट ऐप प्रदर्शन एवं त्रुटि ट्रैकिंग इंजन (`telemetry_engine.dart`)।

---

## Appendix B: Canonical Route Index & Navigation Topology

Rank Crackers में कुल 29 आधिकारिक रूट्स (`AppRoutes`) परिभाषित हैं:

| रूट पाथ (Path) | कॉन्सटेंट नाम (Constant) | गंतव्य स्क्रीन (Screen) | प्राधिकरण गेट (Guard Policy) | विवरण (Description) |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `splash` | `SplashScreen` | Public | बूटस्ट्रैप, ब्रांड एनीमेशन और 5-गेट रीडायरेक्ट |
| `/login` | `login` | `UnifiedIdentityScreen` | Unauthenticated | फोन/ईमेल/गूगल एसएसओ प्रमाणीकरण |
| `/profile-setup` | `profileSetup` | `ProfileSetupScreen` | Authenticated | नाम, राज्य चयन (36 entities), सहमति अनुबंध |
| `/mission-realm` | `missionRealm` | `MissionSelectionScreen` | Profile Complete | आधिकारिक प्रकाशित परीक्षाओं का चयन |
| `/exam-select` | `examSelect` | `ExamSelectionScreen` | Legacy Alias | मिशन चयन का वैकल्पिक रूट |
| `/dashboard` | `dashboard` | `DashboardScreen` | Fully Qualified | मुख्य छात्र कमांड सेंटर (7 sliver folds) |
| `/crucible` | `crucible` | `CrucibleScreen` | Fully Qualified | 98-दिवसीय दैनिक मोडुलो टेस्ट रिंग |
| `/crucible/micro` | `sacredMicroChamber`| `MicroChamberScreen` | Fully Qualified | दिन 1–12 का 15-30 मिनट का दैनिक टेस्ट |
| `/crucible/rebuild`| `sacredRebuildChamber`| `RebuildChamberScreen` | Fully Qualified | दिन 13 का कमजोर एटम्स मरम्मत कक्ष |
| `/crucible/macro` | `sacredMacroCitadel`| `MacroCitadelScreen` | Fully Qualified | दिन 14 का संपूर्ण ब्लॉक महा-दुर्ग टेस्ट |
| `/digibook` | `digibook` | `DigiBookScreen` | Fully Qualified | कैनोनिकल अध्ययन ग्रंथ और नोड नेविगेशन |
| `/digibook-reader`| `digibookReader` | `DigiBookReaderScreen` | Fully Qualified | डीप रीडिंग मोड (17px Noto Sans Devanagari) |
| `/syllabus` | `syllabus` | `SyllabusScreen` | Fully Qualified | Official-authority-bound variable-depth tree और mastery visualizer |
| `/profile` | `profile` | `ProfileScreen` | Fully Qualified | छात्र प्रोफ़ाइल, लक्ष्य वर्ष, और खाता सेटिंग्स |
| `/deep-profile` | `deepProfile` | `DeepProfileScreen` | Fully Qualified | संज्ञानात्मक शैली और विस्तृत शैक्षणिक विश्लेषण |
| `/opportunities` | `opportunities` | `OpportunitiesScreen` | Fully Qualified | आधिकारिक भर्ती और करियर सिग्नल्स |
| `/recruitment` | `recruitment` | `RecruitmentDetailScreen`| Fully Qualified | विशिष्ट भर्ती का पात्रता और परीक्षा पैटर्न |
| `/pyq-vault` | `pyqVault` | `PyqVaultScreen` | Fully Qualified | पिछले वर्षों के प्रामाणिक प्रश्नों का संग्रह |
| `/progress-tracker`| `progressTracker` | `ProgressTrackerScreen` | Fully Qualified | ऐतिहासिक मास्टरी और कवरेज प्रक्षेपवक्र |
| `/revision-desk` | `revisionDesk` | `RevisionDeskScreen` | Fully Qualified | स्मृति क्षरण वाले एटम्स का लक्षित रिवीजन |
| `/test-arena` | `testArena` | `TestArenaScreen` | Fully Qualified | फुल-लेंथ सिमुलेशन और स्पीड डायग्नोस्टिक्स |
| `/test-arena/founder-harness` | `testArenaFounderHarness` | `FounderTestHarnessScreen` | Founder Only | टेस्ट इंजन का प्रशासनिक सत्यापन हार्नेस |
| `/diagnostic-entry`| `diagnosticEntry`| `DiagnosticEntryScreen` | Profile Complete | प्रारंभिक स्तर निर्धारण टेस्ट का प्रवेश |
| `/diagnostic-test` | `diagnosticTest` | `DiagnosticTestScreen` | In-Progress | 30 प्रश्नों का आधारभूत मूल्यांकन टेस्ट |
| `/diagnostic-result`| `diagnosticResult`| `DiagnosticResultScreen`| Post-Test | डायग्नोस्टिक परिणाम और प्रारंभिक मास्टरी मैप |
| `/sentinel-center` | `sentinelCenter` | `SentinelCenterScreen` | Fully Qualified | इंटेलिजेंस स्काउट ड्राफ्ट्स और अलर्ट्स |
| `/notification-center`| `notificationCenter`| `NotificationCenterScreen`| Fully Qualified | सिस्टम, मिशन, और रिवीजन सूचनाएँ |
| `/admin` | `admin` | `FounderDashboardScreen`| Founder Claim | वेब-ओनली फाउंडर ऑपरेशंस कंसोल |
| `/nebula-founder-preview`| `nebulaFounderPreview`| `NebulaPreviewScreen` | Founder Claim | भविष्य के यूआई और नॉलेज ग्राफ़ का पूर्वावलोकन |

---

## Appendix C: Master File & Source Code Symbol Index

यह अनुक्रमणिका कोडबेस की सबसे महत्वपूर्ण फाइलों और उनके प्रमुख प्रतीकों को सूचीबद्ध करती है:

### 1. कोर और कॉन्फ़िगरेशन (Core & Config)
- `lib/main.dart`: मोबाइल बूटस्ट्रैप, `RankCrackersApp`, `AppCheck`, `GlobalErrorHandler`।
- `lib/main_web.dart`: वेब बूटस्ट्रैप, `RankCrackersWebApp`, `AuthGate`, `WebShell`।
- `lib/firebase_options.dart`: Android, iOS, और Web के लिए आधिकारिक फायरबेस विकल्प।
- `lib/core/router/app_router.dart`: `appRouter`, 5-गेट समकालिक रीडायरेक्ट लॉजिक।
- `lib/core/navigation/main_navigation_shell.dart`: `MainNavigationShell`, `_navItem`, PopScope बैक-बटन नियंत्रण।
- `lib/core/constants/founder_identity.dart`: `FounderIdentity`, `isFounderUser()`, हार्डकोडेड फाउंडर यूआईडी।
- `lib/shared/session/session_manager.dart`: `SessionManager`, `initialize()`, `profileCompletedSync()`, `selectedExamSync()`, `isMissionValid()`।

### 2. डिज़ाइन सिस्टम और यूआई (Design System & UI)
- `lib/core/theme/app_colors.dart`: `AppColors` (`background`, `surface`, `gold`, `tacticalGold`, `borderSoft`)।
- `lib/core/theme/app_typography.dart`: `AppTypography` (`hero`, `metric`, `heading`, `body`, `readingContent`)।
- `lib/core/theme/app_theme.dart`: `AppTheme.darkTheme`।
- `lib/core/theme/tactical_noir_background.dart`: `TacticalNoirBackground`।
- `lib/core/utils/responsive_helper.dart`: `ResponsiveHelper` (`width`, `height`, `sp`, `buttonHeight`, `crossAxisCount`)।
- `lib/core/widgets/dark_card.dart`: `DarkCard`।
- `lib/core/widgets/premium_button.dart`: `PremiumButton`।

### 3. डेटा मॉडल्स और बौद्धिक इंजन (Models & Intelligence)
- `lib/core/models/atomic_fact.dart`: `AtomicFact`, `FactType`, `statement`।
- `lib/core/models/atomic_topic.dart`: `AtomicTopic`, `coverageWeight`, `masteryWeight`।
- `lib/core/models/atomic_mastery_state.dart`: `AtomicMasteryState`, `score`, `confidence`, `trend`।
- `lib/core/models/atomic_risk_state.dart`: `AtomicRiskState`, `coverageDeficiency`, `masteryDeficiency`, `recencyWeakness`।
- `lib/core/models/readiness_state.dart`: `ReadinessState`, `successProbability`, `status`।
- `lib/core/models/success_probability_node.dart`: `SuccessProbabilityNode`, `failureDrivers`, `actionImpact`।
- `lib/core/models/battle_session.dart`: `BattleSession`, `MissionResult`, `questionOutcomes`।
- `lib/core/telemetry/telemetry_engine.dart`: `TelemetryEngine`, `capture()`, `flush()`, `trackCriticalError()`।
- `lib/features/syllabus/core/node_factory_worker.dart`: `NodeFactoryWorker.generate({required String exam, required List<SyllabusChunk> chunks})`।
- `lib/features/digibook/domain/services/digibook_canonical_bridge_service.dart`: `DigiBookCanonicalBridgeService.buildLaunchArgs(String guId)`।
- `functions/workers/evaluate_attempt_worker.js`: `createAttemptSession()`, `evaluateAttempt()`।

---

## Appendix D: Firestore Collection & Field Dictionary

Rank Crackers के फायरस्टोर डेटाबेस में 7 संप्रभु कार्यात्मक क्षेत्र और 46 संग्रह सन्निहित हैं:

### 1. उपयोगकर्ता और पहचान क्षेत्र (`users/{userId}`)
- **रूट दस्तावेज़ फ़ील्ड्स:**
  - `email` (String): छात्र का ईमेल।
  - `fullName` (String): छात्र का पूरा नाम।
  - `phoneNumber` (String?): 10-अंकीय भारतीय मोबाइल नंबर।
  - `targetYear` (int): लक्ष्य परीक्षा वर्ष (उदा. 2026, 2027)।
  - `stateId` (String): 2-अक्षरीय राज्य कोड (`IndiaStates` — 36 इकाइयाँ)।
  - `selectedExam` (String): सक्रिय मिशन आईडी।
  - `consentAccepted` (bool): नियमों और गोपनीयता नीति की स्वीकृति।
  - `isDeactivated` (bool): खाता निष्क्रियता फ्लैग।
  - `createdAt` (Timestamp), `updatedAt` (Timestamp)।
- **उप-संग्रह (Subcollections):**
  - `/progress/{progressId}`: सामान्य प्रगति रिकॉर्ड्स।
  - `/atomic_mastery/{atomicTopicId}`: `score`, `confidence`, `status`, `lastEvidenceAt`।
  - `/atomic_coverage/{atomicTopicId}`: `coveragePercent`, `lastReadAt`।
  - `/atomic_risk/{atomicTopicId}`: `score`, `coverageDeficiency`, `recencyWeakness`।
  - `/rebuild_candidates/{rebuildId}`: कमजोर एटम्स और सुधार प्राथमिकता।
  - `/notifications/{notifId}`: छात्र के व्यक्तिगत अलर्ट्स।

### 2. अकादमिक सामग्री और पब्लिशिंग क्षेत्र
- **`digibook_refinery`:**
  - `nodeId` (String): अद्वितीय कैनोनिकल नोड आईडी।
  - `subjectId`, `unitId`, `topicId`, `atomId` (String): current runtime projection IDs; these fields alone do not establish OFFICIAL provenance or fixed hierarchy depth.
  - `canonicalFacts` (List<Map>): SVO तथ्यों का संग्रह।
  - `deepReadingHindi` (String): देवनागरी में गहन व्याख्यात्मक पाठ।
  - `isPublished` (bool), `revisionId` (int)।

### 3. प्रश्न बैंक और असेसमेंट क्षेत्र
- **`question_bank`:**
  - `questionId` (String), `atomicTopicId` (String), `text` (String)।
  - `options` (List<String>), `correctOptionIndex` (int)।
  - `difficulty` (int: 1–5), `isPYQ` (bool), `examYear` (int?)।
  - `solutionVerificationId` (String): शिक्षक सत्यापन संदर्भ।
- **`solution_verifications`:** `UNRESOLVED / HISTORICAL` in the current assessment worker. The collection/fields `verificationHash`, `verifiedByFacultyId`, `verifiedAt` and `canonicalProofText` are retained as former governance vocabulary only; `evaluateAttempt` currently reads `answer_keys.verifiedAnswerValue` and `answer_keys.acceptancePolicy`, not this collection.
- **`micro_attempts` & `macro_attempts`:** live result targets for `functions/workers/evaluate_attempt_worker.js`. The verified fields written by that helper are `attemptSessionId`, `userId`, `scheduleId`, `status`, `submittedAt`, `responses`, `score`, `correctness` and `evaluated`; older `attemptId/examId/cycleIndex/totalQuestions` fields are not asserted for this path without a separate fixture.

### 4. मिशन और भर्ती क्षेत्र
- **`recruitments`:**
  - `examId`, `title`, `officialNotificationUrl`, `applicationDeadline`।
  - `isPublished` (bool), `totalVacancies` (int), `eligibilityCriteria` (Map)।
- **`student_mission_catalog`:**
  - `catalogVersion` (int), `publishedMissions` (List<String>)।

### 5. टेलीमेट्री और शासन क्षेत्र
- **`telemetry_nexus`:**
  - `id`, `eventName`, `durationMs`, `success`, `anonymizedUserId`।
  - `deviceModel`, `osVersion`, `networkType`, `timestamp`।
- **`founder_activity_log`:**
  - `founderId`, `actionType`, `targetEntityId`, `payloadSnapshot`, `timestamp`।

---

## Appendix E: Cloud Callable Functions & Triggers API Index

यह index current checkout के live exports और अलग worker/helper boundaries को अलग-अलग रखता है। “Official contract” का अर्थ केवल source-evidence तक सीमित है; absent validation, retry या offline behavior को अनुमान से नहीं भरा गया है। Callable export wiring `functions/index.js` Lines 20–26 और worker wiring Lines 46–59 में है।

| Symbol / status | Live source and lines | Caller/auth boundary | Input | Output and mutation | Error/retry/offline evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `manageUserAccess` — VERIFIED | `functions/callable/manage_access.js:10–96` | Auth required; founder/admin; founder-only elevation and last-founder guard | `{ targetUid, role, action }` | `{ success: true, newClaims }`; Auth claims, `users/{targetUid}`, founder audit log | Explicit unauthenticated/permission/failed-precondition; caught failures become internal; no retry/idempotency/offline queue declared |
| `toggleAiSystem` — VERIFIED | `functions/callable/toggle_ai_system.js:8–26` | Founder claim | `{ enabled }` | `{ success: true }`; merges `system_config/global.aiEnabled` and writes founder activity log | Permission denial explicit; no input type validation, retry or offline behavior declared |
| `getSystemHealth` — VERIFIED | `functions/callable/system_health.js:8–72` | Founder or admin claim | data unused | Health object with provider/service/project/version/timestamp; writes and reads `system_health_pings/heartbeat` | Firestore codes mapped to status strings; outer failure returns `system_error`; no retry/cache declared |
| `processAITask` — VERIFIED | `functions/callable/process_ai_task.js:12–63` | Admin claim; Gemini secret | `{ taskType, provider, payload }` | Parsed sanitized Gemini result; budget increments and AI audit write | kill switch `unavailable`, quota `resource-exhausted`, other failures `internal`; no idempotency/retry/offline mode |
| `getSecureAssetUrl` — VERIFIED | `functions/callable/secure_download.js:8–71` | Any authenticated caller | `{ assetUrl, realmId, assetType }` | Five-minute V4 signed read URL; `download_audit` append | invalid-argument/not-found/internal; no enrollment check or offline cache in source |
| `finalizeTestArenaAttempt` — VERIFIED callable | `functions/src/workers/testArenaFinalScorerWorker.ts:289–296`; worker `:74–282` | Auth required; admin/founder override | `{ attemptId }` | authoritative result in `test_arena_results/{attemptId}`; existing result returned for idempotency | unauthenticated, invalid-argument, not-found, permission-denied, failed-precondition; transaction/automatic retry not claimed |
| `createAttemptSession` — VERIFIED helper, not callable | `functions/workers/evaluate_attempt_worker.js:9–55,219–220` | No auth context in helper; caller must be trusted server/test code | db plus user/test IDs, question versions, ordinal, `isRunnable` | `attempt_sessions/{deterministicId}`; existing document returned, else 3-hour session written | `NOT_READY`; no callable/offline semantics; concurrent create race not transactionally closed |
| `evaluateAttempt` — VERIFIED helper, not callable | `functions/workers/evaluate_attempt_worker.js:57–217,219–220` | No auth context in helper; session.userId is trusted from stored session | db, session ID, responses, submittedAt | attempt result, atomic evidence records, evidence outbox in one batch | invalid/expired/stale/missing data errors; existing attempt guard is idempotent for sequential repeats; no retry/offline queue |
| `handleSentinelAction` — VERIFIED callable | `functions/callable/handle_sentinel_action.js:165–780`; export `functions/index.js:24` | Founder or admin claim (`auth.token.founder === true \|\| auth.token.admin === true`) | `{ draftId, sourceId, action, payload, recruitmentId }` (Actions: `log_founder_activity`, `update_mission_variables`, `purge_historical_test_data`, `publish`, `verify`, `reject`, `reprocess`, `push_to_ai_queue`, `manifest_learning`, `verify_knowledge_block`, `approve_storage_purge`, `verify_participant_claim`, `launch_exam_mission`, `manifest_realm`, `launch_realm`, `delete_realm_permanently`, `declare_result`, `delete`) | `{ success: true, ... }`; updates `sentinel_drafts`, `mission_realms`, `student_mission_catalog`, `recruitments`, queues `ai_queue`, logs to `founder_activity_log` | `unauthenticated`, `permission-denied`, `DRAFT_ID_REQUIRED`, `DRAFT_NOT_FOUND`, `RECRUITMENT_ID_REQUIRED`, `REALM_ID_REQUIRED`; caught errors wrapped in `HttpsError('internal')`; no client offline queue or automatic retry in source |
| `handleMissionAction` — VERIFIED callable | `functions/callable/handle_mission_action.js:8–90`; export `functions/index.js:25` | Authenticated student (`auth != null`) | `{ action, realmId, payload: { milestoneType, rollNumber, resultUrl, screenshotUrl, score, rank } }` | Strictly handles `action === 'claim_qualification'`; computes authenticity score (0–100), detects cross-user duplicate roll number across `collectionGroup('participants')`; merges `mission_realms/{realmId}/participants/{uid}` with `claimedRollNumber`, `authenticityScore`, status `PENDING_VERIFICATION` or `FLAGGED`; returns `{ success: true, status, score }` | Throws `unauthenticated`; any action other than `claim_qualification` (including client router's `submit_micro_attempt`) throws `Error('UNKNOWN_ACTION')` wrapped in `HttpsError('internal')`; no retry or offline queue declared |

### Appendix E.1 — Deliberately historical or unresolved API labels

`functions/src/assessment.ts`, `functions/src/triggers.ts` और `functions/src/workers.ts` current checkout में नहीं मिले। पुराने `createAttemptSession`/`evaluateAttempt` labels को अब live callable नहीं लिखा जाएगा; live replacement/helper path ऊपर दिया गया है। `SolutionVerificationRecord.computeSha256` और `functions/src/assessment/verification.ts` भी `UNRESOLVED/HISTORICAL` हैं; current `evaluateAttempt` SHA-256 verification नहीं करता।

---

## Appendix F: Revision History & Editorial Provenance Log

Rank Crackers जीवित संदर्भ ग्रंथ के विकास का कालानुक्रमिक लेज़र (Editorial Provenance Ledger):

| संस्करण (Version) | प्रकाशन तिथि (Date) | संपादक / एजेंसी (Editorial Authority) | प्रमुख मील के पत्थर और जोड़े गए खंड (Milestones & Changes) |
| :--- | :--- | :--- | :--- |
| **v1.0.0-PROD** | 09-10-2026 | Antigravity 2.0 Lead Editor | प्रारंभिक ऑडिट, प्रोजेक्ट स्नैपशॉट, और 11 प्राथमिक रूपरेखा ड्राफ्ट्स। |
| **v2.0.0-DEEP** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 08 (पहचान पाइपलाइन) और 09 (डैशबोर्ड कमांड सरफेस) का 60KB+ गहन विस्तार। |
| **v2.5.0-CRUCIBLE**| 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 10 (क्रूसिबल 98-दिवसीय मोडुलो) और 11 (सिलेबस व डिजीबुक ब्रिज) का पूर्ण दस्तावेज़ीकरण। |
| **v3.0.0-FOUNDER** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 13 (फाउंडर वेब ऑपरेशंस) का 10-सेक्शन विस्तार, सेपरेशन ऑफ पावर्स लॉ। |
| **v3.5.0-BACKEND** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 14 (फायरस्टोर डिक्शनरी व रूल्स) और 15 (क्लाउड फ़ंक्शंस व कॉलएबल्स) का संकलन। |
| **v4.0.0-OPS** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 16 (इंजीनियरिंग ऑपरेशंस, एमुलेटर्स, सीआई/सीडी और रोलबैक) का समापन। |
| **v4.5.0-VISION** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 17 (वॉल्यूम A: प्रोडक्ट विजन, दर्शन, 5 व्यक्तित्व व छात्र यात्रा) का लोकार्पण। |
| **v5.0.0-ARCH** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 18 (वॉल्यूम D: मल्टीप्लेटफ़ॉर्म आर्किटेक्चर, टैक्टिकल नोआर व रिवरपॉड) का दस्तावेज़ीकरण। |
| **v5.5.0-MATH** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 19 (वॉल्यूम F: अकादमिक बौद्धिकता, मास्टरी, रिस्क, एबिंगहॉस क्षरण व FNV-1a)। |
| **v6.0.0-MASTER** | 09-10-2026 | Antigravity 2.0 Lead Editor | अध्याय 20 (वॉल्यूम I: मास्टर संदर्भ परिशिष्ट A-F, रूट इंडेक्स, ग्लॉसरी व स्कीमा डिक्शनरी)। |
| **v7.0.0-CHIEF-MANDATE** | 09-10-2026 | Antigravity 2.0 Lead Editor & Chief Author | Chief Author directive के अनुसार contract और atomic-trace manuscript का विस्तार। यह milestone scoped working-manuscript state है; इसे 100% implementation या parity certification नहीं माना जाता। |

---

## Appendix G: Master Function Contracts Index (8-Dimension Specification)

यह section legacy manuscript में गिने गए 91 formal contract rows का master-registry view है। Batch 02 के बाद हर row को live, unresolved, historical या proposed status के साथ पढ़ना होगा; 91 को current implementation count या exhaustive certification न माना जाए। Chapters 15 और 19 के corrected atomic contracts Appendix E तथा Chapter 22 में cross-referenced हैं:

### 1. वॉल्यूम A — प्रोडक्ट विज़न, बूटस्ट्रैप और छात्र यात्रा (Chapter 17)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 17.1** | `SplashScreen._navigateNext` | `splash_screen.dart` | `initState()` एनीमेशन लिसनर | `context, session, auth` | Public / Non-privileged |
| **Contract 17.2** | `StartModeScreen._handleContinue`| `start_mode_screen.dart` | मोड कार्ड टैप (`onTap`) | `context, LearningMode` | Authenticated + Profile |
| **Contract 17.3** | `MainNavigationShell.build` | `main_navigation_shell.dart`| GoRouter `StatefulShellRoute`| `context, shell, index` | Fully Qualified Student |
| **Contract 17.4** | `SessionManager.isMissionValid` | `session_manager.dart` | Router redirect, Dashboard | `examId: String?` | Client Cache Guard |
| **Contract 17.5** | `AppRouter._redirectLogic` | `app_router.dart` | GoRouter redirect callback | `context, state, session` | Client 5-Gate Boundary |
| **Contract 17.6** | `TelemetryEngine.capture/flush` | `telemetry_engine.dart` | UI/इवेंट ट्रिगर्स | `eventName, properties` | SHA-256 Anonymized |
| **Contract 17.7** | `ResponsiveHelper.scale/sp` | `responsive_helper.dart` | UI रेंडर विजेट्स | `context, baseValue, factor` | Presentation Layer |
| **Contract 17.8** | `TacticalNoirBackground.paint` | `tactical_noir_background.dart`| Flutter Canvas Renderer | `canvas, size, themeTokens` | Visual Layer |

### 2. वॉल्यूम B, पार्ट 1 — पहचान, प्रोफ़ाइल व मिशन गेट्स (Chapter 08)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 8.1** | `verifyPhoneNumber` | `phone_auth_service.dart` | `UnifiedIdentityScreen` | `phoneNumber, callbacks` | Unauthenticated |
| **Contract 8.2** | `signInWithCredential` | `phone_auth_service.dart` | OTP सबमिट बटन | `verificationId, smsCode` | Public OTP Gate |
| **Contract 8.3** | `signInWithGoogle` | `google_auth_service.dart` | Google SSO बटन | Google OAuth Prompt | Public OAuth Gate |
| **Contract 8.4** | `isAccountDeactivated` | `deactivation_service.dart` | Auth state listener | `userId: String` | Authenticated |
| **Contract 8.5** | `ProfileSetupScreen._submit` | `profile_setup_screen.dart`| प्रोफ़ाइल सबमिट बटन | `name, stateId, targetYear` | Auth User Gate |
| **Contract 8.6** | `SessionManager.initialize` | `session_manager.dart` | `main.dart` बूटस्ट्रैप | `SharedPreferences` | Local Sandbox |
| **Contract 8.7** | `isProfileCompleted` | `profile_service.dart` | Route guard Gate 3 | `userId: String` | Firestore User Doc |
| **Contract 8.8** | `streamPublishedRealms` | `mission_realm_service.dart`| `MissionSelectionScreen`| Firestore query stream | Published Catalog |
| **Contract 8.9** | `setSelectedMission` | `session_manager.dart` | मिशन कार्ड चयन | `examId: String` | Authenticated |
| **Contract 8.10** | `AppRouter.redirect` | `app_router.dart` | प्रत्येक नेविगेशन इवेंट | 5-Gate synchronous state | Router Authority |
| **Contract 8.11** | `reinstateAccount` | `deactivation_service.dart` | रीइंस्टेटमेंट डायलॉग | `userId, consentAccepted` | Reinstatement Token |

### 3. वॉल्यूम B, पार्ट 2 — डैशबोर्ड कमांड सरफेस व प्रोवाइडर्स (Chapter 09)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 9.1** | `dashboardHeroStateProvider` | `dashboard_providers.dart` | `DashboardScreen` Sliver 1 | `ref (Riverpod)` | Authenticated User |
| **Contract 9.2** | `todaysFocusProvider` | `dashboard_providers.dart` | `DashboardScreen` Sliver 3 | `ref, selectedMission` | User Mastery Cache |
| **Contract 9.3** | `readinessIndexProvider` | `dashboard_providers.dart` | `DashboardScreen` Sliver 4 | `ref, examId` | Knowledge Engine |
| **Contract 9.4** | `rebuildQueueSummaryProvider`| `dashboard_providers.dart` | `DashboardScreen` Sliver 5 | `ref, userId` | Rebuild Candidates |
| **Contract 9.5** | `streakCalculationService` | `streak_service.dart` | टेस्ट सबमिशन, ऐप ओपन | `lastActiveTimestamp` | Immutable History |
| **Contract 9.6** | `dynamicActionEngine` | `action_engine.dart` | डैशबोर्ड रीफ्रेश | `masteryState, cycleDay` | Reactive Algorithm |
| **Contract 9.7** | `sliverFoldAnimator` | `dashboard_screen.dart` | स्क्रॉल कंट्रोलर लिसनर | `ScrollNotification` | UI Presentation |
| **Contract 9.8** | `offlineDashboardCache` | `offline_cache_manager.dart`| नेटवर्क विफलता फॉलबैक | `localDb: SQLite` | Encrypted Storage |

### 4. वॉल्यूम B, पार्ट 3 — क्रूसिबल प्रोटोकॉल व 98-दिवसीय मोडुलो (Chapter 10)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 10.1** | `calculateModuloCadence` | `crucible_engine.dart` | `CrucibleScreen` इनिशियलाइजेशन | `enrolledAt, currentDate` | Pure Math Kernel |
| **Contract 10.2** | `resolveSacredDay` | `crucible_engine.dart` | `CrucibleScreen` स्टेटस कार्ड | `cycleDay (1..14)` | Modulo Invariant |
| **Contract 10.3** | `generateFnv1aSeed` | `fnv_shuffler.dart` | टेस्ट सेशन निर्माण | `examId, cycleIndex, date` | Deterministic Seed |
| **Contract 10.4** | `shuffleQuestionsDeterministically`| `fnv_shuffler.dart`| `MicroChamberScreen` | `questions, seed64` | Client-Side FNV-1a |
| **Contract 10.5** | `recordQuestionOutcome` | `battle_session.dart` | प्रश्न उत्तर चयन | `questionId, isCorrect, ms` | In-Memory Session |
| **Contract 10.6** | `submitCrucibleAttempt` | `crucible_repository.dart` | टेस्ट सबमिट बटन | `BattleSession` पेलोड | Auth Student Token |
| **Contract 10.7** | `fetchRebuildCandidates` | `rebuild_repository.dart` | `RebuildChamberScreen` | `userId, threshold < 0.50` | User Mastery Store |
| **Contract 10.8** | `unlockMacroCitadel` | `macro_citadel_service.dart`| दिन 14 गेटवे सत्यापन | `cycleDay == 14, microCount`| Modulo Day 14 Guard |

### 5. वॉल्यूम B, पार्ट 4 — सिलेबस पदानुक्रम व डिजीबुक ब्रिज (Chapter 11)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 11.1** | `fetchSyllabusTree` | `syllabus_repository.dart` | `SyllabusScreen` | `examId, subjectId` | Published Catalog |
| **Contract 11.2** | `resolveAtomNode` | `syllabus_repository.dart` | सिलेबस नोड टैप | `atomId: String` | Cached DAG Cache |
| **Contract 11.3** | `bridgeToDigiBook` | `canonical_bridge.dart` | "Read in DigiBook" एक्शन | `atomId, BuildContext` | Fully Qualified |
| **Contract 11.4** | `streamDeepReadingHindi` | `digibook_repository.dart` | `DigiBookReaderScreen` | `nodeId: String` | Published Content |
| **Contract 11.5** | `renderSvoTriplets` | `svo_visualizer.dart` | डिजीबुक फैक्ट्स कार्ड | `List<AtomicFact>` | Presentation Layer |
| **Contract 11.6** | `updateReadingProgress` | `digibook_service.dart` | स्क्रॉल थ्रेशोल्ड (80%) | `userId, atomId, dwellSeconds`| Auth User Storage |
| **Contract 11.7** | `calculateNodeWeight` | `syllabus_math.dart` | ट्री एग्रीगेशन इंजन | `atomWeights: List<double>` | Mathematical Pure |
| **Contract 11.8** | `searchSyllabusNodes` | `syllabus_search.dart` | सर्च बार इनपुट | `query: String, examId` | Client Trie Search |

### 6. वॉल्यूम C, पार्ट 1 — फाउंडर वेब ऑपरेशंस व मिशन कंट्रोल (Chapter 13)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 13.1** | `streamTotalPendingReviews`| `command_center_repo.dart`| `FounderDashboard` | `Firestore system_metrics` | Web Founder Only |
| **Contract 13.2** | `reconcileMissionPortfolio` | `founder_mission_inv.dart`| मिशन इन्वेंटरी लोड | `realms, recruitments, catalog`| Web Admin Reconciler|
| **Contract 13.3** | `toggleWorker` | `command_center_repo.dart`| वर्कर टॉगल स्विच | `workerId, enabled: bool` | Founder Role Claim |
| **Contract 13.4** | `purgeForensicTestData` | `outcome_verification.dart`| "PURGE TEST DATA" एक्शन | `confirmationHash` | Exclusive Founder |
| **Contract 13.5** | `grantAuthorityRole` | `people_access_center.dart`| "GRANT ACCESS" डायलॉग | `targetUid, newRole` | Custom Claims Token |
| **Contract 13.6** | `streamStudentHealthTelemetry`| `founder_student_health.dart`| हेल्थ मॉनिटर ग्रिड | `telemetry_nexus limit(500)`| Read-Only Founder |
| **Contract 13.7** | `handleSentinelAction` | `sentinel_repo.dart` | अप्रूवल / रिजेक्शन बटन | `draftId, action: APPROVE` | Founder Role Claim |
| **Contract 13.8** | `fetchSystemHealthVitals` | `system_health_center.dart`| हेल्थ टैब लोड | CPU, Latency, Token Metrics | Founder Role Claim |

### 7. वॉल्यूम D, पार्ट 1 — मल्टीप्लेटफ़ॉर्म आर्किटेक्चर व डिज़ाइन सिस्टम (Chapter 18)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 18.1** | `main()` | `lib/main.dart` | Flutter OS Engine | Platform Environment | GlobalErrorHandler Crash Catch |
| **Contract 18.2** | `SessionManager.initialize()`| `lib/shared/session/session_manager.dart`| `main.dart`, `main_web.dart`| None (Local Disk) | Local-First Synchronous Authority |
| **Contract 18.3** | `FirebaseAppCheck.instance.activate`| `lib/main.dart` | `main()` Mobile Bootstrap | Play Integrity / DeviceCheck | Hardware Attestation Token Gate |
| **Contract 18.4** | `TelemetryEngine.init()` | `lib/core/telemetry/telemetry_engine.dart`| `main()` Mobile Bootstrap | None | Privacy Hashing (12-char SHA-256) |
| **Contract 18.5** | `TelemetryEngine.capture()`| `lib/core/telemetry/telemetry_engine.dart`| UI, Network, Navigation | `eventName, durationMs, ...`| Persistent Disk Queue Protection |
| **Contract 18.6** | `TelemetryEngine.flush()` | `lib/core/telemetry/telemetry_engine.dart`| 1-Min Timer, Critical Error | None | Firestore Batch Upload & Retry Retention |
| **Contract 18.7** | `GlobalErrorHandler.handleFatal`| `lib/core/errors/global_error_handler.dart`| `main()` Catch, Dispatcher | `error, [stack]` | Non-Debug Crashlytics Record |
| **Contract 18.8** | `ResponsiveHelper.sp()` | `lib/core/utils/responsive_helper.dart`| `AppTypography`, Layouts | `BuildContext context, double size`| Clamping Guard `[size*0.8, size*1.3]` |

### 8. वॉल्यूम E & G, पार्ट 1 — फायरस्टोर संग्रह व सुरक्षा नियम (Chapter 14)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 14.1** | `isAuth()` | `firestore.rules` | सभी सुरक्षित संग्रह | `request.auth` | Firebase Auth |
| **Contract 14.2** | `isOwner(userId)` | `firestore.rules` | `users/{userId}/*` | `request.auth.uid == userId` | Row-Level Security |
| **Contract 14.3** | `isFounder()` | `firestore.rules` | सिस्टम / एडमिन संग्रह | `request.auth.token.founder` | Custom Claims Claim |
| **Contract 14.4** | `hasConsent()` | `firestore.rules` | शैक्षणिक म्यूटेशन्स | `users/{uid}.consentAccepted`| Legal Consent Gate |
| **Contract 14.5** | `preventScoreTampering()` | `firestore.rules` | `atomic_mastery` राइट | `request.auth != null` | Serverless Mutation |
| **Contract 14.6** | `validateProfileSchema()` | `firestore.rules` | प्रोफ़ाइल अपडेट | `request.resource.data` | Schema Validator |
| **Contract 14.7** | `validateSvoStructure()` | `firestore.rules` | डिजीबुक इनजेशन | `SVO triplet maps` | Content Schema Guard |
| **Contract 14.8** | `immutableLogGuard()` | `firestore.rules` | `founder_activity_log` | `allow write: if false;` | Hard Immutability |

### 9. वॉल्यूम E, पार्ट 2 — क्लाउड फ़ंक्शंस व कॉलएबल्स (Chapter 15)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 15.1** | `evaluateAttempt` | `functions/workers/evaluate_attempt_worker.js` (L57–217, export L219–220) | Trusted server/test helper; not callable | `db, attemptSessionId, responses, submittedAt` | Writes attempt result, atomic evidence and outbox; sequential existing-result guard; `VERIFIED HELPER / NO AUTH CONTEXT` |
| **Contract 15.2** | `createAttemptSession` | `functions/workers/evaluate_attempt_worker.js` (L9–55, export L219–220) | Trusted server/test helper; not callable | `db, user/test IDs, versions, ordinal, isRunnable` | Writes/returns `attempt_sessions/{deterministicId}`; 3-hour expiry; `VERIFIED HELPER / NO AUTH CONTEXT` |
| **Contract 15.3** | `manageUserAccess` | `functions/callable/manage_access.js` | Founder/admin callable | `targetUid, role, action` | Auth + founder/admin claims |
| **Contract 15.4** | `toggleAiSystem` | `functions/callable/toggle_ai_system.js` | Founder callable | `enabled` | Founder claim |
| **Contract 15.5** | `getSystemHealth` | `functions/callable/system_health.js` | Founder/admin callable | Callable context | Founder/admin claims |
| **Contract 15.6** | `getSecureAssetUrl` | `functions/callable/secure_download.js` | Authenticated asset request | `assetUrl, realmId, assetType` | Live auth/asset checks |
| **Contract 15.7** | `onUserCreatedTrigger` | `UNRESOLVED — former functions/src/triggers.ts not found` | Historical trigger label | Not verified | `UNRESOLVED` |
| **Contract 15.8** | `scheduledSentinelWorker` | `UNRESOLVED — former functions/src/workers.ts not found` | Historical worker label | Not verified | `UNRESOLVED` |
| **Contract 15.9** | `finalizeTestArenaAttempt` | `functions/src/workers/testArenaFinalScorerWorker.ts` (L74–82, L101–105, L279–296) | Authenticated student or founder/admin override | `{ attemptId }` | Reads attempt, enforces ownership/status, returns existing result or writes authoritative result; `VERIFIED CALLABLE` |
| **Contract 15.10** | `handleSentinelAction` | `functions/callable/handle_sentinel_action.js` (L165–780, export `functions/index.js:24`) | Founder/admin callable | `{ draftId, sourceId, action, payload, recruitmentId }` | Founder/admin claim; 15 governance actions (`publish`, `launch_realm`, etc.); `VERIFIED CALLABLE` |
| **Contract 15.11** | `handleMissionAction` | `functions/callable/handle_mission_action.js` (L8–90, export `functions/index.js:25`) | Authenticated student callable | `{ action, realmId, payload }` | Auth required; strictly `claim_qualification`; duplicate roll check across participants; `VERIFIED CALLABLE` |

### 10. वॉल्यूम F, पार्ट 1 — अकादमिक बौद्धिकता व गणितीय मॉडल (Chapter 19)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 19.1** | `MasteryDecayEngine.calculateRetention` | `lib/core/knowledge/mastery_decay_engine.dart` (L8–20) | Knowledge refresh | `lastEvidenceAt, memoryStrengthDays` | Returns clamped retention; pure sync; `VERIFIED` |
| **Contract 19.2** | `MasteryEngine.calculateScore` | `lib/core/knowledge/mastery_engine.dart` (L12–28) | `KnowledgeEngine._applyDeltaProgress` | five weighted evidence inputs | Returns clamped 0–1 score; pure sync; `VERIFIED` |
| **Contract 19.3** | `RiskEngine.calculate` | `lib/core/knowledge/risk_engine.dart` (L55–82) | `KnowledgeEngine._refreshAnalytics` | `CoverageState, atomicWeaknessRisk, cascadeRisk` | Returns `RiskState`; no persistence; `VERIFIED` |
| **Contract 19.4** | `ReadinessEngine.calculate` | `lib/core/engines/readiness_engine.dart` (L14–56) | `KnowledgeEngine._refreshAnalytics` | `CoverageState, masteryPercent, assessmentPerformance, RiskState` | Returns `ReadinessState`; zero evidence is `Pending Evidence`; `VERIFIED` |
| **Contract 19.5** | `fnv1a64Hash` | `UNRESOLVED — former fnv_hasher.dart not found` | Historical seed/hash label | Not verified | `UNRESOLVED` |
| **Contract 19.6** | `calculateDwellDiscount` | `UNRESOLVED — former dwell_filter.dart not found` | Historical scoring label | Not verified | `UNRESOLVED` |
| **Contract 19.7** | `CoverageEngine.calculate` | `lib/core/knowledge/coverage_engine.dart` (L44–80) | `KnowledgeEngine._refreshAnalytics` | exam/variant, nodes, runtime/atomic states | Returns `CoverageState`; empty-node zero state; `VERIFIED` |
| **Contract 19.8** | `predictExamRankAir` | `UNRESOLVED — former rank_forecaster.dart not found` | Historical rank forecast label | Not verified | `UNRESOLVED` |

### 11. वॉल्यूम H, पार्ट 1 — इंजीनियरिंग ऑपरेशंस, एमुलेटर्स व सीआई/सीडी (Chapter 16)
| अनुबंध आईडी | फ़ंक्शन प्रतीक | स्रोत फ़ाइल (File Path) | कॉलर (Caller) | इनपुट पेलोड | सुरक्षा सीमा |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract 16.1** | `npm run serve` | `functions/package.json` | लोकल developer console | Firebase emulator command | Live package script |
| **Contract 16.2** | `seedProductionFixtures` | `UNRESOLVED — former scripts/seed_fixtures.py not found` | Historical fixture label | Not verified | `UNRESOLVED` |
| **Contract 16.3** | `runFlutterUnitTests` | `UNRESOLVED — no .github/workflows inventory found` | Historical CI label | Not verified | `UNRESOLVED` |
| **Contract 16.4** | `runFirestoreRulesTests` | `functions/package.json` dependency only; workflow not found | Rules test capability, not CI proof | Jest/rules-unit-testing dependency | `UNRESOLVED` execution gate |
| **Contract 16.5** | `buildReleaseApk` | Release Pipeline | Tagged Release Trigger | Flutter toolchain + Keystore | Signed Cryptographic |
| **Contract 16.6** | `deployCloudFunctions` | CD Deployment Action | Main branch merge | `firebase deploy --only functions`| Google Cloud IAM |
| **Contract 16.7** | `checkDeadLetterQueue` | Ops Monitoring Cron | 5-minute schedule | `dlq_tasks` collection | Ops Service Worker |
| **Contract 16.8** | `emergencyRollback` | SRE Runbook Playbook | Production Incident | Target release hash | Founder & SRE Lead |

---

## Appendix H: Master Atomic Trace Methodology & Cross-Domain Verification Matrix

Rank Crackers के अकादमिक और तकनीकी अनुशासन का मूल आधार **11-चरणीय अखंड एटॉमिक पाइपलाइन अनुरेखण (11-Step Atomic Pipeline Trace)** है। यह सुनिश्चित करता है कि ज्ञान के किसी भी परमाणु (Atom) का स्रोत से लेकर छात्र की स्मृति और ऑडिट ट्रेल तक का जीवनचक्र पूरी तरह प्रामाणिक, पारदर्शी और सत्यापित हो।

### H.1 The 11-Step Pipeline Formal Specification

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       THE 11-STEP CANONICAL TRACE PROTOCOL                             │
├────┬────────────────────────┬──────────────────────────────────────────────────────────┤
│ 1  │ Source Record          │ मूल आधिकारिक राजपत्रित दस्तावेज़ या पाठ्यक्रम स्रोत      │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 2  │ Canonical ID           │ अद्वितीय, अपरिवर्तनीय सिस्टम पहचानकर्ता                 │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 3  │ Parent Hierarchy       │ पाठ्यक्रम और संरचनात्मक ट्री में पूर्ण पदानुक्रम पथ     │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 4  │ Content Payload        │ सत्यापित SVO तथ्य, व्याख्यात्मक पाठ और कैलिब्रेटेड प्रश्न│
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 5  │ Publication State      │ मानव शिक्षक के हस्ताक्षर और SHA-256 क्रिप्टोग्राफिक हैश│
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 6  │ Student Visibility     │ बहु-स्तरीय रूट गेट्स और प्रोफ़ाइल पात्रता द्वारा दृश्यता │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 7  │ Learning Interaction   │ डिजीबुक में गहन पठन या क्रूसिबल मोडुलो रिंग में अभ्यास    │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 8  │ Evidence Capture       │ बैटल सेशन के तहत समय, विकल्प और एंटी-चीट डेटा संकलन    │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 9  │ Mastery Calculation    │ सर्वरलेस बायेशियन नॉलेज ट्रेसिंग द्वारा मास्टरी अद्यतन   │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 10 │ Risk / Coverage State  │ समय-क्षरण रीसेट, रिस्क फ़ैक्टर अद्यतन और रेडीनेस इंडेक्स  │
├────┼────────────────────────┼──────────────────────────────────────────────────────────┤
│ 11 │ Audit Trail            │ अपरिवर्तनीय टेलीमेट्री और निष्पादन लॉग में कमिट         │
└────┴────────────────────────┴──────────────────────────────────────────────────────────┘
```

### H.2 Cross-Domain Verification Matrix (11 Subsystems Across All Volumes)

नीचे दिया गया विस्तृत मैट्रिक्स दर्शाता है कि रैंक क्रैकर्स के सभी 11 प्रमुख कार्यात्मक डोमेन किस प्रकार 11-चरणीय ट्रेस पाइपलाइन में मैप होते हैं:

| डोमेन (Domain) | चरण 1–3: स्रोत व पहचान | चरण 4–5: सामग्री व प्रकाशन | चरण 6–7: दृश्यता व अध्ययन | चरण 8–9: साक्ष्य व मास्टरी | चरण 10–11: रिस्क व ऑडिट |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Student Journey (Vol A, Ch 17)** | BPSC Notification $\rightarrow$ `bpsc_gs1_hist_004` $\rightarrow$ GS1/ModHist | SVO कुंवर सिंह $\rightarrow$ Human Faculty Verified | Phone OTP $\rightarrow$ State BR $\rightarrow$ DigiBook & Crucible D3 | 24s Dwell $\rightarrow$ $M(a): 0.40 \rightarrow 0.85$ | Risk STABLE $\rightarrow$ `telemetry_nexus` |
| **2. Identity & Gates (Vol B1, Ch 08)** | Auth Record $\rightarrow$ `users/{uid}` $\rightarrow$ State/Year Map | Terms Consent $\rightarrow$ `consentAccepted: true` | 5-Gate Pass $\rightarrow$ `/dashboard` Entry | Auth Token $\rightarrow$ Custom Claims Assigned | `isDeactivated: false` $\rightarrow$ Auth Log |
| **3. Command Surface (Vol B2, Ch 09)** | Session Store $\rightarrow$ `dashboard_view` $\rightarrow$ 7 Slivers | Action Vectors $\rightarrow$ Prioritized Today Card | Fully Qualified $\rightarrow$ Today's Focus Tap | Card Click $\rightarrow$ Streak Incremented | Risk Badge $\rightarrow$ Route Transition Metric |
| **4. Crucible Modulo (Vol B3, Ch 10)** | Exam Modulo $\rightarrow$ `crucible_b1_d03` $\rightarrow$ 98-Day Ring | FNV-1a Seeded $\rightarrow$ Anti-Cheat Enforced | Cycle Day 3 $\rightarrow$ Micro Chamber Screen | Battle Session $\rightarrow$ `evaluateAttempt` Pass | Modulo Streak $\rightarrow$ `micro_attempts` Log |
| **5. Syllabus & DigiBook (Vol B4–B5, Ch 11 & 23)** | Official Authority $\rightarrow$ `syllabus_nodes` $\rightarrow$ verified variable-depth DSD | 17px Noto Devanagari $\rightarrow$ SVO Fact Cards | Enrolled Mission $\rightarrow$ Deep Reader Mode | Scroll Depth $\rightarrow$ Coverage Recorded | Read Time Reset $\rightarrow$ Node Access Log |
| **6. Founder Web Ops (Vol C, Ch 13)** | Gazette Crawl $\rightarrow$ `sentinel_drafts` $\rightarrow$ 3-Way Reconcile | Review Workspace $\rightarrow$ Founder Grant Signoff | Web Only $\rightarrow$ Multi-Panel Grid | Review Verdict $\rightarrow$ Catalog Mutated | Needs Attention $\rightarrow$ `founder_activity_log` |
| **7. Architecture & UI (Vol D, Ch 18)** | Design Tokens $\rightarrow$ `TacticalNoir` $\rightarrow$ Responsive Spec | DarkCard / Gold $\rightarrow$ Immutable Theme Tokens | 6 Breakpoints $\rightarrow$ 60 FPS Render | User Gesture $\rightarrow$ Riverpod State Delta | Frame Budget $\rightarrow$ Performance Tracing |
| **8. Security Rules (Vol E/G, Ch 14)** | DB Request $\rightarrow$ `firestore.rules` $\rightarrow$ Collection Match | `isOwner()` / `isFounder()` $\rightarrow$ Security Gate | Auth Header $\rightarrow$ Read/Write Evaluated | Mutation Payload $\rightarrow$ Schema Checked | Denial Caught $\rightarrow$ Security Rule Audit |
| **9. Cloud Functions (Vol E2, Ch 15)** | Callable Event $\rightarrow$ `evaluateAttempt` $\rightarrow$ Serverless TS | Cryptographic Proof $\rightarrow$ Sandbox Execution | Auth Bearer $\rightarrow$ Worker Runtime | Answer Key Match $\rightarrow$ Bayesian Calc | Latency Metric $\rightarrow$ Cloud Run Logs |
| **10. Knowledge Math (Vol F, Ch 19)** | Prior Evidence $\rightarrow$ $M(a)$ State $\rightarrow$ Topic DAG | Ebbinghaus $\tau=14$ $\rightarrow$ FNV-1a Permutation | Active Recall $\rightarrow$ Diagnostic Test | Dwell Filter $\rightarrow$ $\Delta M = f(\text{accuracy})$ | $R_{mission}$ Recalib $\rightarrow$ Mastery History |
| **11. Engineering Ops (Vol H, Ch 16)** | Git Commit $\rightarrow$ `commit_sha` $\rightarrow$ CI/CD Pipeline | Unit Tests Passed $\rightarrow$ Rules Verified | Local Emulator $\rightarrow$ Staging Deployment | Test Suite $\rightarrow$ Code Coverage > 85% | Rollback Ready $\rightarrow$ Deployment Ledger |

### H.3 Verification & Editorial Governance Checklist

किसी भी नए अध्याय, फीचर, या कोड संशोधन को Rank Crackers लिविंग बुक में शामिल करने से पूर्व निम्नलिखित 5 परीक्षण अनिवार्य हैं:
1. **Source Grounding Test:** क्या प्रत्येक फ़ंक्शन और रूट का स्रोत कोड में वास्तविक अस्तित्व है? (Zero Hallucination)।
2. **Contract Completeness Test:** क्या फ़ंक्शन के सभी 8 आयाम (`caller, inputs, outputs, mutations, retries, timeout, security boundary, downstream consumers`) स्पष्ट रूप से निर्दिष्ट हैं?
3. **Pipeline Continuity Test:** क्या 11-चरणीय ट्रेस में कोई भी चरण अनदेखा या अधूरा तो नहीं है?
4. **Visual Evidence Test:** क्या यूआई और स्क्रीनशॉट में कोई भी काल्पनिक या नकली तत्व उपस्थित नहीं है? (Zero-Fake UI Standard)।
5. **Compilation Readback Test:** क्या मास्टर कंपाइलर (`compile_master_book.py`) बिना किसी विफलता या टूटे हुए लिंक के शून्य एरर के साथ निष्पादित हुआ है?

---

### Implementation Note Summary
- **Volume:** I (Reference Appendices)
- **Part:** 1 (Master Lexicon, Route Topology, Schema Dictionary & API Catalog)
- **Chapter:** 20
- **Grounded Source Dependencies:** `lib/core/utils/app_routes.dart`, `lib/core/router/app_router.dart`, `lib/main.dart`, `lib/main_web.dart`, `lib/shared/session/session_manager.dart`, `firestore.rules`, `functions/src/index.ts`, `lib/core/models/atomic_fact.dart`, `lib/core/models/atomic_topic.dart`, `lib/core/telemetry/telemetry_engine.dart`, `lib/features/crucible/core/crucible_engine.dart`, `lib/core/knowledge/mastery_decay_engine.dart`.
- **Editorial Status:** Appendices A–H are a substantial working reference. Contract rows are split between live, unresolved and historical entries; route/model/database coverage is scoped to the evidence rows in this manuscript. This chapter is not a 100% verification certificate and does not claim zero stubs.

---

## Appendix I — GitHub Latest-Document Supersession Register

### I.1 Remote delta accepted into the book

Historical source-reconciliation snapshot (2026-10-10): the local baseline commit `ffb20f4a19d665739a5ba16414cf427e231a0db4` was two commits behind the then-observed GitHub branch head `bfee5c70814af5c2c2c3f3ba9fd9163361441d87`. The remote comparison reported exactly one changed path across those two commits:

`docs/architecture/CANONICAL_SYLLABUS_AND_DERIVED_DECOMPOSITION_CONTRACT.md`

The first commit creates the canonical contract; the second extends it with concept-vs-teaching boundary, Decomposition Stop Test, Mission Academic Boundary Profile, evidence hierarchy, PYQ exceptions, Question Knowledge Closure, deterministic DSD decision states, failure taxonomy and acceptance tests. The complete source payload and provenance are retained in Chapter 23.

### I.2 Older book statements superseded

Any earlier appendix statement that presents `Subject → Unit → Topic → Atom` or a fixed four-tier tree as the current syllabus authority is superseded. It may remain only as a labelled runtime projection or historical schema observation. The current interpretation is:

`Official Syllabus Authority → Derived Syllabus Decomposition → Verified AtomicTopic → Knowledge/Assessment Payload`

`AtomicFact` and SVO records are downstream knowledge payloads; they do not silently create official syllabus scope.

### I.3 Acceptance rule for future updates

Before a new GitHub documentation commit is treated as current book truth, the Chief Author must record repository, branch, commit SHA, source path, changed sections, local source parity, test evidence and implementation status. A newer remote document can supersede narrative wording immediately, but it cannot be used as proof that local runtime code already implements the contract.
