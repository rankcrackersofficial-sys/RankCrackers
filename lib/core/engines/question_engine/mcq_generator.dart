import 'dart:math';
import '../../models/digibook_block.dart';
import '../../models/question_model.dart';
import 'template_engine.dart';
import 'distractor_engine.dart';
import 'difficulty_engine.dart';

/// MCQ GENERATOR (Core Phase 13 Engine)
/// Generates assessment evidence from knowledge blocks at zero AI cost.
class McqGenerator {
  final TemplateEngine _templates = TemplateEngine();
  final DistractorEngine _distractors = DistractorEngine();
  final DifficultyEngine _difficulty = DifficultyEngine();
  final Random _random = Random();

  QuestionModel generate({
    required DigiBookBlock block,
    required List<DigiBookBlock> contextPool,
    required String examId,
    required String subjectId,
    required String nodeId,
  }) {
    // 1. Generate Question Text
    final String questionText = _templates.generateQuestion(block);

    // 2. Generate Distractors
    final List<String> wrongOptions = _distractors.generateDistractors(
      target: block,
      pool: contextPool,
    );

    // 3. Assemble Options & Shuffle
    final List<String> allOptions = [block.content, ...wrongOptions];
    allOptions.shuffle(_random);
    final int correctIndex = allOptions.indexOf(block.content);

    // 4. Determine Difficulty
    final difficulty = _difficulty.calculate(block);

    // 5. Construct Model
    return QuestionModel(
      id: "auto_${block.id}_${DateTime.now().millisecondsSinceEpoch}",
      nodeId: nodeId,
      factId: block.id,
      examId: examId,
      subjectId: subjectId,
      question: questionText,
      options: allOptions,
      answerIndex: correctIndex,
      difficulty: difficulty,
      status: 'review', // Auto-generated questions go to review
      sourceType: 'auto_generator_v1',
      updatedAt: DateTime.now(),
    );
  }
}
