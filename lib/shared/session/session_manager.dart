import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class SessionManager {
  static SharedPreferences? _prefs;
  static bool _profileSyncRunning = false;
  static bool _examSyncRunning = false;
  static bool disableFirebaseForTest = false;

  /// 🔱 BOOTSTRAP INITIALIZATION
  /// Called in main.dart to ensure SharedPreferences is ready for sync routing.
  static Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    debugPrint('🔱 SESSION: Core initialized and cached.');
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

  static Future<void> logout() async {
    final prefs = await _getPrefs();
    await prefs.clear();
  }

  // =====================================================
  // PROFILE STATUS
  // =====================================================

  static Future<void> completeProfile({
    required String studentName,
    required String studentCity,
  }) async {
    final prefs = await _getPrefs();
    await prefs.setBool('profile_completed', true);
    await prefs.setString('student_name', studentName);
    await prefs.setString('student_city', studentCity);
  }

  /// 🔱 Synchronous check for Router
  static bool profileCompletedSync() {
    if (_prefs == null) return false;
    return _prefs!.getBool('profile_completed') ?? false;
  }

  static Future<bool> isProfileCompleted() async {
    final prefs = await _getPrefs();
    
    // 🔱 Local-First Authority (Level-12.1 Hardening)
    final localFlag = prefs.getBool('profile_completed') ?? false;

    // 🔱 Background Cloud Sync with Guard
    _syncProfileStatusInBackground(prefs);

    return localFlag;
  }

  static void _syncProfileStatusInBackground(SharedPreferences prefs) async {
    if (disableFirebaseForTest) return;
    if (_profileSyncRunning) return;
    _profileSyncRunning = true;

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        final doc = await FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get(
          const GetOptions(source: Source.server)
        ).timeout(const Duration(seconds: 2));
        
        final data = doc.data();
        final exists = doc.exists && (data?['name']?.toString().isNotEmpty ?? false);
        if (exists && data != null) {
          await prefs.setBool('profile_completed', true);
          
          final name = data['name']?.toString() ?? '';
          final city = data['city']?.toString() ?? '';
          final mobile = data['mobile']?.toString() ?? '';
          final state = data['state']?.toString() ?? '';
          final email = data['email']?.toString() ?? currentUser.email ?? '';
          final photoUrl = data['photoUrl']?.toString() ?? currentUser.photoURL ?? '';

          if (name.isNotEmpty) await prefs.setString('student_name', name);
          if (city.isNotEmpty) await prefs.setString('student_city', city);
          if (mobile.isNotEmpty) await prefs.setString('student_mobile', mobile);
          if (state.isNotEmpty) await prefs.setString('user_state', state);
          await prefs.setString('student_email', email);
          await prefs.setString('student_photo', photoUrl);
          await prefs.setString('firebase_uid', currentUser.uid);
        }
      }
    } catch (e) {
      debugPrint('🔱 SESSION SYNC: Profile background fail: $e');
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

  // =====================================================
  // EXAM FLOW
  // =====================================================

  static Future<void> saveExam(String exam) async {
    final prefs = await _getPrefs();
    await prefs.setString('selected_exam', exam);
  }

  /// 🔱 Synchronous check for Router
  static String? selectedExamSync() {
    if (_prefs == null) return null;
    return _prefs!.getString('selected_exam');
  }

  static Future<String?> getSelectedExam() async {
    final prefs = await _getPrefs();
    
    // 🔱 Local-First (Level-12.1 Hardening)
    final localExam = prefs.getString('selected_exam');

    // 🔱 Background Sync with Guard
    _syncExamStatusInBackground(prefs);

    return localExam;
  }

  static void _syncExamStatusInBackground(SharedPreferences prefs) async {
    if (_examSyncRunning) return;
    _examSyncRunning = true;

    try {
      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        final doc = await FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get(
          const GetOptions(source: Source.server)
        ).timeout(const Duration(seconds: 2));
        
        final exam = doc.data()?['selectedExam'];
        if (exam != null) {
          await prefs.setString('selected_exam', exam);
        }
      }
    } catch (e) {
      debugPrint('🔱 SESSION SYNC: Exam background fail: $e');
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
    await prefs.setString('selected_exam_id', examId);
    await prefs.setString('selected_exam_name', examName);
    await prefs.setString('selected_variant_id', variantId);
    // 🔱 Legacy compatibility for Router
    await prefs.setString('selected_exam', examName); 
    if (recruitmentId != null) await prefs.setString('selected_recruitment_id', recruitmentId);
    if (examBlueprintId != null) await prefs.setString('selected_blueprint_id', examBlueprintId);
    if (variantName != null) await prefs.setString('selected_variant_name', variantName);
  }

  
  static Future<String?> getExamId() async {
    final prefs = await _getPrefs();
    return prefs.getString('selected_exam_id');
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
