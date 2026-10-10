import '../../../core/firebase/firestore_service.dart';
import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/recruitment.dart';
import '../../../core/models/exam_blueprint.dart';
import '../../../core/models/mission_variant.dart';
import '../../../core/engines/publish_eligibility_engine.dart';
import '../../../core/backend/question_repository.dart';
import '../../../core/backend/digibook_repository.dart';
import '../../../core/engines/mission_seed_engine.dart';
import '../../../core/engines/stress_test_engine.dart';
import '../../../core/engines/digibook_publication_engine.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class AdminUploadEngine {
  static void _requireDebug() {
    if (!kDebugMode) {
      throw Exception(
        'COMMAND DENIED: Physical seeding prohibited in release student paths.',
      );
    }
  }

  // ===================================================
  // PRODUCTION SEEDING
  // ===================================================

  /// Injects canonical "Golden Path" datasets directly into production.
  /// Used for Phase 4C Physical Verification.
  static Future<void> seedProductionData() async {
    _requireDebug();
    final punjab = MissionSeedEngine.generatePunjabMathematics();
    final ugc = MissionSeedEngine.generateUgcNetPaper1();

    final List<Map<String, dynamic>> recruitments = [
      (punjab['recruitment'] as Recruitment).toMap(),
      (ugc['recruitment'] as Recruitment).toMap(),
    ];

    final List<Map<String, dynamic>> blueprints = [
      (punjab['blueprint'] as ExamBlueprint).toMap(),
      (ugc['blueprint'] as ExamBlueprint).toMap(),
    ];

    final List<Map<String, dynamic>> nodes = [];
    for (var node in (punjab['nodes'] as List<MicroTopicNode>)) {
      nodes.add(node.toMap());
    }
    for (var node in (ugc['nodes'] as List<MicroTopicNode>)) {
      nodes.add(node.toMap());
    }

    // Execute Idempotent Batch Uploads
    await FirestoreService.uploadBatch(
      FirestoreService.missionRealmCollection,
      recruitments,
    );
    await FirestoreService.uploadBatch(
      FirestoreService.blueprintCollection,
      blueprints,
    );
    await FirestoreService.uploadBatch(FirestoreService.nodeCollection, nodes);

    print('PRODUCTION SEEDING COMPLETE: Punjab and UGC NET live.');
  }

  /// Phase 6.2: Dataset Stress Test Injection
  static Future<void> runStressTest() async {
    _requireDebug();
    final stressData = StressTestEngine.generateStressDataset();

    final List<MicroTopicNode> nodes = stressData['nodes'];

    // Inject Recruitment & Blueprint
    await FirestoreService.uploadRecruitment(stressData['recruitment']);
    await FirestoreService.uploadBlueprint(stressData['blueprint']);

    // Batch Inject Nodes (Split into chunks of 500 for Firestore limits)
    final List<Map<String, dynamic>> nodeMaps = nodes
        .map((n) => n.toMap())
        .toList();
    for (var i = 0; i < nodeMaps.length; i += 500) {
      final end = (i + 500 < nodeMaps.length) ? i + 500 : nodeMaps.length;
      await FirestoreService.uploadBatch(
        FirestoreService.nodeCollection,
        nodeMaps.sublist(i, end),
      );
    }

    print('STRESS TEST INJECTION COMPLETE: 1000 nodes live.');
  }

  // ===================================================
  // PUBLISH RECRUITMENT
  // ===================================================

  /// Validates and publishes a recruitment.
  /// Implements Document 26 Section 37 (Enforcement).
  /// Hardened via REMEDIATION-04: Scalability, Preservation, and Atomicity.
  static Future<bool> publishRecruitment(Recruitment recruitment) async {
    // 1. Authority Enforcement (FLAG-C)
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception(
        'COMMAND DENIED: Publication requires authenticated authority.',
      );
    }
    final adminId = user.uid;

    final blueprint = await FirestoreService.fetchBlueprint(
      recruitment.examBlueprintId,
    );
    final missionNodes = await FirestoreService.fetchNodesByExam(
      recruitment.examId,
    );
    final digiBookBlocks = await DigiBookRepository.fetchByMission(
      recruitment.examId,
    );
    final questions = await QuestionRepository.fetchByExam(recruitment.examId);

    // 2. Run Publish Eligibility Engine
    final eligibility = PublishEligibilityEngine.validate(
      recruitment: recruitment,
      blueprint: blueprint,
      nodes: missionNodes,
      digiBookBlocks: digiBookBlocks,
      questions: questions,
    );

    if (!eligibility.isEligible) {
      for (final error in eligibility.errors) {
        print('PUBLISH BLOCKED: $error');
      }
      return false;
    }

    try {
      // 3. Sovereign Batch Chunking (FLAG-A: 500 Ops Limit)
      int operationCount = 0;
      WriteBatch batch = FirebaseFirestore.instance.batch();

      Future<void> commitBatch() async {
        if (operationCount > 0) {
          await batch.commit();
          batch = FirebaseFirestore.instance.batch();
          operationCount = 0;
        }
      }

      // 4. Assemble and Batch Payloads
      for (final node in missionNodes) {
        final nodeBlocks = digiBookBlocks
            .where((b) => b.atomicTopicId == node.id)
            .toList();

        final result = DigiBookPublicationEngine.assemble(
          node: node,
          blocks: nodeBlocks,
          adminId: adminId,
          version: recruitment.version, // G5: Version alignment
        );

        // Physical Write: Current Payload
        final payloadRef = FirebaseFirestore.instance
            .collection('content_payloads')
            .doc(node.contentRegistryId);
        batch.set(payloadRef, result.payload.toMap());
        operationCount++;

        // Physical Write: Historical Version Preservation (FLAG-D)
        final historyRef = FirebaseFirestore.instance
            .collection('payload_versions')
            .doc('${node.contentRegistryId}_v${recruitment.version}');
        batch.set(historyRef, result.payload.toMap());
        operationCount++;

        // Physical Write: Audit (G4: Separate Collection)
        final auditRef = FirebaseFirestore.instance
            .collection('payload_publication_audits')
            .doc(result.audit['id']);
        batch.set(auditRef, result.audit);
        operationCount++;

        // Physical Write: Node Status Update
        final nodeRef = FirebaseFirestore.instance
            .collection(FirestoreService.nodeCollection)
            .doc(node.id);
        batch.update(nodeRef, {'status': 'published'});
        operationCount++;

        // Check Batch Limit
        if (operationCount > 400) {
          await commitBatch();
        }
      }

      // 5. Batch Recruitment Update
      final recruitRef = FirebaseFirestore.instance
          .collection(FirestoreService.missionRealmCollection)
          .doc(recruitment.id);
      batch.update(recruitRef, {'status': 'published'});
      operationCount++;

      // 6. Register State Atomically (FLAG-B)
      FirestoreService.addStateRegistryToBatch(batch, recruitment.state);
      operationCount++;

      // 7. Final Commit
      await commitBatch();

      print('MISSION MOBILIZED: ${recruitment.title} is now LIVE at scale.');
      return true;
    } catch (e) {
      print('CRITICAL PUBLICATION FAILURE: $e');
      return false;
    }
  }

  /// Updates the status of a recruitment (Review Workflow).
  static Future<void> updateRecruitmentStatus(String id, String status) async {
    final recruitment = await FirestoreService.fetchRecruitment(id);
    if (recruitment != null) {
      await FirestoreService.uploadRecruitment(
        recruitment.copyWith(status: status),
      );
    }
  }

  /// Uploads a recruitment in draft state.
  static Future<void> uploadRecruitment(Recruitment recruitment) async {
    await FirestoreService.uploadRecruitment(recruitment);
  }

  // ===================================================
  // UPLOAD BLUEPRINT
  // ===================================================
  static Future<void> uploadBlueprint(ExamBlueprint blueprint) async {
    await FirestoreService.uploadBlueprint(blueprint);
  }

  // ===================================================
  // UPLOAD VARIANT
  // ===================================================
  static Future<void> uploadVariant(MissionVariant variant) async {
    await FirestoreService.uploadVariant(variant);
  }

  // ===================================================
  // UPLOAD NODE
  // ===================================================
  static Future<void> uploadNode({
    required String exam,
    required String subject,
    required String chapter,
    required String topic,
    String category = 'competitive', // Amendment v3.0
  }) async {
    final nodeId = topic.replaceAll(' ', '_').toUpperCase();

    final node = MicroTopicNode(
      id: nodeId,
      examId: exam,
      subjectId: subject,
      chapterId: chapter,
      title: topic,
      titleHindi: topic,
      subjectHindi: subject,
      chapterHindi: chapter,
      description: '$topic description',
      contentRegistryId: 'payload_$nodeId',
      difficulty: 2,
      importance: 3,
      status: 'draft',
    );

    await FirestoreService.uploadNode(node);
  }
}
