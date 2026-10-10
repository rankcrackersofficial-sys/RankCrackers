import 'package:flutter/foundation.dart';

/// CHUNKING ENGINE (v4 Page-Aware Semantic)
/// Implements Phase 9 Step 4: Multi-Lingual & Structural Segmentation.
/// Optimized for NCERT, History Books, and State Notifications.
class ChunkingEngine {
  
  /// SEGMENTATION PROTOCOL
  /// Splits text based on structural hierarchy: Page > Chapter > Section.
  static List<Map<String, dynamic>> segment(String text, {int maxChunkSize = 1500}) {
    debugPrint("CHUNKING ENGINE: Initiating Page-Aware Semantic Segmentation.");

    // Step 1: Structural Hierarchy Regex
    final RegExp pageRegex = RegExp(r'\[\[PAGE_(\d+)\]\]', caseSensitive: false);
    
    final RegExp chapterRegex = RegExp(
      r'(Chapter\s+[0-9IVX]+|Part\s+[0-9]+|अध्याय\s+[0-9१-९]+|खंड\s+[0-9१-९]+|UNIT\s+[0-9]+)', 
      caseSensitive: false
    );
    
    final RegExp sectionRegex = RegExp(
      r'(Section\s+[0-9.]+|Topic:|प्रकरण\s+[0-9.]+|विषय:|[0-9]+\.[0-9]+\s+[A-Z])', 
      caseSensitive: false
    );

    final List<String> lines = text.split('\n');
    final List<Map<String, dynamic>> chunks = [];
    
    String currentChunk = "";
    String currentChapter = "Unknown";
    String currentSection = "General";
    int currentPage = 1;
    int chunkIndex = 0;
    int lineInChunk = 0;

    for (var line in lines) {
      final trimmedLine = line.trim();
      if (trimmedLine.isEmpty) {
        lineInChunk++;
        continue;
      }

      // Step 2: Page Detection
      final pageMatch = pageRegex.firstMatch(trimmedLine);
      if (pageMatch != null) {
        if (currentChunk.isNotEmpty) _addChunk(chunks, chunkIndex++, currentChunk, currentChapter, currentSection, currentPage, lineInChunk);
        currentPage = int.tryParse(pageMatch.group(1) ?? '1') ?? currentPage;
        currentChunk = "";
        lineInChunk = 0;
        continue;
      }

      // Step 3: Chapter/Unit Detection
      if (chapterRegex.hasMatch(trimmedLine)) {
        if (currentChunk.isNotEmpty) _addChunk(chunks, chunkIndex++, currentChunk, currentChapter, currentSection, currentPage, lineInChunk);
        currentChapter = trimmedLine;
        currentSection = "General";
        currentChunk = "";
        lineInChunk = 0;
        continue;
      }

      // Step 4: Section/Topic Detection
      if (sectionRegex.hasMatch(trimmedLine)) {
        if (currentChunk.isNotEmpty) _addChunk(chunks, chunkIndex++, currentChunk, currentChapter, currentSection, currentPage, lineInChunk);
        currentSection = trimmedLine;
        currentChunk = "";
        lineInChunk = 0;
        continue;
      }

      // Step 5: Overflow Chunking
      if ((currentChunk.length + trimmedLine.length) > maxChunkSize) {
        _addChunk(chunks, chunkIndex++, currentChunk, currentChapter, currentSection, currentPage, lineInChunk);
        currentChunk = "";
        lineInChunk = 0;
      }
      
      currentChunk += "$trimmedLine\n";
      lineInChunk++;
    }

    if (currentChunk.isNotEmpty) {
      _addChunk(chunks, chunkIndex++, currentChunk, currentChapter, currentSection, currentPage, lineInChunk);
    }

    debugPrint("CHUNKING COMPLETE: ${chunks.length} semantic units extracted.");
    return chunks;
  }

  static void _addChunk(
    List<Map<String, dynamic>> list, 
    int index, 
    String content, 
    String chapter, 
    String section,
    int page,
    int lineCount
  ) {
    list.add({
      'index': index,
      'page': page,
      'line_count': lineCount,
      'chapter': chapter,
      'section': section,
      'content': content.trim(),
      'size': content.length,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }
}
