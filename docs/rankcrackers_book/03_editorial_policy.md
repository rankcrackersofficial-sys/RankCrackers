# लेखन, सत्यापन और प्रकाशन नीति (Editorial & Book Production Policy)

**Current acceptance:** working reference; path existence does not certify runtime behavior, production state or passing tests. Historical code excerpts and line ranges require SHA-specific readback before implementation use.

**GitHub source snapshot:** [`docs/rankcrackers_book/03_editorial_policy.md`](https://github.com/rankcrackersofficial-sys/RankCrackers/blob/5161592ddafb42f1ecc8923cc7b7b0309934cc83/docs/rankcrackers_book/03_editorial_policy.md) · source blob `46112a85a35e0fd63e7a681671cda51e875b5c8e`. This Drive edition contains editorial corrections; it is not a claim that those corrections were committed to GitHub. See `github_source_manifest.json` and the current reconciliation register.


## 1. पुस्तक का विस्तार और संपूर्णता

यह पुस्तक page limit के अधीन नहीं होगी। इसका लक्ष्य 10–15 पृष्ठ का summary document बनाना नहीं, बल्कि Rank Cracker का पूर्ण professional reference work तैयार करना है। यदि project को ईमानदारी से समझाने के लिए सैकड़ों या हजारों पृष्ठ आवश्यक हों, तो पुस्तक उतनी ही विस्तृत होगी। संक्षिप्तता केवल वहाँ रखी जाएगी जहाँ दोहराव हो; महत्वपूर्ण detail कभी हटाई नहीं जाएगी।

हर writing batch में केवल outline, status note या आधा chapter नहीं दिया जाएगा। एक सामान्य batch का target कम-से-कम 5–10 pages के बराबर substantive manuscript होगा। यदि किसी विषय को ईमानदारी से समझाने के लिए इससे अधिक विस्तार चाहिए, तो batch को उसी विषय के अगले complete section तक जारी रखा जाएगा।

Project की complexity के अनुसार पुस्तक को अलग-अलग Volumes, Parts, Chapters, Sections और Subsections में बाँटा गया है। किसी feature को केवल इसलिए छोटा नहीं किया जाएगा कि वह किसी chapter में अधिक स्थान ले रहा है।

---

## 2. अनिवार्य detail स्तर (15 Core Attributes)

जहाँ लागू हो, प्रत्येक feature के लिए निम्न 15 स्तरों पर documentation दी जाएगी:

1. purpose और user value
2. संबंधित user roles और permission boundary
3. screen, route और entry point
4. पूरा user workflow
5. हर visible control, field, state और message
6. loading, empty, offline और error states
7. exact file path
8. class, function, constant या route name
9. relevant code block
10. line-by-line code explanation
11. inputs, outputs और side effects
12. data model, repository, service और backend function mapping
13. security, claims और authority behavior
14. संबंधित tests, audit reports और verification evidence
15. maintenance, migration और future-change impact

छोटी दिखाई देने वाली detail—जैसे button state, fallback text, retry behavior, route guard, field default, timestamp handling या empty-state message—को भी तभी छोड़ा जाएगा जब audit में प्रमाणित हो कि वह documentation के लिए अप्रासंगिक है।

---

## 3. Code-integrated documentation

जहाँ किसी behavior का वास्तविक प्रमाण source code में है, वहाँ उस topic के साथ code भी शामिल किया जाएगा। केवल यह लिखना कि “screen खुलती है” या “mission select होता है” पर्याप्त नहीं होगा। Documentation में आवश्यकता के अनुसार exact file path, class/function/constant, relevant code block, line-by-line explanation, inputs, outputs, side effects, related backend contract और edge-case paths दिए जाएँगे।

लंबे source files को mechanically copy नहीं किया जाएगा; लेकिन behavior समझाने के लिए आवश्यक पूरा logical block छोड़ा नहीं जाएगा। बड़े blocks को numbered subtopics में बाँटकर canonical source path के साथ रखा जाएगा।

---

## 4. सामग्री की श्रेणियाँ

- **वर्तमान implementation:** जो project में वास्तव में मौजूद और सत्यापित है।
- **व्याख्या:** वर्तमान implementation का सरल और technical वर्णन।
- **प्रक्रिया:** किसी feature या workflow को उपयोग करने या maintain करने का तरीका।
- **प्रस्ताव:** भविष्य में किए जा सकने वाले सुधार या design ideas।
- **सत्यापन नोट:** source, configuration, test या audit के आधार पर किया गया प्रमाण।

---

## 5. पुस्तक की Canonical Editorial Hierarchy

Working labels “Unit / Topic / Micro-topic” को final editorial terminology न माना जाए। Final hierarchy यह है:

**Volume → Part → Chapter → Section → Subsection → Implementation Note → Reference / Appendix**

- **Volume (खंड):** बड़ा thematic volume
- **Part (भाग):** किसी product या system domain का भाग
- **Chapter (अध्याय):** एक complete learning/documentation subject
- **Section (अनुभाग):** chapter के भीतर एक स्पष्ट conceptual area
- **Subsection (उप-अनुभाग):** किसी behavior, component या workflow की focused detail
- **Implementation Note (कार्यान्वयन टिप्पणी):** source code, file path, API, data contract या edge case का प्रमाण
- **Reference / Appendix (संदर्भ / परिशिष्ट):** tables, glossary, mappings, logs और exhaustive indexes

Application के legacy/runtime academic labels को book hierarchy के साथ mix न करें। Latest GitHub contract के अनुसार official authority की hierarchy published scope पर रुक सकती है; `MICRO_TOPIC` और `ATOMIC_TOPIC` केवल traceable, verified और scope-contained derived decomposition के रूप में स्वीकार होंगे।

---

## 6. प्रत्येक Chapter का मानक प्रारूप

1. Executive Overview / Chapter का उद्देश्य
2. Conceptual Topology & System Context
3. Step-by-Step User & Operational Workflows
4. Code Blocks, Exact File Paths & Line-by-Line Breakdown
5. Edge Cases, Failure States, Offline & Loading Behaviors
6. Security Rules, Roles, Claims & Authority Boundaries
7. Verification Evidence, Unit/Widget Tests & Audits
8. Maintenance Playbooks & Impact Analysis
9. Implementation Note Summary

---

## 7. Editorial Truth Rules

- **अनुमान को implementation के रूप में न लिखें।**
- **Proposed behavior को current behavior से स्पष्ट रूप से अलग रखें।**
- **Unverified academic content को published या available न बताएं।**
- **Code और prose के बीच exact mapping रखें।**
- **एक ही fact की conflicting copies न बनाएं; canonical reference और cross-reference दें।**
- **Existing user changes या unrelated repository work को overwrite न करें।**
- **Technical debt, disabled path और legacy implementation को छुपाएँ नहीं।**

---

## 8. Google Docs Book Production Standard

Google Docs में book को केवल plain text document की तरह नहीं लिखा जाएगा। इसे एक consistent, professional और visually verified book manuscript की तरह format किया जाएगा।

### 8.1 Official Icon और Brand Identity
- Cover, title page और chapter-opening pages पर project का official icon उपयोग किया जा सकता है।
- **Canonical source asset:** `assets/images/logo.png`
- White mark को light/white page पर readable रखने के लिए केवल इसी source से बना verified display variant `assets/images/logo_on_black.png` उपयोग किया जा सकता है। यह नया logo नहीं है और original source को overwrite नहीं करता।
- किसी unrelated generated या substitute icon का उपयोग न करें।
- Logo का aspect ratio preserve करें; उसे stretch, crop या pixelate न करें।
- Repeated pages पर logo का अनावश्यक उपयोग न करें; title page, volume opener और आवश्यक branded divider पर्याप्त हैं।
- App icon और book branding के बीच visual consistency रखी जाए।

### 8.2 App Screenshots और Visual Evidence
Project में उपलब्ध login screens, splash screen, student screens, founder screens और अन्य verified UI screenshots को book में figures के रूप में शामिल किया जा सकता है।

हर screenshot के लिए:
1. केवल project से verified screenshot उपयोग करें (`screen.png`, `assets/images/logo.png`, `assets/images/logo_on_black.png`, `scratch/founder_final_live_screens/`, `docs/patch_safety/nebula_vs1_fix3_...`)।
2. Screenshot के नीचे figure number और स्पष्ट caption दें (उदा. *Figure 13.2: Founder Mission Control Overview Console*)।
3. Caption में screen name, route या workflow context लिखें।
4. यदि screenshot में sensitive personal data, tokens, emails या private identifiers हों तो उसे redact करें।
5. Screenshot को इतना बड़ा रखें कि text पढ़ने योग्य रहे, लेकिन page margins न टूटें।
6. Figure को संबंधित explanation और code reference के पास रखें।
7. Screenshot को decorative image की तरह नहीं, evidence या workflow illustration की तरह treat करें।
8. Image के साथ short alt-text या accessibility description दें।

### 8.3 Page और Margin Standard
- **Page size:** A4 portrait, जब तक किसी विशेष figure या appendix के लिए अलग layout आवश्यक न हो।
- **Margins:** Top, bottom, left और right margins समान रखें; recommended value **0.8 inch (2.03 cm)** है।
- पूरे manuscript में एक ही margin profile रखें।
- Code tables, screenshots और wide reference tables को margins के भीतर fit करें।
- जरूरत पड़ने पर landscape page केवल wide tables/diagrams के लिए उपयोग करें और उसके बाद normal portrait layout restore करें।
- Chapter और volume breaks पर accidental blank pages न छोड़ें।

### 8.4 Typography और Alignment
- **Body font:** Readable Devanagari-compatible font, जैसे **Noto Sans Devanagari** या Google Docs में उपलब्ध equivalent।
- **Body size:** 11 pt।
- **Body line spacing:** 1.15–1.3, paragraph spacing after 6 pt।
- **Body alignment:** Justified, ताकि left और right edges visually consistent रहें।
- **Headings:** Left aligned; heading को justify न करें।
- **Captions:** Centered या left aligned, लेकिन पूरे book में एक ही rule रखें।
- **Code:** Monospace font (Courier New / Roboto Mono / Consolas), left aligned, never justified।
- **Lists:** Consistent indentation और spacing के साथ।
- Hindi और English के बीच अनावश्यक font switching न करें; code और identifiers के लिए ही monospace style रखें।

### 8.5 Heading Hierarchy & Auto TOC
Book hierarchy को Google Docs native heading styles से map करें:
- **Title:** Book title (*Rank Cracker Book*)
- **Heading 1:** Volume (उदा. *Volume A — Product और मूल दृष्टि*)
- **Heading 2:** Part (उदा. *Part 1 — Genesis, Philosophy & Student Journey*)
- **Heading 3:** Chapter (उदा. *Chapter 17 — Product Vision...*)
- **Heading 4:** Section (उदा. *Section 1: Genesis of Rank Crackers*)
- **Heading 5:** Subsection
- **Normal text:** Explanation prose
- **Caption:** Figures और screenshots

Contents table automatic heading styles से generate होनी चाहिए। Heading को केवल bold करके छोड़ना पर्याप्त नहीं है; native heading style का उपयोग करें।

### 8.6 Highlights और Callouts (Semantic Color Coding)
Highlight का उपयोग केवल meaningful information के लिए करें:
- 🟨 **Yellow (पीला):** Important definition या key takeaway
- 🟦 **Blue (नीला):** Implementation rule या code behavior
- 🟩 **Green (हरा):** Verified evidence या completion condition
- 🟥 **Red / Light Red (लाल):** Warning, security risk, failure state या unresolved gap

पूरे paragraph को लगातार highlight न करें। Highlight short sentence, key term या compact callout तक सीमित रखें।

### 8.7 Monospace Code Blocks
हर code block में:
- Language label (Dart, TypeScript, JSON, Bash)
- Exact file path
- Relevant class/function name
- Monospace font
- Light shaded background (`#F1F5F9` या `#1E293B` डार्क थीम में)
- Left alignment और preserved indentation
- Code के बाद line-by-line explanation

Code को screenshot के रूप में न डालें जब तक visual UI evidence की आवश्यकता न हो। Searchable, copyable native text code blocks को प्राथमिकता दें।

### 8.8 Tables, Figures और Captions
Tables के header, body, border, padding और alignment पूरे manuscript में consistent रहें। Wide tables के लिए landscape page या appendix उपयोग करें। प्रत्येक figure/table का unique number और meaningful title हो। Text में figure/table का reference उसी क्रम में हो जिसमें वह दिखाई देता है।

### 8.9 Final Visual Quality Check
हर major Google Docs update के बाद:
1. Heading hierarchy और Contents refresh करें।
2. Page breaks और orphan headings जाँचें।
3. समान margins (0.8 inch) और alignment verify करें।
4. Screenshots की readability जाँचें।
5. Logo distortion और image placement जाँचें।
6. Code blocks के indentation और clipping जाँचें।
7. Tables के overflow और split rows जाँचें।
8. PDF export या print preview से visual QA करें।
9. Local manuscript और Google Docs content consistency check करें।

किसी section का content सही लेकिन उसका page layout असंगत हो, तो वह section final नहीं माना जाएगा।

---

## 9. Chief Author Directive (मुख्य लेखक का निर्देश)

Antigravity 2.0 इस project में केवल content writer या code summarizer के रूप में काम नहीं करेगा। उसे Chief Author के editorial direction के अंतर्गत एक research-driven technical author, source auditor और book production operator की तरह काम करना है।

हर नए chapter से पहले यह 12-चरणीय अनुक्रम अनिवार्य है:

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

### Chief Author Quality Gate

किसी delivery को complete न माना जाए यदि:
- source code audit के बिना prose लिखी गई हो;
- relevant code block या file path missing हो;
- user workflow के loading, empty, error या offline states छूटे हों;
- security, authority या data ownership स्पष्ट न हो;
- screenshot या logo का source verify न हो;
- Google Docs में heading style, margins, alignment या image placement inconsistent हो;
- local manuscript और Google Docs में chapter structure अलग हो;
- कोई limitation, legacy path या unresolved issue जानबूझकर छुपाया गया हो।

### Working Tone and Authorship

लेखन authoritative, clear, patient और technically honest हो। हिन्दी narration professional और readable रहे; code identifiers, APIs और file paths English में अपने मूल रूप में रहें। हर chapter ऐसा लिखा जाए कि founder उसे product understanding के लिए, developer implementation के लिए, auditor verification के लिए और future team maintenance के लिए उपयोग कर सके।

Chief Author का अंतिम मानदंड page count नहीं, बल्कि source-grounded completeness, structural clarity, visual consistency और long-term maintainability है।

---
