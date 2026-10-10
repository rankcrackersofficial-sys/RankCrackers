import '../../models/digibook_block.dart';

/// TEMPLATE ENGINE
/// Generates raw question text from DigiBook Blocks using predefined patterns.
class TemplateEngine {
  
  String generateQuestion(DigiBookBlock block) {
    final String content = block.content;
    final String? title = block.toMap()['title']; // Extracted by sentinel

    // Strategy 1: Title-based interrogation
    if (title != null && title.isNotEmpty) {
      if (title.contains('?') || title.contains('=')) {
        return title.replaceAll('=', 'is').trim();
      }
      return "What is $title?";
    }
    
    // Strategy 2: Direct statement conversion
    return "Identify the correct statement regarding this concept: ${content.length > 50 ? content.substring(0, 50) + "..." : content}";
  }
}
