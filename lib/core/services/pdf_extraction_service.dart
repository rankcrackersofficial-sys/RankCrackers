import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart' as sf;
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:pdfx/pdfx.dart' as px;
import 'package:path_provider/path_provider.dart';

/// 🔱 PDF EXTRACTION SERVICE (v3 Hardened)
/// Implements Phase 9: Real Physical Extraction with OCR Fallback.
class PdfExtractionService {
  
  /// 🔱 EXTRACT TEXT PROTOCOL
  /// Primary: Direct Text Extraction. Fallback: Full Page OCR for scanned documents.
  static Future<Map<String, dynamic>> extract(File file) async {
    debugPrint("🔱 PDF SERVICE: Processing ${file.path}");
    
    final List<int> bytes = await file.readAsBytes();
    final sf.PdfDocument syncfusionDoc = sf.PdfDocument(inputBytes: bytes);
    
    String fullText = "";
    final List<Map<String, dynamic>> pageMap = [];
    bool containsScannedPages = false;

    // We use pdfx for rendering and syncfusion for direct extraction
    final px.PdfDocument pdfxDoc = await px.PdfDocument.openFile(file.path);

    try {
      final sf.PdfTextExtractor extractor = sf.PdfTextExtractor(syncfusionDoc);
      
      for (int i = 0; i < syncfusionDoc.pages.count; i++) {
        String pageText = extractor.extractText(startPageIndex: i, endPageIndex: i);
        String method = 'direct';

        // 🔱 Step 1: Detect Scanned Page (Density Check)
        if (pageText.trim().length < 50) {
          debugPrint("🔱 PDF SERVICE: Page ${i + 1} looks scanned. Triggering OCR...");
          pageText = await _ocrPage(pdfxDoc, i);
          method = 'ocr_fallback';
          containsScannedPages = true;
        }

        fullText += "$pageText\n";
        pageMap.add({
          'page': i + 1,
          'text': pageText,
          'method': method,
        });
      }
    } finally {
      syncfusionDoc.dispose();
      await pdfxDoc.close();
    }

    return {
      'fullText': fullText,
      'pageMap': pageMap,
      'ocrFlag': containsScannedPages,
    };
  }

  /// 🔱 INTERNAL OCR PIPELINE
  /// Renders PDF page to image and runs ML Kit Text Recognition.
  static Future<String> _ocrPage(px.PdfDocument pdfxDoc, int pageIndex) async {
    try {
      final page = await pdfxDoc.getPage(pageIndex + 1);
      final pageImage = await page.render(
        width: page.width * 2, // Higher scale for better OCR accuracy
        height: page.height * 2,
        format: px.PdfPageImageFormat.jpeg, // Changed from jpg to jpeg
        quality: 90,
      );

      if (pageImage == null) return "";

      // Save to temporary file for ML Kit
      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/ocr_page_$pageIndex.jpg');
      await tempFile.writeAsBytes(pageImage.bytes);

      final text = await performOCR(tempFile);
      
      // Cleanup
      await tempFile.delete();
      await page.close();
      
      return text;
    } catch (e) {
      debugPrint("🔱 OCR ERROR on Page $pageIndex: $e");
      return "";
    }
  }

  /// 🔱 ML KIT OCR ENGINE (v2 Multi-Lingual)
  static Future<String> performOCR(File imageFile) async {
    // 🔱 Audit Fix: Multi-lingual support (Latin script covers English/Numbers)
    // Note: Devanagari requires specific ML Kit bundled models.
    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
    final InputImage inputImage = InputImage.fromFile(imageFile);
    
    final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);
    await textRecognizer.close();
    
    return recognizedText.text;
  }
}
