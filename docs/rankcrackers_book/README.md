# RankCrackers Living Technical Product and Architecture Book

**Current acceptance:** working reference; path existence does not certify runtime behavior, production state or passing tests. Historical code excerpts and line ranges require SHA-specific readback before implementation use.

**GitHub source snapshot:** [`docs/rankcrackers_book/README.md`](https://github.com/rankcrackersofficial-sys/RankCrackers/blob/5161592ddafb42f1ecc8923cc7b7b0309934cc83/docs/rankcrackers_book/README.md) · source blob `23c0e8eee0fa789dcb00c3bf3f3d06b3bf9258c5`. This Drive edition contains editorial corrections; it is not a claim that those corrections were committed to GitHub. See `github_source_manifest.json` and the current reconciliation register.


यह Rank Cracker project की आधिकारिक, क्रमबद्ध और निरंतर विकसित की जाने वाली विस्तृत तकनीकी-उत्पाद पुस्तक (Living Technical-Product Reference Book) है। इसका उद्देश्य short summary बनाना नहीं, बल्कि project का complete professional reference तैयार करना है—जिसमें project का उद्देश्य, प्रत्येक user experience, technical architecture, source mapping, development process, संचालन, सुरक्षा, academic system और भविष्य की दिशा स्रोत कोड साक्ष्य के साथ दर्ज हो।

---

## पुस्तक की भाषा और संपादकीय मानक

- **प्राथमिक भाषा:** उच्च-स्तरीय, स्पष्ट हिन्दी।
- **तकनीकी शब्दावली और कोड:** Identifiers, APIs, Classes, Routes, Database Fields और Code Snippets मूल English रूप में।
- **कैनोनिकल पदानुक्रम:** `Volume → Part → Chapter → Section → Subsection → Implementation Note → Reference / Appendix` (वर्किंग लेबल्स जैसे "Unit / Topic" पूर्णतः निष्कासित हैं)।
- **सत्यापन मानक:** Zero-Fake UI / Truthful Evidence Policy. प्रत्येक विवरण को source audit से मिलाना अनिवार्य है; खुले corrections और unresolved claims को [Chapter 18 Claim Register](18_chapter_18_claim_register.md) जैसे audit registers में छिपाया नहीं जाएगा।

---

## Official Brand Asset

पुस्तक के cover, title page और आधिकारिक शीर्षकों पर प्रोजेक्ट का वास्तविक ब्रांड लोगो उपयोग किया जाएगा:
`assets/images/logo.png`

White official mark को white page पर readable रखने के लिए non-destructive display variant भी उपलब्ध है:
`assets/images/logo_on_black.png`। मूल official source asset को कभी overwrite नहीं किया जाएगा।

---

## GitHub authority and edition status

**Authoritative repository:** [https://github.com/rankcrackersofficial-sys/RankCrackers](https://github.com/rankcrackersofficial-sys/RankCrackers)  
**Default branch:** `safety/rc-g2-pre-notification-schema`  
**Read commit:** [`5161592ddafb42f1ecc8923cc7b7b0309934cc83`](https://github.com/rankcrackersofficial-sys/RankCrackers/commit/5161592ddafb42f1ecc8923cc7b7b0309934cc83)  
**Edition:** GitHub-aligned working edition, 10 October 2026  
**Authority direction:** GitHub source and evidence govern the book. Book wording never authorizes a repository change.

इस edition में current default-branch source, branch-specific architecture, historical snapshots और unresolved claims अलग हैं। किसी path का मौजूद होना उस behavior, test pass या production deployment का प्रमाण नहीं है। पुराने line ranges और embedded code excerpts को नया source audit किए बिना current contract न मानें। इस correction pass में application tests या live production probes नहीं चलाए गए हैं। Chapter 18 का `AUDIT HOLD — NOT FINAL` बना हुआ है।

## वर्तमान वॉल्यूम और संपूर्ण अध्याय इन्वेंट्री

### प्रारंभिक खंड
- [01. संपादक की ओर से](01_editor_note.md)
- [02. पुस्तक का Canonical Index](02_index.md)
- [03. लेखन, सत्यापन और कोड-एकीकरण नीति](03_editorial_policy.md)
- [04. Preliminary Project Audit Snapshot](04_project_audit_snapshot.md)
- [05. Master Documentation Plan](05_master_documentation_plan.md)
- [06. Preliminary Application Entry और Trust Model](06_architecture_entry_and_trust_model.md)
- [07. Preliminary Student Navigation और Route Inventory](07_student_route_inventory.md)
- [12. Antigravity 2.0 Operating Handoff Brief](12_handoff_to_antigravity_2_0.md)
- [18. Chapter 18 Chief Author Claim Register](18_chapter_18_claim_register.md) *(Chapter 18 audit status: AUDIT HOLD — NOT FINAL)*
- [22. Cross-Chapter Source Reconciliation Register & Live Contract Notes](22_source_reconciliation_register_and_live_contracts.md) *(Batch 02 path/symbol reconciliation, live contracts and explicit unresolved ledger)*
- [21. Chief Author Audit & Antigravity 2.0 Work Order](21_chief_author_audit_and_antigravity_work_order.md) *(current book status and mandatory repair order)*

### Volume A — Product और मूल दृष्टि
- [Chapter 17 — Product Vision, Learning Philosophy, Cognitive Personas और Complete Student Journey](17_product_vision_learning_philosophy_and_journey.md) *(Part 1)*

### Volume B — Student Experience
- [Chapter 08 — Identity Pipeline, Unified Authentication, Profile Synthesis और Dynamic Mission Authority](08_identity_profile_and_mission_gates.md) *(Part 1)*
- [Chapter 09 — Dashboard Architecture, Command Surface, Knowledge Engine और Reactive Providers](09_dashboard_and_learning_command_surface.md) *(Part 2)*
- [Chapter 10 — Crucible Protocol, Continuous Modulo Schedule Engine, Chambers और Assessment Workflows](10_crucible_protocol_and_schedule_engine.md) *(Part 3)*
- [Chapter 11 — Syllabus Tree Architecture, Node Factory, Local Database और DigiBook Canonical Bridge](11_syllabus_hierarchy_and_digibook_bridge.md) *(Part 4)*
- [Chapter 23 — GitHub-Tracked Canonical Syllabus & Derived Decomposition Contract](23_github_tracked_canonical_syllabus_contract.md) *(Part 5 — latest remote architecture source; local implementation parity pending)*

### Volume C — Founder Web Operations
- [Chapter 13 — Founder Operational Architecture, Multi-Panel Control Grid, Ingestion Pipeline और System Health Telemetry](13_founder_web_operations_and_mission_control.md) *(Part 1)*

### Volume D — Application Architecture
- [Chapter 18 — Application Architecture, Multiplatform Design System, Responsive Engine और Riverpod State Topology](18_application_architecture_and_design_system.md) *(Part 1 — AUDIT HOLD — NOT FINAL; see Claim Register)*

### Volume E & G — Backend Data Layer, Security & Trust Architecture
- [Chapter 14 — Firestore Data Architecture, Collection Taxonomy, Field Specifications और Security Rules Governance](14_firestore_collections_and_security_rules_dictionary.md) *(Part 1)*
- [Chapter 15 — Serverless Infrastructure, Cloud Callable Contracts, Asynchronous Worker Battalions और Authoritative Evaluation Engines](15_cloud_functions_and_callable_contracts.md) *(Part 2)*

### Volume F — Academic Intelligence & Cognitive Science
- [Chapter 19 — Academic Intelligence, Knowledge Engine, Mathematical Formulations, Decay Functions और Cognitive Assessment Engines](19_academic_intelligence_and_knowledge_engine.md) *(Part 1)*

### Volume H — Engineering Operations, Quality Assurance & Deployment
- [Chapter 16 — Engineering Operations, Multi-Tier Test Harnesses, Firebase Emulators और Continuous Delivery Protocol](16_engineering_operations_testing_and_deployment.md) *(Part 1)*

### Volume I — Reference Appendices
- [Chapter 20 — Master Reference Appendices](20_master_reference_appendices.md) *(Part 1)*

---

## Canonical Live Manuscript

- **Local Source Repository:** `G:\RankCrackers Project\RankCrackers-55\docs\rankcrackers_book`
- **Google Docs status:** partial living draft only; native parity with the local master is not verified in this batch. Do not treat the linked document as synchronized until native write plus readback confirms parity.
- **Working status:** source-reconciliation batch 02 plus GitHub latest-document reconciliation are compiled locally; Chapter 18 remains `AUDIT HOLD — NOT FINAL`.
- **GitHub tracking status:** latest observed remote documentation is tracked in Chapter 23. The canonical contract was observed at commit `bfee5c70814af5c2c2c3f3ba9fd9163361441d87` and is included in the current local checkout; its presence in the book is not, by itself, proof of live runtime implementation.
- **GitHub tracking files:** `github_source_manifest.json` records source commits; `scripts/check_github_book_tracking.py --json` performs a read-only remote change check before each book compilation cycle.


## Current edition controls

The current compiler order contains 24 source documents. GitHub tree census: 779 tracked `lib/` blobs, 757 Dart files and 22 non-Dart files. The former 776-Dart census is historical local evidence only. The book does not certify current deployments or release readiness. Full native Google Docs/Word parity is not certified.

**Inventory qualification:** mentions of 776 Dart files, 798 local files or the old layer partition describe a historical local snapshot. Current GitHub tree census is 757 Dart / 779 total `lib/` files.
