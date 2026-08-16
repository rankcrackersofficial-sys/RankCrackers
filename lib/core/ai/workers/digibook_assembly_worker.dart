import 'package:flutter/foundation.dart';
import '../../models/recruitment_realm.dart';
import '../../models/syllabus_canonical.dart';
import '../../../features/digibook/data/models/digibook_unit.dart';
import '../../../features/digibook/data/models/digibook_chapter.dart';
import '../workers/knowledge_expansion_worker.dart';
import '../../engines/coverage_validation_engine.dart';
import '../../engines/pyq_linkage_engine.dart';

import '../../models/sentinel_draft.dart';
import '../../models/audit_record.dart';
import '../../backend/sentinel_repository.dart';

/// 🔱 DIGIBOOK ASSEMBLY WORKER (Sprint G Hardened)
/// Law: Verified Syllabus -> Atomic Topics -> DigiBook Builder -> DigiBook
class DigiBookAssemblyWorker {
  static Future<void> assemble(
      RecruitmentRealm realm, List<SyllabusCanonical> syllabuses) async {
    debugPrint(
        "🔱 DIGIBOOK WORKER: Initiating assembly for ${realm.realmId}...");
    final draft = await buildDraft(realm: realm, syllabuses: syllabuses);
    if (draft != null) {
      await SentinelRepository.injectDrafts([draft]);
      debugPrint(
          "🔱 DIGIBOOK WORKER: Assembly complete. Staged for Founder review.");
    }
  }

  /// Exposes the pure assembly API without database side-effects.
  static Future<SentinelDraft?> buildDraft({
    required RecruitmentRealm realm,
    required List<SyllabusCanonical> syllabuses,
  }) async {
    if (!realm.syllabusVerified) {
      debugPrint(
          "🔱 DIGIBOOK WORKER ERROR: Syllabus not verified. Assembly blocked.");
      return null;
    }

    final List<Map<String, dynamic>> chapterMaps = [];
    final List<Map<String, dynamic>> unitMaps = [];
    final List<String> allAtomicTopicIds = [];
    final List<String> generatedUnitTopicIds = [];

    for (var syllabus in syllabuses) {
      final String chapterId =
          "ch_${realm.realmId}_${syllabus.subject.toLowerCase()}";
      final List<String> chapterUnitIds = [];

      if (syllabus.atomicTopics.isEmpty) {
        debugPrint(
            "🔱 DIGIBOOK WORKER ERROR: No Atomic Topics found for ${syllabus.subject}. Skipping subject.");
        continue;
      }

      for (var atomic in syllabus.atomicTopics) {
        allAtomicTopicIds.add(atomic.atomicId);
        final unitId = "unit_${realm.realmId}_${atomic.atomicId}";

        // 🔱 EXPANSION PROTOCOL (GAP-H3)
        final expansion = await KnowledgeExpansionWorker.expand(
            atomic.title, atomic.microTopics.map((e) => e.title).toList());

        // 🔱 PYQ LINKAGE (GAP-H1)
        final pyqMapping = await PYQLinkageEngine.mapTopic(atomic.atomicId);

        final unit = DigiBookUnit(
          id: unitId,
          atomicTopicId: atomic.atomicId,
          chapterId: chapterId,
          realmId: realm.realmId,
          concept: atomic.title,
          definition: expansion['definition'],
          explanation: expansion['explanation'],
          examples: expansion['examples'],
          keywords: expansion['keywords'],

          // 🔱 Hardened PYQ Data
          pyqIds: List<String>.from(pyqMapping['pyqIds']),
          pyqCount: pyqMapping['pyqCount'],
          pyqWeightage: pyqMapping['pyqWeightage'],

          // 🔱 CRUCIBLE DEPENDENCY
          crucibleMapped: false,
          crucibleNodeIds: const [],

          difficulty: expansion['difficulty'],
          status: 'draft',
        );

        unitMaps.add(unit.toMap());
        chapterUnitIds.add(unitId);
        generatedUnitTopicIds.add(atomic.atomicId);
      }

      final chapter = DigiBookChapter(
        id: chapterId,
        realmId: realm.realmId,
        title: "${syllabus.subject} Core Knowledge",
        subject: syllabus.subject,
        unitIds: chapterUnitIds,
        order: chapterMaps.length,
      );

      chapterMaps.add(chapter.toMap());
    }

    // 🔱 COVERAGE VALIDATION (GAP-3)
    final coverageReport = CoverageValidationEngine.validate(
        atomicTopicIds: allAtomicTopicIds,
        digibookUnitTopicIds: generatedUnitTopicIds);

    if (!coverageReport['isValid']) {
      debugPrint(
          "🔱 DIGIBOOK WORKER WARNING: Coverage gap detected! ${coverageReport['missing_topic_ids'].length} topics missing.");
    }

    // 🔱 Create Sentinel Draft for DigiBook Review
    return SentinelDraft(
      id: "db_draft_${realm.realmId}",
      type: 'digibook',
      rawData: {
        'realmId': realm.realmId,
        'chapters': chapterMaps,
        'units': unitMaps,
        'coverage_report': coverageReport, // 🔱 Attached for Founder Review
      },
      status: 'under_review',
      audit: AuditRecord(
        sourceUrl: 'internal_generation',
        sourceHash: 'gen_${DateTime.now().millisecondsSinceEpoch}',
        documentHash: 'db_${realm.realmId}',
        validationStatus: 'pending',
        workerVersion: '1.2.0', // Hardened version
        provider: 'digibook_assembly_worker',
        discoveryCount: 1,
        createdAt: DateTime.now(),
        discoveredAt: DateTime.now(),
        lastSeenAt: DateTime.now(),
      ),
    );
  }
}
