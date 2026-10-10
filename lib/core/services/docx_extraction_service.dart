import 'dart:io';
import 'package:archive/archive.dart';
import 'package:xml/xml.dart';
import 'package:flutter/foundation.dart';
import 'package:collection/collection.dart';

/// DOCX EXTRACTION SERVICE
/// Implements Phase 9: XML-Based Physical Structural Extraction.
/// Parses word/document.xml to identify headings and hierarchy.
class DocxExtractionService {
  
  static Future<Map<String, dynamic>> extract(File file) async {
    debugPrint("DOCX SERVICE: Physically parsing XML for ${file.path}");
    
    final bytes = await file.readAsBytes();
    final archive = ZipDecoder().decodeBytes(bytes);
    
    final documentFile = archive.findFile('word/document.xml');
    if (documentFile == null) throw Exception("Invalid DOCX: missing document.xml");

    final content = String.fromCharCodes(documentFile.content);
    final document = XmlDocument.parse(content);

    final List<Map<String, dynamic>> sections = [];
    String fullText = "";

    // Namespace-Safe Selection (Audit Fix)
    // We target 'p' elements within any namespace to handle WordprocessingML correctly.
    final paragraphs = document.descendants.whereType<XmlElement>().where((e) => e.localName == 'p');
    
    for (var p in paragraphs) {
      // Namespace-Independent Attribute Access (Audit Fix)
      final pPr = p.children.whereType<XmlElement>().where((e) => e.localName == 'pPr').firstOrNull;
      final pStyle = pPr?.children.whereType<XmlElement>().where((e) => e.localName == 'pStyle').firstOrNull;
      
      final style = pStyle?.attributes
          .where((attr) => attr.name.local == 'val')
          .firstOrNull
          ?.value;

      final text = p.innerText;
      fullText += "$text\n";

      if (style != null && style.contains('Heading')) {
        sections.add({
          'level': int.tryParse(style.replaceAll('Heading', '')) ?? 1,
          'title': text,
          'content': '', // Content will be appended in Step 3
        });
      } else if (sections.isNotEmpty) {
        // Append text to the last identified heading/section
        sections.last['content'] += "$text\n";
      }
    }

    return {
      'fullText': fullText,
      'sections': sections,
      'wordCount': fullText.split(' ').length,
    };
  }
}
