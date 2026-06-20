import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../session/session_manager.dart';

class SessionUser {
  final String name;
  final String? photo;
  final String examName;
  final String examId;

  SessionUser({
    required this.name,
    this.photo,
    required this.examName,
    required this.examId,
  });
}

final sessionUserProvider = FutureProvider<SessionUser>((ref) async {
  final name = await SessionManager.getStudentName();
  final photo = await SessionManager.getStudentPhoto();
  final examName = await SessionManager.getExamName();
  final examId = await SessionManager.getExamId();

  return SessionUser(
    name: name ?? 'Warrior',
    photo: photo,
    examName: examName ?? 'Mission',
    examId: examId ?? 'ras',
  );
});
