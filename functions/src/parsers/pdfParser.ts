export async function parsePDF(buffer: Buffer) {
  try {
    // Lazy-load to keep Cloud Function discovery independent from optional
    // native canvas bindings used by pdf-parse.
    const pdfParse = require('pdf-parse');
    // Handling potential type issues with pdf-parse default export
    const data = await (pdfParse as any).default(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF PARSE ERROR:', error);
    return null;
  }
}
