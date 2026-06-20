/**
 * 🔱 REFINERY PROMPTS
 */
function getRefineryPrompt(taskType, payload) {
  const sourceText = payload.text || payload.fullText || "";
  switch (taskType) {
    case 'recruitment':
      return `🔱 TASK: RECRUITMENT INTELLIGENCE EXTRACTION
RULES: Extract official metadata into structured JSON.
JSON FORMAT: {
  "exam_name": "Short code or common name (e.g. SSC CGL, RAS)",
  "exam_category": "Canonical lower-case slug (e.g. ssc_cgl, rpsc_ras)",
  "title": "Full Official Title",
  "organization": "Official Board Name (e.g. SSC, RPSC, UPSC)",
  "year": 2026,
  "cycle": "Cycle name or month if applicable",
  "lastDate": "YYYY-MM-DD",
  "notificationDate": "YYYY-MM-DD",
  "vacancies": 0,
  "eligibility": ["Criteria 1"],
  "syllabusSummary": "Short Markdown",
  "document_type": "notification"
}
SOURCE:
${sourceText}`;

    case 'syllabus':
      return `🔱 TASK: SYLLABUS ATOMIZATION
RULES: Extract exam metadata and map subject segments.
JSON FORMAT: {
  "exam_name": "Short code or common name",
  "exam_category": "Canonical lower-case slug (e.g. ssc_cgl, rpsc_ras)",
  "organization": "Official Board Name",
  "year": 2026,
  "cycle": "Cycle name",
  "document_type": "syllabus",
  "segments": [{"subject": "", "chapters": [""]}]
}
SOURCE:
${sourceText}`;

    case 'canonicalRepair': return `🔱 TASK: CANONICAL REPAIR\nRULES: Fix OCR artifacts, restore semantic Markdown.\nSOURCE:\n${sourceText}`;
    case 'digibook': return `🔱 TASK: KNOWLEDGE ATOMIZATION\nJSON FORMAT: {"facts": [{"title": "", "content": "", "importance": 8, "isCore": true}], "oneLiners": [], "revisionPoints": []}\nSOURCE:\n${sourceText}`;
    case 'mcq': return `🔱 TASK: MCQ GENERATION\nJSON FORMAT: {"questions": [{"question": "", "options": [], "answerIndex": 0, "difficulty": "medium"}]}\nSOURCE:\n${sourceText}`;
    case 'structural_segmentation':
      return `🔱 TASK: DOCUMENT STRUCTURAL SEGMENTATION
You are not extracting facts. You are only identifying document structure.
RULES:
1. Preserve original order.
2. Preserve section hierarchy.
3. Preserve eligibility tables as separate units.
4. Preserve bullet lists as separate list_item units.
5. Never summarize. Never rewrite text.
6. Output only exact source text fragments.
7. Split text into logical chunks (approx 500-1000 characters each).
Return JSON:
{
  "units": [
    {
      "pageNumber": 1,
      "sectionHeading": "Eligibility",
      "semanticType": "paragraph",
      "rawText": "..."
    }
  ]
}
SOURCE:
${sourceText}`;
    case 'svo_extraction':
      return `🔱 TASK: ATOMIC KNOWLEDGE EXTRACTION (SVO)
You are a Senior Knowledge Engineer. Decompose the following text into machine-readable triplets.
RULES:
1. One fact = one atomic truth. NEVER merge facts.
2. Maximum object length = 80 characters.
3. Identify the FactType: definition, rule, date, formula, eligibility, fact, exception, instruction.
4. Capture Context (e.g., "In Rajasthan", "For ST category").
5. Maintain strict truth: Never invent or summarize.
6. If uncertain or information is missing, skip the fact.
7. SUBJECT and PREDICATE must never be "Unknown".
8. Return ONLY valid JSON.
JSON FORMAT:
{
  "facts": [
    {
      "subject": "SSC CGL",
      "predicate": "minimum_age",
      "object": "18 years",
      "context": "as on 01.01.2025",
      "factType": "eligibility",
      "confidence": 0.9,
      "isCore": true
    }
  ]
}
SOURCE:
${sourceText}`;
    default: return `🔱 TASK: GENERAL INTELLIGENCE\nRULES: Return structured JSON summarizing the source.\nSOURCE:\n${sourceText}`;
  }
}

module.exports = getRefineryPrompt;
