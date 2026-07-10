# RankCrackers Final Operation Rules

## 1. Project Boundary

- Official project path: `C:\RankCrackers\RankCrackers-55`
- Do not touch VESTA.
- Do not touch city.
- Do not touch any other project.

## 2. Platform Boundary

- Web = Founder/Admin Desktop Console only.
- Android/Mobile = Student/User experience only.
- Android Founder/Admin panels are not allowed for now.
- If mobile Founder/Admin is needed in future, it will be rebuilt from Web Founder Panel options.

## 3. Web Build Rule

Correct web build command:

```powershell
flutter build web -t lib/main_web.dart --release
```

Correct web deploy command:

```powershell
npm run deploy:web:founder
```

Or:

```powershell
flutter build web -t lib/main_web.dart --release
firebase deploy --only hosting
```

Wrong command:

```powershell
flutter build web
```

Reason:

Default `lib/main.dart` is Android/student entry and must not be used for Founder Web hosting.

## 4. Android Rule

- Android uses `lib/main.dart`.
- Android routes to Student/User flow only.
- `/admin` or founder/admin mobile routes must stay blocked or Access Denied.

## 5. Extraction Rule

- Every uploaded official document has value.
- All pages must be extracted.
- Extraction must never stop because of AI token limit.
- Large PDFs must be split into small page batches.
- Each batch must produce page-wise records.
- Final Founder preview must show complete document, not only first page.

## 6. English-first Rule

- Future official extraction source should be English-first.
- Hindi documents should not be primary extraction inputs going forward.
- If Hindi output is needed, extract from English source first, then translate through controlled translation workflow.
- Existing Hindi uploads should be audited and marked with language policy warning, not silently ignored.

## 7. Notification Extraction Rule

- Notification extraction output is not summary.
- Notification extraction output must be structured form data.
- Use:
  - Base Notification Form
  - Exam Archetype Form
  - Variable Packs
  - Exam-specific rules when needed
- Every extracted field must have source page proof.
- Founder verifies extracted fields before facts are locked.

## 8. Syllabus Atom Rule

- Syllabus atoms must not be manually created as final source.
- Founder upload -> AI worker page-wise extraction -> atom candidate extraction -> Founder verification -> verified atoms.
- Every atom must include:
  - `source_document_id`
  - `source_page_number`
  - `source_text_excerpt`
  - `confidence`
  - `verification_status`

## 9. Publish Rule

- No extracted fact, atom, question, DigiBook unit, or Crucible content becomes student-live without Founder verification/approval.
