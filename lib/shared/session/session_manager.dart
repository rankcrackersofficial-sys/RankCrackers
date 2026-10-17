import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../../data/india_states.dart';

class MissionAccessSnapshot {
  final bool snapshotReady;
  final Set<String> missionIdsExact;
  final Map<String, dynamic> missionById;
  final DateTime capturedAt;
  final String sourceState;
  final String? errorState;

  const MissionAccessSnapshot({
    required this.snapshotReady,
    required this.missionIdsExact,
    required this.missionById,
    required this.capturedAt,
    required this.sourceState,
    this.errorState,
  });

  static MissionAccessSnapshot uninitialized() => MissionAccessSnapshot(
    snapshotReady: false,
    missionIdsExact: const {},
    missionById: const {},
    capturedAt: DateTime.fromMillisecondsSinceEpoch(0),
    sourceState: 'UNINITIALIZED',
  );

  static MissionAccessSnapshot fromRecruitments(
    Iterable<dynamic> recruitments, {
    String sourceState = 'FIREBASE_STUDENT_CATALOG',
  }) {
    final ids = <String>{};
    final map = <String, dynamic>{};
    for (final r in recruitments) {
      final examId = (r is Map ? r['examId'] ?? r['id'] : (r.examId ?? r.id)).toString().trim();
      if (examId.isNotEmpty) {
        ids.add(examId);
        map[examId] = r;
      }
    }
    return MissionAccessSnapshot(
      snapshotReady: true,
      missionIdsExact: ids,
      missionById: map,
      capturedAt: DateTime.now(),
      sourceState: sourceState,
    );
  }

  static MissionAccessSnapshot failed(String error) => MissionAccessSnapshot(
    snapshotReady: false,
    missionIdsExact: const {},
    missionById: const {},
    capturedAt: DateTime.now(),
    sourceState: 'FAILED',
    errorState: error,
  );
}

class SessionManager {
  static SharedPreferences? _prefs;
  static bool _profileSyncRunning = false;
  static bool _examSyncRunning = false;
  static bool disableFirebaseForTest = false;

  /// Dynamic Mission Access Snapshot (Section 4 & 5)
  static MissionAccessSnapshot _currentSnapshot = MissionAccessSnapshot.uninitialized();
  static MissionAccessSnapshot get currentSnapshot => _currentSnapshot;
  static bool get accessSnapshotReady => _currentSnapshot.snapshotReady;

  static void updateAccessSnapshot(MissionAccessSnapshot snapshot) {
    _currentSnapshot = snapshot;
    if (snapshot.snapshotReady && snapshot.missionIdsExact.isNotEmpty) {
      _prefs?.setStringList('cached_accessible_mission_ids', snapshot.missionIdsExact.toList());
    }
  }

  /// BOOTSTRAP INITIALIZATION
  /// Called in main.dart to ensure SharedPreferences is ready for sync routing.
  static Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    final cached = _prefs?.getStringList('cached_accessible_mission_ids');
    if (cached != null && cached.isNotEmpty) {
      _currentSnapshot = MissionAccessSnapshot(
        snapshotReady: true,
        missionIdsExact: cached.toSet(),
        missionById: const {},
        capturedAt: DateTime.now(),
        sourceState: 'LOCAL_CACHE',
      );
    } else {
      _currentSnapshot = MissionAccessSnapshot.uninitialized();
    }
    debugPrint('SESSION: Core initialized. (${_currentSnapshot.missionIdsExact.length} accessible missions loaded, snapshotReady=${_currentSnapshot.snapshotReady})');
  }

  static Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // =====================================================
  // LOGIN STATUS
  // =====================================================

  static Future<void> completeLogin() async {
    final prefs = await _getPrefs();
    await prefs.setBool('is_logged_in', true);
  }

  static Future<void> saveLoginSession({
    required String token,
  }) async {
    final prefs = await _getPrefs();
    await prefs.setBool('is_logged_in', true);
    await prefs.setString('auth_token', token);
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await _getPrefs();
    return prefs.getBool('is_logged_in') ?? false;
  }

  static bool isLoggedInSync() {
    if (_prefs == null) return false;
    return _prefs!.getBool('is_logged_in') ?? false;
  }

  static Future<void> logout() async {
    final prefs = await _getPrefs();
    await prefs.clear();
    _currentSnapshot = MissionAccessSnapshot.uninitialized();
  }

  // =====================================================
  // PROFILE STATUS
  // =====================================================

  static Future<void> saveConsent(bool accepted) async {
    final prefs = await _getPrefs();
    await prefs.setBool('consent_accepted', accepted);
  }

  static bool consentAcceptedSync() {
    if (_prefs == null) return false;
    return _prefs!.getBool('consent_accepted') ?? false;
  }

  /// Complete profile with explicit mandatory consent (Section 6: IMPLICIT_TRUE_CONSENT_DEFAULT_COUNT = 0)
  static Future<void> completeProfile({
    required String studentName,
    String? studentCity,
    String? studentState,
    String? studentStateCode,
    required bool consentAccepted,
  }) async {
    final prefs = await _getPrefs();
    await prefs.setBool('profile_completed', true);
    await prefs.setBool('consent_accepted', consentAccepted);
    await prefs.setString('student_name', studentName);
    if (studentCity != null && studentCity.isNotEmpty) {
      await prefs.setString('student_city', studentCity);
    }
    if (studentState != null && studentState.isNotEmpty) {
      await prefs.setString('user_state', studentState);
      final code = studentStateCode ?? IndiaStates.getStateCode(studentState);
      if (code != null) {
        await prefs.setString('user_state_code', code);
      }
    }
  }

  static Future<void> saveStudentState(String state, {String? stateCode}) async {
    final prefs = await _getPrefs();
    await prefs.setString('user_state', state);
    final code = stateCode ?? IndiaStates.getStateCode(state);
    if (code != null) {
      await prefs.setString('user_state_code', code);
    }
  }

  static String? getUserStateSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('user_state');
  }

  static String? getUserStateCodeSync() {
    if (_prefs == null) return null;
    final code = _prefs!.getString('user_state_code');
    if (code != null && code.isNotEmpty) return code;
    final state = _prefs!.getString('user_state');
    return IndiaStates.getStateCode(state);
  }

  static Future<String?> getUserState() async {
    final prefs = await _getPrefs();
    return prefs.getString('user_state');
  }

  static Future<String?> getUserStateCode() async {
    final prefs = await _getPrefs();
    final code = prefs.getString('user_state_code');
    if (code != null && code.isNotEmpty) return code;
    final state = prefs.getString('user_state');
    return IndiaStates.getStateCode(state);
  }

  /// Synchronous check for Router
  static bool profileCompletedSync() {
    if (_prefs == null) return false;
    final bool profileDone = _prefs!.getBool('profile_completed') ?? false;
    final bool consentDone = _prefs!.getBool('consent_accepted') ?? false;
    final name = (_prefs!.getString('student_name') ?? '').trim();
    final rawMobile = _prefs!.getString('student_mobile') ?? '';
    final digits = rawMobile.replaceAll(RegExp(r'\D'), '');
    final normMobile = (digits.length == 12 && digits.startsWith('91'))
        ? digits.substring(2)
        : (digits.length == 11 && digits.startsWith('0'))
            ? digits.substring(1)
            : digits;
    final state = (_prefs!.getString('user_state') ?? '').trim();
    final isValidState = IndiaStates.statesAndUTs.any(
      (s) => s.toLowerCase() == state.toLowerCase(),
    );

    // Profile is complete ONLY when all 4 mandatory criteria are satisfied and confirmed:
    return profileDone && consentDone && name.isNotEmpty && normMobile.length == 10 && isValidState;
  }

  static Future<bool> isProfileCompleted() async {
    final prefs = await _getPrefs();
    
    // Local-First Authority (Level-12.1 Hardening)
    final localFlag = profileCompletedSync();

    // Background Cloud Sync with Guard
    _syncProfileStatusInBackground(prefs);

    return localFlag;
  }

  /// Authoritative server-side profile sync from Firestore
  static Future<bool> syncProfileFromFirestore(User user) async {
    if (disableFirebaseForTest) return profileCompletedSync();
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get(const GetOptions(source: Source.server))
          .timeout(const Duration(seconds: 3));

      final data = doc.data();
      if (doc.exists && data != null) {
        final name = (data['name'] ?? user.displayName ?? '').toString().trim();
        final rawMobile = (data['mobile'] ?? '').toString().trim();
        final digits = rawMobile.replaceAll(RegExp(r'\D'), '');
        final normMobile = (digits.length == 12 && digits.startsWith('91'))
            ? digits.substring(2)
            : (digits.length == 11 && digits.startsWith('0'))
                ? digits.substring(1)
                : digits;
        final stateStr = (data['state'] ?? data['stateName'] ?? '').toString().trim();
        final stateCode = (data['stateCode'] ?? IndiaStates.getStateCode(stateStr) ?? '').toString().trim();
        final city = (data['city'] ?? '').toString().trim();
        final email = (data['email'] ?? user.email ?? '').toString().trim();
        final photoUrl = (data['photoUrl'] ?? user.photoURL ?? '').toString().trim();
        final rawExam = (data['selectedExamId'] ?? data['selectedExam'] ?? data['examId'] ?? '').toString().trim();
        final examName = (data['selectedExamName'] ?? data['examName'] ?? '').toString().trim();

        // Strict Nested Consent Law: MUST have consent.termsAccepted == true
        final consentMap = data['consent'];
        final bool hasConsent = (consentMap is Map && consentMap['termsAccepted'] == true);

        final bool isValidState = IndiaStates.statesAndUTs.any(
          (s) => s.toLowerCase() == stateStr.toLowerCase(),
        );

        final bool isComplete = name.isNotEmpty &&
            normMobile.length == 10 &&
            isValidState &&
            hasConsent;

        final prefs = await _getPrefs();
        await prefs.setString('firebase_uid', user.uid);
        await prefs.setString('student_email', email);
        if (name.isNotEmpty) await prefs.setString('student_name', name);
        if (city.isNotEmpty) await prefs.setString('student_city', city);
        if (normMobile.isNotEmpty) await prefs.setString('student_mobile', normMobile);
        if (stateStr.isNotEmpty) await prefs.setString('user_state', stateStr);
        if (stateCode.isNotEmpty) await prefs.setString('user_state_code', stateCode);
        if (photoUrl.isNotEmpty) await prefs.setString('student_photo', photoUrl);
        
        final canonicalExamId = resolveCanonicalMissionId(rawExam) ?? (rawExam.isNotEmpty ? rawExam : null);
        if (canonicalExamId != null) {
          await prefs.setString('selected_exam_id', canonicalExamId);
          await prefs.setString('selected_exam', canonicalExamId);
          if (examName.isNotEmpty) {
            await prefs.setString('selected_exam_name', examName);
          }
        }

        if (isComplete) {
          await prefs.setBool('profile_completed', true);
          await prefs.setBool('consent_accepted', true);
          await prefs.setBool('is_logged_in', true);
          return true;
        } else {
          await prefs.setBool('profile_completed', false);
          await prefs.setBool('consent_accepted', false);
          return false;
        }
      }
    } catch (e) {
      debugPrint('SESSION SYNC: Profile fetch error: $e');
    }
    return profileCompletedSync();
  }

  static void _syncProfileStatusInBackground(SharedPreferences prefs) async {
    if (disableFirebaseForTest) return;
    if (_profileSyncRunning) return;
    _profileSyncRunning = true;

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        await syncProfileFromFirestore(currentUser);
      }
    } catch (e) {
      debugPrint('SESSION SYNC: Profile background fail: $e');
    } finally {
      _profileSyncRunning = false;
    }
  }

  // =====================================================
  // STUDENT INFO
  // =====================================================

  static Future<String?> getStudentName() async {
    final prefs = await _getPrefs();
    return prefs.getString('student_name');
  }

  static Future<void> saveStudentName(String name) async {
    final prefs = await _getPrefs();
    await prefs.setString('student_name', name);
  }

  static Future<String?> getStudentCity() async {
    final prefs = await _getPrefs();
    return prefs.getString('student_city');
  }

  static Future<void> saveStudentPhoto(String photoUrl) async {
    final prefs = await _getPrefs();
    await prefs.setString('student_photo', photoUrl);
  }

  static Future<String?> getStudentPhoto() async {
    final prefs = await _getPrefs();
    return prefs.getString('student_photo');
  }

  // =====================================================
  // MOBILE LOGIN
  // =====================================================

  static Future<void> saveStudentMobile(String mobile) async {
    final prefs = await _getPrefs();
    await prefs.setString('student_mobile', mobile);
  }

  static Future<String?> getStudentMobile() async {
    final prefs = await _getPrefs();
    return prefs.getString('student_mobile');
  }

  // =====================================================
  // EMAIL LOGIN
  // =====================================================

  static Future<void> saveStudentEmail(String email) async {
    final prefs = await _getPrefs();
    await prefs.setString('student_email', email);
  }

  static Future<String?> getStudentEmail() async {
    final prefs = await _getPrefs();
    return prefs.getString('student_email');
  }

  // =====================================================
  // FIREBASE IDENTITY
  // =====================================================

  static Future<void> saveFirebaseIdentity({
    required String uid,
    required String email,
  }) async {
    final prefs = await _getPrefs();
    await prefs.setString('firebase_uid', uid);
    await prefs.setString('student_email', email);
  }

  static Future<String?> getFirebaseUid() async {
    final prefs = await _getPrefs();
    return prefs.getString('firebase_uid');
  }

  static String? getFirebaseUidSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('firebase_uid');
  }

  static String? getStudentEmailSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('student_email');
  }

  // =====================================================
  // EXAM FLOW & DYNAMIC CANONICAL MISSION IDENTITY
  // =====================================================

  /// Legacy display titles mapped to exact canonical mission IDs for alias lookup only.
  /// Section 2 & 3: Legacy aliases map to permanent canonical IDs; they do NOT grant accessibility.
  static final Map<String, String> _legacyTitleToCanonicalId = {
    'jee main': 'jee_main',
    'jee main 2026': 'jee_main',
    'neet ug': 'neet_ug',
    'neet ug 2027': 'neet_(ug)-2027',
    'upsc civil services – prelims': 'upsc_cse_prelims',
    'upsc civil services – prelims 2026': 'upsc_cse_prelims',
    'upsc cse prelims': 'upsc_cse_prelims',
    'upsc cse': 'upsc_cse_prelims',
    'upsc cse 2026': 'upsc_cse_prelims',
    'ssc cgl': 'ssc_cgl',
    'ssc cgl 2026': 'ssc_cgl',
    'ssc je': 'ssc_je',
    'ssc je 2026': 'ssc_je',
    'ssc selection post': 'ssc_selection_post',
    'ssc selection post 2026': 'ssc_selection_post',
    'ssc chsl': 'ssc_chsl',
    'ssc chsl 2026': 'ssc_chsl',
    'ssc stenographer': 'ssc_stenographer',
    'ssc stenographer 2026': 'ssc_stenographer',
    'ssc junior hindi translator': 'ssc_hindi_translators',
    'ssc junior hindi translator 2026': 'ssc_hindi_translators',
    'ssc hindi translators': 'ssc_hindi_translators',
    'ssc mts & havaldar': 'ssc_mts_havaldar',
    'ssc mts & havaldar 2026': 'ssc_mts_havaldar',
    'ssc mts havaldar': 'ssc_mts_havaldar',
    'ssc cpo': 'ssc_cpo',
    'ssc cpo 2026': 'ssc_cpo',
    'ssc gd': 'ssc_gd',
    'ssc gd constable': 'ssc_gd',
    'ssc gd constable 2026': 'ssc_gd',
    'rpsc 1st grade 2026': 'RPSC_FIRST_GRADE2026_2026_1782713222215',
    'rpsc first grade 2026': 'RPSC_FIRST_GRADE2026_2026_1782713222215',
    'rpsc ras prelims': 'rpsc_ras_prelims',
    'rpsc ras': 'rpsc_ras_prelims',
    'rpsc ras 2026': 'rpsc_ras_prelims',
    'uppsc pcs prelims': 'uppsc_pcs_prelims',
    'uppsc pcs': 'uppsc_pcs_prelims',
    'uppsc pcs 2026': 'uppsc_pcs_prelims',
    'uppsc combined state exam 2026': 'uppsc_pcs_prelims',
  };

  /// Clears in-memory accessible missions (for tests)
  static void clearAccessibleMissions() {
    _currentSnapshot = MissionAccessSnapshot.uninitialized();
    _prefs?.remove('cached_accessible_mission_ids');
  }

  /// Number of currently registered accessible missions
  static int get accessibleMissionsCount => _currentSnapshot.missionIdsExact.length;

  /// Always 0 by architectural law (Section 2 & 15: HARDCODED_RUNTIME_MISSION_AUTHORITY_COUNT = 0)
  static const int runtimeHardcodedMissionCatalogCount = 0;

  /// Registers valid accessible mission IDs from published student catalog.
  /// Section 3: Mission IDs are case-sensitive opaque strings — NEVER lowercased or mutated!
  static void registerAccessibleMissions(Iterable<String> ids, {String source = 'TEST_FIXTURE'}) {
    final set = Set<String>.from(_currentSnapshot.missionIdsExact);
    for (final id in ids) {
      final trimmed = id.trim();
      if (trimmed.isNotEmpty) {
        set.add(trimmed);
      }
    }
    _currentSnapshot = MissionAccessSnapshot(
      snapshotReady: true,
      missionIdsExact: set,
      missionById: _currentSnapshot.missionById,
      capturedAt: DateTime.now(),
      sourceState: source,
    );
    _prefs?.setStringList('cached_accessible_mission_ids', set.toList());
  }

  /// Backward-compatible alias for registering published mission catalog IDs
  static void registerValidMissionIds(Iterable<String> ids) {
    registerAccessibleMissions(ids);
  }

  /// Resolves raw mission ID or legacy title to canonical mission ID
  /// Section 3: Preserves EXACT case for canonical IDs.
  static String? resolveCanonicalMissionId(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    final trimmed = raw.trim();
    if (trimmed == 'unresolved' ||
        trimmed == 'none' ||
        trimmed == 'null' ||
        trimmed == 'invalid' ||
        trimmed.toLowerCase() == 'unresolved mission') {
      return null;
    }
    // Snapshot must be ready to resolve against authoritative catalog
    if (!_currentSnapshot.snapshotReady) return null;

    // 1. Direct exact case match in accessible catalog snapshot
    if (_currentSnapshot.missionIdsExact.contains(trimmed)) return trimmed;

    // 2. Legacy display title resolution (only legacy titles are normalized for alias lookup)
    final titleKey = trimmed.toLowerCase();
    if (_legacyTitleToCanonicalId.containsKey(titleKey)) {
      final mappedId = _legacyTitleToCanonicalId[titleKey]!;
      if (_currentSnapshot.missionIdsExact.contains(mappedId)) {
        return mappedId;
      }
    }

    return null;
  }

  /// Validates if a saved mission identifier resolves to a real student-accessible mission
  static bool isMissionValid(String? exam) {
    if (exam == null || exam.trim().isEmpty) return false;
    final trimmed = exam.trim();
    if (trimmed == 'unresolved' ||
        trimmed == 'none' ||
        trimmed == 'null' ||
        trimmed == 'invalid' ||
        trimmed.toLowerCase() == 'unresolved mission') {
      return false;
    }
    // Fail closed if snapshot is not ready
    if (!_currentSnapshot.snapshotReady) return false;

    if (_currentSnapshot.missionIdsExact.contains(trimmed)) return true;
    final titleKey = trimmed.toLowerCase();
    if (_legacyTitleToCanonicalId.containsKey(titleKey)) {
      final mappedId = _legacyTitleToCanonicalId[titleKey]!;
      return _currentSnapshot.missionIdsExact.contains(mappedId);
    }
    return false;
  }

  /// Dynamic accessible mission check
  static bool isMissionAccessible(String? exam) => isMissionValid(exam);

  static Future<void> saveExam(String examId, {String? examName}) async {
    final prefs = await _getPrefs();
    final canonicalId = resolveCanonicalMissionId(examId) ?? examId;
    await prefs.setString('selected_exam_id', canonicalId);
    await prefs.setString('selected_exam', canonicalId);
    if (examName != null && examName.isNotEmpty) {
      await prefs.setString('selected_exam_name', examName);
    }
  }

  /// Synchronous check for Router
  static String? selectedExamSync() {
    if (_prefs == null) return null;
    final raw = _prefs!.getString('selected_exam_id') ?? _prefs!.getString('selected_exam');
    return resolveCanonicalMissionId(raw) ?? raw;
  }

  static String? selectedRecruitmentIdSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('selected_recruitment_id');
  }

  static String? getStudentNameSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('student_name');
  }

  static String? getStudentMobileSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('student_mobile');
  }

  static String? getStudentPhotoSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('student_photo');
  }

  static String? getExamNameSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('selected_exam_name');
  }

  static String? getExamIdSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('selected_exam_id') ?? _prefs!.getString('selected_exam');
  }

  static Future<String?> getRecruitmentId() async {
    final prefs = await _getPrefs();
    return prefs.getString('selected_recruitment_id');
  }

  static Future<String?> getSelectedExam() async {
    final prefs = await _getPrefs();
    
    // Local-First (Level-12.1 Hardening)
    final localExam = prefs.getString('selected_exam_id') ?? prefs.getString('selected_exam');

    // Background Sync with Guard
    _syncExamStatusInBackground(prefs);

    return resolveCanonicalMissionId(localExam) ?? localExam;
  }

  static void _syncExamStatusInBackground(SharedPreferences prefs) async {
    if (disableFirebaseForTest) return;
    if (_examSyncRunning) return;
    _examSyncRunning = true;

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        final doc = await FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get(
          const GetOptions(source: Source.server)
        ).timeout(const Duration(seconds: 2));
        
        final exam = doc.data()?['selectedExam'] ?? doc.data()?['selectedExamId'];
        if (exam != null) {
          final canonicalId = resolveCanonicalMissionId(exam.toString()) ?? exam.toString();
          await prefs.setString('selected_exam_id', canonicalId);
          await prefs.setString('selected_exam', canonicalId);
        }
      }
    } catch (e) {
      debugPrint('SESSION SYNC: Exam background fail: $e');
    } finally {
      _examSyncRunning = false;
    }
  }

  static Future<void> saveMissionIdentity({
    required String examId,
    required String examName,
    required String variantId,
    String? recruitmentId,
    String? examBlueprintId,
    String? variantName,
  }) async {
    final prefs = await _getPrefs();
    final canonicalId = resolveCanonicalMissionId(examId) ?? examId;
    await prefs.setString('selected_exam_id', canonicalId);
    await prefs.setString('selected_exam_name', examName);
    await prefs.setString('selected_variant_id', variantId);
    await prefs.setString('selected_exam', canonicalId); 
    if (recruitmentId != null) await prefs.setString('selected_recruitment_id', recruitmentId);
    if (examBlueprintId != null) await prefs.setString('selected_blueprint_id', examBlueprintId);
    if (variantName != null) await prefs.setString('selected_variant_name', variantName);
  }

  static Future<String?> getExamId() async {
    final prefs = await _getPrefs();
    return prefs.getString('selected_exam_id') ?? prefs.getString('selected_exam');
  }

  static Future<String?> getExamName() async {
    final prefs = await _getPrefs();
    return prefs.getString('selected_exam_name');
  }

  static Future<String?> getVariantId() async {
    final prefs = await _getPrefs();
    return prefs.getString('selected_variant_id');
  }

  static Future<void> saveStartMode(String mode) async {
    final prefs = await _getPrefs();
    await prefs.setString('start_mode', mode);
  }

  static Future<String?> getStartMode() async {
    final prefs = await _getPrefs();
    return prefs.getString('start_mode');
  }

  // =====================================================
  // DIAGNOSTIC
  // =====================================================

  static Future<void> completeDiagnostic() async {
    final prefs = await _getPrefs();
    await prefs.setBool('diagnostic_completed', true);
  }

  static Future<bool> isDiagnosticCompleted() async {
    final prefs = await _getPrefs();
    return prefs.getBool('diagnostic_completed') ?? false;
  }
}
