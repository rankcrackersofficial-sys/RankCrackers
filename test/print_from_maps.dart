import 'dart:io';

void main() {
  print('=== crucible_protocol_state.dart ===');
  print(File('lib/features/crucible/models/crucible_protocol_state.dart').readAsStringSync());

  print('=== student_crucible_ledger.dart ===');
  print(File('lib/features/crucible/models/student_crucible_ledger.dart').readAsStringSync());

  print('=== crucible_repository.dart ===');
  print(File('lib/core/backend/crucible_repository.dart').readAsStringSync());

  print('=== crucible_state_provider.dart ===');
  print(File('lib/features/crucible/presentation/providers/crucible_state_provider.dart').readAsStringSync());
}
