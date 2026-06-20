const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * 🔱 SOVEREIGN RENDERING SERVICE (v5.0 Hardened)
 * Implements Phase 7D-B: Forensic PDF and QR generation with Text Wrapping.
 */

/**
 * Generates a QR Code buffer for the verification URL.
 */
async function generateQrBuffer(hash) {
    const baseUrl = process.env.VERIFICATION_BASE_URL || "https://verify.rankcrackers.com";
    const url = `${baseUrl}/v/${hash}`;
    return await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });
}

/**
 * Helper to wrap text for PDF rendering.
 */
function wrapText(text, maxWidth, font, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * Generates the physical Certificate PDF.
 */
async function generateCertificatePdf(data, qrBuffer) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 1. Background Layer (Luxury Noir)
    page.drawRectangle({
        x: 0, y: 0,
        width, height,
        color: rgb(0.04, 0.05, 0.08) // #0A0C14
    });

    // 2. Gold Border
    page.drawRectangle({
        x: 20, y: 20,
        width: width - 40, height: height - 40,
        borderColor: rgb(0.7, 0.6, 0.36), // Gold #B39B5D
        borderWidth: 2
    });

    // 3. Brand Header
    page.drawText("RANKCRACKERS", {
        x: width / 2 - 100, y: height - 80,
        size: 30, font, color: rgb(1, 1, 1)
    });

    page.drawText("SOVEREIGN VICTORY RECORD", {
        x: width / 2 - 120, y: height - 110,
        size: 14, font: italicFont, color: rgb(0.7, 0.6, 0.36)
    });

    // 4. Recipient Details (🔱 Gap 3 Fix: Using warriorName)
    const warriorName = (data.metadata.warriorName || "VALIANT WARRIOR").toUpperCase();

    page.drawText("This certifies that the warrior", {
        x: width / 2 - 100, y: height - 200,
        size: 16, font: regularFont, color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText(warriorName, {
        x: width / 2 - (font.widthOfTextAtSize(warriorName, 28) / 2), y: height - 245,
        size: 28, font, color: rgb(1, 1, 1)
    });

    page.drawText(`has successfully conquered the mission:`, {
        x: width / 2 - 140, y: height - 290,
        size: 16, font: regularFont, color: rgb(0.8, 0.8, 0.8)
    });

    // 🔱 Gap 4 Fix: Text Wrapping for Long Exam Names
    const examName = data.metadata.examName.toUpperCase();
    const wrappedExamLines = wrapText(examName, 600, font, 22);

    let yPos = height - 330;
    for (const line of wrappedExamLines) {
        page.drawText(line, {
            x: width / 2 - (font.widthOfTextAtSize(line, 22) / 2), y: yPos,
            size: 22, font, color: rgb(0.7, 0.6, 0.36)
        });
        yPos -= 28;
    }

    // 5. Success Metrics
    const scoreText = `SCORE: ${data.metadata.score}%`;
    const rankText = data.metadata.rank ? `RANK: ${data.metadata.rank}` : "RANK: QUALIFIED";
    const metricsLine = `${scoreText}   |   ${rankText}`;

    page.drawText(metricsLine, {
        x: width / 2 - (font.widthOfTextAtSize(metricsLine, 14) / 2), y: yPos - 30,
        size: 14, font, color: rgb(0.5, 0.5, 0.5)
    });

    // 6. QR Code Embedding (Verification Anchor)
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImage, {
        x: width - 150, y: 50,
        width: 100, height: 100
    });

    page.drawText("VERIFY AUTHENTICITY", {
        x: width - 150, y: 35,
        size: 8, font: regularFont, color: rgb(0.3, 0.3, 0.3)
    });

    // 7. Footer
    page.drawText(`CERTIFICATE ID: ${data.certificateId}`, {
        x: 50, y: 50,
        size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3)
    });

    page.drawText(`ISSUED BY THE RANKCRACKERS AUTHORITY`, {
        x: 50, y: 35,
        size: 8, font: italicFont, color: rgb(0.3, 0.3, 0.3)
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

/**
 * Computes SHA256 hash of a buffer.
 */
function computeHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
    generateQrBuffer,
    generateCertificatePdf,
    computeHash
};
