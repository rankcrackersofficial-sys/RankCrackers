const pdfParse = require("pdf-parse");
console.log("Full export:", pdfParse);
console.log("Type of export:", typeof pdfParse);
console.log("Keys:", Object.keys(pdfParse));

try {
    const { PDFParse } = pdfParse;
    console.log("PDFParse class exists:", !!PDFParse);
} catch (e) {
    console.log("Error accessing PDFParse key");
}
