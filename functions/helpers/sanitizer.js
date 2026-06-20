/**
 * 🔱 JSON SANITIZER v2.0 (Forensic Quality)
 * Extracts and cleans JSON from LLM responses even if they are malformed or wrapped in Markdown.
 */
function sanitizeJsonResponse(text) {
  if (typeof text !== 'string') return "{}";

  let cleaned = text.trim();

  // 1. Remove Markdown code blocks (more aggressive)
  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");

  // 2. Extract content between first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Post-Extraction Repair: Remove dangerous whitespace/newlines inside keys
  // Note: This is simplified; real repair would use a proper parser fallback.

  try {
    // Attempt parsing to see if it's already valid
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    // If it fails, try to fix common trailing comma issue before returning
    let repaired = cleaned.replace(/,\s*([\]}])/g, '$1');
    return repaired;
  }
}

module.exports = sanitizeJsonResponse;
