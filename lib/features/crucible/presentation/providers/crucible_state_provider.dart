import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/backend/crucible_repository.dart';
import '../../models/crucible_protocol_state.dart';
import '../../../../shared/providers/session_provider.dart';

final crucibleProtocolStateProvider = StreamProvider.autoDispose<CrucibleProtocolState?>((ref) {
  final sessionUserAsync = ref.watch(sessionUserProvider);
  return sessionUserAsync.when(
    data: (user) => CrucibleRepository.streamProtocolState(user.recruitmentId),
    loading: () => const Stream.empty(),
    error: (err, stack) => const Stream.empty(),
  );
});
