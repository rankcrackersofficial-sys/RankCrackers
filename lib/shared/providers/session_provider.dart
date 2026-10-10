import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../session/session_manager.dart';

class SessionUser {
  final String uid;
  final String name;
  final String email;
  final String? photo;
  final String examName;
  final String examId;
  final String recruitmentId;
  final String? phone;

  SessionUser({
    required this.uid,
    required this.name,
    required this.email,
    this.photo,
    required this.examName,
    required this.examId,
    required this.recruitmentId,
    this.phone,
  });

  /// 🛡️ STUDENT DISPLAY MISSION NAME (P0-6 & DISPLAY-01)
  /// Always returns "JEE Main 2027" for JEE Main missions, NEVER internal "jee_main_2026".
  String get displayExamName {
    final clean = examName.trim();
    if (clean.isEmpty || clean == 'unresolved' || clean == 'Unresolved Mission') {
      return 'JEE Main 2027';
    }
    if (clean.toLowerCase().contains('jee main') || clean == 'jee_main_2026' || clean == 'jee_main_2027') {
      return 'JEE Main 2027';
    }
    return clean;
  }

  static SessionUser getSync() {
    if (!SessionManager.disableFirebaseForTest) {
      try {
        final user = FirebaseAuth.instance.currentUser;
        final cachedUid = SessionManager.getFirebaseUidSync();
        
        // Guard against stale previous-mission cache first frame leakage
        final isStaleOrLoggedOut = user == null || (cachedUid != null && user.uid != cachedUid);

        if (isStaleOrLoggedOut) {
          return SessionUser(
            uid: '',
            name: 'Warrior',
            email: '',
            photo: null,
            examName: 'JEE Main 2027',
            examId: 'jee_main_2026',
            recruitmentId: 'jee_main_2026',
            phone: null,
          );
        }
      } catch (e) {
        // Fallback if FirebaseAuth channel is not initialized/connected in tests
      }
    }

    final uid = SessionManager.getFirebaseUidSync() ?? '';
    final email = SessionManager.getStudentEmailSync() ?? '';
    final name = SessionManager.getStudentNameSync();
    final photo = SessionManager.getStudentPhotoSync();
    final examName = SessionManager.getExamNameSync();
    final examId = SessionManager.getExamIdSync();
    final recruitmentId = SessionManager.selectedRecruitmentIdSync();
    final phone = SessionManager.getStudentMobileSync();

    return SessionUser(
      uid: uid,
      name: name ?? 'Warrior',
      email: email,
      photo: photo,
      examName: examName ?? 'JEE Main 2027',
      examId: examId ?? 'jee_main_2026',
      recruitmentId: recruitmentId ?? 'jee_main_2026',
      phone: phone,
    );
  }
}

final sessionUserProvider = FutureProvider<SessionUser>((ref) async {
  if (!SessionManager.disableFirebaseForTest) {
    try {
      final user = FirebaseAuth.instance.currentUser;
      final cachedUid = await SessionManager.getFirebaseUid();
      final isStaleOrLoggedOut = user == null || (cachedUid != null && user.uid != cachedUid);

      if (isStaleOrLoggedOut) {
        return SessionUser(
          uid: '',
          name: 'Warrior',
          email: '',
          photo: null,
          examName: 'JEE Main 2027',
          examId: 'jee_main_2026',
          recruitmentId: 'jee_main_2026',
          phone: null,
        );
      }
    } catch (e) {
      // Fallback if FirebaseAuth channel is not initialized/connected in tests
    }
  }

  final uid = await SessionManager.getFirebaseUid() ?? '';
  final email = await SessionManager.getStudentEmail() ?? '';
  final name = await SessionManager.getStudentName();
  final photo = await SessionManager.getStudentPhoto();
  final examName = await SessionManager.getExamName();
  final examId = await SessionManager.getExamId();
  final recruitmentId = await SessionManager.getRecruitmentId();
  final phone = await SessionManager.getStudentMobile();

  return SessionUser(
    uid: uid,
    name: name ?? 'Warrior',
    email: email,
    photo: photo,
    examName: examName ?? 'JEE Main 2027',
    examId: examId ?? 'jee_main_2026',
    recruitmentId: recruitmentId ?? 'jee_main_2026',
    phone: phone,
  );
});

/// 🛡️ CANONICAL ACTIVE SESSION AUTHORITY (P0-2, P0-3 & SESSION-01/02)
/// Synchronously yields validated sync session during hydration so providers
/// never receive null or freeze on uninitialized async state.
final activeSessionUserProvider = Provider<SessionUser>((ref) {
  final asyncUser = ref.watch(sessionUserProvider).valueOrNull;
  if (asyncUser != null && asyncUser.uid.isNotEmpty && asyncUser.examId != 'unresolved') {
    return asyncUser;
  }
  return SessionUser.getSync();
});
