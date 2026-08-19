import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/micro_topic_node.dart';
import '../models/recruitment.dart';
import '../models/mission_variant.dart';
import '../models/exam_blueprint.dart';
import '../models/notification_event.dart';
import '../../features/crucible/models/crucible_protocol_state.dart';
import '../../features/crucible/models/crucible_schedule.dart';
import '../models/atomic_mastery_state.dart';
import '../models/atomic_coverage_state.dart';
import '../models/atomic_risk_state.dart';
import '../models/sentinel_draft.dart';
import '../models/notification_candidate.dart';
import '../../features/profile/data/models/user_profile_model.dart';
import '../constants/founder_identity.dart';

class FirestoreService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static const String nodeCollection = 'micro_nodes';
  static const String recruitmentCollection = 'recruitments';
  static const String stateRegistryCollection =
      'published_states'; // 🔱 Amendment v3.0: State Registry Law
  static const String variantCollection = 'mission_variants';
  static const String blueprintCollection = 'blueprints';
  static const String protocolCollection = 'protocols';
  static const String scheduleCollection = 'schedules';
  static const String atomicMasteryCollection = 'atomic_mastery';
  static const String atomicCoverageCollection = 'atomic_coverage';
  static const String atomicRiskCollection = 'atomic_risk';
  static const String sentinelDraftCollection = 'sentinel_drafts';
  static const String aiQueueCollection = 'ai_queue';
  static const String notificationCandidateCollection =
      'notification_candidates';
  static const String studentMissionCatalogCollection =
      'student_mission_catalog';

  // 🔱 EXTRACTION REALM (Document 50J)
  static const String semanticUnitCollection = 'semantic_units';
  static const String atomicFactCollection = 'atomic_facts';
  static const String factRelationshipCollection = 'fact_relationships';
  static const String transformationLineageCollection =
      'transformation_lineage';
  static const String verifiedFactCollection = 'verified_facts';
  static const String factIntelligenceCollection = 'fact_intelligence';
  static const String verificationCandidateCollection =
      'verification_candidates';

  // ===================================================
  // AI WORKER OPS 🔱
  // ===================================================

  static Stream<List<Map<String, dynamic>>> streamAIQueue() {
    return _firestore
        .collection(aiQueueCollection)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => doc.data()).toList());
  }

  // ===================================================
  // NOTIFICATION CANDIDATES 🔱
  // ===================================================

  static Future<void> saveNotificationCandidate(
      NotificationCandidate candidate) async {
    await _firestore
        .collection(notificationCandidateCollection)
        .doc(candidate.id)
        .set(candidate.toMap(), SetOptions(merge: true));
  }

  static Stream<List<NotificationCandidate>> streamNotificationCandidates() {
    return _firestore
        .collection(notificationCandidateCollection)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => NotificationCandidate.fromMap(doc.data()))
            .toList());
  }

  // ===================================================
  // SENTINEL INTELLIGENCE 🔱
  // ===================================================

  static Future<void> saveSentinelDraft(SentinelDraft draft) async {
    await _firestore
        .collection(sentinelDraftCollection)
        .doc(draft.id)
        .set(draft.toMap());
  }

  static Stream<List<SentinelDraft>> streamSentinelDrafts() {
    return _firestore.collection(sentinelDraftCollection).snapshots().map(
        (snap) =>
            snap.docs.map((doc) => SentinelDraft.fromMap(doc.data())).toList());
  }

  static Stream<List<Map<String, dynamic>>> streamCollection(
      String collection) {
    return _firestore
        .collection(collection)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => doc.data()).toList());
  }

  static Stream<List<Map<String, dynamic>>> streamStudentMissionCatalog() {
    return _firestore
        .collection(studentMissionCatalogCollection)
        .where('cardVisible', isEqualTo: true)
        .where('userPanelVisible', isEqualTo: true)
        .where('archived', isEqualTo: false)
        .snapshots()
        .map((snap) =>
            snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // ===================================================
  // QUERY OPS 🔱
  // ===================================================
  static Future<List<Map<String, dynamic>>> queryCollection(
    String collection, {
    Map<String, dynamic>? where,
  }) async {
    Query query = _firestore.collection(collection);
    if (where != null) {
      where.forEach((key, value) {
        query = query.where(key, isEqualTo: value);
      });
    }
    final snapshot = await query.get();
    return snapshot.docs
        .map((doc) => doc.data() as Map<String, dynamic>)
        .toList();
  }

  // ===================================================
  // BATCH UPLOAD HARDENING 🔱
  // ===================================================

  /// Performs an idempotent, atomic batch upload.
  /// Implements Duplicate Detection and All-or-Nothing Commit.
  static Future<void> uploadBatch(
      String collection, List<Map<String, dynamic>> items) async {
    final batch = _firestore.batch();
    final colRef = _firestore.collection(collection);

    for (var item in items) {
      final id = item['id'];
      if (id == null || id.toString().isEmpty) continue;

      // 🔱 Idempotency: Overwrite existing doc with same ID to prevent duplication
      final docRef = colRef.doc(id);
      batch.set(docRef, item, SetOptions(merge: true));
    }

    try {
      await batch.commit();
      debugPrint(
          '🔱 BATCH COMMIT SUCCESS: $collection (${items.length} items)');
    } catch (e) {
      debugPrint('🔱 BATCH COMMIT FAILED: $e');
      rethrow; // Ensure upper layers can handle rollback logic
    }
  }

  // ===================================================
  // UPLOAD NODE 🔱
  // ===================================================
  static Future<void> uploadNode(MicroTopicNode node) async {
    await _firestore.collection(nodeCollection).doc(node.id).set(node.toMap());
  }

  // ===================================================
  // UPLOAD RECRUITMENT 🔱
  // ===================================================
  static Future<void> uploadRecruitment(Recruitment recruitment) async {
    await _firestore
        .collection(recruitmentCollection)
        .doc(recruitment.id)
        .set(recruitment.toMap());
  }

  // ===================================================
  // STATE REGISTRY 🔱
  // ===================================================
  static Future<void> registerPublishedState(String state) async {
    await _firestore
        .collection(stateRegistryCollection)
        .doc(state.toLowerCase())
        .set({'name': state, 'updatedAt': FieldValue.serverTimestamp()});
  }

  static void addStateRegistryToBatch(WriteBatch batch, String state) {
    final ref =
        _firestore.collection(stateRegistryCollection).doc(state.toLowerCase());
    batch.set(ref, {'name': state, 'updatedAt': FieldValue.serverTimestamp()});
  }

  static Future<List<String>> fetchPublishedStates() async {
    final snapshot = await _firestore.collection(stateRegistryCollection).get();
    return snapshot.docs.map((doc) => doc.data()['name'] as String).toList();
  }

  // ===================================================
  // UPLOAD VARIANT 🔱
  // ===================================================
  static Future<void> uploadVariant(MissionVariant variant) async {
    await _firestore
        .collection(variantCollection)
        .doc(variant.id)
        .set(variant.toMap());
  }

  // ===================================================
  // PROTOCOL STATE 🔱
  // ===================================================
  static Future<void> saveProtocolState(
      String uid, CrucibleProtocolState state) async {
    await _firestore
        .collection('users')
        .doc(uid)
        .collection(protocolCollection)
        .doc(state.recruitmentId)
        .set(state.toMap());
  }

  static Stream<CrucibleProtocolState?> streamProtocolState(
      String uid, String recruitmentId) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection(protocolCollection)
        .doc(recruitmentId)
        .snapshots()
        .map((snap) =>
            snap.exists ? CrucibleProtocolState.fromMap(snap.data()!) : null);
  }

  // ===================================================
  // SCHEDULES 🔱
  // ===================================================
  static Future<void> saveSchedule(CrucibleSchedule schedule) async {
    await _firestore
        .collection(scheduleCollection)
        .doc(schedule.id)
        .set(schedule.toMap());
  }

  static Stream<List<CrucibleSchedule>> streamSchedules(String recruitmentId) {
    return _firestore
        .collection(scheduleCollection)
        .where('recruitmentId', isEqualTo: recruitmentId)
        .orderBy('scheduleIndex')
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => CrucibleSchedule.fromMap(doc.data()))
            .toList());
  }

  // ===================================================
  // UPLOAD BLUEPRINT 🔱
  // ===================================================
  static Future<void> uploadBlueprint(ExamBlueprint blueprint) async {
    await _firestore
        .collection(blueprintCollection)
        .doc(blueprint.id)
        .set(blueprint.toMap());
  }

  // ===================================================
  // FETCH RECRUITMENTS 🔱
  // ===================================================
  static Future<List<Recruitment>> fetchRecruitments() async {
    final snapshot = await _firestore.collection(recruitmentCollection).get();
    return snapshot.docs.map((doc) => Recruitment.fromMap(doc.data())).toList();
  }

  static Future<List<Recruitment>> fetchPublishedRecruitments() async {
    final snapshot = await _firestore
        .collection(recruitmentCollection)
        .where('status', isEqualTo: 'published')
        .get();
    return snapshot.docs.map((doc) => Recruitment.fromMap(doc.data())).toList();
  }

  static Stream<List<Recruitment>> streamPublishedRecruitments() {
    return _firestore
        .collection(recruitmentCollection)
        .where('status', isEqualTo: 'published')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Recruitment.fromMap(doc.data()))
          .toList();
    });
  }

  static const List<String> _missionVariablePackKeys = [
    'vacancy_variables',
    'eligibility_variables',
    'paper_variables',
    'category_variables',
    'subject_variables',
    'department_variables',
    'fee_variables',
    'date_variables',
    'relaxation_variables',
    'link_variables',
    'amendment_variables',
  ];

  static Map<String, dynamic> _extractMissionVariables(
    Map<String, dynamic> data,
  ) {
    final variables = <String, dynamic>{};

    void mergeMap(dynamic value) {
      if (value is Map) {
        value.forEach((key, entry) {
          if (entry != null) variables[key.toString()] = entry;
        });
      }
    }

    mergeMap(data['missionVariables']);
    mergeMap(data['mission_variables']);
    mergeMap(data['variablePacks']);
    mergeMap(data['variable_packs']);
    mergeMap(data['variables']);

    for (final key in _missionVariablePackKeys) {
      final value = data[key];
      if (value is List && value.isNotEmpty) variables[key] = value;
      if (value is Map && value.isNotEmpty) variables[key] = value;
    }

    final mediumPolicy = data['mediumPolicy'];
    if (mediumPolicy != null && mediumPolicy.toString().trim().isNotEmpty) {
      variables['mediumPolicy'] = mediumPolicy;
    }
    final supportedMediums = data['supportedMediums'];
    if (supportedMediums is List && supportedMediums.isNotEmpty) {
      variables['supportedMediums'] = supportedMediums;
    }
    final defaultMedium = data['defaultMedium'];
    if (defaultMedium != null && defaultMedium.toString().trim().isNotEmpty) {
      variables['defaultMedium'] = defaultMedium;
    }

    return variables;
  }

  static String _catalogString(Map<String, dynamic> data, String key) {
    final value = data[key];
    return value == null ? '' : value.toString().trim();
  }

  static String _catalogSourcePath(String docId, Map<String, dynamic> data) {
    final direct = _catalogString(data, 'sourcePath');
    if (direct.isNotEmpty) return direct;
    final source = data['source'];
    if (source is Map) {
      final missionRealmPath = source['missionRealmPath'];
      if (missionRealmPath != null &&
          missionRealmPath.toString().trim().isNotEmpty) {
        return missionRealmPath.toString().trim();
      }
    }
    return 'mission_realms/$docId';
  }

  static bool _hasCanonicalMissionLineage(
      String docId, Map<String, dynamic> data) {
    final sourcePath = _catalogSourcePath(docId, data);
    final directSourceMissionId = _catalogString(data, 'sourceMissionId');
    final sourceMissionId = directSourceMissionId.isNotEmpty
        ? directSourceMissionId
        : sourcePath.startsWith('mission_realms/')
            ? sourcePath.substring('mission_realms/'.length).split('/').first
            : '';
    final sourceType = _catalogString(data, 'sourceType').isNotEmpty
        ? _catalogString(data, 'sourceType')
        : sourcePath.startsWith('mission_realms/')
            ? 'mission_realms'
            : '';

    return sourceType == 'mission_realms' &&
        sourcePath == 'mission_realms/$sourceMissionId' &&
        sourceMissionId.isNotEmpty &&
        sourceMissionId == docId;
  }

  static Recruitment _studentCatalogDocToRecruitment(
      String docId, Map<String, dynamic> data) {
    final title =
        (data['displayName'] ?? data['title'] ?? data['name'] ?? docId)
            .toString();
    final sourcePath = _catalogSourcePath(docId, data);
    final directSourceMissionId = _catalogString(data, 'sourceMissionId');
    final sourceMissionId = directSourceMissionId.isNotEmpty
        ? directSourceMissionId
        : sourcePath.startsWith('mission_realms/')
            ? sourcePath.substring('mission_realms/'.length).split('/').first
            : docId;
    final sourceType = _catalogString(data, 'sourceType').isNotEmpty
        ? _catalogString(data, 'sourceType')
        : 'mission_realms';
    final sourceMissionVersion =
        _catalogString(data, 'sourceMissionVersion').isNotEmpty
            ? _catalogString(data, 'sourceMissionVersion')
            : _catalogString(data, 'canonicalKnowledgeVersion').isNotEmpty
                ? _catalogString(data, 'canonicalKnowledgeVersion')
                : _catalogString(data, 'version');
    final normalizedState = (data['state'] ?? data['examState'] ?? 'Central')
        .toString()
        .trim();
    final missionId = sourceMissionId;
    final yearValue = data['year'] ?? data['examYear'];
    final year = yearValue is int
        ? yearValue
        : int.tryParse(yearValue?.toString() ?? '') ?? 0;
    final blueprintValue = (data['examBlueprintId'] ?? '').toString();
    final publicationState =
        _catalogString(data, 'studentPublicationState').isNotEmpty
            ? _catalogString(data, 'studentPublicationState')
            : _catalogString(data, 'catalogStatus').isNotEmpty
                ? _catalogString(data, 'catalogStatus')
                : _catalogString(data, 'status');

    return Recruitment(
      id: docId,
      recruitmentGroupId: 'student_mission_catalog',
      boardId: (data['boardId'] ?? '').toString(),
      examId: missionId,
      examBlueprintId:
          blueprintValue.isEmpty ? '${missionId}_blueprint' : blueprintValue,
      title: title,
      titleHindi: (data['titleHindi'] ?? title).toString(),
      year: year,
      state: normalizedState.isEmpty ? 'Central' : normalizedState,
      examCategory: (data['examCategory'] ??
              data['exam_category'] ??
              data['missionType'] ??
              data['category'] ??
              data['type'] ??
              'category_pending')
          .toString(),
      status: (data['status'] ?? 'CATALOG_VISIBLE').toString(),
      examDifficulty: 0.6,
      variantCode: (data['variantCode'] ?? missionId).toString(),
      missionVariables: _extractMissionVariables(data),
      version: 'student_mission_catalog',
      sourceMissionId: sourceMissionId,
      sourceMissionVersion: sourceMissionVersion,
      sourcePath: sourcePath,
      sourceType: sourceType,
      studentPublicationState: publicationState,
    );
  }

  static Stream<List<Recruitment>> streamStudentMissionCatalogRecruitments() {
    return _firestore
        .collection(studentMissionCatalogCollection)
        .where('cardVisible', isEqualTo: true)
        .where('userPanelVisible', isEqualTo: true)
        .where('archived', isEqualTo: false)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .where((doc) => _hasCanonicalMissionLineage(doc.id, doc.data()))
          .map((doc) => _studentCatalogDocToRecruitment(doc.id, doc.data()))
          .toList();
    });
  }

  static Future<Recruitment?> fetchRecruitment(String id) async {
    final doc =
        await _firestore.collection(recruitmentCollection).doc(id).get();
    if (!doc.exists) return null;
    return Recruitment.fromMap(doc.data()!);
  }

  // ===================================================
  // LIVE RECRUITMENT STREAM 🔱
  // ===================================================
  static Stream<List<Recruitment>> streamRecruitments() {
    return _firestore
        .collection(recruitmentCollection)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Recruitment.fromMap(doc.data()))
          .toList();
    });
  }

  // ===================================================
  // FETCH BLUEPRINT 🔱
  // ===================================================
  static Future<ExamBlueprint?> fetchBlueprint(String blueprintId) async {
    final doc =
        await _firestore.collection(blueprintCollection).doc(blueprintId).get();
    if (!doc.exists) return null;
    return ExamBlueprint.fromMap(doc.data()!);
  }

  // ===================================================
  // LIVE BLUEPRINT STREAM 🔱
  // ===================================================
  static Stream<List<ExamBlueprint>> streamBlueprints() {
    return _firestore
        .collection(blueprintCollection)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => ExamBlueprint.fromMap(doc.data()))
          .toList();
    });
  }

  // ===================================================
  // FETCH NODES 🔱
  // ===================================================
  static Future<List<MicroTopicNode>> fetchNodes() async {
    final snapshot = await _firestore.collection(nodeCollection).get();
    return snapshot.docs
        .map((doc) => MicroTopicNode.fromMap(doc.data()))
        .toList();
  }

  static Future<List<MicroTopicNode>> fetchNodesByExam(String examId) async {
    final snapshot = await _firestore
        .collection(nodeCollection)
        .where('examId', isEqualTo: examId)
        .get();
    return snapshot.docs
        .map((doc) => MicroTopicNode.fromMap(doc.data()))
        .toList();
  }

  // ===================================================
  // NOTIFICATIONS 🔱
  // ===================================================
  static Future<void> saveNotification(
      String uid, NotificationEvent event) async {
    await _firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .doc(event.id)
        .set(event.toMap());
  }

  static Stream<List<NotificationEvent>> streamNotifications(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((e) => NotificationEvent.fromMap(e.data()))
            .toList());
  }

  // ===================================================
  // LIVE NODE STREAM 🔱
  // ===================================================
  static Stream<List<MicroTopicNode>> streamNodes() {
    return _firestore.collection(nodeCollection).snapshots().map((snapshot) {
      return snapshot.docs
          .map((doc) => MicroTopicNode.fromMap(doc.data()))
          .toList();
    });
  }

  /// 🔱 Phase 6.1: Scoped Node Streaming
  static Stream<List<MicroTopicNode>> streamNodesByExam(String examId) {
    return _firestore
        .collection(nodeCollection)
        .where('examId', isEqualTo: examId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => MicroTopicNode.fromMap(doc.data()))
          .toList();
    });
  }

  // ===================================================
  // STREAM PROGRESS 🔱
  // ===================================================
  static Stream<List<Map<String, dynamic>>> streamProgress(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection('progress')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((e) => e.data()).toList());
  }

  // ===================================================
  // SAVE USER PROGRESS 🔱
  // ===================================================
  static Future<void> saveProgress({
    required String uid,
    required String nodeId,
    required Map<String, dynamic> data,
  }) async {
    await _firestore
        .collection('users')
        .doc(uid)
        .collection('progress')
        .doc(nodeId)
        .set(data, SetOptions(merge: true));
  }

  // ===================================================
  // LOAD USER PROGRESS 🔱
  // ===================================================
  static Future<List<Map<String, dynamic>>> loadProgress(String uid) async {
    final snapshot = await _firestore
        .collection('users')
        .doc(uid)
        .collection('progress')
        .get();
    return snapshot.docs.map((e) => e.data()).toList();
  }

  // ===================================================
  // SAVE USER PROFILE 🔱
  // ===================================================
  static Future<void> saveUserProfile({
    required String uid,
    required Map<String, dynamic> profileData,
  }) async {
    // Personal profile setup must not write privileged role fields from client.
    await _firestore
        .collection('users')
        .doc(uid)
        .set(profileData, SetOptions(merge: true));
  }

  /// 🔱 Fetch specific user profile with role awareness
  static Future<UserProfile?> fetchUserProfile(String uid) async {
    // 🔱 Sovereignty Law: Check Dedicated Founder collection first (Phase 6 Recommendation)
    final founderDoc = await _firestore.collection('founders').doc(uid).get();
    if (founderDoc.exists) {
      final data = founderDoc.data()!;
      data['role'] = 'founder';
      data['tier'] = SubscriptionTier.elite.name;
      return UserProfile.fromMap(data);
    }

    final doc = await _firestore.collection('users').doc(uid).get();
    if (!doc.exists) {
      // 🔱 If matching Founder UID but no doc, create a virtual sovereign profile
      if (uid == FounderIdentity.founderUid) {
        return UserProfile(
          uid: uid,
          name: 'Founder',
          email: 'founder.rcofficial@gmail.com',
          tier: SubscriptionTier.elite,
        );
      }
      return null;
    }

    final data = doc.data()!;

    // 🔱 Hardened Role Injection
    if (uid == FounderIdentity.founderUid) {
      data['role'] = 'founder';
      data['tier'] = SubscriptionTier.elite.name;
      data['admin'] = true;
      data['founder'] = true;
      data['accessLevel'] = 9;
    }

    return UserProfile.fromMap(data);
  }

  // ===================================================
  // ATOMIC MASTERY 🔱
  // ===================================================
  static Future<void> saveAtomicMastery(
      String uid, AtomicMasteryState state) async {
    await _firestore
        .collection('users')
        .doc(uid)
        .collection(atomicMasteryCollection)
        .doc(state.atomicTopicId)
        .set(state.toMap(), SetOptions(merge: true));
  }

  static Stream<List<AtomicMasteryState>> streamAtomicMastery(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection(atomicMasteryCollection)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => AtomicMasteryState.fromMap(doc.data()))
            .toList());
  }

  // ===================================================
  // ATOMIC COVERAGE 🔱
  // ===================================================
  static Future<void> saveAtomicCoverage(
      String uid, AtomicCoverageState state) async {
    await _firestore
        .collection('users')
        .doc(uid)
        .collection(atomicCoverageCollection)
        .doc(state.atomicTopicId)
        .set(state.toMap(), SetOptions(merge: true));
  }

  static Stream<List<AtomicCoverageState>> streamAtomicCoverage(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection(atomicCoverageCollection)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => AtomicCoverageState.fromMap(doc.data()))
            .toList());
  }

  // ===================================================
  // ATOMIC RISK 🔱
  // ===================================================
  static Future<void> saveAtomicRisk(String uid, AtomicRiskState state) async {
    await _firestore
        .collection('users')
        .doc(uid)
        .collection(atomicRiskCollection)
        .doc(state.atomicTopicId)
        .set(state.toMap(), SetOptions(merge: true));
  }

  static Stream<List<AtomicRiskState>> streamAtomicRisk(String uid) {
    return _firestore
        .collection('users')
        .doc(uid)
        .collection(atomicRiskCollection)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => AtomicRiskState.fromMap(doc.data()))
            .toList());
  }
}
