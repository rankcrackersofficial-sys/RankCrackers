import '../../models/digibook_block.dart';
import '../../models/question_difficulty.dart';

/// 🔱 DIFFICULTY ENGINE
/// Calibrates question complexity based on content depth and block type.
class DifficultyEngine {
  
  QuestionDifficulty calculate(DigiBookBlock block) {
    final Map<String, dynamic> data = block.toMap();
    final int importance = data['importance'] ?? 5;

    // 🔱 Rule 1: High importance core concepts are usually 'easy' or 'medium'
    if (block.type == 'concept_note' && importance >= 8) return QuestionDifficulty.easy;
    
    // 🔱 Rule 2: Technical brief notes are 'hard'
    if (block.type == 'brief_note' && block.content.length > 200) return QuestionDifficulty.hard;
    
    return QuestionDifficulty.medium;
  }
}
