import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/backend/recruitment_repository.dart';
import '../../../../core/models/recruitment.dart';

final recruitmentsProvider = StreamProvider<List<Recruitment>>((ref) {
  return RecruitmentRepository.streamPublished();
});

/// Student Mission Realm uses student_mission_catalog as the canonical
/// student-facing mission source. The name is preserved for older tests/routes,
/// but this no longer means recruitments(status == published).
final publishedRecruitmentsProvider = Provider<List<Recruitment>>((ref) {
  return ref.watch(recruitmentsProvider).value ?? const <Recruitment>[];
});

final publishedStatesProvider = Provider<List<String>>((ref) {
  final published = ref.watch(publishedRecruitmentsProvider);
  return published.map((r) => r.state).toSet().toList();
});

final filteredRecruitmentsProvider =
    Provider.family<List<Recruitment>, String>((ref, state) {
  final published = ref.watch(publishedRecruitmentsProvider);
  return published
      .where((r) =>
          r.state.toLowerCase() == state.toLowerCase() ||
          r.state.toLowerCase() == 'central')
      .toList();
});

final filteredRecruitmentsByCategoryProvider =
    Provider.family<List<Recruitment>, ({String state, String category})>(
        (ref, arg) {
  final stateMissions = ref.watch(filteredRecruitmentsProvider(arg.state));
  return stateMissions
      .where((r) =>
          r.examCategory == arg.category ||
          r.examCategory == 'category_pending')
      .toList();
});
