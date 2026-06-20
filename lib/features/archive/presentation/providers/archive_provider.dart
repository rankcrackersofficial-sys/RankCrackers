import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';
import '../../data/archive_repository.dart';

final archiveRepositoryProvider = Provider((ref) => ArchiveRepository());

final activeRealmsStreamProvider = StreamProvider<List<RecruitmentRealm>>((ref) {
  final repo = ref.watch(archiveRepositoryProvider);
  return repo.streamActiveRealms();
});
