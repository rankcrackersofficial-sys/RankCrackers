import * as pdfParse from 'pdf-parse';

export async function parsePDF(buffer: Buffer) {
  try {
    // Handling potential type issues with pdf-parse default export
    const data = await (pdfParse as any).default(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF PARSE ERROR:', error);
    return null;
  }
}
