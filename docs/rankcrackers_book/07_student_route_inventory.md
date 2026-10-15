# Preliminary Reference — Student Navigation और Route Inventory

**Current acceptance:** working reference; path existence does not certify runtime behavior, production state or passing tests. Historical code excerpts and line ranges require SHA-specific readback before implementation use.

**GitHub source snapshot:** [`docs/rankcrackers_book/07_student_route_inventory.md`](https://github.com/rankcrackersofficial-sys/RankCrackers/blob/5161592ddafb42f1ecc8923cc7b7b0309934cc83/docs/rankcrackers_book/07_student_route_inventory.md) · source blob `22d174dba19ccdc697be8d90d3087407b762aa03`. This Drive edition contains editorial corrections; it is not a claim that those corrections were committed to GitHub. See `github_source_manifest.json` and the current reconciliation register.


## Section 1 — Student Navigation और Route Inventory

यह chapter source-level route audit पर आधारित है। यह केवल screen names की सूची नहीं है; इसका उद्देश्य यह दर्ज करना है कि student application किन प्रवेश-बिंदुओं, guards और navigation branches से बनी है। प्रत्येक route का full screen behavior उसके dedicated chapter में अलग लिखा जाएगा। Code references भी शामिल होंगे ताकि behavior implementation से verify किया जा सके।

## 1. Application entry और identity routes

### 1.1 Splash

Application का initial location splash route है। Router splash को internally redirect नहीं करता, ताकि startup sequence अपनी initialization और session resolution पूरी कर सके।

### 1.2 Login / Unified Identity

Login route `UnifiedIdentityScreen` को खोलता है। Unauthenticated user यदि किसी protected route पर पहुँचता है तो router उसे login flow में भेजता है। Authenticated user को login screen पर बने रहने की अनुमति नहीं दी जाती।

### 1.3 Profile Setup

Profile completion के बिना सामान्य student को आगे जाने की अनुमति नहीं है। यह gate synchronous session state से profile completion की जाँच करता है और incomplete profile को unified identity flow में लौटाता है।

### 1.4 Mission Realm

Valid mission या exam selection के बिना सामान्य student को मुख्य application में जाने की अनुमति नहीं है। Mission invalid या missing होने पर user mission realm route पर भेजा जाता है।

## 2. Main student navigation shell

Authenticated और onboarding-complete student के लिए मुख्य navigation एक indexed stateful shell पर आधारित है। इसके पाँच प्रमुख branches हैं:

1. **Dashboard** — student का मुख्य home और progress-oriented entry surface
2. **Crucible** — practice, challenge और assessment-oriented learning area
3. **DigiBook** — digital lessons और book/library experience
4. **Syllabus** — syllabus और topic hierarchy का study surface
5. **Opportunities / Recruitment** — opportunities और recruitment-related experience

Stateful shell का अर्थ है कि branch बदलने पर प्रत्येक branch अपनी navigation state बनाए रख सकती है। इसलिए पुस्तक में bottom navigation को केवल five-button UI के रूप में नहीं, बल्कि independent navigation stacks के रूप में document किया जाएगा।

## 3. Student feature routes

प्रारंभिक route inventory में निम्न student-facing surfaces मिले:

- Diagnostic entry और diagnostic test
- Diagnostic result
- Deep profile
- Profile
- PYQ Vault
- Progress Tracker
- Revision Desk
- Test Arena
- Sentinel Center
- Notification Center
- DigiBook Reader
- Mission Realm

इन routes में कुछ shell के बाहर root-level routes हैं, ताकि reader, test या full-screen workflow bottom navigation से स्वतंत्र रूप से खुल सके। उदाहरण के लिए DigiBook Reader root navigator का उपयोग करता है और launch arguments या micro-topic node के आधार पर अलग reading context खोल सकता है।

## 4. Test और attempt routes

Crucible-related dedicated chambers में micro test, macro test और rebuild workflow के लिए अलग screens/widgets हैं। Micro attempt submit करते समय route-level code verified payload, recruitment identity और schedule information की जाँच करता है और फिर `handleMissionAction` callable function को request भेजता है।

यहाँ तीन authority boundaries स्पष्ट हैं:

1. UI attempt payload बनाता है
2. client-side route आवश्यक fields की प्रारंभिक जाँच करता है
3. server callable final submission और evaluation authority रखता है

इस workflow के full data contract, error states और retry behavior को backend तथा assessment chapters में cross-reference किया जाएगा।

## 5. Founder और privileged route behavior

Founder identity को router में अलग privilege gate के रूप में handle किया गया है। Privileged user onboarding के login/profile/mission gates से bypass कर सकता है और dashboard पर जा सकता है। Founder preview route पर non-founder के लिए access-denied surface render होती है। Mobile admin route स्पष्ट रूप से disabled message दिखाता है।

यह distinction महत्वपूर्ण है: founder access केवल navigation convenience नहीं, बल्कि अलग operational authority model का हिस्सा है। Founder Web Panel की विस्तृत routes और permission matrix इस student route inventory से अलग chapter में रखी जाएगी।

## 6. Router guard sequence

सामान्य रूप से redirect logic का क्रम इस प्रकार है:

1. Splash और root startup location को preserve करना
2. Unauthenticated user को login flow तक सीमित करना
3. Founder/admin identity को onboarding gates से bypass करना
4. सामान्य user का profile completion check करना
5. valid mission selection check करना
6. authenticated user को login screens से dashboard पर भेजना
7. बाकी routes को pass-through देना

इस sequence को बदलने वाला कोई भी feature student accessibility, founder access या onboarding safety को प्रभावित कर सकता है। इसलिए router में किए गए changes के लिए dedicated regression verification आवश्यक होगी।

## 7. आगे के विस्तृत units

- Dashboard का complete state और data dependency map
- Crucible और test lifecycle
- DigiBook library तथा reader contract
- Syllabus hierarchy और topic graph
- Opportunities और recruitment workflow
- Diagnostic, result और recommendation pipeline
- Profile, notifications और progress persistence

## 8. Code-level completion requirement

इस route inventory को final chapter तभी माना जाएगा जब प्रत्येक listed route के लिए screen source, route declaration, guard behavior, dependent models/providers, service calls, visible states, error handling और relevant tests दर्ज हो जाएँ। वर्तमान chapter प्रारंभिक route map है; इसे final implementation reference नहीं माना जाएगा।

## 9. प्रारंभिक verified code excerpts

### 9.1 Router startup और splash protection

**Source:** `lib/core/router/app_router.dart`

```dart
final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: AppRoutes.splash,
  redirect: (context, state) {
    final user = FirebaseAuth.instance.currentUser;
    final matchedLocation = state.matchedLocation;

    if (matchedLocation == AppRoutes.splash || state.uri.path == '/') {
      return null;
    }
```

इस block से प्रमाणित है कि application splash से शुरू होती है और splash/root location पर router forced redirect नहीं करता। इससे startup initialization interrupt नहीं होती।

### 9.2 Login route और authentication gate

```dart
GoRoute(
  path: AppRoutes.login,
  builder: (context, state) => const UnifiedIdentityScreen(),
),
```

```dart
if (user == null) {
  return onLoginFlow ? null : AppRoutes.login;
}

if (onLoginFlow) {
  return AppRoutes.dashboard;
}
```

पहला block unauthenticated user को login flow में रखता है। दूसरा authenticated user को login screen पर बने रहने से रोककर dashboard पर भेजता है। Unified Identity के sign-in methods, errors, profile creation और session persistence आगे अलग micro-units में code mapping के साथ लिखे जाएँगे।

### 9.3 Profile completion gate

```dart
final profileDone = SessionManager.profileCompletedSync();
if (!profileDone && !isPrivileged) {
  return (matchedLocation == AppRoutes.profileSetup)
      ? null
      : AppRoutes.profileSetup;
}
```

`profileCompletedSync()` profile gate का synchronous authority read है। `isPrivileged` founder/admin bypass को दर्शाता है। Student profile setup के fields, validation और completion mutation अलग unit में दर्ज होंगे।

### 9.4 Mission validity gate

```dart
final String? selectedExam = SessionManager.selectedExamSync();
final bool isMissionValid = SessionManager.isMissionValid(selectedExam);
if (!isMissionValid && !isPrivileged) {
  return (matchedLocation == AppRoutes.missionRealm)
      ? null
      : AppRoutes.missionRealm;
}
```

यह code session state से selected exam पढ़कर domain validation करता है। Mission selection के बाद save होने वाले fields, repositories, invalidation और fallback behavior को full source audit के बाद विस्तार से लिखा जाएगा।
