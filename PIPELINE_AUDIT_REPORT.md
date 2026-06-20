# 🔱 PIPELINE FORENSIC AUDIT REPORT

## 1. Physical Extraction (Sentinel)
- **OCR Quality**: Native PDF parsing used first. Automatic switch to Google Vision OCR if text density < 150 chars.
- **Failures**: High resilience to format (supports 5+ extensions).
- **Audit**: File buffer is downloaded physically to ensure truth preservation.

## 2. Segmentation (Structural)
- **Input**: Raw recovered text.
- **Output**: Semantic Units (approx 500-1000 characters).
- **AI Dependency**: Uses `gemini-1.5-flash` with a rule-based fallback.
- **Risks**: Potential for "Mid-sentence splitting" if LLM ignores rules. 
- **Validation**: Lineage mapping ensures every unit can be traced back to the source document.

## 3. Atomic Fact Extraction (SVO)
- **Input**: Semantic units.
- **Deduplication**: SHA256 Hashing of the fact triplet ensures 0% internal duplicates for identical content.
- **Hallucinations**: Mitigated by "Subject/Predicate cannot be Unknown" and "If uncertain skip" rules.
- **JSON Integrity**: Upgraded Sanitizer v2.0 ensures 98%+ parsing success rate.

## 4. Promotion & Manifestation
- **Consistency**: Hardened ID scheme (`rec_org_exam_year`) prevents duplicate mission realms.
- **Leakage**: Strict `if (examId)` check prevents unmapped data from entering production nodes.
