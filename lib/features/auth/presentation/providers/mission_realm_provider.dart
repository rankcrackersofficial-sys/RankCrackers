import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/backend/recruitment_repository.dart';
import '../../../../core/models/recruitment.dart';
import 'auth_provider.dart';

final recruitmentsProvider = StreamProvider.autoDispose<List<Recruitment>>((ref) {
  // Re-subscribe whenever authentication state transitions so same-UID or different-UID
  // relogin hydrates freshly without requiring hot restart.
  ref.watch(authStateChangesProvider);
  return RecruitmentRepository.streamPublished();
});

/// Student Mission Realm uses mission_realms as the canonical student-facing
/// mission source. The provider name is preserved for older routes only.
final publishedRecruitmentsProvider = Provider.autoDispose<List<Recruitment>>((ref) {
  return ref.watch(recruitmentsProvider).value ?? const <Recruitment>[];
});

final publishedStatesProvider = Provider.autoDispose<List<String>>((ref) {
  final published = ref.watch(publishedRecruitmentsProvider);
  return published.map((r) => r.state).toSet().toList();
});

final filteredRecruitmentsProvider =
    Provider.autoDispose.family<List<Recruitment>, String>((ref, state) {
  final published = ref.watch(publishedRecruitmentsProvider);
  return published
      .where((r) =>
          r.state.toLowerCase() == state.toLowerCase() ||
          r.state.toLowerCase() == 'central')
      .toList();
});

final filteredRecruitmentsByCategoryProvider =
    Provider.autoDispose.family<List<Recruitment>, ({String state, String category})>(
        (ref, arg) {
  final stateMissions = ref.watch(filteredRecruitmentsProvider(arg.state));
  return stateMissions
      .where((r) {
        final rCat = r.examCategory.trim().toLowerCase();
        final filterCat = arg.category.trim().toLowerCase();
        return rCat == filterCat ||
            rCat == 'category_pending' ||
            rCat == 'pending';
      })
      .toList();
});
