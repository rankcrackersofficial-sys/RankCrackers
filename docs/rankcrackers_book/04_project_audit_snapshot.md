# Preliminary Reference — Project Audit Snapshot

**Current acceptance:** working reference; path existence does not certify runtime behavior, production state or passing tests. Historical code excerpts and line ranges require SHA-specific readback before implementation use.

**GitHub source snapshot:** [`docs/rankcrackers_book/04_project_audit_snapshot.md`](https://github.com/rankcrackersofficial-sys/RankCrackers/blob/5161592ddafb42f1ecc8923cc7b7b0309934cc83/docs/rankcrackers_book/04_project_audit_snapshot.md) · source blob `b0590e0fc8eba73affc2a34df6b1721031304090`. This Drive edition contains editorial corrections; it is not a claim that those corrections were committed to GitHub. See `github_source_manifest.json` and the current reconciliation register.


**Audit status:** प्रारंभिक संरचनात्मक audit  
**Reference date:** 9 October 2026  
**Editor:** Rank Cracker Book का प्रबंध संपादक

## 1. Audit का उद्देश्य

इस audit का उद्देश्य पूरे Rank Cracker project की वर्तमान संरचना को समझना और उसे पुस्तक के लिए reliable source map में बदलना है। यह snapshot implementation के बारे में प्रारंभिक तथ्य दर्ज करता है; आगे के chapters में प्रत्येक area का अलग functional और technical अध्ययन किया जाएगा।

## Current default branch tracked inventory

| Metric | Current GitHub tree result |
|---|---:|
| `lib/` tracked files | 779 |
| Dart files | 757 |
| Non-Dart files | 22 |
| `lib/` blob bytes | 3,438,588 |
| Dart blob bytes | 3,301,582 |
| Compiler-ordered source documents | 24 |
| `.github/workflows/` tracked files | 0 |

This is a Git tree census at the recorded SHA, not a Windows disk inventory or test result.

## 2. वर्तमान technology foundation

Rank Cracker का primary application Flutter पर आधारित है। Project में web और Android-oriented configuration मौजूद है। Application state और navigation के लिए Riverpod तथा `go_router` का उपयोग किया गया है। Firebase platform निम्न महत्वपूर्ण सेवाओं के लिए जुड़ा हुआ है:

- Firebase Authentication
- Google Sign-In
- Cloud Firestore
- Firebase Storage
- Cloud Functions
- Firebase App Check
- Firebase Crashlytics
- Firebase Performance

स्थानीय और offline behavior के लिए `shared_preferences`, `flutter_secure_storage`, `path_provider`, connectivity handling और Isar-related packages मौजूद हैं। File तथा academic-document workflows के लिए PDF, Excel, XML, archive और text-recognition libraries भी शामिल हैं।

## 3. Source structure का प्रारंभिक map

### 3.1 `lib/core`

यह project का मुख्य domain और infrastructure layer है। इसमें निम्न प्रकार के क्षेत्रों की पुष्टि हुई:

- `firebase` — Firestore और emulator configuration
- `backend` — repositories, adapters, sync और offline cache
- `engines` — mastery, readiness, risk, coverage, publication और mission engines
- `ai` — workers, orchestration और document/content intelligence
- `authority` — content और decision authority
- `knowledge` — search, mastery और weak-node intelligence
- `telemetry` और `diagnostic` — observability और health signals
- `theme`, `language`, `network`, `errors` — shared application foundation
- `exam`, `topic_graph` और `question_engine` — academic/product logic

### 3.2 `lib/web`

यह user-facing और founder-facing web experience का मुख्य क्षेत्र है। प्रारंभिक inventory में निम्न areas स्पष्ट हैं:

- `web/founder/mission_control`
- `web/founder/study_master`
- `web/founder/intelligence`
- `web/founder/ingestion`
- `web/founder/health`
- `web/founder/revenue`
- `web/founder/system`
- `web/shared`

इनके आधार पर Founder Web Panel को पुस्तक का स्वतंत्र भाग बनाना आवश्यक है। Student Panel की पूरी route और feature inventory अगले audit pass में map की जाएगी।

### 3.3 `functions`

Backend functions area में callable functions, audits, academic quality gates, ingestion, syllabus/question workflows, notification workflows, mission processing और verification utilities मौजूद हैं। इससे स्पष्ट है कि backend केवल CRUD layer नहीं है; यह governance, validation, queue processing और academic integrity का भी महत्वपूर्ण केंद्र है।

### 3.4 `assets` और `docs`

`assets` में official logo, geographic data, preview manifests, digibook lessons और academic datasets मौजूद हैं। `docs` में authority, academic review, syllabus, worker training और patch-safety से संबंधित विस्तृत records हैं। ये materials पुस्तक के evidence और reference chapters के प्रमुख स्रोत होंगे।

## 4. Build और deployment map

वर्तमान configuration के अनुसार:

- Firebase Hosting का public output `build/web` है।
- Hosting सभी routes को `index.html` पर rewrite करती है, जो Flutter web app के लिए आवश्यक SPA behavior है।
- Firebase Functions का source directory `functions` है।
- Firestore rules और indexes अलग configuration files में हैं।
- Storage rules अलग से maintain की जाती हैं।
- Auth, Firestore, Functions और Emulator UI के लिए local emulator ports configured हैं।

## 5. Brand asset verification

Official logo project में उपलब्ध है और `assets/images/logo.png` के रूप में Flutter launcher icon, adaptive icon और native splash configuration में भी referenced है। पुस्तक के cover और title page के लिए इसी asset का उपयोग किया जाएगा। किसी substitute या नया logo की आवश्यकता नहीं है।

## 6. प्रारंभिक editorial निष्कर्ष

इस project को पुस्तक में केवल “app documentation” के रूप में प्रस्तुत करना पर्याप्त नहीं होगा। इसकी वास्तविक संरचना कम-से-कम चार परतों में समझानी होगी:

1. **Product layer:** Student और Founder के लिए दिखाई देने वाला अनुभव
2. **Application layer:** Flutter screens, navigation और shared UI
3. **Intelligence layer:** engines, workers, academic processing और recommendations
4. **Trust layer:** Firebase security, authority, audit, validation और deployment controls

यही चार-layer model आगे के architectural chapters का आधार रहेगा।

## 7. अगले audit sections

1. App entry points, routes और authentication flow
2. Student Panel की screen और workflow inventory
3. Founder Panel की screen, controls और permissions
4. Firestore collections, repositories और rules
5. Cloud Functions और queue-processing map
6. Academic content और digibook pipeline
7. Testing, audit और deployment evidence
