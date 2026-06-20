import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/backend/recruitment_repository.dart';
import '../../../../core/models/recruitment.dart';

final recruitmentsProvider = StreamProvider<List<Recruitment>>((ref) {
  return RecruitmentRepository.stream();
});

/// 🔱 Published Mission Filter
final publishedRecruitmentsProvider = Provider<List<Recruitment>>((ref) {
  final all = ref.watch(recruitmentsProvider).value ?? [];
  return all.where((r) => r.status == 'published').toList();
});

/// 🔱 State Visibility Law
final publishedStatesProvider = Provider<List<String>>((ref) {
  final published = ref.watch(publishedRecruitmentsProvider);
  return published.map((r) => r.state).toSet().toList();
});

final filteredRecruitmentsProvider = Provider.family<List<Recruitment>, String>((ref, state) {
  final published = ref.watch(publishedRecruitmentsProvider);
  return published.where((r) => r.state.toLowerCase() == state.toLowerCase() || r.state.toLowerCase() == 'central').toList();
});

/// 🔱 Exam Category Filtering (Amendment v3.0)
final filteredRecruitmentsByCategoryProvider = Provider.family<List<Recruitment>, ({String state, String category})>((ref, arg) {
  final stateMissions = ref.watch(filteredRecruitmentsProvider(arg.state));
  return stateMissions.where((r) => r.examCategory == arg.category).toList();
});
