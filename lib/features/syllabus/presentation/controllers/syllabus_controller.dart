import 'package:flutter/material.dart';

import '../../../../core/knowledge/knowledge_engine.dart';
import '../../domain/models/exam_syllabus_model.dart';
import '../../domain/models/subject_model.dart';

class SyllabusController extends ChangeNotifier {
  ExamSyllabusModel? currentSyllabus;
  bool isLoading = false;

  Future<void> loadSyllabus(String examId) async {
    isLoading = true;
    notifyListeners();

    // 🔱 Audit Fix: Derive from KnowledgeEngine (Article 6 & 8)
    final engine = KnowledgeEngine.instance;
    final nodes = engine.allNodes.where((n) => n.examId == examId).toList();

    if (nodes.isEmpty) {
      currentSyllabus = ExamSyllabusModel(examId: examId, examName: 'Mission $examId', subjects: []);
    } else {
      final subjectIds = nodes.map((n) => n.subjectId).toSet().toList();
      final List<SubjectModel> subjects = [];

      for (final sId in subjectIds) {
        final subjectNodes = nodes.where((n) => n.subjectId == sId).toList();
        final subjectMastery = engine.getSubjectMastery(sId);
        final subjectCoverage = engine.getSubjectCoverage(sId);

        subjects.add(
          SubjectModel(
            id: sId,
            name: sId, // Fallback to ID for now, can map to Hindi title later
            totalTopics: subjectNodes.length,
            completedTopics: subjectNodes.where((n) => engine.getState(n.id)?.completed ?? false).length,
            totalQuestions: 0,
            completedQuestions: 0,
            accuracy: subjectMastery * 100,
            icon: sId.toLowerCase(),
            topics: subjectNodes.map((n) => n.title).toList(),
            isCompleted: subjectCoverage >= 0.99,
          ),
        );
      }

      currentSyllabus = ExamSyllabusModel(
        examId: examId,
        examName: 'Mission $examId',
        subjects: subjects,
      );
    }

    isLoading = false;
    notifyListeners();
  }

  List<SubjectModel> get subjects {

    return currentSyllabus
        ?.subjects ??
        [];
  }

  List<String> getAllTopics() {

    final List<String> allTopics = [];

    for (final subject in subjects) {

      allTopics.addAll(
        subject.topics,
      );
    }

    return allTopics;
  }

  double getOverallProgress() {
    // 🔱 Audit Fix: Overall Mission Coverage (Article 9)
    return KnowledgeEngine.instance.coverageState?.coveragePercent ?? 0.0;
  }

  double getOverallAccuracy() {
    // 🔱 Audit Fix: Overall Mission Readiness (Article 27)
    return KnowledgeEngine.instance.readinessState?.score ?? 0.0;
  }

  List<SubjectModel> getWeakSubjects() {

    final weakSubjects =
    subjects.where(

          (subject) =>
      subject.accuracy < 0.70,
    ).toList();

    weakSubjects.sort(

          (a, b) =>
          a.accuracy.compareTo(
            b.accuracy,
          ),
    );

    return weakSubjects;
  }
}