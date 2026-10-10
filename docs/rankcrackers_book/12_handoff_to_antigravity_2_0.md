# Rank Cracker Book — Antigravity 2.0 Handoff Document

**Handoff recipient:** Antigravity 2.0  
**Handoff purpose:** Rank Cracker Book project को व्यवस्थित रूप से आगे बढ़ाना  
**Primary language:** हिन्दी, आवश्यक technical terminology और code English में  
**Status:** Active long-form documentation project

## 1. Project objective

इस project का उद्देश्य Rank Cracker ecosystem पर एक पूर्ण, professional और continuously maintained technical-product book तैयार करना है। यह short overview, marketing brochure या केवल developer README नहीं है। इसमें Rank Cracker से संबंधित प्रत्येक महत्वपूर्ण product, academic, technical, operational और governance detail को source code तथा verified project evidence के साथ दर्ज करना है।

Book page limit के अधीन नहीं है। आवश्यकता होने पर कई Volumes और हजारों pages बनाए जाएँगे। किसी feature को केवल छोटा रखने के लिए compress नहीं किया जाएगा।

## 2. Documentation scope

Book में कम-से-कम निम्न domains शामिल होंगे:

- Rank Cracker का vision, product history और learning philosophy
- Student Panel और complete student journey
- Founder Web Panel और operational controls
- Flutter application architecture
- Firebase Authentication, Firestore, Storage और Cloud Functions
- Firestore collections, fields, repositories और data contracts
- Academic syllabus, topics, atoms, missions, PYQs और DigiBook
- Knowledge Engine, mastery, coverage, risk और recommendation systems
- Crucible और assessment workflows
- Security rules, roles, claims और authority boundaries
- Audit, provenance, governance, approvals और rollback
- GitHub workflow, testing, emulators, build और deployment
- Error states, troubleshooting, glossary और complete reference appendices

## 3. Canonical book hierarchy

Working labels “Unit / Topic / Micro-topic” को final editorial terminology न माना जाए। Final hierarchy यह है:

**Volume → Part → Chapter → Section → Subsection → Implementation Note → Reference / Appendix**

- **Volume:** बड़ा thematic खंड
- **Part:** product या system domain
- **Chapter:** complete documentation subject
- **Section:** chapter का conceptual area
- **Subsection:** focused workflow या component detail
- **Implementation Note:** exact code, file path, API, data contract, behavior और edge cases
- **Reference / Appendix:** mappings, indexes, glossary, logs और exhaustive lookup material

Application के runtime hierarchy labels को book hierarchy या official syllabus authority न समझें। Latest GitHub contract (`Chapter 23`) के अनुसार official tree published scope पर रुक सकती है; lower Micro/Atomic nodes केवल explicit `DERIVED` provenance, nearest official ancestor और verification के बाद मान्य होंगे।

## 4. Local project location

Repository root:

`G:\RankCrackers Project\RankCrackers-55`

Book manuscript folder:

`G:\RankCrackers Project\RankCrackers-55\docs\rankcrackers_book`

इस folder में वर्तमान मुख्य files हैं:

- `README.md` — book identity और editorial overview
- `01_editor_note.md` — संपादक की ओर से
- `02_index.md` — प्रारंभिक index
- `03_editorial_policy.md` — writing, verification और code-integration policy
- `04_project_audit_snapshot.md` — प्रारंभिक project audit
- `05_master_documentation_plan.md` — volume और domain plan
- `06_architecture_entry_and_trust_model.md` — architecture और trust model
- `07_student_route_inventory.md` — student routes
- `08_identity_profile_and_mission_gates.md` — identity, profile और mission gates
- `09_dashboard_and_learning_command_surface.md` — dashboard documentation
- `10_crucible_protocol_and_schedule_engine.md` — Crucible protocol और schedule engine
- `11_syllabus_hierarchy_and_digibook_bridge.md` — syllabus और DigiBook bridge

## 5. Google Docs live manuscript

Canonical Google Docs living book:

[Rank Cracker Book — Living Technical Reference](https://docs.google.com/document/d/1zMT940eozloy03y7FBHSkqNqh9SgnaotPL2v-FWzWoA/edit)

यह document RankCrackers Official Google Drive account में बनाया गया है। इसमें title page, official logo, editorial declaration, professional contents structure और प्रारंभिक chapter summaries मौजूद हैं। आगे substantive chapters पूरे होने पर Google Docs manuscript में भी update किए जाएँ।

Local repository को technical source और versioned manuscript माना जाए; Google Docs को live editorial reading, review, comments और collaboration surface माना जाए।

## 6. Official brand asset

Official logo उपलब्ध है:

`G:\RankCrackers Project\RankCrackers-55\assets\images\logo.png`

नया या substitute logo न बनाया जाए। Cover, title page और आवश्यक branded locations पर यही asset उपयोग किया जाए।

## 7. अनिवार्य writing standard

हर chapter को source audit के आधार पर लिखना है। केवल screen का दो-line description पर्याप्त नहीं है। प्रत्येक relevant feature के लिए, जहाँ लागू हो:

1. purpose और user value
2. user roles और permission boundary
3. screen और route
4. पूरा workflow
5. visible controls, fields और states
6. loading, empty, offline और error behavior
7. exact file path
8. class, function, constant या route name
9. relevant code block
10. line-by-line code explanation
11. inputs, outputs और side effects
12. model, repository, service और backend function mapping
13. security और authority behavior
14. tests, audit reports और verification evidence
15. maintenance और future-change impact

हर writing batch में सामान्यतः कम-से-कम 5–10 pages के बराबर substantive manuscript तैयार किया जाए। Outline, placeholder या half-written chapter को finished delivery न माना जाए।

## 8. Google Docs Book Production Standard

Google Docs में book को केवल plain text document की तरह नहीं लिखा जाएगा। इसे एक consistent, professional और visually verified book manuscript की तरह format किया जाएगा।

### 8.1 Official icon और brand identity

- Cover, title page और chapter-opening pages पर project का official icon उपयोग किया जा सकता है।
- Canonical source asset: `assets/images/logo.png`
- White mark को light/white page पर readable रखने के लिए केवल इसी source से बना verified display variant `assets/images/logo_on_black.png` उपयोग किया जा सकता है। यह नया logo नहीं है और original source को overwrite नहीं करता।
- किसी unrelated generated या substitute icon का उपयोग न करें।
- Logo का aspect ratio preserve करें; उसे stretch, crop या pixelate न करें।
- Repeated pages पर logo का अनावश्यक उपयोग न करें; title page, volume opener और आवश्यक branded divider पर्याप्त हैं।
- App icon और book branding के बीच visual consistency रखी जाए।

### 8.2 App screenshots और visual evidence

Project में उपलब्ध login screens, splash screen, student screens, founder screens और अन्य verified UI screenshots को book में figures के रूप में शामिल किया जा सकता है।

हर screenshot के लिए:

1. केवल project से verified screenshot उपयोग करें।
2. Screenshot के नीचे figure number और स्पष्ट caption दें।
3. Caption में screen name, route या workflow context लिखें।
4. यदि screenshot में sensitive personal data, tokens, emails या private identifiers हों तो उसे redact करें।
5. Screenshot को इतना बड़ा रखें कि text पढ़ने योग्य रहे, लेकिन page margins न टूटें।
6. Figure को संबंधित explanation और code reference के पास रखें।
7. Screenshot को decorative image की तरह नहीं, evidence या workflow illustration की तरह treat करें।
8. Image के साथ short alt-text या accessibility description दें।

प्रारंभिक source candidates में `screen.png`, `assets/images/logo.png`, `web/icons/` और project के verified documentation/audit screenshots शामिल हो सकते हैं। किसी image को शामिल करने से पहले उसका source और relevance verify करें।

### 8.3 Page and margin standard

- Page size: A4 portrait, जब तक किसी विशेष figure या appendix के लिए अलग layout आवश्यक न हो।
- Top, bottom, left और right margins समान रखें; recommended value 0.8 inch है।
- पूरे manuscript में एक ही margin profile रखें।
- Code tables, screenshots और wide reference tables को margins के भीतर fit करें।
- जरूरत पड़ने पर landscape page केवल wide tables/diagrams के लिए उपयोग करें और उसके बाद normal portrait layout restore करें।
- Chapter और volume breaks पर accidental blank pages न छोड़ें।

### 8.4 Typography and alignment

- Body font: readable Devanagari-compatible font, जैसे Noto Sans Devanagari या Google Docs में उपलब्ध equivalent।
- Body size: 11 pt.
- Body line spacing: 1.15–1.3, paragraph spacing after 6 pt.
- Body alignment: justified, ताकि left और right edges visually consistent रहें।
- Headings: left aligned; heading को justify न करें।
- Captions: centered या left aligned, लेकिन पूरे book में एक ही rule रखें।
- Code: monospace font, left aligned, never justified।
- Bullet और numbered lists: consistent indentation और spacing के साथ।
- Hindi और English के बीच अनावश्यक font switching न करें; code और identifiers के लिए ही monospace style रखें।

### 8.5 Heading hierarchy

Book hierarchy को Google Docs heading styles से map करें:

- Title — book title
- Heading 1 — Volume
- Heading 2 — Part
- Heading 3 — Chapter
- Heading 4 — Section
- Heading 5 — Subsection
- Normal text — explanation
- Caption — figures और screenshots

Contents table automatic heading styles से generate होनी चाहिए। Heading को केवल bold करके छोड़ना पर्याप्त नहीं है; native heading style का उपयोग करें।

### 8.6 Highlights and callouts

Highlight का उपयोग केवल meaningful information के लिए करें:

- Yellow: important definition या key takeaway
- Blue: implementation rule या code behavior
- Green: verified evidence या completion condition
- Red/light red: warning, security risk, failure state या unresolved gap

पूरे paragraph को लगातार highlight न करें। Highlight short sentence, key term या compact callout तक सीमित रखें। एक ही meaning के लिए पूरे book में वही color रखें।

### 8.7 Code blocks

हर code block में:

- language label
- exact file path
- relevant class/function name
- monospace font
- light shaded background
- left alignment
- preserved indentation
- code के बाद explanation

Code को screenshot के रूप में न डालें जब तक visual UI evidence की आवश्यकता न हो। Searchable, copyable native text code blocks को प्राथमिकता दें।

### 8.8 Tables, figures and captions

Tables के header, body, border, padding और alignment पूरे manuscript में consistent रहें। Wide tables के लिए landscape page या appendix उपयोग करें। प्रत्येक figure/table का unique number और meaningful title हो। Text में figure/table का reference उसी क्रम में हो जिसमें वह दिखाई देता है।

### 8.9 Final visual quality check

हर major Google Docs update के बाद:

1. heading hierarchy और Contents refresh करें
2. page breaks और orphan headings जाँचें
3. समान margins और alignment verify करें
4. screenshots की readability जाँचें
5. logo distortion और image placement जाँचें
6. code blocks के indentation और clipping जाँचें
7. tables के overflow और split rows जाँचें
8. PDF export या print preview से visual QA करें
9. local manuscript और Google Docs content consistency check करें

किसी section का content सही लेकिन उसका page layout असंगत हो, तो वह section final नहीं माना जाएगा।

## 9. Audit method

Antigravity 2.0 को audit स्वयं करना है। किसी external agent को केवल audit delegation के लिए न भेजा जाए। Working sequence:

1. संबंधित source directories और configuration files inventory करें।
2. Screen, route, provider, repository, model और backend function map करें।
3. Security rules और authority boundaries पढ़ें।
4. Existing tests, audit reports और docs को evidence के रूप में cross-check करें।
5. Current implementation, proposal और unresolved gap को अलग रखें।
6. Source code के relevant blocks को chapter में जोड़ें।
7. Local manuscript update करें।
8. Google Docs living manuscript में corresponding chapter/update जोड़ें।
9. Readback और consistency verification करें।

## 10. Editorial truth rules

- अनुमान को implementation के रूप में न लिखें।
- Proposed behavior को current behavior से स्पष्ट रूप से अलग रखें।
- Unverified academic content को published या available न बताएं।
- Code और prose के बीच exact mapping रखें।
- एक ही fact की conflicting copies न बनाएं; canonical reference और cross-reference दें।
- Existing user changes या unrelated repository work को overwrite न करें।
- Technical debt, disabled path और legacy implementation को छुपाएँ नहीं।

## 11. Immediate continuation order

अगला काम इस क्रम में आगे बढ़ाया जाए:

1. Existing chapters को final hierarchy और 5–10 page standard के अनुसार deepen करना
2. Student Dashboard के सभी child widgets और providers document करना
3. Crucible screens, schedule models, repositories और assessment submission का complete chapter
4. Syllabus provider, node factory, Firebase sync और DigiBook publication chain
5. Student authentication और Unified Identity screen का full source audit
6. Founder Web Panel का route/control/permission inventory
7. Firestore collections और rules का exhaustive dictionary
8. Cloud Functions और callable contracts का reference volume
9. Testing, deployment और GitHub operations chapters
10. [AUDIT HOLD — NOT FINAL] Chapter 18 में 776-Dart-file scope सही है, लेकिन current matrix में 88 rows, 10 stale paths, L4 scope mismatch, no-op `TacticalSecureLayer`, raw telemetry `userId`, और unsupported performance/privacy claims पाए गए हैं। नीचे दिए गए Chapter 18 Reconciliation Gate को पहले पूरा किया जाए।
11. Chapter 18 gate pass होने के बाद Chapter 09 (Student Dashboard) के सभी child widgets, local cache और providers का deep source audit शुरू किया जाए।

## 12. Completion definition

Book को complete तभी माना जाएगा जब project के relevant source areas audit हो चुके हों, प्रत्येक domain के user और technical workflows लिखे जा चुके हों, code references जुड़े हों, security और failure states documented हों, और local तथा Google Docs manuscripts में consistency verify हो चुकी हो। Page count completion criterion नहीं है; completeness, accuracy और maintainability हैं।

**Handoff conclusion:** Antigravity 2.0 को इस document को operating brief मानकर Rank Cracker Book को उसी professional, exhaustive और code-integrated standard पर आगे बढ़ाना है।

## 13. Chief Author directive

Antigravity 2.0 इस project में केवल content writer या code summarizer के रूप में काम नहीं करेगा। उसे Chief Author के editorial direction के अंतर्गत एक research-driven technical author, source auditor और book production operator की तरह काम करना है।

हर नए chapter से पहले यह sequence अनिवार्य है:

1. **Scope lock:** chapter का Volume, Part, Chapter और expected Sections तय करें।
2. **Source inventory:** संबंधित Dart, JavaScript, JSON, rules, assets, tests और existing reports खोजें।
3. **Behavior reconstruction:** source से वास्तविक user workflow और backend/data flow reconstruct करें।
4. **Evidence separation:** current implementation, legacy path, proposal और unresolved gap अलग करें।
5. **Code selection:** explanation को साबित करने वाले exact code blocks चुनें।
6. **Visual selection:** केवल relevant और verified logo/screenshots/diagrams चुनें।
7. **Long-form drafting:** एक complete chapter लिखें; outline या two-line summary पर न रुकें।
8. **Cross-reference:** related routes, models, repositories, rules, functions और previous chapters link करें।
9. **Local write:** local manuscript में chapter और index update करें।
10. **Google Docs write:** same chapter को living Google Docs manuscript में professionally format करके add करें।
11. **Verification:** content, code paths, headings, images, margins, alignment और readback verify करें।
12. **Completion decision:** chapter तभी complete mark करें जब कोई known required layer undocumented न बची हो।

### Chief Author quality gate

किसी delivery को complete न माना जाए यदि:

- source code audit के बिना prose लिखी गई हो;
- relevant code block या file path missing हो;
- user workflow के loading, empty, error या offline states छूटे हों;
- security, authority या data ownership स्पष्ट न हो;
- screenshot या logo का source verify न हो;
- Google Docs में heading style, margins, alignment या image placement inconsistent हो;
- local manuscript और Google Docs में chapter structure अलग हो;
- कोई limitation, legacy path या unresolved issue जानबूझकर छुपाया गया हो।

### Working tone and authorship

लेखन authoritative, clear, patient और technically honest हो। हिन्दी narration professional और readable रहे; code identifiers, APIs और file paths English में अपने मूल रूप में रहें। हर chapter ऐसा लिखा जाए कि founder उसे product understanding के लिए, developer implementation के लिए, auditor verification के लिए और future team maintenance के लिए उपयोग कर सके।

Chief Author का अंतिम मानदंड page count नहीं, बल्कि source-grounded completeness, structural clarity, visual consistency और long-term maintainability है।

## 14. Atomic-level completeness mandate

“Atomic level” का अर्थ केवल academic atom का नाम लिखना नहीं है। प्रत्येक relevant atomic concept के लिए, जहाँ source उपलब्ध हो, निम्न chain लिखी जाएगी:

**source record → canonical ID → parent topic/unit/subject → content payload → publication state → student visibility → learning interaction → evidence/attempt → mastery update → risk/coverage effect → audit trail**

इसके साथ field names, types, defaults, nullability, validation, ownership, read/write authority, serialization, repository path, Cloud Function path, UI consumer, error state और test evidence दर्ज किए जाएँ।

किसी function को केवल उसके नाम से document न करें। उसके caller, input contract, output contract, mutations, idempotency behavior, retries, timeout, security boundary और downstream consumers भी लिखें। किसी screen को केवल screenshot से document न करें; उसके route, provider, state machine, data source, interaction actions और failure behavior भी लिखें।

## 15. Master compilation control

Master manuscript compilation script project में verified है:

`G:\RankCrackers Project\RankCrackers-55\scripts\compile_master_book.py`

इसे चलाने से पहले source chapter list, ordering, relative links और generated output path verify करें। Compilation के बाद Markdown और HTML दोनों का readback, heading inventory, chapter count, link check और output timestamp verify किए बिना “master synchronized” claim न करें।

## 16. Chief Author command — Chapter 18 reconciliation gate

Antigravity 2.0, पिछले audit report को evidence नहीं माना जाएगा। उसे केवल work log माना जाए। इस command को स्वयं execute करके current repository से फिर से प्रमाण तैयार करो:

### Objective

Chapter 18 (`18_application_architecture_and_design_system.md`) को live source के साथ point-to-point reconcile करो। कोई symbol, file path, row count, security property, performance result, privacy claim, platform boundary या Google Drive sync status अनुमान से final न लिखो।

### Mandatory audit sequence

1. `lib/` का fresh inventory बनाओ और exact count लिखो: total files, Dart files, non-Dart files, bytes और directory distribution।
2. Chapter 18 की हर factual sentence, code block, table row और numeric claim को claim ID दो।
3. हर claim के लिए यह 12-field evidence row बनाओ: repository path, file type, symbol, caller, inputs, outputs, mutations, failure behavior, security/authority boundary, downstream consumer, exact line evidence, और book mapping।
4. Section 14.1 की 15-layer distribution को disjoint path sets से पुनः calculate करो। हर file exactly one layer में हो; total 776 Dart files से match होना चाहिए।
5. Section 14.2 की हर matrix row का path existence और symbol existence check करो। Current stale rows को वास्तविक source path से replace करो या स्पष्ट `UNRESOLVED` register में भेजो; stale row को verified source row मत रखो।
6. Router और session contracts को source से मिलाओ। केवल actual symbols लिखो: `profileCompletedSync()`, `selectedExamSync()`, `isMissionValid(...)`, `selectedRecruitmentIdSync()` आदि। अनुमानित `recruitmentSelectedSync()`/`targetExamSelectedSync()` जैसे symbols नहीं लिखने हैं।
7. `TelemetryEngine`, `TelemetryRecord`, `GlobalErrorHandler`, `FirebaseAppCheck`, `FirestoreService`, `AIQueueService` और responsive/theme hubs के exact contracts दोबारा पढ़ो। Hash और raw `userId` दोनों present होने की privacy limitation स्पष्ट रखो।
8. `TacticalSecureLayer` को तभी screenshot/DRM protection कहो जब source में वास्तविक platform enforcement मिले। वर्तमान no-op behavior को छिपाना नहीं है।
9. Dashboard, DigiBook, Crucible और visual tests में `CustomScrollView`, `SliverList`, `RepaintBoundary`, golden tests और performance evidence का अलग-अलग mapping करो। 60/120 FPS, memory safety, WCAG level, WebP optimization या “zero drop” को measured evidence के बिना achieved result न लिखो।
10. Current source, legacy path, proposed standard और unresolved gap को अलग headings में रखो।
11. Local manuscript update करो, फिर `scripts/compile_master_book.py` और `scripts/verify_compilation.py` दोनों चलाओ। Readback में word count, line count, headings, local links, images और timestamps दर्ज करो।
12. Google Drive/Google Docs को तभी synchronized कहो जब live document readback या verified Drive listing में updated artifact मिले। इस audit baseline में `I:\My Drive\Rank_Cracker_Book` sync status false है; इसे true लिखना निषिद्ध है।

### Required deliverables

- Updated `18_application_architecture_and_design_system.md` with only source-grounded claims.
- `docs/rankcrackers_book/18_chapter_18_claim_register.md` containing every claim ID, evidence path, status (`VERIFIED`, `CORRECTED`, `UNRESOLVED`, `PROPOSED`) and book location.
- Updated `02_index.md`, `README.md`, and generated master Markdown/HTML if chapter structure changes.
- Final report with unresolved items listed explicitly; “100% verified”, “exhaustive”, “all symbols verified” और “Drive sync true” जैसे statements तभी लिखो जब उनके लिए machine-readable evidence attached हो।

### Stop condition

जब तक stale paths, wrong symbols, unsupported guarantees और Drive sync discrepancy resolve या explicitly registered नहीं होते, Chapter 18 को **AUDIT HOLD — NOT FINAL** रखो और Chapter 09 पर आगे मत बढ़ो।
