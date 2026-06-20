import '../models/question_model.dart';
import '../models/digibook_block.dart';
import '../backend/question_repository.dart';
import '../backend/digibook_repository.dart';

/// 🔱 CONTENT GOVERNANCE SERVICE
/// Implements the Constitutional Gate for content quality.
/// Enforces Human Authority Law: No AI content reaches learners without human verification.
class ContentGovernanceService {
  
  // ===================================================
  // QUESTION GOVERNANCE 🔱
  // ===================================================

  static Future<void> submitQuestionForReview(QuestionModel question) async {
    final updated = question.copyWith(
      status: 'review',
      lastAction: 'review_requested',
      updatedAt: DateTime.now(),
    );
    await QuestionRepository.save(updated);
  }

  static Future<void> verifyQuestion({
    required QuestionModel question,
    required String adminId,
  }) async {
    final updated = question.copyWith(
      status: 'verified',
      verifiedBy: adminId,
      verifiedAt: DateTime.now(),
      lastAction: 'verified',
      updatedAt: DateTime.now(),
    );
    await QuestionRepository.save(updated);
  }

  static Future<void> publishQuestion(QuestionModel question) async {
    if (question.status != 'verified') {
      throw Exception("Constitutional Violation: Cannot publish unverified question.");
    }
    final updated = question.copyWith(
      status: 'published',
      lastAction: 'published',
      updatedAt: DateTime.now(),
    );
    await QuestionRepository.save(updated);
  }

  // ===================================================
  // DIGIBOOK GOVERNANCE 🔱
  // ===================================================

  static Future<void> submitBlockForReview(DigiBookBlock block) async {
    final updated = block.copyWith(
      status: 'review',
      lastAction: 'review_requested',
      updatedAt: DateTime.now(),
    );
    await DigiBookRepository.saveBlock(updated);
  }

  static Future<void> verifyBlock({
    required DigiBookBlock block,
    required String adminId,
  }) async {
    final updated = block.copyWith(
      status: 'verified',
      verifiedBy: adminId,
      verifiedAt: DateTime.now(),
      lastAction: 'verified',
      updatedAt: DateTime.now(),
    );
    await DigiBookRepository.saveBlock(updated);
  }

  static Future<void> publishBlock(DigiBookBlock block) async {
    if (block.status != 'verified') {
      throw Exception("Constitutional Violation: Cannot publish unverified DigiBook block.");
    }
    final updated = block.copyWith(
      status: 'published',
      lastAction: 'published',
      updatedAt: DateTime.now(),
    );
    await DigiBookRepository.saveBlock(updated);
  }
}
