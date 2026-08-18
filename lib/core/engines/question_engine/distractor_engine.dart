import 'dart:math';
import '../../models/digibook_block.dart';

/// 🔱 DISTRACTOR ENGINE
/// Logic for generating plausible wrong answers (distractors) without AI.
class DistractorEngine {
  final Random _random = Random();

  /// 🔱 Primary Logic: Pick distractors from siblings (same topic/context)
  List<String> generateDistractors({
    required DigiBookBlock target,
    required List<DigiBookBlock> pool,
    int count = 3,
  }) {
    // 🔱 Rule 1: Find blocks from the same atomic topic
    final List<String> siblings = pool
        .where((b) => b.id != target.id && b.atomicTopicId == target.atomicTopicId)
        .map((b) => b.content)
        .where((c) => c != target.content)
        .toSet() // Deduplicate
        .toList();

    if (siblings.length >= count) {
      siblings.shuffle(_random);
      return siblings.take(count).toList();
    }

    // 🔱 Rule 2: Fallback to general pool
    final List<String> generic = pool
        .where((b) => b.id != target.id && b.content != target.content)
        .map((b) => b.content)
        .toSet()
        .toList();
    
    generic.shuffle(_random);
    final List<String> combined = (siblings + generic).toSet().toList();
    
    if (combined.length >= count) {
      return combined.take(count).toList();
    }

    // 🔱 Rule 3: Hardcoded Fallbacks: DISABLED
    // Return empty list to ensure zero fake academic content in production.
    return [];
  }

  List<String> _generateHardcodedFallbacks(int count) {
    return List.generate(count, (i) => "Incorrect Statement ${i + 1}");
  }
}
