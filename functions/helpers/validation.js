/**
 * 🔱 SCHEMA VALIDATION
 */
function validateSchema(type, data) {
  if (!data) throw new Error("SCHEMA_VIOLATION: Data is null");
  if (type === 'digibook' && (!data.facts)) throw new Error("SCHEMA_VIOLATION: Missing facts");
  if (type === 'mcq' && (!data.questions)) throw new Error("SCHEMA_VIOLATION: Missing questions");
  if (type === 'recruitment' && (!data.lastDate)) throw new Error("SCHEMA_VIOLATION: Missing dates");
}

module.exports = validateSchema;
