# Notification Dynamic Schema Foundation

RC-N0 locks notification extraction as structured, source-proofed form data. Notification extraction output must not be a summary.

## Flow

Notification PDF upload -> document classifier -> exam archetype detector -> schema selector -> AI fact extractor -> source page proof mapping -> Founder verification -> verified notification facts -> mission profile update.

## Schema Layers

1. Base Notification Form: universal fields every notification should expose.
2. Exam Archetype Form: fields selected from the nature of the exam or notice.
3. Variable Packs: flexible arrays for vacancies, eligibility, papers, dates, fees, categories, departments, links, relaxations, and amendments.
4. Exam-specific Rules: allowed later only as small rules layered on top of base + archetype + packs.

## Source Proof Contract

Every extracted field must later store:

```js
source_proof: {
  source_document_id,
  source_page_number,
  source_text_excerpt,
  extraction_confidence,
  page_extraction_id,
}
```

No field may become `verified=true` without `source_proof`.

## Founder Verification

Every field must support:

- approve
- edit
- send_back

Founder verification locks facts. Nothing becomes student-live from notification extraction without Founder approval.

## Language and Extraction Boundaries

- This foundation does not run extraction.
- This foundation does not write Firestore.
- This foundation does not deploy Firebase.
- Future primary extraction source is English-first.
- Hindi output, if needed, comes after English extraction through a controlled translation workflow.
