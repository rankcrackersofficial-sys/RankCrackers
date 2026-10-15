# Preliminary Reference — Application Entry और Trust Model

**Current acceptance:** working reference; path existence does not certify runtime behavior, production state or passing tests. Historical code excerpts and line ranges require SHA-specific readback before implementation use.

**GitHub source snapshot:** [`docs/rankcrackers_book/06_architecture_entry_and_trust_model.md`](https://github.com/rankcrackersofficial-sys/RankCrackers/blob/5161592ddafb42f1ecc8923cc7b7b0309934cc83/docs/rankcrackers_book/06_architecture_entry_and_trust_model.md) · source blob `fa5d41325c869fd8ca16bb263073fb8841adbb66`. This Drive edition contains editorial corrections; it is not a claim that those corrections were committed to GitHub. See `github_source_manifest.json` and the current reconciliation register.


## Section 1 — Entry Points और Runtime Modes

Audit में तीन स्पष्ट Flutter entry points मिले:

- `lib/main.dart` — सामान्य application entry point
- `lib/main_web.dart` — web runtime entry point
- `lib/main_web_emulator.dart` — local Firebase emulator आधारित web runtime

इन entry points में Firebase initialization अलग runtime context के अनुसार किया जाता है। इसका अर्थ है कि local development और production deployment को एक ही behavior मानकर नहीं लिखना चाहिए; पुस्तक में दोनों modes के configuration, limitations और verification अलग दर्ज किए जाएँगे।

## Section 2 — Routing और Access Surface

Application का central router `lib/core/router/app_router.dart` में स्थित है और `go_router` पर आधारित है। प्रारंभिक source audit में लगभग दो दर्जन top-level तथा nested route declarations मिले। इनमें authentication, student experience और founder workflows के अलग-अलग surfaces शामिल हैं।

Route documentation में प्रत्येक route के लिए निम्न विवरण दर्ज किया जाएगा:

1. path और route name
2. किस role के लिए उपलब्ध है
3. direct navigation पर expected behavior
4. authentication guard
5. data dependencies
6. loading और failure state
7. child routes और back-navigation behavior

## Section 3 — Trust Model

Rank Cracker का trust model केवल UI visibility पर आधारित नहीं है। वास्तविक access boundary कई स्तरों पर लागू होती है:

- Flutter route और panel visibility
- Firebase Authentication identity
- custom claims और founder/admin role
- Firestore security rules
- Storage security rules
- server-authoritative Cloud Functions
- publication और governance status

इसलिए किसी control का screen पर दिखाई देना अपने-आप में write permission का प्रमाण नहीं है। पुस्तक में UI intent और backend authority को हर relevant workflow में अलग-अलग document किया जाएगा।

## Section 4 — Firestore Authority Pattern

Rules audit में server-authoritative collections के कई स्पष्ट patterns मिले। उदाहरण के लिए system configuration, activity logs, metrics, official provenance, canonical audit events और कई processing queues में client writes प्रतिबंधित हैं। ऐसे records केवल Cloud Functions या Admin SDK आधारित workers से बनते अथवा बदलते हैं।

दूसरी ओर, student-owned records में user-specific boundaries लागू हैं। `users/{userId}` और उसके progress, notifications, mission statistics तथा अन्य subcollections में access authenticated user identity से जोड़ा गया है। Founder को operational oversight के लिए अलग authority दी गई है।

## Section 5 — Content Visibility और Publication

Academic content में visibility सामान्य read permission से अधिक नियंत्रित है। `published` status, `studentVisibilityAuthorized` तथा governed-read conditions जैसे fields यह तय करते हैं कि कोई document founder-only, authenticated-user या student-readable surface पर उपलब्ध होगा।

इससे पुस्तक में content lifecycle को कम-से-कम इन अवस्थाओं में समझाना आवश्यक होगा:

1. draft या ingestion state
2. review और verification state
3. governed या approved state
4. published state
5. student-visible state
6. superseded या rollback state

## Section 6 — Storage Boundary

Storage rules में user-owned files, shared assets, certificates, ingestion data और mission official documents के लिए अलग paths हैं। User path में ownership-based access है, जबकि ingestion और official-document areas founder/admin claims पर निर्भर हैं। Certificates का client write disabled है और उन्हें server-side process से handle किया जाता है।

## Editorial note

यह chapter केवल architecture का प्रारंभिक map है। पूर्ण पुस्तक में इसके बाद route-by-route, collection-by-collection और function-by-function chapters आएँगे। यहाँ दी गई high-level summary को उन विस्तृत chapters का substitute नहीं माना जाएगा।
